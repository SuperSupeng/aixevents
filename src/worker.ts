import { createClient } from '@supabase/supabase-js';

type AssetBinding = {
  fetch: (request: Request | string | URL) => Promise<Response>;
};

type WorkerEnv = {
  ASSETS: AssetBinding;
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  REVIEW_ADMIN_TOKEN?: string;
  STATS_API_KEY?: string;
  IP_HASH_SALT?: string;
};

type ExecutionContextLike = {
  waitUntil: (promise: Promise<unknown>) => void;
};

type DatawhaleEvent = {
  id: string;
  title: string;
  summary: string;
  start_time: string;
  end_time: string;
  timezone: string;
  is_all_day: boolean;
  format: string;
  location: { country?: string; city?: string; address?: string } | null;
  links: { officialSite?: string; registration?: string; poster?: string; source?: string };
  organizer: { name: string; logo?: string };
  activity_type?: string;
  organizers?: string[];
  tags: string[];
  custom_tags?: string[];
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
};

function createSupabase(env: WorkerEnv) {
  return createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatIcsDate(dateStr: string, isAllDay: boolean): string {
  const date = new Date(dateStr);
  if (isAllDay) return date.toISOString().slice(0, 10).replace(/-/g, '');
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function generateIcs(events: DatawhaleEvent[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Datawhale//AI+X Activity Calendar//ZH-CN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Datawhale AI+X 活动日历
X-WR-CALDESC:Datawhale AI+X 生态活动日历
X-WR-TIMEZONE:UTC
REFRESH-INTERVAL;VALUE=DURATION:P1D
X-PUBLISHED-TTL:P1D
`;

  for (const event of events) {
    const location = event.location
      ? [event.location.address, event.location.city, event.location.country].filter(Boolean).join(', ')
      : '';
    const organizers = event.organizers?.length ? event.organizers.join(' / ') : event.organizer?.name;
    let description = event.summary || '';

    if (organizers) description += `\\n\\nOrganizer: ${organizers}`;
    if (event.links?.officialSite) description += `\\n\\nOfficial Site: ${event.links.officialSite}`;
    if (event.links?.registration) description += `\\nRegistration: ${event.links.registration}`;
    if (event.format) description += `\\n\\nFormat: ${event.format}`;
    if (event.tags?.length) description += `\\nTags: ${event.tags.join(', ')}`;
    if (event.custom_tags?.length) {
      description += `\\nCustom Tags: ${event.custom_tags.map((tag) => `#${tag}`).join(', ')}`;
    }
    description += `\\n\\n---\\nPowered by Datawhale AI+X 活动日历`;

    ics += `BEGIN:VEVENT
UID:${event.id}@datawhale.club
DTSTAMP:${now}
`;

    if (event.is_all_day) {
      ics += `DTSTART;VALUE=DATE:${formatIcsDate(event.start_time, true)}
DTEND;VALUE=DATE:${formatIcsDate(event.end_time, true)}
`;
    } else {
      ics += `DTSTART:${formatIcsDate(event.start_time, false)}
DTEND:${formatIcsDate(event.end_time, false)}
`;
    }

    ics += `SUMMARY:${escapeIcsText(event.title)}
DESCRIPTION:${escapeIcsText(description)}
`;

    if (location) {
      ics += `LOCATION:${escapeIcsText(location)}
`;
    }

    if (event.links?.officialSite) {
      ics += `URL:${event.links.officialSite}
`;
    }

    ics += `STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
`;
  }

  return `${ics}END:VCALENDAR`;
}

async function hashIp(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${ip}${salt}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 16);
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

async function handleCalendar(request: Request, env: WorkerEnv, ctx: ExecutionContextLike): Promise<Response> {
  const url = new URL(request.url);
  const supabase = createSupabase(env);
  const eventId = url.searchParams.get('eventId');
  const format = url.searchParams.get('format');
  const location = url.searchParams.get('location');
  const tags = url.searchParams.get('tags');

  try {
    let query = supabase
      .from('datawhale_events_public')
      .select('*')
      .in('status', ['upcoming', 'live'])
      .order('start_time', { ascending: true });

    if (eventId) query = supabase.from('datawhale_events_public').select('*').eq('id', eventId);
    if (format && format !== 'all') query = query.eq('format', format);
    if (location && location !== 'all') query = query.ilike('location->>city', `${location.split(',')[0].trim()}%`);
    if (tags) query = query.eq('activity_type', tags);

    const { data: events, error } = await query;
    if (error) {
      console.error('Worker calendar database error:', error);
      return jsonResponse({ error: 'Failed to fetch events' }, 500);
    }
    if (!events || events.length === 0) return jsonResponse({ error: 'No events found' }, 404);

    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const country = request.headers.get('cf-ipcountry') || '';
    const ipHash = await hashIp(ip, env.IP_HASH_SALT || 'default-salt');

    ctx.waitUntil(
      Promise.resolve(supabase.rpc('record_ics_download', {
        p_download_type: eventId ? 'single' : (format || location || tags ? 'filtered' : 'full'),
        p_event_id: eventId || null,
        p_filters: { format, location, tags },
        p_user_agent: userAgent.slice(0, 500),
        p_ip_hash: ipHash,
        p_country: country,
      })).then(() => undefined).catch((statsError: unknown) => {
        console.error('Worker calendar stats error:', statsError);
      })
    );

    const filename = eventId
      ? `event-${eventId}.ics`
      : `datawhale-aix-events-${new Date().toISOString().slice(0, 10)}.ics`;

    return new Response(generateIcs(events as DatawhaleEvent[]), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'text/calendar; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Worker calendar handler error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

async function handleStats(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  const apiKey = request.headers.get('x-api-key') || url.searchParams.get('key');

  if (!env.STATS_API_KEY || apiKey !== env.STATS_API_KEY) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const { data, error } = await createSupabase(env).rpc('get_ics_download_stats');
    if (error) {
      console.error('Worker stats error:', error);
      return jsonResponse({ error: 'Failed to fetch stats' }, 500);
    }
    return jsonResponse({
      success: true,
      generated_at: new Date().toISOString(),
      stats: data,
    });
  } catch (error) {
    console.error('Worker stats handler error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

async function handleReviewSubmission(request: Request, env: WorkerEnv): Promise<Response> {
  if (!isAuthorized(request, env.REVIEW_ADMIN_TOKEN)) return jsonResponse({ error: 'Unauthorized' }, 401);

  const supabase = createSupabase(env);

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
      console.error('Worker review fetch error:', error);
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
      if (fetchError) console.error('Worker review submission fetch error:', fetchError);
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
          console.error('Worker review reject update error:', error);
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
        console.error('Worker review approve update error:', error);
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
        console.error('Worker review reject submission error:', error);
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
      console.error('Worker review approve submission error:', error);
      return jsonResponse({ error: 'Failed to update submission' }, 500);
    }

    return jsonResponse({ status: 'approved', eventId: submission.id });
  } catch (error) {
    console.error('Worker review handler error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

async function routeApi(request: Request, env: WorkerEnv, ctx: ExecutionContextLike): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(request.url);

  if (url.pathname === '/api/calendar') return handleCalendar(request, env, ctx);
  if (url.pathname === '/api/stats') return handleStats(request, env);
  if (url.pathname === '/api/review-submission') return handleReviewSubmission(request, env);

  return jsonResponse({ error: 'Not found' }, 404);
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContextLike): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return routeApi(request, env, ctx);
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};
