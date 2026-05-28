import { TechEvent } from '../types';

interface SEOMetadata {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  twitterCard: 'summary' | 'summary_large_image';
  canonicalUrl: string;
}

/**
 * 生成首页 SEO metadata
 */
export function getHomeSEO(): SEOMetadata {
  return {
    title: 'Datawhale AI+X 活动日历',
    description: 'Datawhale AI+X 活动日历连接 AI 学习者、开发者、高校学生、产业从业者和个人创造者，推动 AI+X 在城市、高校与产业场景中持续发生。',
    keywords: 'Datawhale, AI活动, AI+X, 科技活动, 开发者活动, 高校活动, 产业活动, AI实践, 活动日历, 活动提交',
    ogTitle: 'Datawhale AI+X 活动日历',
    ogDescription: '发现、提交并订阅 AI+X 生态活动，让 AI 学习走向真实场景、动手实践、作品展示和生态共建。',
    twitterCard: 'summary_large_image',
    canonicalUrl: 'https://datawhale.club',
  };
}

/**
 * 生成活动详情页 SEO metadata
 */
export function getEventSEO(event: TechEvent): SEOMetadata {
  const eventDate = new Date(event.startTime).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const location = event.format === 'online' 
    ? '线上活动'
    : `${event.location?.city}, ${event.location?.country}`;

  return {
    title: `${event.title} - ${eventDate} | Datawhale AI+X 活动日历`,
    description: `${event.summary.substring(0, 155)}... 查看这场${event.format === 'online' ? '线上' : event.format === 'hybrid' ? '混合' : '线下'}科技活动。${event.price.type === 'free' ? '免费参与' : event.price.range}。`,
    keywords: `${event.tags.join(', ')}, ${event.title}, 科技活动, ${location}, ${eventDate}`,
    ogTitle: event.title,
    ogDescription: event.summary,
    ogImage: event.coverImage,
    twitterCard: event.coverImage ? 'summary_large_image' : 'summary',
    canonicalUrl: `https://datawhale.club/event/${event.id}`,
  };
}

/**
 * 生成标签页 SEO metadata
 */
export function getTagSEO(tag: string): SEOMetadata {
  return {
    title: `${tag} 活动与大会 2026 | Datawhale AI+X 活动日历`,
    description: `发现全球即将举行的 ${tag} 活动、会议、峰会、工作坊和社区聚会。`,
    keywords: `${tag} 活动, ${tag} 大会, ${tag} 聚会, ${tag} 峰会, ${tag} 黑客松, ${tag} 工作坊`,
    ogTitle: `${tag} 活动与大会`,
    ogDescription: `探索全球 ${tag} 活动，持续关注最新会议、聚会和实践机会。`,
    twitterCard: 'summary',
    canonicalUrl: `https://datawhale.club/tag/${tag.toLowerCase()}`,
  };
}

/**
 * 生成地区页 SEO metadata
 */
export function getLocationSEO(location: string): SEOMetadata {
  return {
    title: `${location} 科技活动 2026 | Datawhale AI+X 活动日历`,
    description: `查找 ${location} 的科技大会、开发者聚会、AI 峰会和黑客松活动。`,
    keywords: `${location} 科技活动, ${location} 开发者大会, ${location} 科技聚会, ${location} AI峰会, ${location} 黑客松`,
    ogTitle: `${location} 科技活动`,
    ogDescription: `探索 ${location} 即将举行的科技活动、会议和社区聚会。`,
    twitterCard: 'summary',
    canonicalUrl: `https://datawhale.club/location/${location.toLowerCase().replace(/\s+/g, '-')}`,
  };
}

/**
 * 更新页面 meta 标签
 */
export function updateMetaTags(metadata: SEOMetadata) {
  // Title
  document.title = metadata.title;

  // Meta Description
  updateOrCreateMetaTag('name', 'description', metadata.description);
  updateOrCreateMetaTag('name', 'keywords', metadata.keywords);

  // Open Graph
  updateOrCreateMetaTag('property', 'og:title', metadata.ogTitle);
  updateOrCreateMetaTag('property', 'og:description', metadata.ogDescription);
  updateOrCreateMetaTag('property', 'og:url', metadata.canonicalUrl);
  updateOrCreateMetaTag('property', 'og:type', 'website');
  
  if (metadata.ogImage) {
    updateOrCreateMetaTag('property', 'og:image', metadata.ogImage);
  }

  // Twitter Card
  updateOrCreateMetaTag('name', 'twitter:card', metadata.twitterCard);
  updateOrCreateMetaTag('name', 'twitter:title', metadata.ogTitle);
  updateOrCreateMetaTag('name', 'twitter:description', metadata.ogDescription);
  
  if (metadata.ogImage) {
    updateOrCreateMetaTag('name', 'twitter:image', metadata.ogImage);
  }

  // Canonical URL
  updateOrCreateLinkTag('canonical', metadata.canonicalUrl);
}

/**
 * 辅助函数：更新或创建 meta 标签
 */
function updateOrCreateMetaTag(attribute: string, name: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.content = content;
}

/**
 * 辅助函数：更新或创建 link 标签
 */
function updateOrCreateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  
  element.href = href;
}

/**
 * 生成 JSON-LD 结构化数据（活动）
 */
export function generateEventSchema(event: TechEvent): string {
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
      url: event.links.officialSite
    } : {
      '@type': 'Place',
      name: event.location?.city,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.location?.city,
        addressCountry: event.location?.country,
      }
    },
    image: event.coverImage ? [event.coverImage] : [],
    organizer: {
      '@type': 'Organization',
      name: event.organizer.name,
      url: event.links.officialSite
    },
    offers: event.price.type === 'free' ? {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: event.links.registration || event.links.officialSite
    } : undefined,
    url: event.links.officialSite,
    isAccessibleForFree: event.price.type === 'free',
  };

  return JSON.stringify(schema);
}

/**
 * 注入结构化数据到页面
 */
export function injectSchema(schemaJson: string) {
  // 移除旧的 schema
  const oldSchema = document.querySelector('script[type="application/ld+json"]');
  if (oldSchema) {
    oldSchema.remove();
  }

  // 注入新的 schema
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = schemaJson;
  document.head.appendChild(script);
}
