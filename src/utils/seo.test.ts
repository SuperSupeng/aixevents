import assert from 'node:assert/strict';
import { test } from 'node:test';

test('seo utilities load outside Vite and use the community calendar brand', async () => {
  const seo = await import('./seo');

  assert.equal(seo.SITE_NAME, 'Datawhale AI+X 社区活动日历');
  assert.equal(seo.canonicalUrl('/hackathons'), 'https://aixevents.datawhale.cn/hackathons');
  assert.equal(seo.canonicalUrl('/'), 'https://aixevents.datawhale.cn/');
});

test('event seo uses stable event URLs and poster images', async () => {
  const seo = await import('./seo');

  const metadata = seo.getEventSEO({
    id: 'event/with space',
    title: 'AI+X 城市 Meetup',
    summary: '  面向社区成员的 AI 实践活动。\n欢迎开发者、高校同学和产业伙伴参与。  ',
    startTime: '2026-06-10T11:00:00.000Z',
    endTime: '2026-06-10T13:00:00.000Z',
    timezone: 'Asia/Shanghai',
    format: 'offline',
    activityType: 'meetup',
    location: { country: '中国', city: '杭州', address: '西湖区' },
    tags: ['AI+X'],
    customTags: ['社区'],
    language: ['中文'],
    links: { officialSite: 'https://example.com/event', poster: '/poster.png' },
    organizer: { name: 'Datawhale' },
    organizers: ['Datawhale'],
    price: { type: 'free' },
    status: 'upcoming',
    coverImage: '/poster.png',
  });

  assert.equal(metadata.canonicalPath, '/events/event%2Fwith%20space');
  assert.equal(metadata.ogImage, '/poster.png');
  assert.match(metadata.description, /^面向社区成员的 AI 实践活动。欢迎开发者/);
});
