import type { TechEvent } from '../types';
import { isEventActiveByEndTime } from './timeUtils';

export interface EventTimeSections {
  allEvents: TechEvent[];
  upcomingEvents: TechEvent[];
  pastEvents: TechEvent[];
}

function getTimeValue(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
}

function sortByStartAsc(a: TechEvent, b: TechEvent): number {
  return getTimeValue(a.startTime) - getTimeValue(b.startTime);
}

function isPastEvent(event: TechEvent, referenceDate: Date): boolean {
  return event.status === 'ended' || !isEventActiveByEndTime(event.endTime, referenceDate);
}

export function splitEventsByTimeSection(events: TechEvent[], referenceDate = new Date()): EventTimeSections {
  const upcomingEvents: TechEvent[] = [];
  const pastEvents: TechEvent[] = [];

  events.forEach((event) => {
    if (isPastEvent(event, referenceDate)) {
      pastEvents.push(event);
    } else {
      upcomingEvents.push(event);
    }
  });

  return {
    allEvents: [...events].sort(sortByStartAsc),
    upcomingEvents: upcomingEvents.sort(sortByStartAsc),
    pastEvents: pastEvents.sort(sortByStartAsc),
  };
}
