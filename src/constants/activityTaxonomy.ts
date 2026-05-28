export const ACTIVITY_TYPES = [
  { value: 'meetup', label: 'Meetup', hint: '适合交流、聚会、社区活动' },
  { value: 'workshop', label: 'Workshop', hint: '适合实操、练习、工作坊' },
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

export const PUBLIC_ACTIVITY_TYPES = ACTIVITY_TYPES.filter((type) => type.value !== 'other');

export function getActivityTypeLabel(value?: string): string {
  return ACTIVITY_TYPES.find((type) => type.value === value)?.label || '活动';
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
