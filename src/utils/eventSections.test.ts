import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { TechEvent } from '../types';

function makeEvent(id: string, startTime: string, endTime: string, status: TechEvent['status'] = 'upcoming'): TechEvent {
  return {
    id,
    title: id,
    summary: '',
    startTime,
    endTime,
    timezone: 'Asia/Shanghai',
    format: 'offline',
    location: { country: '中国', city: '上海' },
    tags: ['AI+X'],
    language: ['中文'],
    links: { officialSite: '#' },
    organizer: { name: 'Datawhale' },
    price: { type: 'unknown' },
    status,
  };
}

test('splitEventsByTimeSection puts active events first and past events after them', async () => {
  const { splitEventsByTimeSection } = await import('./eventSections');
  const referenceDate = new Date('2026-06-03T04:00:00.000Z');
  const events = [
    makeEvent('future-later', '2026-06-20T02:00:00.000Z', '2026-06-20T05:00:00.000Z'),
    makeEvent('past-older', '2026-05-01T02:00:00.000Z', '2026-05-01T05:00:00.000Z'),
    makeEvent('live-now', '2026-06-03T02:00:00.000Z', '2026-06-03T05:00:00.000Z', 'live'),
    makeEvent('past-recent', '2026-06-01T02:00:00.000Z', '2026-06-01T05:00:00.000Z', 'ended'),
    makeEvent('future-sooner', '2026-06-04T02:00:00.000Z', '2026-06-04T05:00:00.000Z'),
  ];

  const sections = splitEventsByTimeSection(events, referenceDate);

  assert.deepEqual(sections.upcomingEvents.map((event) => event.id), ['live-now', 'future-sooner', 'future-later']);
  assert.deepEqual(sections.pastEvents.map((event) => event.id), ['past-older', 'past-recent']);
  assert.equal(sections.allEvents.length, events.length);
});
