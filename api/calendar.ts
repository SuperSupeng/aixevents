import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TechEvent {
  id: string;
  title: string;
  summary: string;
  start_time: string;
  end_time: string;
  timezone: string;
  is_all_day: boolean;
  format: string;
  location: {
    country?: string;
    city?: string;
    address?: string;
  } | null;
  links: {
    officialSite?: string;
    registration?: string;
    poster?: string;
    source?: string;
  };
  organizer: {
    name: string;
    logo?: string;
  };
  activity_type?: string;
  organizers?: string[];
  tags: string[];
  custom_tags?: string[];
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
  if (isAllDay) {
    // Format: YYYYMMDD
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }
  // Format: YYYYMMDDTHHMMSSZ
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function generateIcs(events: TechEvent[]): string {
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
    const uid = `${event.id}@datawhale.club`;
    const dtStart = formatIcsDate(event.start_time, event.is_all_day);
    const dtEnd = formatIcsDate(event.end_time, event.is_all_day);
    
    let location = '';
    if (event.location) {
      const parts = [event.location.address, event.location.city, event.location.country].filter(Boolean);
      location = parts.join(', ');
    }
    
    let description = event.summary || '';
    const organizers = event.organizers?.length ? event.organizers.join(' / ') : event.organizer?.name;
    if (organizers) {
      description += `\\n\\nOrganizer: ${organizers}`;
    }
    if (event.links?.officialSite) {
      description += `\\n\\nOfficial Site: ${event.links.officialSite}`;
    }
    if (event.links?.registration) {
      description += `\\nRegistration: ${event.links.registration}`;
    }
    if (event.format) {
      description += `\\n\\nFormat: ${event.format}`;
    }
    if (event.tags?.length) {
      description += `\\nTags: ${event.tags.join(', ')}`;
    }
    if (event.custom_tags?.length) {
      description += `\\nCustom Tags: ${event.custom_tags.map((tag) => `#${tag}`).join(', ')}`;
    }
    description += `\\n\\n---\\nPowered by Datawhale AI+X 活动日历`;

    ics += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
`;

    if (event.is_all_day) {
      ics += `DTSTART;VALUE=DATE:${dtStart}
DTEND;VALUE=DATE:${dtEnd}
`;
    } else {
      ics += `DTSTART:${dtStart}
DTEND:${dtEnd}
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

  ics += 'END:VCALENDAR';
  return ics;
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + (process.env.IP_HASH_SALT || 'default-salt')).digest('hex').slice(0, 16);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS 和缓存头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // 1 hour cache
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 解析查询参数
    const { eventId, format, location, tags } = req.query;

    // 构建查询
    let query = supabase
      .from('datawhale_events_public')
      .select('*')
      .in('status', ['upcoming', 'live'])
      .order('start_time', { ascending: true });

    // 单个活动
    if (eventId && typeof eventId === 'string') {
      query = supabase
        .from('datawhale_events_public')
        .select('*')
        .eq('id', eventId);
    }

    // 格式筛选
    if (format && typeof format === 'string' && format !== 'all') {
      query = query.eq('format', format);
    }

    // 地点筛选
    if (location && typeof location === 'string' && location !== 'all') {
      query = query.ilike('location->>city', `${location}%`);
    }

    // 活动类型筛选
    if (tags && typeof tags === 'string') {
      query = query.eq('activity_type', tags);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }

    if (!events || events.length === 0) {
      return res.status(404).json({ error: 'No events found' });
    }

    // 生成 ICS
    const icsContent = generateIcs(events);

    // 记录下载统计（异步，不阻塞响应）
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const country = req.headers['x-vercel-ip-country'] as string || '';

    // 不等待统计完成
    Promise.resolve(supabase.rpc('record_ics_download', {
      p_download_type: eventId ? 'single' : (format || location || tags ? 'filtered' : 'full'),
      p_event_id: eventId || null,
      p_filters: { format, location, tags },
      p_user_agent: userAgent.slice(0, 500),
      p_ip_hash: hashIp(clientIp),
      p_country: country,
    })).then(() => {}).catch(console.error);

    // 返回 ICS 文件
    const filename = eventId 
      ? `event-${eventId}.ics` 
      : `datawhale-aix-events-${new Date().toISOString().slice(0, 10)}.ics`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return res.status(200).send(icsContent);

  } catch (error) {
    console.error('ICS generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
