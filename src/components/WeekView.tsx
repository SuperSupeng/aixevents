import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TechEvent } from '../types';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay,
  addWeeks,
  subWeeks,
  parseISO,
  startOfDay,
  endOfDay,
  differenceInCalendarDays
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Globe } from 'lucide-react';
import EventDetail from './EventDetail';
import EmptyState from './EmptyState';

interface WeekViewProps {
  events: TechEvent[];
  onEventClick?: (event: TechEvent) => void;
}

const HOUR_ROW_HEIGHT = 60;
const WEEK_GRID_COLUMNS = '100px repeat(7, minmax(96px, 1fr))';
const DEFAULT_VISIBLE_START_HOUR = 8;
const MIN_VISIBLE_START_HOUR = 7;
const MAX_VISIBLE_START_HOUR = 18;

interface SpanningEventPlacement {
  event: TechEvent;
  startIndex: number;
  endIndex: number;
  span: number;
  startsBeforeWeek: boolean;
  endsAfterWeek: boolean;
}

function getDisplayEndDate(eventStart: Date, eventEnd: Date): Date {
  const endsAtMidnight =
    eventEnd.getHours() === 0 &&
    eventEnd.getMinutes() === 0 &&
    eventEnd.getSeconds() === 0 &&
    eventEnd.getMilliseconds() === 0;

  if (eventEnd.getTime() > eventStart.getTime() && endsAtMidnight) {
    return new Date(eventEnd.getTime() - 1);
  }

  return eventEnd;
}

function eventOverlapsRange(event: TechEvent, rangeStart: Date, rangeEnd: Date): boolean {
  const eventStart = parseISO(event.startTime);
  const eventEnd = parseISO(event.endTime);
  const displayEnd = getDisplayEndDate(eventStart, eventEnd);

  return eventStart.getTime() <= rangeEnd.getTime() && displayEnd.getTime() >= rangeStart.getTime();
}

function isSpanningEvent(event: TechEvent): boolean {
  const eventStart = parseISO(event.startTime);
  const eventEnd = getDisplayEndDate(eventStart, parseISO(event.endTime));

  return Boolean(event.isAllDay) || !isSameDay(eventStart, eventEnd);
}

function getSpanningPlacement(event: TechEvent, weekDays: Date[]): SpanningEventPlacement | null {
  const eventStart = parseISO(event.startTime);
  const eventEnd = parseISO(event.endTime);
  const displayEnd = getDisplayEndDate(eventStart, eventEnd);
  const weekStartDay = startOfDay(weekDays[0]);
  const weekEndDay = endOfDay(weekDays[weekDays.length - 1]);

  if (!eventOverlapsRange(event, weekStartDay, weekEndDay)) return null;

  const rawStartIndex = differenceInCalendarDays(startOfDay(eventStart), weekStartDay);
  const rawEndIndex = differenceInCalendarDays(startOfDay(displayEnd), weekStartDay);
  const startIndex = Math.max(0, Math.min(6, rawStartIndex));
  const endIndex = Math.max(0, Math.min(6, rawEndIndex));

  if (endIndex < startIndex) return null;

  return {
    event,
    startIndex,
    endIndex,
    span: endIndex - startIndex + 1,
    startsBeforeWeek: eventStart.getTime() < weekStartDay.getTime(),
    endsAfterWeek: displayEnd.getTime() > weekEndDay.getTime(),
  };
}

function buildSpanningRows(placements: SpanningEventPlacement[]): SpanningEventPlacement[][] {
  const rows: SpanningEventPlacement[][] = [];

  placements
    .sort((a, b) => a.startIndex - b.startIndex || b.span - a.span || new Date(a.event.startTime).getTime() - new Date(b.event.startTime).getTime())
    .forEach((placement) => {
      const availableRow = rows.find((row) =>
        row.every((item) => placement.endIndex < item.startIndex || placement.startIndex > item.endIndex)
      );

      if (availableRow) {
        availableRow.push(placement);
      } else {
        rows.push([placement]);
      }
    });

  return rows;
}

const WeekView: React.FC<WeekViewProps> = ({ events, onEventClick }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Monday
  const [selectedEvent, setSelectedEvent] = useState<TechEvent | null>(null);
  const weekGridRef = useRef<HTMLDivElement>(null);

  const weekEnd = useMemo(() => endOfWeek(currentWeekStart, { weekStartsOn: 1 }), [currentWeekStart]);
  const weekRangeStart = useMemo(() => startOfDay(currentWeekStart), [currentWeekStart]);
  const weekRangeEnd = useMemo(() => endOfDay(weekEnd), [weekEnd]);

  const weekDays = useMemo(() => {
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart, weekEnd]);

  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Filter events for current week
  const weekEvents = useMemo(() => {
    return events.filter(event => eventOverlapsRange(event, weekRangeStart, weekRangeEnd));
  }, [events, weekRangeEnd, weekRangeStart]);

  // Separate spanning events from single-day timed events. Multi-day timed events
  // render as top bars so the hour grid never stretches across several days.
  const { spanningEvents, timedEvents } = useMemo(() => {
    const spanning: TechEvent[] = [];
    const timed: TechEvent[] = [];
    
    weekEvents.forEach(event => {
      if (isSpanningEvent(event)) {
        spanning.push(event);
      } else {
        timed.push(event);
      }
    });
    
    return { spanningEvents: spanning, timedEvents: timed };
  }, [weekEvents]);

  const spanningRows = useMemo(() => {
    const placements = spanningEvents
      .map((event) => getSpanningPlacement(event, weekDays))
      .filter((placement): placement is SpanningEventPlacement => Boolean(placement));

    return buildSpanningRows(placements);
  }, [spanningEvents, weekDays]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const initialScrollHour = useMemo(() => {
    if (timedEvents.length === 0) return DEFAULT_VISIBLE_START_HOUR;

    const earliestHour = timedEvents.reduce((earliest, event) => {
      const eventHour = parseISO(event.startTime).getHours();
      return Number.isFinite(eventHour) ? Math.min(earliest, eventHour) : earliest;
    }, 24);

    if (earliestHour === 24) return DEFAULT_VISIBLE_START_HOUR;

    return Math.min(
      MAX_VISIBLE_START_HOUR,
      Math.max(MIN_VISIBLE_START_HOUR, earliestHour - 1)
    );
  }, [timedEvents]);

  useEffect(() => {
    const weekGrid = weekGridRef.current;
    if (!weekGrid) return;

    const frameId = window.requestAnimationFrame(() => {
      weekGrid.scrollTo({
        top: initialScrollHour * HOUR_ROW_HEIGHT,
        left: weekGrid.scrollLeft,
        behavior: 'auto',
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [currentWeekStart, initialScrollHour]);

  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const handleEventClick = (event: TechEvent) => {
    if (onEventClick) {
      onEventClick(event);
      return;
    }

    setSelectedEvent(event);
  };

  // Get events for specific day and hour
  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return timedEvents.filter(event => {
      const eventStart = parseISO(event.startTime);
      const eventEnd = parseISO(event.endTime);
      
      if (!isSameDay(eventStart, day)) return false;
      
      const startHour = eventStart.getHours();
      const endHour = eventEnd.getHours();
      const endMinute = eventEnd.getMinutes();
      
      return hour >= startHour && (hour < endHour || (hour === endHour && endMinute > 0));
    });
  };

  // Calculate event position and height
  const getEventStyle = (event: TechEvent, day: Date) => {
    const eventStart = parseISO(event.startTime);
    const eventEnd = parseISO(event.endTime);
    
    if (!isSameDay(eventStart, day)) return null;
    
    const startMinute = eventStart.getMinutes();
    const durationMinutes = Math.max(30, (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60));
    
    return {
      top: `${startMinute}px`, // positioned within the start-hour row
      height: `${Math.max(durationMinutes, 30)}px`,
    };
  };

  const isToday = (day: Date) => isSameDay(day, new Date());

  if (weekEvents.length === 0) {
    return (
      <div className="space-y-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black">
            {format(currentWeekStart, 'M月d日', { locale: zhCN })} - {format(weekEnd, 'M月d日', { locale: zhCN })} 周视图
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="rounded-lg border border-black/10 bg-white/80 p-2 text-black/60 transition-all hover:border-black/25 hover:bg-primary/30 hover:text-black"
              aria-label="上一周"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToToday}
              className="rounded-lg border border-black/10 bg-white/80 px-4 py-2 text-sm font-black text-black/60 transition-all hover:border-black/25 hover:bg-primary/30 hover:text-black"
            >
              今天
            </button>
            <button
              onClick={goToNextWeek}
              className="rounded-lg border border-black/10 bg-white/80 p-2 text-black/60 transition-all hover:border-black/25 hover:bg-primary/30 hover:text-black"
              aria-label="下一周"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <EmptyState type="calendar" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-black">
            {format(currentWeekStart, 'M月d日', { locale: zhCN })} - {format(weekEnd, 'M月d日', { locale: zhCN })} 周视图
          </h2>
          <p className="text-sm text-black/50 mt-1">时间按 {userTimezone} 显示</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="rounded-lg border border-black/10 bg-white/80 p-2 text-black/60 transition-all hover:border-black/25 hover:bg-primary/30 hover:text-black"
            aria-label="上一周"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToToday}
            className="rounded-lg border border-black/10 bg-white/80 px-4 py-2 text-sm font-black text-black/60 transition-all hover:border-black/25 hover:bg-primary/30 hover:text-black"
          >
            今天
          </button>
          <button
            onClick={goToNextWeek}
            className="rounded-lg border border-black/10 bg-white/80 p-2 text-black/60 transition-all hover:border-black/25 hover:bg-primary/30 hover:text-black"
            aria-label="下一周"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div ref={weekGridRef} className="max-h-[min(74vh,860px)] overflow-auto rounded-2xl border border-black/10 bg-white/90 shadow-[0_18px_44px_rgba(5,5,5,0.08)] backdrop-blur-xl">
        <div className="min-w-[800px]">
          {/* Days Header */}
          <div 
            className="sticky top-0 z-30 grid border-b border-black/10 bg-white/95 backdrop-blur-xl"
            style={{ gridTemplateColumns: WEEK_GRID_COLUMNS }}
          >
          <div className="sticky left-0 z-40 flex items-center justify-center border-r border-black/10 bg-white/95 py-3 text-xs font-semibold text-black/50">时间</div>
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`p-3 text-center border-r border-black/10 last:border-r-0 ${
                isToday(day) ? 'bg-primary/20' : ''
              }`}
            >
              <div className="text-xs font-semibold text-black/55">{format(day, 'EEE', { locale: zhCN })}</div>
              <div className={`text-lg font-bold ${isToday(day) ? 'text-accent' : 'text-black'}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
          </div>

          {spanningRows.length > 0 && (
            <div
              className="sticky top-[61px] z-20 grid border-b border-black/10 bg-white/95 backdrop-blur-xl"
              style={{ gridTemplateColumns: WEEK_GRID_COLUMNS }}
            >
              <div className="sticky left-0 z-30 flex items-center justify-center gap-1.5 border-r border-black/10 bg-white/95 px-2 py-2 text-[11px] font-black text-black/45">
                <CalendarIcon size={13} className="text-accent" />
                全天/跨天
              </div>
              <div
                className="grid gap-x-1 gap-y-1.5 px-2 py-2"
                style={{
                  gridColumn: '2 / span 7',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                }}
              >
                {spanningRows.map((row, rowIndex) =>
                  row.map((placement) => {
                    const eventStart = parseISO(placement.event.startTime);
                    const eventEnd = parseISO(placement.event.endTime);
                    const timeLabel = placement.event.isAllDay
                      ? '全天'
                      : `${placement.startsBeforeWeek ? '此前' : format(eventStart, 'M/d HH:mm', { locale: zhCN })} - ${placement.endsAfterWeek ? '之后' : format(eventEnd, 'M/d HH:mm', { locale: zhCN })}`;

                    return (
                      <button
                        key={placement.event.id}
                        onClick={() => handleEventClick(placement.event)}
                        className={`min-h-8 overflow-hidden rounded-md border border-accent/40 bg-primary/35 px-2 py-1.5 text-left text-black shadow-[2px_2px_0_rgba(23,100,255,0.12)] transition-all hover:border-accent hover:bg-primary/50 ${
                          placement.startsBeforeWeek ? 'rounded-l-none border-l-accent' : ''
                        } ${placement.endsAfterWeek ? 'rounded-r-none border-r-accent' : ''}`}
                        style={{
                          gridColumn: `${placement.startIndex + 1} / span ${placement.span}`,
                          gridRow: rowIndex + 1,
                        }}
                      >
                        <div className="truncate text-[11px] font-black leading-4">{placement.event.title}</div>
                        <div className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-bold leading-3 text-black/55">
                          <Clock size={10} className="shrink-0" />
                          <span className="truncate">{timeLabel}</span>
                          {placement.event.format === 'online' ? (
                            <>
                              <span className="text-black/25">•</span>
                              <Globe size={10} className="shrink-0 text-accent" />
                              <span>线上</span>
                            </>
                          ) : placement.event.location?.city ? (
                            <>
                              <span className="text-black/25">•</span>
                              <MapPin size={10} className="shrink-0 text-accent" />
                              <span className="truncate">{placement.event.location.city}</span>
                            </>
                          ) : null}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Time Grid */}
          <div>
            {hours.map(hour => (
              <div 
                key={hour} 
                className="grid border-b border-black/10 last:border-b-0"
                style={{ height: `${HOUR_ROW_HEIGHT}px`, gridTemplateColumns: WEEK_GRID_COLUMNS }}
              >
                {/* Hour Label */}
                <div className="sticky left-0 z-10 flex items-start justify-center border-r border-black/10 bg-white/95 py-3 text-xs text-black/45">
                  {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                </div>
                
                {/* Day Cells */}
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = getEventsForDayAndHour(day, hour);
                  const isFirstHourOfEvent = dayEvents.filter(event => {
                    const eventStart = parseISO(event.startTime);
                    return eventStart.getHours() === hour;
                  });

                  return (
                    <div
                      key={dayIndex}
                      className={`relative p-3 border-r border-black/10 last:border-r-0 ${
                        isToday(day) ? 'bg-primary/[0.06]' : 'bg-transparent'
                      }`}
                    >
                      {/* Render events at their start hour */}
                      {isFirstHourOfEvent.map(event => {
                        const style = getEventStyle(event, day);
                        if (!style) return null;

                        return (
                          <button
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className="absolute left-1 right-1 z-10 overflow-hidden rounded-lg border border-primary bg-primary/25 p-1.5 text-left transition-all hover:bg-primary/35"
                            style={style}
                          >
                            <div className="text-xs font-semibold text-black line-clamp-1">
                              {event.title}
                            </div>
                            <div className="text-[10px] text-black/55 line-clamp-1">
                              {format(parseISO(event.startTime), 'HH:mm')} - {format(parseISO(event.endTime), 'HH:mm')}
                            </div>
                            {event.format === 'online' && (
                              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-accent">
                                <Globe size={10} />
                                线上
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default WeekView;
