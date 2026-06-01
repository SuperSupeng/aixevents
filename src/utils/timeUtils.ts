import { differenceInDays, differenceInHours, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';

export interface TimeUrgency {
  label: string;
  type: 'urgent' | 'soon' | 'upcoming' | 'future';
  color: string;
  bgColor: string;
  borderColor: string;
}

export function isEventActiveByEndTime(eventEndTime: string, referenceDate = new Date()): boolean {
  const endTime = typeof eventEndTime === 'string' ? parseISO(eventEndTime) : eventEndTime;
  const endTimestamp = endTime.getTime();

  return Number.isFinite(endTimestamp) && endTimestamp >= referenceDate.getTime();
}

/**
 * 计算活动的时间紧迫度
 */
export function getTimeUrgency(eventStartTime: string): TimeUrgency | null {
  const startTime = typeof eventStartTime === 'string' ? parseISO(eventStartTime) : eventStartTime;
  const now = new Date();
  
  const hoursDiff = differenceInHours(startTime, now);
  const daysDiff = differenceInDays(startTime, now);

  // 已经开始或过去的活动
  if (hoursDiff < 0) {
    return null;
  }

  // 24小时内
  if (hoursDiff < 24) {
    if (isToday(startTime)) {
      return {
        label: '今天',
        type: 'urgent',
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        borderColor: 'border-red-400/30'
      };
    }
  }

  // 明天
  if (isTomorrow(startTime)) {
    return {
      label: '明天',
      type: 'urgent',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      borderColor: 'border-orange-400/30'
    };
  }

  // 本周
  if (isThisWeek(startTime, { weekStartsOn: 0 })) {
    return {
      label: '本周',
      type: 'soon',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      borderColor: 'border-yellow-400/30'
    };
  }

  // 下周（7-14天）
  if (daysDiff >= 7 && daysDiff < 14) {
    return {
      label: '下周',
      type: 'upcoming',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/30'
    };
  }

  // 本月（14-30天）
  if (daysDiff >= 14 && daysDiff < 30) {
    return {
      label: '本月',
      type: 'upcoming',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30'
    };
  }

  // 下月（30-60天）
  if (daysDiff >= 30 && daysDiff < 60) {
    return {
      label: '下月',
      type: 'future',
      color: 'text-white/40',
      bgColor: 'bg-white/5',
      borderColor: 'border-white/10'
    };
  }

  // 更远的未来
  return null;
}

/**
 * 获取倒计时文本
 */
export function getCountdownText(eventStartTime: string): string {
  const startTime = typeof eventStartTime === 'string' ? parseISO(eventStartTime) : eventStartTime;
  const now = new Date();
  
  const hoursDiff = differenceInHours(startTime, now);
  const daysDiff = differenceInDays(startTime, now);

  if (hoursDiff < 0) {
    return '已开始';
  }

  if (hoursDiff < 1) {
    return '即将开始';
  }

  if (hoursDiff < 24) {
    return `${hoursDiff} 小时后`;
  }

  if (daysDiff === 1) {
    return '明天';
  }

  if (daysDiff < 7) {
    return `${daysDiff} 天后`;
  }

  return '';
}
