import type { TechEvent } from '../types';
import { getPublicSiteUrl } from './site';

export const SITE_URL = getPublicSiteUrl();
export const SITE_NAME = 'Datawhale AI+X 社区活动日历';
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

export type SeoPage = 'home' | 'privacy' | 'terms' | 'resources' | 'hackathons' | 'creatorsDay' | 'partners' | 'join' | 'edit';

export const PAGE_SEO: Record<SeoPage, SEOMetadata> = {
  home: {
    title: 'Datawhale AI+X 社区活动日历｜发现、提交和订阅 AI 实践活动',
    description: 'Datawhale AI+X 社区活动日历收录 Meetup、Workshop、Hackathon、高校、城市和产业共创活动，帮助学习者、开发者和生态伙伴发现可参与、可实践、可共建的 AI+X 机会。',
    keywords: 'Datawhale, AI+X, 社区活动日历, AI活动日历, AI实践, 开发者活动, 高校活动, 城市活动, 产业活动, 黑客松, Workshop, Meetup, 活动提交',
    canonicalPath: '/',
  },
  hackathons: {
    title: 'AI+X Hackathon｜Datawhale AI+X 社区活动日历',
    description: '收录 AI 黑客松、创造营、挑战赛、Demo Day 和 Agent 实战活动，帮助开发者、高校学生和个人创造者发现可参与、可产出的社区实践机会。',
    keywords: 'AI黑客松, Hackathon, AI挑战赛, Agent实战, 创造营, Demo Day, Datawhale, AI+X社区活动',
    canonicalPath: '/hackathons',
  },
  creatorsDay: {
    title: 'AI+X 创造节｜Datawhale AI+X Creators Day',
    description: 'Datawhale AI+X 创造节是面向 AI 学习者、开发者、高校学生、个人创造者与产业从业者的 AI 动手实践品牌活动，鼓励大家在真实场景中用 AI 做出可展示的作品。',
    keywords: 'AI+X创造节, Datawhale AI+X Creators Day, AI实践活动, AI作品共创, 高校AI活动, 城市AI活动, Agent, 工作流, 应用原型',
    canonicalPath: '/creators-day',
  },
  resources: {
    title: 'AI+X 资源与外部参考｜Datawhale AI+X 社区活动日历',
    description: '查看 AI 里程碑、外部参考源和活动提交入口，持续追踪 Datawhale AI+X 社区活动相关的信息源。',
    keywords: 'AI资源, AI里程碑, AI生态资源, 社区活动资源, Datawhale AI+X',
    canonicalPath: '/resources',
  },
  partners: {
    title: '生态伙伴｜Datawhale AI+X 社区活动日历',
    description: 'Datawhale AI+X 社区活动日历生态伙伴页暂未公开。',
    keywords: 'Datawhale AI+X 生态伙伴, AI模型平台, AI工具, 开源与社区, 开发者社区, 科技媒体, 投资孵化, 算力芯片, 智能硬件, 具身智能, 活动共建',
    canonicalPath: '/partners',
    robots: 'noindex,nofollow',
  },
  join: {
    title: '加入 Datawhale 城市/区域群｜Datawhale AI+X 社区活动日历',
    description: '选择城市或区域并扫码加入 Datawhale AI+X 本地交流群，获取近期活动、共创机会和线下交流信息。',
    keywords: 'Datawhale 城市/区域群, AI+X 城市群, AI活动群, AI交流群, Datawhale AI+X',
    canonicalPath: '/join',
  },
  privacy: {
    title: '隐私政策｜Datawhale AI+X 社区活动日历',
    description: '了解 Datawhale AI+X 社区活动日历如何处理活动提交、联系信息、海报上传、订阅统计和基础访问数据。',
    keywords: 'Datawhale AI+X 隐私政策, 活动日历隐私, 数据处理',
    canonicalPath: '/privacy',
  },
  terms: {
    title: '服务条款｜Datawhale AI+X 社区活动日历',
    description: 'Datawhale AI+X 社区活动日历的服务条款，包含活动提交、审核收录、活动信息展示、订阅和资源共建相关规则。',
    keywords: 'Datawhale AI+X 服务条款, 活动提交规则, 活动日历条款',
    canonicalPath: '/terms',
  },
  edit: {
    title: '活动信息修改｜Datawhale AI+X 社区活动日历',
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
    ? normalizeSeoText(event.summary).slice(0, 155)
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
  const cleanPath = (path || '/').split('#')[0].split('?')[0] || '/';
  if (cleanPath === '/') return `${SITE_URL}/`;
  return `${SITE_URL}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`;
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

  script.text = JSON.stringify(payload).replace(/</g, '\\u003c');
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
        description: 'Datawhale AI+X 社区活动日历的活动共建与展示站点。',
        url: SITE_URL,
        logo: absoluteUrl('/brand/datawhale-logo-color.png'),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        description: PAGE_SEO.home.description,
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
  const externalUrl = safeHttpUrl(event.links.registration) || safeHttpUrl(event.links.officialSite) || eventUrl;
  const organizerName = event.organizers?.length
    ? event.organizers.join(' / ')
    : event.organizer?.name || 'Datawhale AI+X';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.summary,
    startDate: event.startTime,
    endDate: event.endTime,
    eventStatus: event.status === 'canceled'
      ? 'https://schema.org/EventCancelled'
      : 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.format === 'online'
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : event.format === 'hybrid'
        ? 'https://schema.org/MixedEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
    location: event.format === 'online' ? {
      '@type': 'VirtualLocation',
      url: externalUrl,
    } : {
      '@type': 'Place',
      name: [event.location?.city, event.location?.address].filter(Boolean).join(' · ') || '线下活动地点',
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.location?.address,
        addressLocality: event.location?.city,
        addressCountry: event.location?.country,
      },
    },
    image: event.coverImage ? [absoluteUrl(event.coverImage)] : [DEFAULT_OG_IMAGE],
    organizer: {
      '@type': 'Organization',
      name: organizerName,
      url: externalUrl,
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
    inLanguage: event.language?.[0] || 'zh-CN',
  };

  return schema;
}

export function generateEventItemListSchema(events: TechEvent[]) {
  const upcomingEvents = events
    .filter((event) => event.status !== 'canceled')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 12);

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Datawhale AI+X 社区活动列表',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: upcomingEvents.length,
    itemListElement: upcomingEvents.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: canonicalUrl(`/events/${encodeURIComponent(event.id)}`),
      name: event.title,
      startDate: event.startTime,
    })),
  };
}

function safeHttpUrl(url?: string): string {
  if (!url || url === '#') return '';

  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol) ? parsedUrl.toString() : '';
  } catch {
    return '';
  }
}

function normalizeSeoText(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/([。！？；：，、])\s+/g, '$1');
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
