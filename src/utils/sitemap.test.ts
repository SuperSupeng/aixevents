import assert from 'node:assert/strict';
import { test } from 'node:test';

test('sitemap only includes public indexed pages', async () => {
  const { generateSitemap } = await import('./sitemap');
  const sitemap = generateSitemap([]);

  assert.match(sitemap, /https:\/\/aixevents\.datawhale\.cn\//);
  assert.match(sitemap, /https:\/\/aixevents\.datawhale\.cn\/hackathons/);
  assert.match(sitemap, /https:\/\/aixevents\.datawhale\.cn\/creators-day/);
  assert.match(sitemap, /https:\/\/aixevents\.datawhale\.cn\/resources/);
  assert.doesNotMatch(sitemap, /\/partners/);
  assert.doesNotMatch(sitemap, /\/edit/);
  assert.doesNotMatch(sitemap, /\/admin/);
});

test('robots keeps hidden and private routes out of crawl paths', async () => {
  const { generateRobotsTxt } = await import('./sitemap');
  const robots = generateRobotsTxt();

  assert.match(robots, /Disallow: \/edit\//);
  assert.match(robots, /Disallow: \/admin/);
  assert.match(robots, /Disallow: \/partners/);
  assert.match(robots, /Disallow: \/api\/admin\//);
  assert.match(robots, /Allow: \/api\/calendar/);
  assert.match(robots, /Sitemap: https:\/\/aixevents\.datawhale\.cn\/sitemap\.xml/);
});
