import type { ActivityType } from './constants/activityTaxonomy';

export interface TechEvent {
  id: string;
  title: string;
  summary: string;
  coverImage?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  timezone: string;
  isAllDay?: boolean; // 是否为全天活动
  format: 'online' | 'offline' | 'hybrid';
  activityType?: ActivityType | string;
  location?: {
    country: string;
    city: string;
    address?: string;
  };
  tags: string[];
  customTags?: string[];
  language: string[];
  links: {
    officialSite: string;
    registration?: string;
    poster?: string;
    source?: string;
  };
  organizer: {
    name: string;
    logo?: string;
  };
  organizers?: string[];
  price: {
    type: 'free' | 'paid' | 'unknown';
    range?: string;
  };
  status: 'upcoming' | 'live' | 'ended' | 'canceled';
  isFeatured?: boolean;
  featuredRank?: number | null;
}

export interface EventSubmissionInput {
  title: string;
  summary: string;
  activityType: ActivityType;
  customTags?: string[];
  startTime: string;
  endTime: string;
  format: 'online' | 'offline' | 'hybrid';
  city?: string;
  address?: string;
  organizer: {
    name: string;
  };
  organizers: string[];
  links: {
    registration?: string;
    poster?: string;
  };
  submitter: {
    name: string;
    contact: string;
  };
  notes?: string;
}

export interface EditableEventSubmission {
  id: string;
  title: string;
  summary: string;
  activityType: ActivityType | string;
  customTags: string[];
  startTime: string;
  endTime: string;
  format: 'online' | 'offline' | 'hybrid';
  city?: string;
  address?: string;
  organizers: string[];
  registrationUrl?: string;
  posterUrl?: string;
  contactName: string;
  contactInfo: string;
  notes?: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewNote?: string | null;
  updateStatus?: 'none' | 'pending' | 'rejected';
  updateNote?: string | null;
}

export interface EventSubmissionResult {
  editToken: string;
  editUrl: string;
}

export type ViewMode = 'month' | 'week' | 'list';
