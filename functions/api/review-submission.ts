import { createClient } from '@supabase/supabase-js';

type Env = {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  REVIEW_ADMIN_TOKEN?: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
    },
  });
}

function isAuthorized(request: Request, adminToken?: string): boolean {
  if (!adminToken) return false;
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const headerToken = request.headers.get('x-admin-token') || '';
  return bearerToken === adminToken || headerToken === adminToken;
}

function arrayFromPayload(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function normalizePendingUpdatePayload(payload: any) {
  return {
    title: payload.title,
    summary: payload.summary,
    start_time: payload.start_time,
    end_time: payload.end_time,
    timezone: payload.timezone || 'Asia/Shanghai',
    is_all_day: Boolean(payload.is_all_day),
    format: payload.format,
    activity_type: payload.activity_type || 'meetup',
    location: payload.location || null,
    organizer: payload.organizer,
    organizers: arrayFromPayload(payload.organizers),
    links: payload.links,
    tags: arrayFromPayload(payload.tags),
    custom_tags: arrayFromPayload(payload.custom_tags),
    language: Array.isArray(payload.language) ? payload.language : ['中文'],
    price: payload.price || { type: 'unknown' },
    submitter: payload.submitter,
    notes: payload.notes || null,
  };
}

export async function onRequestOptions(): Promise<Response> {
  return jsonResponse({}, 200);
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return onRequestOptions();
  if (!isAuthorized(request, env.REVIEW_ADMIN_TOKEN)) return jsonResponse({ error: 'Unauthorized' }, 401);

  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    let query = supabase
      .from('datawhale_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    query = status === 'pending'
      ? query.or('review_status.eq.pending,update_status.eq.pending')
      : query.eq('review_status', status);

    const { data, error } = await query;
    if (error) {
      console.error('Cloudflare review fetch error:', error);
      return jsonResponse({ error: 'Failed to fetch submissions' }, 500);
    }

    return jsonResponse({ submissions: data || [] });
  }

  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const body: any = await request.json();
    const submissionId = String(body.submissionId || '');
    const action = String(body.action || '');
    const reviewNote = typeof body.reviewNote === 'string' ? body.reviewNote : null;

    if (!submissionId || !['approve', 'reject'].includes(action)) {
      return jsonResponse({ error: 'submissionId and action are required' }, 400);
    }

    const { data: submission, error: fetchError } = await supabase
      .from('datawhale_events')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      if (fetchError) console.error('Cloudflare review submission fetch error:', fetchError);
      return jsonResponse({ error: 'Submission not found' }, 404);
    }

    const hasPendingUpdate = submission.update_status === 'pending' && submission.pending_update;

    if (hasPendingUpdate) {
      if (action === 'reject') {
        const { error } = await supabase
          .from('datawhale_events')
          .update({
            update_status: 'rejected',
            update_note: reviewNote,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', submissionId);

        if (error) {
          console.error('Cloudflare review reject update error:', error);
          return jsonResponse({ error: 'Failed to update submission' }, 500);
        }

        return jsonResponse({ status: 'update_rejected', eventId: submission.id });
      }

      const pendingPayload = normalizePendingUpdatePayload(submission.pending_update);
      const { error } = await supabase
        .from('datawhale_events')
        .update({
          ...pendingPayload,
          review_status: 'approved',
          review_note: reviewNote,
          reviewed_at: new Date().toISOString(),
          published_at: submission.published_at || new Date().toISOString(),
          pending_update: null,
          update_status: 'none',
          update_note: null,
        })
        .eq('id', submissionId);

      if (error) {
        console.error('Cloudflare review approve update error:', error);
        return jsonResponse({ error: 'Failed to update submission' }, 500);
      }

      return jsonResponse({ status: 'update_approved', eventId: submission.id });
    }

    if (submission.review_status === 'approved') {
      return jsonResponse({ eventId: submission.id, status: 'approved' });
    }

    if (action === 'reject') {
      const { error } = await supabase
        .from('datawhale_events')
        .update({
          review_status: 'rejected',
          review_note: reviewNote,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) {
        console.error('Cloudflare review reject submission error:', error);
        return jsonResponse({ error: 'Failed to update submission' }, 500);
      }

      return jsonResponse({ status: 'rejected' });
    }

    const { error } = await supabase
      .from('datawhale_events')
      .update({
        review_status: 'approved',
        review_note: reviewNote,
        reviewed_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (error) {
      console.error('Cloudflare review approve submission error:', error);
      return jsonResponse({ error: 'Failed to update submission' }, 500);
    }

    return jsonResponse({ status: 'approved', eventId: submission.id });
  } catch (error) {
    console.error('Cloudflare review handler error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}
