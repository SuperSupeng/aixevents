import { isSupabaseConfigured, supabase } from '../config/supabase';
import { DEFAULT_ACTIVITY_TYPE, type ActivityType } from '../constants/activityTaxonomy';
import type { EditableEventSubmission, EventSubmissionInput, EventSubmissionResult } from '../types';

const DATAWHALE_AIX_SOURCE = 'Datawhale AI+X 活动日历提交';
const POSTER_BUCKET = 'datawhale-event-posters';
const MAX_POSTER_SIZE = 5 * 1024 * 1024;
const ALLOWED_POSTER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getPosterExtension(file: File): string {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

function normalizeArray(values: Array<string | undefined | null>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  );
}

function normalizeActivityType(value?: string): ActivityType {
  return (value || DEFAULT_ACTIVITY_TYPE) as ActivityType;
}

function normalizeHttpUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function getSubmissionErrorMessage(error: any): string {
  const code = String(error?.code || '');
  const message = String(error?.message || '');

  if (code === '42P01' || message.includes('Could not find the table')) {
    return '活动提交服务暂时不可用，请稍后再试。';
  }

  if (message.includes('Could not find') && message.includes('column')) {
    return '活动提交服务暂时不可用，请稍后再试。';
  }

  if (message.includes('schema cache')) {
    return '活动提交服务正在更新，请稍后再试。';
  }

  if (code === '42501' || message.toLowerCase().includes('row-level security')) {
    return '活动提交暂时失败，请稍后再试。';
  }

  return '活动提交失败，请稍后再试。';
}

function generateEditToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getEditUrl(editToken: string): string {
  if (typeof window === 'undefined') return `/edit/${editToken}`;
  return `${window.location.origin}/edit/${editToken}`;
}

export function buildEventPayload(input: EventSubmissionInput) {
  const registrationUrl = normalizeHttpUrl(input.links.registration);
  const posterUrl = normalizeHttpUrl(input.links.poster);
  const primaryLink = registrationUrl || posterUrl;
  const organizers = normalizeArray(input.organizers.length ? input.organizers : [input.organizer.name]);
  const organizerName = organizers.join(' / ') || input.organizer.name.trim();
  const customTags = normalizeArray(input.customTags || []);
  const activityType = input.activityType || DEFAULT_ACTIVITY_TYPE;
  const city = input.city?.trim();
  const address = input.address?.trim();

  const links: Record<string, string> = {
    officialSite: primaryLink || '#',
    source: DATAWHALE_AIX_SOURCE,
  };

  if (registrationUrl) {
    links.registration = registrationUrl;
  }

  if (posterUrl) {
    links.poster = posterUrl;
  }

  return {
    title: input.title.trim(),
    summary: input.summary.trim(),
    start_time: input.startTime,
    end_time: input.endTime,
    timezone: 'Asia/Shanghai',
    is_all_day: false,
    format: input.format,
    activity_type: activityType,
    location: city
      ? {
          country: '中国',
          city,
          ...(address ? { address } : {}),
        }
      : null,
    organizer: {
      name: organizerName,
    },
    organizers,
    links,
    tags: normalizeArray(['AI+X', activityType, ...customTags]),
    custom_tags: customTags,
    language: ['中文'],
    price: { type: 'unknown' },
    submitter: input.submitter,
    notes: input.notes?.trim() || null,
  };
}

function transformEditableSubmission(raw: any): EditableEventSubmission {
  const pendingUpdate = raw?.update_status === 'pending' && raw?.pending_update ? raw.pending_update : null;
  const source = pendingUpdate || raw || {};
  const submitter = source.submitter || raw?.submitter || {};
  const links = source.links || {};
  const organizers = Array.isArray(source.organizers)
    ? source.organizers
    : source.organizer?.name
      ? [source.organizer.name]
      : raw?.organizer?.name
        ? [raw.organizer.name]
        : [];

  return {
    id: raw.id,
    title: source.title || '',
    summary: source.summary || '',
    activityType: normalizeActivityType(source.activity_type),
    customTags: Array.isArray(source.custom_tags) ? source.custom_tags : [],
    startTime: source.start_time || '',
    endTime: source.end_time || '',
    format: source.format || 'offline',
    city: source.location?.city || '',
    address: source.location?.address || '',
    organizers,
    registrationUrl: links.registration || '',
    posterUrl: links.poster || '',
    contactName: submitter.name || '',
    contactInfo: submitter.contact || '',
    notes: source.notes || '',
    reviewStatus: raw.review_status || 'pending',
    reviewNote: raw.review_note || null,
    updateStatus: raw.update_status || 'none',
    updateNote: raw.update_note || null,
  };
}

export async function uploadEventPoster(file: File): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('活动提交服务暂时不可用，请稍后再试。');
  }

  if (!ALLOWED_POSTER_TYPES.includes(file.type)) {
    throw new Error('海报仅支持 JPG、PNG 或 WebP 图片。');
  }

  if (file.size > MAX_POSTER_SIZE) {
    throw new Error('海报图片不能超过 5MB。');
  }

  const extension = getPosterExtension(file);
  const filePath = `${new Date().toISOString().slice(0, 10)}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(POSTER_BUCKET)
    .upload(filePath, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('Failed to upload event poster:', error);
    if (error.message?.includes('Bucket not found') || error.message?.includes('bucket')) {
      throw new Error('海报上传暂时不可用，可以先移除海报后提交。');
    }
    throw new Error('海报上传失败，可以稍后重试或先移除海报后提交。');
  }

  const { data } = supabase.storage.from(POSTER_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function submitEventForReview(input: EventSubmissionInput): Promise<EventSubmissionResult> {
  if (!isSupabaseConfigured) {
    throw new Error('活动提交服务暂时不可用，请稍后再试。');
  }

  const editToken = generateEditToken();
  const editTokenHash = await sha256Hex(editToken);
  const payload = buildEventPayload(input);

  const { error } = await supabase.from('datawhale_events').insert({
    ...payload,
    edit_token_hash: editTokenHash,
    review_status: 'pending',
    update_status: 'none',
  });

  if (error) {
    console.error('Failed to submit event for review:', error);
    throw new Error(getSubmissionErrorMessage(error));
  }

  return {
    editToken,
    editUrl: getEditUrl(editToken),
  };
}

export async function fetchSubmissionForEdit(editToken: string): Promise<EditableEventSubmission | null> {
  if (!isSupabaseConfigured) {
    throw new Error('读取活动信息失败，请稍后再试。');
  }

  const { data, error } = await supabase.rpc('get_datawhale_event_by_edit_token', {
    p_edit_token: editToken,
  });

  if (error) {
    console.error('Failed to fetch editable event:', error);
    throw new Error('读取活动信息失败，请稍后再试。');
  }

  if (!data) return null;
  return transformEditableSubmission(data);
}

export async function updateSubmissionWithToken(editToken: string, input: EventSubmissionInput): Promise<{ mode: string }> {
  if (!isSupabaseConfigured) {
    throw new Error('提交修改失败，请稍后再试。');
  }

  const payload = buildEventPayload(input);
  const { data, error } = await supabase.rpc('update_datawhale_event_by_edit_token', {
    p_edit_token: editToken,
    p_event: payload,
  });

  if (error) {
    console.error('Failed to update event with token:', error);
    throw new Error('提交修改失败，请稍后再试。');
  }

  if (!data?.ok) {
    const reason = data?.error === 'not_found' ? '编辑链接无效或活动不存在。' : '编辑链接无效。';
    throw new Error(reason);
  }

  return { mode: data.mode || 'direct_update' };
}
