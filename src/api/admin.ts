import { buildEventPayload } from './submissions';
import type { EventSubmissionInput } from '../types';

export type AdminStatusFilter = 'pending' | 'updates' | 'approved' | 'rejected' | 'featured' | 'all';

export interface AdminSubmission {
  id: string;
  title: string;
  summary: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  is_all_day?: boolean;
  format: 'online' | 'offline' | 'hybrid';
  activity_type?: string;
  location?: {
    country?: string;
    city?: string;
    address?: string;
  } | null;
  organizer?: {
    name?: string;
  } | null;
  organizers?: string[];
  links?: {
    officialSite?: string;
    registration?: string;
    poster?: string;
    source?: string;
  };
  tags?: string[];
  custom_tags?: string[];
  language?: string[];
  price?: {
    type?: string;
    range?: string;
  };
  submitter?: {
    name?: string;
    contact?: string;
  };
  notes?: string | null;
  is_featured?: boolean;
  featured_rank?: number | null;
  pending_update?: Record<string, any> | null;
  update_status?: 'none' | 'pending' | 'rejected';
  update_note?: string | null;
  review_status: 'pending' | 'approved' | 'rejected';
  review_note?: string | null;
  reviewed_at?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminSummary {
  pendingSubmissions: number;
  pendingUpdates: number;
  approved: number;
  rejected: number;
  featured: number;
}

export interface AdminListResponse {
  submissions: AdminSubmission[];
  total: number;
  summary: AdminSummary;
  generatedAt: string;
}

export interface AdminActionResponse {
  status: string;
  eventId?: string;
  eventIds?: string[];
  isFeatured?: boolean;
  featuredRank?: number | null;
}

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

function adminHeaders(token: string, actor: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Admin-Actor': actor,
  };
}

async function parseAdminResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    const message = typeof payload?.error === 'string' ? payload.error : '管理接口请求失败';
    throw new AdminApiError(message, response.status);
  }

  if (!isJson) {
    throw new AdminApiError('管理接口返回格式异常', response.status);
  }

  return payload as T;
}

export async function fetchAdminSubmissions(params: {
  token: string;
  actor: string;
  status: AdminStatusFilter;
  search?: string;
}): Promise<AdminListResponse> {
  const url = new URL('/api/admin/submissions', window.location.origin);
  url.searchParams.set('status', params.status);
  if (params.search?.trim()) url.searchParams.set('q', params.search.trim());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: adminHeaders(params.token, params.actor),
    cache: 'no-store',
  });

  return parseAdminResponse<AdminListResponse>(response);
}

export async function reviewAdminSubmission(params: {
  token: string;
  actor: string;
  submissionId: string;
  action: 'approve' | 'reject';
  reviewNote?: string;
}): Promise<AdminActionResponse> {
  const response = await fetch('/api/admin/submissions', {
    method: 'POST',
    headers: adminHeaders(params.token, params.actor),
    cache: 'no-store',
    body: JSON.stringify({
      submissionId: params.submissionId,
      action: params.action,
      reviewNote: params.reviewNote,
    }),
  });

  return parseAdminResponse<AdminActionResponse>(response);
}

export async function setAdminEventFeature(params: {
  token: string;
  actor: string;
  eventId: string;
  isFeatured: boolean;
  featuredRank?: number | null;
}): Promise<AdminActionResponse> {
  const response = await fetch('/api/admin/submissions', {
    method: 'POST',
    headers: adminHeaders(params.token, params.actor),
    cache: 'no-store',
    body: JSON.stringify({
      eventId: params.eventId,
      action: 'set_feature',
      isFeatured: params.isFeatured,
      featuredRank: params.featuredRank,
    }),
  });

  return parseAdminResponse<AdminActionResponse>(response);
}

export async function reorderAdminFeaturedEvents(params: {
  token: string;
  actor: string;
  eventIds: string[];
}): Promise<AdminActionResponse> {
  const response = await fetch('/api/admin/submissions', {
    method: 'POST',
    headers: adminHeaders(params.token, params.actor),
    cache: 'no-store',
    body: JSON.stringify({
      action: 'reorder_featured',
      eventIds: params.eventIds,
    }),
  });

  return parseAdminResponse<AdminActionResponse>(response);
}

export async function updateAdminEvent(params: {
  token: string;
  actor: string;
  eventId: string;
  input: EventSubmissionInput;
}): Promise<AdminActionResponse> {
  const response = await fetch('/api/admin/submissions', {
    method: 'POST',
    headers: adminHeaders(params.token, params.actor),
    cache: 'no-store',
    body: JSON.stringify({
      action: 'update',
      eventId: params.eventId,
      event: buildEventPayload(params.input),
    }),
  });

  return parseAdminResponse<AdminActionResponse>(response);
}
