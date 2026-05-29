import { TechEvent } from '../types';

const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://aixevents.datawhale.cn';

export const SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || runtimeOrigin).replace(/\/$/, '');
export const SITE_NAME = 'Datawhale AI+X 活动日历';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`;

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string;
  canonicalPath: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  robots?: string;
  type?: 'website' | 'article';
}

export type SeoPage = 'home' | 'privacy' | 'terms' | 'resources' | 'hackathons' | 'partners' | 'edit';

export const PAGE_SEO: Record<SeoPage, SEOMetadata> = {
  home: {
    title: 'Datawhale AI+X 活动日历｜发现、提交和订阅 AI+X 生态活动',
    description: 'Datawhale AI+X 活动日历收录 AI 实践、开发者、高校、产业、创业和 OPC 等生态活动，帮助学习者、开发者和生态伙伴找到真实场景中的连接、实践与共创机会。',
    keywords: 'Datawhale, AI+X, AI活动日历, AI实践, 开发者活动, 高校活动, 产业活动, 创业活动, OPC, 黑客松, Workshop, Meetup, 活动提交',
    canonicalPath: '/',
  },
  hackathons: {
    title: 'AI+X Hackathon 与作品挑战｜Datawhale AI+X 活动日历',
    description: '收录 AI 黑客松、创造营、作品挑战和 Agent 实战活动，帮助开发者、高校学生和个人创造者发现可参与、可产出的 AI+X 实践机会。',
    keywords: 'AI黑客松, Hackathon, AI作品挑战, Agent实战, 创造营, Datawhale, AI+X活动',
    canonicalPath: '/hackathons',
  },
  resources: {
    title: 'AI+X 资源与日历订阅｜Datawhale AI+X 活动日历',
    description: '订阅 Datawhale AI+X 活动日历，查看 AI 里程碑和生态资源入口，持续追踪 AI+X 活动、日历源与共建信息。',
    keywords: 'AI资源, 日历订阅, ICS订阅, AI里程碑, AI生态资源, Datawhale AI+X',
    canonicalPath: '/resources',
  },
  partners: {
    title: '生态伙伴｜Datawhale AI+X 活动日历',
    description: 'Datawhale AI+X 活动日历生态伙伴页，收录共同推动 AI+X 活动发生的社区、高校、科技企业、媒体、政府园区、投资机构和在地社区伙伴。',
    keywords: 'Datawhale AI+X 生态伙伴, AI社区, 高校伙伴, 科技企业, 媒体伙伴, 在地社区, 活动共建',
    canonicalPath: '/partners',
  },
  privacy: {
    title: '隐私政策｜Datawhale AI+X 活动日历',
    description: '了解 Datawhale AI+X 活动日历如何处理活动提交、联系信息、海报上传、订阅统计和基础访问数据。',
    keywords: 'Datawhale AI+X 隐私政策, 活动日历隐私, 数据处理',
    canonicalPath: '/privacy',
  },
  terms: {
    title: '服务条款｜Datawhale AI+X 活动日历',
    description: 'Datawhale AI+X 活动日历的服务条款，包含活动提交、审核收录、活动信息展示、订阅和资源共建相关规则。',
    keywords: 'Datawhale AI+X 服务条款, 活动提交规则, 活动日历条款',
    canonicalPath: '/terms',
  },
  edit: {
    title: '活动信息修改｜Datawhale AI+X 活动日历',
    description: '通过私有编辑链接修改已提交的 AI+X 活动信息。修改内容会进入确认流程，确认通过后再公开展示。',
    keywords: 'Datawhale AI+X 活动修改, 活动信息编辑',
    canonicalPath: '/edit',
    robots: 'noindex,nofollow',
  },
};

export function getPageSEO(page: SeoPage): SEOMetadata {
  return PAGE_SEO[page] || PAGE_SEO.home;
}

export function getEventSEO(event: TechEvent): SEOMetadata {
  const organizerName = event.organizers?.length
    ? event.organizers.join(' / ')
    : event.organizer?.name || '活动主办方';
  const description = event.summary?.trim()
    ? event.summary.trim().replace(/\s+/g, ' ').slice(0, 155)
    : `${organizerName} 发起的 AI+X 生态活动，查看活动时间、地点、主办方、海报和报名信息。`;
  const tags = [
    event.title,
    organizerName,
    event.activityType,
    ...(event.customTags || []),
    'Datawhale AI+X',
    'AI活动日历',
  ].filter(Boolean);

  return {
    title: `${event.title}｜${SITE_NAME}`,
    description,
    keywords: tags.join(', '),
    canonicalPath: `/events/${encodeURIComponent(event.id)}`,
    ogTitle: event.title,
    ogDescription: description,
    ogImage: event.coverImage || DEFAULT_OG_IMAGE,
    type: 'article',
  };
}

export function canonicalUrl(path: string): string {
  if (!path || path === '/') return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function absoluteUrl(url?: string): string {
  if (!url) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

export function updatePageSEO(metadata: SEOMetadata) {
  const canonical = canonicalUrl(metadata.canonicalPath);
  const ogTitle = metadata.ogTitle || metadata.title;
  const ogDescription = metadata.ogDescription || metadata.description;
  const image = absoluteUrl(metadata.ogImage || DEFAULT_OG_IMAGE);

  document.title = metadata.title;
  updateOrCreateMetaTag('name', 'description', metadata.description);
  updateOrCreateMetaTag('name', 'keywords', metadata.keywords);
  updateOrCreateMetaTag('name', 'robots', metadata.robots || 'index,follow,max-image-preview:large');

  updateOrCreateMetaTag('property', 'og:site_name', SITE_NAME);
  updateOrCreateMetaTag('property', 'og:locale', 'zh_CN');
  updateOrCreateMetaTag('property', 'og:type', metadata.type || 'website');
  updateOrCreateMetaTag('property', 'og:title', ogTitle);
  updateOrCreateMetaTag('property', 'og:description', ogDescription);
  updateOrCreateMetaTag('property', 'og:url', canonical);
  updateOrCreateMetaTag('property', 'og:image', image);
  updateOrCreateMetaTag('property', 'og:image:alt', `${SITE_NAME} 海报`);
  updateOrCreateMetaTag('property', 'og:image:width', '1200');
  updateOrCreateMetaTag('property', 'og:image:height', '630');

  updateOrCreateMetaTag('name', 'twitter:card', 'summary_large_image');
  updateOrCreateMetaTag('name', 'twitter:title', ogTitle);
  updateOrCreateMetaTag('name', 'twitter:description', ogDescription);
  updateOrCreateMetaTag('name', 'twitter:image', image);

  updateOrCreateLinkTag('canonical', canonical);
}

export function injectStructuredData(id: string, payload: unknown) {
  const scriptId = `structured-data-${id}`;
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.text = JSON.stringify(payload);
}

export function removeStructuredData(id: string) {
  document.getElementById(`structured-data-${id}`)?.remove();
}

export function generateBaseSchema(page: SeoPage) {
  const metadata = getPageSEO(page);
  const url = canonicalUrl(metadata.canonicalPath);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Datawhale',
        url: SITE_URL,
        logo: absoluteUrl('/brand/datawhale-logo-color.png'),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'zh-CN',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': page === 'home' ? 'CollectionPage' : 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: metadata.title,
        description: metadata.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'zh-CN',
      },
    ],
  };
}

export function generateEventSchema(event: TechEvent) {
  const eventUrl = canonicalUrl(`/events/${encodeURIComponent(event.id)}`);
  const externalUrl = event.links.registration || event.links.officialSite || eventUrl;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.summary,
    startDate: event.startTime,
    endDate: event.endTime,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.format === 'online'
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : event.format === 'hybrid'
        ? 'https://schema.org/MixedEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
    location: event.format === 'online' ? {
      '@type': 'VirtualLocation',
      url: event.links.officialSite,
    } : {
      '@type': 'Place',
      name: event.location?.city,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.location?.city,
        addressCountry: event.location?.country,
      },
    },
    image: event.coverImage ? [absoluteUrl(event.coverImage)] : [DEFAULT_OG_IMAGE],
    organizer: {
      '@type': 'Organization',
      name: event.organizer?.name || event.organizers?.join(' / ') || 'Datawhale AI+X',
      url: event.links.officialSite,
    },
    offers: event.price?.type === 'free' ? {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
      availability: 'https://schema.org/InStock',
      url: externalUrl,
    } : undefined,
    url: eventUrl,
    isAccessibleForFree: event.price?.type === 'free',
  };

  return schema;
}

function updateOrCreateMetaTag(attribute: 'name' | 'property', name: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.content = content;
}

function updateOrCreateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }

  element.href = href;
}
