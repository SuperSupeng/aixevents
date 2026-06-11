import { createClient } from '@supabase/supabase-js';

type Env = {
  VITE_SUPABASE_URL?: string;
  VITE_PUBLIC_SITE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  REVIEW_ADMIN_TOKEN?: string;
  ADMIN_ALLOWED_ORIGINS?: string;
  IP_HASH_SALT?: string;
};

type AdminAction = 'approve' | 'reject' | 'set_feature' | 'reorder_featured';

const MAX_ACTIVE_FEATURED_EVENTS = 3;

const EVENT_SELECT = [
  'id',
  'title',
  'summary',
  'start_time',
  'end_time',
  'timezone',
  'is_all_day',
  'format',
  'activity_type',
  'location',
  'organizer',
  'organizers',
  'links',
  'tags',
  'custom_tags',
  'language',
  'price',
  'submitter',
  'notes',
  'is_featured',
  'featured_rank',
  'pending_update',
  'update_status',
  'update_note',
  'review_status',
  'review_note',
  'reviewed_at',
  'published_at',
  'created_at',
  'updated_at',
].join(',');

function getAllowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get('origin');
  if (!origin) return null;

  const requestOrigin = new URL(request.url).origin;
  const allowedOrigins = new Set<string>([requestOrigin]);

  if (env.VITE_PUBLIC_SITE_URL) {
    allowedOrigins.add(env.VITE_PUBLIC_SITE_URL.replace(/\/+$/, ''));
  }

  for (const value of (env.ADMIN_ALLOWED_ORIGINS || '').split(',')) {
    const trimmed = value.trim().replace(/\/+$/, '');
    if (trimmed) allowedOrigins.add(trimmed);
  }

  return allowedOrigins.has(origin) ? origin : null;
}

function isCorsBlocked(request: Request, env: Env): boolean {
  return Boolean(request.headers.get('origin')) && !getAllowedOrigin(request, env);
}

function corsHeaders(request: Request, env: Env): HeadersInit {
  const allowedOrigin = getAllowedOrigin(request, env);
  return {
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Actor, X-Admin-Token',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

function jsonResponse(request: Request, env: Env, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(request, env),
    },
  });
}

function constantTimeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;

  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    const aCode = index < a.length ? a.charCodeAt(index) : 0;
    const bCode = index < b.length ? b.charCodeAt(index) : 0;
    diff |= aCode ^ bCode;
  }

  return diff === 0;
}

function getAdminToken(request: Request): string {
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  return bearerToken || request.headers.get('x-admin-token')?.trim() || '';
}

function isAuthorized(request: Request, adminToken?: string): boolean {
  return Boolean(adminToken && constantTimeEqual(getAdminToken(request), adminToken));
}

function getActor(request: Request): string {
  const rawActor = request.headers.get('x-admin-actor') || 'admin';
  const actor = rawActor.trim().slice(0, 80);
  return actor || 'admin';
}

function sanitizeSearch(value: string | null): string {
  return String(value || '').trim().replace(/[%,()]/g, ' ').slice(0, 80);
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

function normalizeReviewNote(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 1000) : null;
}

function normalizeUuidArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => String(item || '').trim()).filter(isUuid)));
}

function normalizeFeatureRank(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 9999) return null;
  return parsed;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  return forwarded.split(',')[0]?.trim() || '';
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function writeAuditLog(
  supabase: any,
  request: Request,
  env: Env,
  actor: string,
  action: AdminAction,
  eventId: string | null,
  metadata: Record<string, unknown>
) {
  const ip = getClientIp(request);
  const requestIpHash = ip && env.IP_HASH_SALT ? await sha256Hex(`${env.IP_HASH_SALT}:${ip}`) : null;
  const userAgent = request.headers.get('user-agent')?.slice(0, 300) || null;

  const { error } = await supabase.from('datawhale_admin_audit_logs').insert({
    actor,
    action,
    event_id: eventId,
    request_ip_hash: requestIpHash,
    user_agent: userAgent,
    metadata,
  });

  if (error) {
    console.warn('Admin audit log insert failed:', error);
  }
}

function createSupabaseClient(env: Env) {
  return createClient(env.VITE_SUPABASE_URL || '', env.SUPABASE_SERVICE_ROLE_KEY || '', {
    auth: { persistSession: false },
  }) as any;
}

async function getAdminSummary(supabase: any) {
  const nowIso = new Date().toISOString();
  const countQuery = async (filters: (query: any) => any): Promise<number> => {
    const query = filters(supabase.from('datawhale_events').select('id', { count: 'exact', head: true }));
    const { count, error } = await query;
    if (error) {
      console.warn('Admin count query failed:', error);
      return 0;
    }
    return count || 0;
  };

  const [pendingSubmissions, pendingUpdates, approved, rejected, featured] = await Promise.all([
    countQuery((query) => query.eq('review_status', 'pending')),
    countQuery((query) => query.eq('update_status', 'pending')),
    countQuery((query) => query.eq('review_status', 'approved').neq('update_status', 'pending')),
    countQuery((query) => query.eq('review_status', 'rejected')),
    countQuery((query) => query.eq('review_status', 'approved').eq('is_featured', true).gte('end_time', nowIso)),
  ]);

  return {
    pendingSubmissions,
    pendingUpdates,
    approved,
    rejected,
    featured,
  };
}

function applyStatusFilter(query: any, status: string) {
  const nowIso = new Date().toISOString();
  if (status === 'updates') return query.eq('update_status', 'pending');
  if (status === 'approved') return query.eq('review_status', 'approved').neq('update_status', 'pending');
  if (status === 'rejected') return query.eq('review_status', 'rejected');
  if (status === 'featured') return query.eq('review_status', 'approved').eq('is_featured', true).gte('end_time', nowIso);
  if (status === 'all') return query;
  return query.eq('review_status', 'pending');
}

async function listSubmissions(request: Request, env: Env) {
  const supabase = createSupabaseClient(env);
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'pending';
  const search = sanitizeSearch(url.searchParams.get('q'));
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 100), 1), 200);

  let query = supabase
    .from('datawhale_events')
    .select(EVENT_SELECT, { count: 'exact' });

  query = applyStatusFilter(query, status);

  if (search) {
    const term = `%${search}%`;
    query = query.or(`title.ilike.${term},summary.ilike.${term},organizer->>name.ilike.${term}`);
  }

  const orderedQuery = status === 'featured'
    ? query
        .order('featured_rank', { ascending: true, nullsFirst: false })
        .order('start_time', { ascending: true })
        .order('updated_at', { ascending: false })
    : query.order('updated_at', { ascending: false });

  const { data, error, count } = await orderedQuery.limit(limit);

  if (error) {
    console.error('Admin submissions fetch error:', error);
    return jsonResponse(request, env, { error: 'Failed to fetch submissions' }, 500);
  }

  return jsonResponse(request, env, {
    submissions: data || [],
    total: count || 0,
    summary: await getAdminSummary(supabase),
    generatedAt: new Date().toISOString(),
  });
}

async function reviewSubmission(request: Request, env: Env, body: any, action: 'approve' | 'reject') {
  const submissionId = String(body.submissionId || '');
  const reviewNote = normalizeReviewNote(body.reviewNote);

  if (!isUuid(submissionId)) {
    return jsonResponse(request, env, { error: 'A valid submissionId is required' }, 400);
  }

  const supabase = createSupabaseClient(env);
  const { data: submission, error: fetchError } = await supabase
    .from('datawhale_events')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (fetchError || !submission) {
    if (fetchError) console.error('Admin submission fetch error:', fetchError);
    return jsonResponse(request, env, { error: 'Submission not found' }, 404);
  }

  const actor = getActor(request);
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
        console.error('Admin reject update error:', error);
        return jsonResponse(request, env, { error: 'Failed to update submission' }, 500);
      }

      await writeAuditLog(supabase, request, env, actor, action, submissionId, {
        target: 'pending_update',
        reviewNote,
        result: 'update_rejected',
      });

      return jsonResponse(request, env, { status: 'update_rejected', eventId: submission.id });
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
      console.error('Admin approve update error:', error);
      return jsonResponse(request, env, { error: 'Failed to update submission' }, 500);
    }

    await writeAuditLog(supabase, request, env, actor, action, submissionId, {
      target: 'pending_update',
      reviewNote,
      result: 'update_approved',
    });

    return jsonResponse(request, env, { status: 'update_approved', eventId: submission.id });
  }

  if (submission.review_status === 'approved' && action === 'approve') {
    return jsonResponse(request, env, { eventId: submission.id, status: 'approved' });
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
      console.error('Admin reject submission error:', error);
      return jsonResponse(request, env, { error: 'Failed to update submission' }, 500);
    }

    await writeAuditLog(supabase, request, env, actor, action, submissionId, {
      target: 'submission',
      reviewNote,
      result: 'rejected',
    });

    return jsonResponse(request, env, { status: 'rejected', eventId: submission.id });
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
    console.error('Admin approve submission error:', error);
    return jsonResponse(request, env, { error: 'Failed to update submission' }, 500);
  }

  await writeAuditLog(supabase, request, env, actor, action, submissionId, {
    target: 'submission',
    reviewNote,
    result: 'approved',
  });

  return jsonResponse(request, env, { status: 'approved', eventId: submission.id });
}

async function setFeatured(request: Request, env: Env, body: any) {
  const eventId = String(body.eventId || body.submissionId || '');
  const isFeatured = Boolean(body.isFeatured);
  const featuredRank = isFeatured ? normalizeFeatureRank(body.featuredRank) : null;
  const nowIso = new Date().toISOString();

  if (!isUuid(eventId)) {
    return jsonResponse(request, env, { error: 'A valid eventId is required' }, 400);
  }

  const supabase = createSupabaseClient(env);
  const { data: event, error: fetchError } = await supabase
    .from('datawhale_events')
    .select('id, review_status, end_time, is_featured, featured_rank')
    .eq('id', eventId)
    .single();

  if (fetchError || !event) {
    if (fetchError) console.error('Admin feature fetch error:', fetchError);
    return jsonResponse(request, env, { error: 'Event not found' }, 404);
  }

  if (event.review_status !== 'approved') {
    return jsonResponse(request, env, { error: '只有已发布活动可以设置推荐' }, 409);
  }

  if (isFeatured) {
    if (!event.end_time || new Date(event.end_time).getTime() < Date.now()) {
      return jsonResponse(request, env, { error: '已结束活动不能设置为当前推荐' }, 409);
    }

    const { count, error: countError } = await supabase
      .from('datawhale_events')
      .select('id', { count: 'exact', head: true })
      .eq('review_status', 'approved')
      .eq('is_featured', true)
      .gte('end_time', nowIso)
      .neq('id', eventId);

    if (countError) {
      console.error('Admin active featured count error:', countError);
      return jsonResponse(request, env, { error: 'Failed to validate featured limit' }, 500);
    }

    if ((count || 0) >= MAX_ACTIVE_FEATURED_EVENTS) {
      return jsonResponse(request, env, { error: `当前有效推荐最多 ${MAX_ACTIVE_FEATURED_EVENTS} 个，请先取消一个推荐` }, 409);
    }
  }

  const { error } = await supabase
    .from('datawhale_events')
    .update({
      is_featured: isFeatured,
      featured_rank: featuredRank,
    })
    .eq('id', eventId);

  if (error) {
    console.error('Admin set feature error:', error);
    return jsonResponse(request, env, { error: 'Failed to update feature status' }, 500);
  }

  await writeAuditLog(supabase, request, env, getActor(request), 'set_feature', eventId, {
    before: {
      isFeatured: Boolean(event.is_featured),
      featuredRank: event.featured_rank ?? null,
    },
    after: {
      isFeatured,
      featuredRank,
    },
  });

  return jsonResponse(request, env, {
    status: 'feature_updated',
    eventId,
    isFeatured,
    featuredRank,
  });
}

async function reorderFeatured(request: Request, env: Env, body: any) {
  const eventIds = normalizeUuidArray(body.eventIds);
  const nowMs = Date.now();
  const nowIso = new Date().toISOString();

  if (eventIds.length === 0) {
    return jsonResponse(request, env, { error: '需要提供推荐活动 ID' }, 400);
  }

  if (eventIds.length > MAX_ACTIVE_FEATURED_EVENTS) {
    return jsonResponse(request, env, { error: `当前有效推荐最多 ${MAX_ACTIVE_FEATURED_EVENTS} 个` }, 409);
  }

  const supabase = createSupabaseClient(env);
  const { data: activeFeaturedEvents, error: fetchError } = await supabase
    .from('datawhale_events')
    .select('id, end_time')
    .eq('review_status', 'approved')
    .eq('is_featured', true)
    .gte('end_time', nowIso);

  if (fetchError) {
    console.error('Admin reorder featured fetch error:', fetchError);
    return jsonResponse(request, env, { error: '推荐排序校验失败' }, 500);
  }

  const activeFeaturedIds = Array.isArray(activeFeaturedEvents)
    ? activeFeaturedEvents.map((event: any) => String(event.id)).filter(isUuid)
    : [];

  if (activeFeaturedIds.length !== eventIds.length) {
    return jsonResponse(request, env, { error: '需要提交完整的当前推荐列表' }, 409);
  }

  const activeFeaturedIdSet = new Set(activeFeaturedIds);
  if (eventIds.some((eventId) => !activeFeaturedIdSet.has(eventId))) {
    return jsonResponse(request, env, { error: '只能排序当前有效推荐活动' }, 409);
  }

  const staleEvent = activeFeaturedEvents.find((event: any) => (
    !event.end_time || new Date(event.end_time).getTime() < nowMs
  ));

  if (staleEvent) {
    return jsonResponse(request, env, { error: '推荐活动状态已变更，请刷新后重试' }, 409);
  }

  for (let index = 0; index < eventIds.length; index += 1) {
    const { error } = await supabase
      .from('datawhale_events')
      .update({ featured_rank: index + 1 })
      .eq('id', eventIds[index]);

    if (error) {
      console.error('Admin reorder featured update error:', error);
      return jsonResponse(request, env, { error: '推荐排序保存失败' }, 500);
    }
  }

  await writeAuditLog(supabase, request, env, getActor(request), 'reorder_featured', null, {
    eventIds,
    ranks: eventIds.map((id, index) => ({ id, rank: index + 1 })),
  });

  return jsonResponse(request, env, {
    status: 'featured_reordered',
    eventIds,
  });
}

function ensureReady(request: Request, env: Env): Response | null {
  if (isCorsBlocked(request, env)) {
    return jsonResponse(request, env, { error: 'Origin is not allowed' }, 403);
  }

  if (!isAuthorized(request, env.REVIEW_ADMIN_TOKEN)) {
    return jsonResponse(request, env, { error: 'Unauthorized' }, 401);
  }

  if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(request, env, { error: 'Server configuration is missing' }, 500);
  }

  return null;
}

export async function onRequestOptions(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  if (isCorsBlocked(request, env)) {
    return jsonResponse(request, env, { error: 'Origin is not allowed' }, 403);
  }
  return jsonResponse(request, env, {}, 200);
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const readyResponse = ensureReady(request, env);
  if (readyResponse) return readyResponse;

  return listSubmissions(request, env);
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const readyResponse = ensureReady(request, env);
  if (readyResponse) return readyResponse;

  try {
    const body: any = await request.json();
    const action = String(body.action || '') as AdminAction;

    if (action === 'approve' || action === 'reject') {
      return reviewSubmission(request, env, body, action);
    }

    if (action === 'set_feature') {
      return setFeatured(request, env, body);
    }

    if (action === 'reorder_featured') {
      return reorderFeatured(request, env, body);
    }

    return jsonResponse(request, env, { error: 'Unsupported action' }, 400);
  } catch (error) {
    console.error('Admin submissions handler error:', error);
    return jsonResponse(request, env, { error: 'Internal server error' }, 500);
  }
}
