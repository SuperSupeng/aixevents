import { createClient } from '@supabase/supabase-js';

type Env = {
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  IP_HASH_SALT?: string;
};

type TechEvent = {
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

function sanitizeSearchTerm(term: string): string {
  return term.trim().replace(/[%,()]/g, ' ');
}

function sanitizeTagSearchTerm(term: string): string {
  return term.replace(/^#/, '').trim().replace(/[{}"\\,]/g, '');
}

function getActivityFilterValues(value: string): string[] {
  const filterGroups: Record<string, string[]> = {
    sharing: ['meetup', 'talk', 'conference'],
    workshop: ['workshop'],
    creator_day: ['creator_day'],
    challenge: ['hackathon', 'competition', 'demo_day'],
    training: ['training'],
    other: ['other'],
  };

  return filterGroups[value] || [value];
}

function formatIcsTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function getUtcDateOnly(dateStr: string): Date {
  const date = new Date(dateStr);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatIcsAllDayDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function getAllDayEndDate(startStr: string, endStr: string): string {
  const startDate = getUtcDateOnly(startStr);
  const endDate = getUtcDateOnly(endStr || startStr);

  if (endDate <= startDate) {
    endDate.setUTCDate(startDate.getUTCDate() + 1);
  }

  return formatIcsAllDayDate(endDate);
}

function foldIcsLine(line: string): string {
  const lines: string[] = [];
  let rest = line;

  while (rest.length > 73) {
    lines.push(rest.slice(0, 73));
    rest = ` ${rest.slice(73)}`;
  }

  lines.push(rest);
  return lines.join('\r\n');
}

function serializeIcs(lines: string[]): string {
  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`;
}

function generateIcs(events: TechEvent[]): string {
  const now = formatIcsTimestamp(new Date().toISOString());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Datawhale//AI+X Activity Calendar//ZH-CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Datawhale AI+X 活动日历',
    'X-WR-CALDESC:Datawhale AI+X 生态活动日历',
    'X-WR-TIMEZONE:UTC',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ];

  for (const event of events) {
    const uid = `${event.id}@datawhale.club`;
    const location = event.location
      ? [event.location.address, event.location.city, event.location.country].filter(Boolean).join(', ')
      : '';
    const organizers = event.organizers?.length ? event.organizers.join(' / ') : event.organizer?.name;
    let description = event.summary || '';

    if (organizers) description += `\n\nOrganizer: ${organizers}`;
    if (event.links?.officialSite) description += `\n\nOfficial Site: ${event.links.officialSite}`;
    if (event.links?.registration) description += `\nRegistration: ${event.links.registration}`;
    if (event.format) description += `\n\nFormat: ${event.format}`;
    if (event.tags?.length) description += `\nTags: ${event.tags.join(', ')}`;
    if (event.custom_tags?.length) {
      description += `\nCustom Tags: ${event.custom_tags.map((tag) => `#${tag}`).join(', ')}`;
    }
    description += `\n\n---\nPowered by Datawhale AI+X 活动日历`;

    lines.push('BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${now}`);

    if (event.is_all_day) {
      lines.push(
        `DTSTART;VALUE=DATE:${formatIcsAllDayDate(getUtcDateOnly(event.start_time))}`,
        `DTEND;VALUE=DATE:${getAllDayEndDate(event.start_time, event.end_time)}`
      );
    } else {
      lines.push(`DTSTART:${formatIcsTimestamp(event.start_time)}`, `DTEND:${formatIcsTimestamp(event.end_time)}`);
    }

    lines.push(`SUMMARY:${escapeIcsText(event.title)}`, `DESCRIPTION:${escapeIcsText(description)}`);

    if (location) lines.push(`LOCATION:${escapeIcsText(location)}`);
    if (event.links?.officialSite) lines.push(`URL:${event.links.officialSite}`);

    lines.push('STATUS:CONFIRMED', 'TRANSP:OPAQUE', 'END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return serializeIcs(lines);
}

function calendarResponse(events: TechEvent[], filename: string, isDownload: boolean): Response {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    'Content-Type': 'text/calendar; charset=utf-8',
  };

  if (isDownload) {
    headers['Content-Disposition'] = `attachment; filename="${filename}"`;
  }

  return new Response(generateIcs(events), {
    status: 200,
    headers,
  });
}

async function hashIp(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${ip}${salt}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

export async function onRequestGet(context: { request: Request; env: Env; waitUntil: (promise: Promise<unknown>) => void }) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Server configuration is missing' }, 500);
  }

  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const eventId = url.searchParams.get('eventId');
    const format = url.searchParams.get('format');
    const location = url.searchParams.get('location');
    const tags = url.searchParams.get('tags');
    const search = url.searchParams.get('search');
    const isDownload = url.searchParams.get('download') === '1';

    let query = supabase
      .from('datawhale_events_public')
      .select('*')
      .order('start_time', { ascending: true });

    if (eventId) query = supabase.from('datawhale_events_public').select('*').eq('id', eventId);
    if (format && format !== 'all') query = query.eq('format', format);
    if (location && location !== 'all') query = query.ilike('location->>city', `${location.split(',')[0].trim()}%`);
    if (tags) {
      const activityTypeValues = getActivityFilterValues(tags);
      query = activityTypeValues.length > 1
        ? query.in('activity_type', activityTypeValues)
        : query.eq('activity_type', activityTypeValues[0]);
    }
    if (search) {
      const sanitizedSearch = sanitizeSearchTerm(search);
      if (sanitizedSearch) {
        const searchTerm = `%${sanitizedSearch}%`;
        const exactTag = sanitizeTagSearchTerm(sanitizedSearch);
        const tagClauses = exactTag && !exactTag.includes(' ')
          ? `,tags.cs.{${exactTag}},custom_tags.cs.{${exactTag}}`
          : '';
        query = query.or(`title.ilike.${searchTerm},summary.ilike.${searchTerm},organizer->>name.ilike.${searchTerm}${tagClauses}`);
      }
    }

    const { data: events, error } = await query;
    if (error) {
      console.error('Cloudflare calendar database error:', error);
      return jsonResponse({ error: 'Failed to fetch events' }, 500);
    }

    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const country = request.headers.get('cf-ipcountry') || '';
    const ipHash = await hashIp(ip, env.IP_HASH_SALT || 'default-salt');

    context.waitUntil(
      Promise.resolve(supabase.rpc('record_ics_download', {
        p_download_type: eventId ? 'single' : (format || location || tags || search ? 'filtered' : 'full'),
        p_event_id: eventId || null,
        p_filters: { format, location, tags, search },
        p_user_agent: userAgent.slice(0, 500),
        p_ip_hash: ipHash,
        p_country: country,
      })).then(() => undefined).catch((error: unknown) => {
        console.error('Cloudflare calendar stats error:', error);
      })
    );

    const filename = eventId
      ? `event-${eventId}.ics`
      : `datawhale-aix-events-${new Date().toISOString().slice(0, 10)}.ics`;

    if (!events || events.length === 0) {
      if (eventId) return jsonResponse({ error: 'No event found' }, 404);
      return calendarResponse([], filename, isDownload);
    }

    return calendarResponse(events as TechEvent[], filename, isDownload);
  } catch (error) {
    console.error('Cloudflare calendar handler error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}
