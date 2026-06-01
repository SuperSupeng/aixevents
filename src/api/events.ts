import { isSupabaseConfigured, supabase } from '../config/supabase';
import { CITY_OPTIONS, OTHER_CITY_OPTION, getActivityFilterValues } from '../constants/activityTaxonomy';
import type { TechEvent } from '../types';

export interface EventFilters {
  search?: string;
  format?: 'all' | 'online' | 'offline' | 'hybrid';
  location?: string;
  tag?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

function isMissingDatawhaleTable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message = 'message' in error ? String((error as { message?: unknown }).message || '') : '';
  const code = 'code' in error ? String((error as { code?: unknown }).code || '') : '';
  return code === '42P01' || message.includes('datawhale_events_public') || message.includes("Could not find the table");
}

function sanitizeSearchTerm(term: string): string {
  return term.trim().replace(/[%,()]/g, ' ');
}

function sanitizeTagSearchTerm(term: string): string {
  return term.replace(/^#/, '').trim().replace(/[{}"\\,]/g, '');
}

function normalizeCityName(rawCity?: string): string {
  const city = String(rawCity || '').trim();
  if (!city) return '';

  for (const option of CITY_OPTIONS) {
    if (option === OTHER_CITY_OPTION) continue;
    if (city === option || city.startsWith(option) || city.startsWith(`${option}市`)) {
      return option;
    }
  }

  return city;
}

/**
 * 获取活动列表
 */
export async function fetchEvents(filters: EventFilters = {}): Promise<TechEvent[]> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase client environment variables are missing.');
    return [];
  }

  try {
    let query = supabase
      .from('datawhale_events_public')
      .select('*')
      .order('start_time', { ascending: true });

    // 格式筛选
    if (filters.format && filters.format !== 'all') {
      query = query.eq('format', filters.format);
    }

    // 地点筛选：只按公开城市筛选；线上/线下由 format 单独控制
    if (filters.location && filters.location !== 'all') {
      // 公开地点筛选只按城市（清理输入防止注入）
      const cityName = filters.location.split(',')[0].trim()
        .replace(/[^\w\s\u4e00-\u9fa5-]/g, ''); // 只保留字母、数字、空格、中文、连字符

      if (cityName) {
        query = query.ilike('location->>city', `${cityName}%`);
      }
    }

    // 活动类型筛选。用户自定义标签走搜索，不作为首页固定筛选项。
    if (filters.tag) {
      const activityTypeValues = getActivityFilterValues(filters.tag);
      if (activityTypeValues.length > 1) {
        query = query.in('activity_type', activityTypeValues);
      } else if (activityTypeValues.length === 1) {
        query = query.eq('activity_type', activityTypeValues[0]);
      } else {
        query = query.eq('activity_type', filters.tag);
      }
    }

    // Search keywords
    if (filters.search) {
      const sanitizedSearch = sanitizeSearchTerm(filters.search);
      if (sanitizedSearch) {
        const searchTerm = `%${sanitizedSearch}%`;
        const exactTag = sanitizeTagSearchTerm(sanitizedSearch);
        const tagClauses = exactTag && !exactTag.includes(' ')
          ? `,tags.cs.{${exactTag}},custom_tags.cs.{${exactTag}}`
          : '';
        query = query.or(`title.ilike.${searchTerm},summary.ilike.${searchTerm},organizer->>name.ilike.${searchTerm}${tagClauses}`);
      }
    }

    // 日期范围
    if (filters.startDate) {
      query = query.gte('start_time', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('start_time', filters.endDate.toISOString());
    }

    // 分页
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      if (isMissingDatawhaleTable(error)) {
        console.warn('Datawhale activity table is not ready yet.');
        return [];
      }
      console.error('Error fetching events:', error);
      throw error;
    }

    // 转换数据格式以匹配前端类型
    return (data || []).map(transformEvent);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
}

/**
 * 获取单个活动详情
 */
export async function fetchEventById(id: string): Promise<TechEvent | null> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase client environment variables are missing.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('datawhale_events_public')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (isMissingDatawhaleTable(error)) {
        return null;
      }
      console.error('Error fetching event:', error);
      throw error;
    }

    return data ? transformEvent(data) : null;
  } catch (error) {
    console.error('Failed to fetch event:', error);
    return null;
  }
}

/**
 * 获取所有唯一的地点列表
 */
export async function fetchLocations(): Promise<string[]> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase client environment variables are missing.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('datawhale_events_public')
      .select('location')
      .not('location', 'is', null);

    if (error) {
      if (isMissingDatawhaleTable(error)) {
        return [];
      }
      console.error('Error fetching locations:', error);
      throw error;
    }

    // 提取唯一城市列表；公开筛选只按城市，不展示具体场地
    const locations = new Set<string>();
    (data || []).forEach((event: any) => {
      if (event.location?.city) {
        const city = normalizeCityName(event.location.city);
        if (city) {
          locations.add(city);
        }
      }
    });

    return Array.from(locations).sort();
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return [];
  }
}

/**
 * 转换数据库格式到前端类型
 */
function transformEvent(dbEvent: any): TechEvent {
  const links = dbEvent.links || {};
  const officialSite = links.officialSite || links.registration || links.poster || '#';
  const location = dbEvent.location
    ? {
        ...dbEvent.location,
        city: normalizeCityName(dbEvent.location.city) || dbEvent.location.city,
      }
    : dbEvent.location;

  return {
    id: dbEvent.id,
    title: dbEvent.title,
    summary: dbEvent.summary || '',
    coverImage: dbEvent.cover_image || links.poster,
    startTime: dbEvent.start_time,
    endTime: dbEvent.end_time,
    timezone: dbEvent.timezone,
    isAllDay: dbEvent.is_all_day,
    format: dbEvent.format,
    location,
    tags: dbEvent.tags || [],
    activityType: dbEvent.activity_type,
    customTags: dbEvent.custom_tags || [],
    language: dbEvent.language || ['中文'],
    links: {
      ...links,
      officialSite,
    },
    organizer: dbEvent.organizer,
    organizers: dbEvent.organizers || (dbEvent.organizer?.name ? [dbEvent.organizer.name] : []),
    price: dbEvent.price || { type: 'unknown' },
    status: dbEvent.status || 'upcoming',
    isFeatured: Boolean(dbEvent.is_featured),
    featuredRank: dbEvent.featured_rank ?? null,
  };
}
