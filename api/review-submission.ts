import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminToken = process.env.REVIEW_ADMIN_TOKEN;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

function isAuthorized(req: VercelRequest): boolean {
  if (!adminToken) return false;
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const headerToken = req.headers['x-admin-token'];
  return bearerToken === adminToken || headerToken === adminToken;
}

function parseBody(req: VercelRequest): any {
  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }
  return req.body || {};
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const status = typeof req.query.status === 'string' ? req.query.status : 'pending';
    let query = supabase
      .from('datawhale_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (status === 'pending') {
      query = query.or('review_status.eq.pending,update_status.eq.pending');
    } else {
      query = query.eq('review_status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch submissions:', error);
      return res.status(500).json({ error: 'Failed to fetch submissions' });
    }

    return res.status(200).json({ submissions: data || [] });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = parseBody(req);
    const submissionId = String(body.submissionId || '');
    const action = String(body.action || '');
    const reviewNote = typeof body.reviewNote === 'string' ? body.reviewNote : null;

    if (!submissionId || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'submissionId and action are required' });
    }

    const { data: submission, error: fetchError } = await supabase
      .from('datawhale_events')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      if (fetchError) {
        console.error('Failed to fetch submission:', fetchError);
      }
      return res.status(404).json({ error: 'Submission not found' });
    }

    const hasPendingUpdate = submission.update_status === 'pending' && submission.pending_update;

    if (hasPendingUpdate) {
      if (action === 'reject') {
        const { error: updateError } = await supabase
          .from('datawhale_events')
          .update({
            update_status: 'rejected',
            update_note: reviewNote,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', submissionId);

        if (updateError) {
          console.error('Failed to reject pending update:', updateError);
          return res.status(500).json({ error: 'Failed to update submission' });
        }

        return res.status(200).json({ status: 'update_rejected', eventId: submission.id });
      }

      const pendingPayload = normalizePendingUpdatePayload(submission.pending_update);
      const { error: updateError } = await supabase
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

      if (updateError) {
        console.error('Failed to approve pending update:', updateError);
        return res.status(500).json({ error: 'Failed to update submission' });
      }

      return res.status(200).json({ status: 'update_approved', eventId: submission.id });
    }

    if (submission.review_status === 'approved') {
      return res.status(200).json({ eventId: submission.id, status: 'approved' });
    }

    if (action === 'reject') {
      const { error: updateError } = await supabase
        .from('datawhale_events')
        .update({
          review_status: 'rejected',
          review_note: reviewNote,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (updateError) {
        console.error('Failed to reject submission:', updateError);
        return res.status(500).json({ error: 'Failed to update submission' });
      }

      return res.status(200).json({ status: 'rejected' });
    }

    const { error: updateError } = await supabase
      .from('datawhale_events')
      .update({
        review_status: 'approved',
        review_note: reviewNote,
        reviewed_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Failed to approve submission:', updateError);
      return res.status(500).json({ error: 'Failed to update submission' });
    }

    return res.status(200).json({ status: 'approved', eventId: submission.id });
  } catch (error) {
    console.error('Review submission handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
