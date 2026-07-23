import type { TechEvent } from '../types';
import { getPublicSiteUrl } from './site';

type SitemapUrl = {
  loc: string;
  lastmod: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
};

/**
 * 生成 XML Sitemap
 */
export function generateSitemap(events: TechEvent[]): string {
  const baseUrl = getPublicSiteUrl();
  const today = new Date().toISOString().split('T')[0];

  const urls: SitemapUrl[] = [
    {
      loc: `${baseUrl}/`,
      lastmod: today,
      changefreq: 'daily',
      priority: '1.0',
    },
    {
      loc: `${baseUrl}/hackathons`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.8',
    },
    {
      loc: `${baseUrl}/creators-day`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.8',
    },
    {
      loc: `${baseUrl}/waic-2026`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.4',
    },
    {
      loc: `${baseUrl}/resources`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.7',
    },
    {
      loc: `${baseUrl}/join`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.6',
    },
    {
      loc: `${baseUrl}/privacy`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.3',
    },
    {
      loc: `${baseUrl}/terms`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.3',
    },
  ];

  for (const event of events) {
    if (!event.id || event.status === 'canceled') continue;

    urls.push({
      loc: `${baseUrl}/events/${encodeURIComponent(event.id)}`,
      lastmod: event.startTime ? event.startTime.slice(0, 10) : today,
      changefreq: 'weekly',
      priority: '0.6',
    });
  }

  const urlsXml = urls.map(url => `
  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
}

/**
 * 生成 robots.txt 内容
 */
export function generateRobotsTxt(): string {
  const baseUrl = getPublicSiteUrl();

  return `# Datawhale AI+X 社区活动日历 Robots.txt
User-agent: *
Allow: /
Disallow: /edit/
Disallow: /admin
Disallow: /partners
Disallow: /api/admin/
Disallow: /api/review-submission
Disallow: /api/stats
Disallow: /*?edit=
Allow: /api/calendar

# AI Crawlers (Allow all for GEO optimization)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Googlebot
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml
`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
