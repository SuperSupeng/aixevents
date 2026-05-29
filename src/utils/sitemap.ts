import { TechEvent } from '../types';

/**
 * 生成 XML Sitemap
 */
export function generateSitemap(_events: TechEvent[]): string {
  const baseUrl = (import.meta.env.VITE_PUBLIC_SITE_URL || 'https://aixevents.datawhale.cn').replace(/\/$/, '');
  const today = new Date().toISOString().split('T')[0];

  const urls = [
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
      loc: `${baseUrl}/resources`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.7',
    },
    {
      loc: `${baseUrl}/partners`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.7',
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

  const urlsXml = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
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
  const baseUrl = (import.meta.env.VITE_PUBLIC_SITE_URL || 'https://aixevents.datawhale.cn').replace(/\/$/, '');

  return `# Datawhale AI+X 活动日历 Robots.txt
User-agent: *
Allow: /
Disallow: /edit/
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
