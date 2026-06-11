export interface CityGroup {
  slug: string;
  city: string;
  qrImage: string;
  aliases?: string[];
  featured?: boolean;
  description?: string;
}

export const FALLBACK_CITY_GROUP: CityGroup = {
  slug: 'dun-dun',
  city: '蹲蹲群',
  qrImage: '/brand/city-groups/dun-dun.jpg',
  aliases: ['蹲蹲', '全国', '其他城市', 'other', 'fallback'],
  description: '没找到自己的城市或区域，可以先加入蹲蹲群，后续城市/区域群开通后再分流。',
};

export const CITY_GROUPS: CityGroup[] = [
  { slug: 'beijing', city: '北京', qrImage: '/brand/city-groups/beijing.jpg', featured: true },
  { slug: 'shanghai', city: '上海', qrImage: '/brand/city-groups/shanghai.jpg', featured: true },
  { slug: 'shenzhen', city: '深圳', qrImage: '/brand/city-groups/shenzhen.jpg', featured: true },
  { slug: 'hangzhou', city: '杭州', qrImage: '/brand/city-groups/hangzhou.jpg', featured: true },
  { slug: 'ningbo', city: '宁波', qrImage: '/brand/city-groups/ningbo.jpg', aliases: ['宁波市'] },
  { slug: 'guangzhou', city: '广州', qrImage: '/brand/city-groups/guangzhou.jpg' },
  { slug: 'nanjing', city: '南京', qrImage: '/brand/city-groups/nanjing.jpg' },
  { slug: 'chengdu', city: '成都', qrImage: '/brand/city-groups/chengdu.jpg' },
  { slug: 'chongqing', city: '重庆', qrImage: '/brand/city-groups/chongqing.jpg' },
  { slug: 'hefei', city: '合肥', qrImage: '/brand/city-groups/hefei.jpg' },
  { slug: 'qingdao', city: '青岛', qrImage: '/brand/city-groups/qingdao.jpg' },
  { slug: 'jinan', city: '济南', qrImage: '/brand/city-groups/jinan.jpg' },
  { slug: 'weihai', city: '威海', qrImage: '/brand/city-groups/weihai.jpg' },
  { slug: 'wuhan', city: '武汉', qrImage: '/brand/city-groups/wuhan.jpg' },
  { slug: 'xiamen', city: '厦门', qrImage: '/brand/city-groups/xiamen.jpg' },
  { slug: 'tianjin', city: '天津', qrImage: '/brand/city-groups/tianjin.jpg' },
  { slug: 'wuxi', city: '无锡', qrImage: '/brand/city-groups/wuxi.jpg' },
  { slug: 'shenyang', city: '沈阳', qrImage: '/brand/city-groups/shenyang.jpg' },
  { slug: 'suzhou', city: '苏州', qrImage: '/brand/city-groups/suzhou.jpg' },
  { slug: 'zhuzhou', city: '株洲', qrImage: '/brand/city-groups/zhuzhou.jpg' },
  { slug: 'xian', city: '西安', qrImage: '/brand/city-groups/xian.jpg', aliases: ['xi-an', '西安市'] },
  { slug: 'xinjiang', city: '新疆', qrImage: '/brand/city-groups/xinjiang.jpg', aliases: ['乌鲁木齐', '新疆维吾尔自治区'] },
  { slug: 'zhengzhou', city: '郑州', qrImage: '/brand/city-groups/zhengzhou.jpg' },
  { slug: 'changzhou', city: '常州', qrImage: '/brand/city-groups/changzhou.jpg' },
  { slug: 'nanning', city: '南宁', qrImage: '/brand/city-groups/nanning.jpg' },
  { slug: 'jiujiang', city: '九江', qrImage: '/brand/city-groups/jiujiang.jpg' },
  { slug: 'singapore', city: '新加坡', qrImage: '/brand/city-groups/singapore.jpg', aliases: ['Singapore', 'SG'] },
  { slug: 'netherlands', city: '荷兰', qrImage: '/brand/city-groups/netherlands.jpg', aliases: ['Netherlands', 'Holland', 'NL'] },
  { slug: 'paris', city: '巴黎', qrImage: '/brand/city-groups/paris.jpg', aliases: ['Paris', '法国', 'France'] },
  { slug: 'korea', city: '韩国', qrImage: '/brand/city-groups/korea.jpg', aliases: ['Korea', 'South Korea', 'KR', '首尔', 'Seoul'] },
];

export const ALL_JOIN_GROUPS = [...CITY_GROUPS, FALLBACK_CITY_GROUP];

function normalizeCityQuery(value: string): string {
  return decodeURIComponent(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/市$/, '');
}

export function findCityGroup(value?: string | null): CityGroup | null {
  if (!value) return null;

  const query = normalizeCityQuery(value);
  if (!query) return null;

  return (
    ALL_JOIN_GROUPS.find((group) => {
      const candidates = [group.slug, group.city, ...(group.aliases || [])];
      return candidates.some((candidate) => normalizeCityQuery(candidate) === query);
    }) || null
  );
}

export function getShareCityParam(group: CityGroup): string {
  return group.slug;
}
