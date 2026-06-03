export const ACTIVITY_TYPES = [
  { value: 'meetup', label: 'Meetup', hint: '适合交流、聚会、社区活动' },
  { value: 'workshop', label: 'Workshop', hint: '适合实操、练习、工作坊' },
  { value: 'creator_day', label: 'AI+X 创造节', hint: '适合 Datawhale AI+X 创造节专题活动' },
  { value: 'hackathon', label: 'Hackathon', hint: '适合黑客松、挑战赛、作品共创' },
  { value: 'talk', label: '分享会/讲座', hint: '适合主题分享、讲座、圆桌' },
  { value: 'training', label: '训练营', hint: '适合连续课程、训练营、营期活动' },
  { value: 'demo_day', label: 'Demo Day', hint: '适合作品展示、路演、发布活动' },
  { value: 'conference', label: '会议/峰会', hint: '适合大会、论坛、峰会' },
  { value: 'competition', label: '竞赛', hint: '适合赛事、评选、竞赛活动' },
  { value: 'other', label: '其他', hint: '无法归类时选择这一项' },
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number]['value'];

export const DEFAULT_ACTIVITY_TYPE: ActivityType = 'meetup';

export const SUBMISSION_ACTIVITY_TYPES = [
  { value: 'meetup', label: '交流/分享', hint: '适合 Meetup、主题分享、讲座、圆桌、社区交流' },
  { value: 'workshop', label: '工作坊/实操', hint: '适合动手练习、工作坊、共学实践' },
  { value: 'creator_day', label: 'AI+X 创造节', hint: '适合 Datawhale AI+X 创造节品牌活动' },
  { value: 'hackathon', label: '黑客松', hint: '适合 Hackathon、挑战赛、作品共创' },
  { value: 'training', label: '课程/训练营', hint: '适合连续课程、训练营、营期活动' },
  { value: 'other', label: '其他/不确定', hint: '拿不准就选这一项，我们确认时可以再调整' },
] as const satisfies ReadonlyArray<{ value: ActivityType; label: string; hint: string }>;

export const ACTIVITY_FILTER_GROUPS = [
  {
    id: 'sharing',
    label: '交流/分享',
    values: ['meetup', 'talk', 'conference'],
  },
  {
    id: 'workshop',
    label: '工作坊/实操',
    values: ['workshop'],
  },
  {
    id: 'creator_day',
    label: '创造节',
    values: ['creator_day'],
  },
  {
    id: 'challenge',
    label: '黑客松',
    values: ['hackathon', 'competition', 'demo_day'],
  },
  {
    id: 'training',
    label: '课程/训练营',
    values: ['training'],
  },
] as const satisfies ReadonlyArray<{ id: string; label: string; values: ActivityType[] }>;

export const PUBLIC_ACTIVITY_TYPES = ACTIVITY_TYPES.filter((type) => type.value !== 'other');

export function getActivityTypeLabel(value?: string): string {
  return ACTIVITY_TYPES.find((type) => type.value === value)?.label || '活动';
}

export function getActivityFilterValues(value?: string): ActivityType[] {
  if (!value) return [];

  const group = ACTIVITY_FILTER_GROUPS.find((filterGroup) => filterGroup.id === value);
  if (group) return [...group.values];

  const activityType = ACTIVITY_TYPES.find((type) => type.value === value);
  return activityType ? [activityType.value] : [];
}

export function getActivityFilterLabel(value?: string): string {
  if (!value) return '活动';
  return ACTIVITY_FILTER_GROUPS.find((filterGroup) => filterGroup.id === value)?.label || getActivityTypeLabel(value);
}

export const CITY_OPTIONS = [
  '北京',
  '上海',
  '广州',
  '深圳',
  '杭州',
  '南京',
  '苏州',
  '成都',
  '重庆',
  '武汉',
  '西安',
  '长沙',
  '合肥',
  '天津',
  '青岛',
  '厦门',
  '福州',
  '郑州',
  '济南',
  '宁波',
  '无锡',
  '常州',
  '南昌',
  '南宁',
  '昆明',
  '贵阳',
  '太原',
  '石家庄',
  '沈阳',
  '大连',
  '长春',
  '哈尔滨',
  '呼和浩特',
  '兰州',
  '银川',
  '西宁',
  '乌鲁木齐',
  '海口',
  '三亚',
  '香港',
  '澳门',
  '台北',
  '其他城市',
] as const;

export const OTHER_CITY_OPTION = '其他城市';
