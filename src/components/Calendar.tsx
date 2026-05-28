import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Globe, Rss } from 'lucide-react';
import { TechEvent } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import EmptyState from './EmptyState';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CalendarProps {
  events: TechEvent[];
  onEventClick: (event: TechEvent) => void;
  onSubscribeClick?: () => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, onEventClick, onSubscribeClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userTimezone, setUserTimezone] = useState<string>('');
  const [timezoneOffset, setTimezoneOffset] = useState<string>('');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [hasUserSelectedMonth, setHasUserSelectedMonth] = useState(false);

  useEffect(() => {
    // 获取用户的浏览器时区
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);
    
    // 计算 UTC 偏移量
    const offset = -new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';
    const offsetStr = `UTC${sign}${hours}${minutes > 0 ? ':' + minutes.toString().padStart(2, '0') : ''}`;
    setTimezoneOffset(offsetStr);
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => {
    setHasUserSelectedMonth(true);
    setCurrentDate(addMonths(currentDate, 1));
    setExpandedDays(new Set()); // 切换月份时重置展开状态
  };
  const prevMonth = () => {
    setHasUserSelectedMonth(true);
    setCurrentDate(subMonths(currentDate, 1));
    setExpandedDays(new Set()); // 切换月份时重置展开状态
  };
  const goToToday = () => {
    setHasUserSelectedMonth(true);
    setCurrentDate(new Date());
  };

  const toggleDayExpanded = (dayKey: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayKey)) {
        newSet.delete(dayKey);
      } else {
        newSet.add(dayKey);
      }
      return newSet;
    });
  };

  // 检查当前月份是否有活动
  const hasEventsThisMonth = events.some(event => 
    isSameMonth(new Date(event.startTime), currentDate)
  );

  useEffect(() => {
    if (hasUserSelectedMonth || events.length === 0 || hasEventsThisMonth) return;
    setCurrentDate(new Date(events[0].startTime));
  }, [events, hasEventsThisMonth, hasUserSelectedMonth]);

  return (
    <div className="glass-panel overflow-hidden border border-black/10">
      {/* Calendar Header */}
      <div className="p-6 sm:p-8 border-b border-black/10 bg-white/70">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-3xl font-black text-black">
            {format(currentDate, 'yyyy年M月', { locale: zhCN })}
          </h2>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
            {onSubscribeClick && (
              <button
                onClick={onSubscribeClick}
                data-testid="calendar-subscribe-button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-black/15 bg-white px-3 text-sm font-black text-accent shadow-[3px_3px_0_rgba(23,100,255,0.14)] transition-all hover:border-black/30 hover:bg-primary/20 hover:text-black active:scale-95"
                aria-label="订阅日历"
              >
                <Rss size={16} />
                <span className="whitespace-nowrap">订阅日历</span>
              </button>
            )}
            <button 
              onClick={goToToday}
              className="h-10 rounded-md border border-black/10 px-4 text-sm font-black text-black/60 transition-all hover:border-black/25 hover:bg-primary/30 hover:text-black"
            >
              今天
            </button>
            <div className="flex h-10 items-center gap-1 rounded-md border border-black/10 bg-white p-1">
              <button 
                onClick={prevMonth}
                className="p-2 text-black/50 hover:text-black hover:bg-primary/30 rounded-md transition-all"
                aria-label="上个月"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 text-black/50 hover:text-black hover:bg-primary/30 rounded-md transition-all"
                aria-label="下个月"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
        {/* Timezone Indicator */}
        {userTimezone && (
          <div className="flex items-center gap-2 text-xs text-black/50">
            <Globe size={14} className="text-accent" />
            <span>所有时间已按你的本地时区显示：<span className="text-black/70 font-bold">{userTimezone}</span> <span className="text-accent">({timezoneOffset})</span></span>
          </div>
        )}
      </div>

      {/* Weekdays Header */}
      <div className="calendar-grid bg-black/[0.02] border-b border-black/10">
        {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(day => (
          <div key={day} className="py-4 text-center text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">
            {day}
          </div>
        ))}
      </div>

      {/* Empty State or Days Grid */}
      {!hasEventsThisMonth ? (
        <div className="p-8">
          <EmptyState type="calendar" onReset={goToToday} />
        </div>
      ) : (
        <div className="calendar-grid">
          {days.map((day, idx) => {
          const dayEvents = events.filter(event => isSameDay(new Date(event.startTime), day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const isLastRow = idx >= days.length - 7; // 检查是否是最后一行
          const dayKey = day.toISOString();
          const isExpanded = expandedDays.has(dayKey);
          const displayLimit = isExpanded ? dayEvents.length : 3;

          return (
            <div 
              key={day.toString()} 
              className={cn(
                "min-h-[140px] p-4 border-r border-black/10 transition-all group",
                !isLastRow && "border-b", // 最后一行不显示底部边框
                !isCurrentMonth ? "bg-black/[0.035]" : "bg-transparent hover:bg-primary/[0.08]",
                idx % 7 === 6 && "border-r-0"
              )}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={cn(
                  "text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-all",
                  isToday ? "bg-primary text-black font-black border border-black shadow-[3px_3px_0_rgba(5,5,5,0.92)]" :
                  isCurrentMonth ? "text-black/80 font-bold" : "text-black/30"
                )}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-black/50 font-bold">
                    {dayEvents.length}
                  </span>
                )}
              </div>
              
              <div className="space-y-1.5">
                {dayEvents.slice(0, displayLimit).map(event => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="w-full text-left px-2.5 py-1.5 text-[10px] leading-tight rounded-md bg-black border border-black !text-white hover:bg-accent hover:border-accent transition-all truncate shadow-sm font-bold"
                  >
                    <span className="font-medium">{event.title}</span>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <button
                    onClick={() => toggleDayExpanded(dayKey)}
                    className="w-full text-left px-2.5 py-1 text-[10px] text-black/50 hover:text-black hover:bg-primary/20 rounded-md transition-all font-bold"
                  >
                    {isExpanded ? '− 收起' : `+ ${dayEvents.length - 3} 场`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

export default Calendar;
