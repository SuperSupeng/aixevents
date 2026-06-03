import assert from 'node:assert/strict';
import { test } from 'node:test';

test('getUpcomingScrollTop keeps the upcoming heading below the sticky chrome', async () => {
  const { getUpcomingScrollTop } = await import('./usePastEventsReveal');

  assert.equal(getUpcomingScrollTop({ elementTop: 880, scrollY: 240, offset: 112 }), 1008);
});

test('getUpcomingScrollTop never scrolls above the document start', async () => {
  const { getUpcomingScrollTop } = await import('./usePastEventsReveal');

  assert.equal(getUpcomingScrollTop({ elementTop: 72, scrollY: 0, offset: 112 }), 0);
});
