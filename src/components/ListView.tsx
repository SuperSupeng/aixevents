import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TechEvent } from '../types';
import EventCard from './EventCard';
import EmptyState from './EmptyState';
import { isEventActiveByEndTime } from '../utils/timeUtils';

interface ListViewProps {
  events: TechEvent[];
  onEventClick: (event: TechEvent) => void;
  searchQuery: string;
  onReset: () => void;
}

function isEventEnded(event: TechEvent, referenceDate: Date): boolean {
  return event.status === 'ended' || !isEventActiveByEndTime(event.endTime, referenceDate);
}

const ListView: React.FC<ListViewProps> = ({ events, onEventClick, searchQuery, onReset }) => {
  const upcomingAnchorRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const { pastEvents, upcomingEvents } = useMemo(() => {
    const now = new Date();
    const past: TechEvent[] = [];
    const upcoming: TechEvent[] = [];

    events.forEach((event) => {
      if (isEventEnded(event, now)) {
        past.push(event);
      } else {
        upcoming.push(event);
      }
    });

    const sortByStartAsc = (a: TechEvent, b: TechEvent) => {
      const aStart = new Date(a.startTime).getTime();
      const bStart = new Date(b.startTime).getTime();

      if (!Number.isFinite(aStart) || !Number.isFinite(bStart)) return 0;
      return aStart - bStart;
    };

    return {
      pastEvents: past.sort(sortByStartAsc),
      upcomingEvents: upcoming.sort(sortByStartAsc),
    };
  }, [events]);

  useEffect(() => {
    setShowPastEvents(false);
  }, [pastEvents.length, upcomingEvents.length]);

  const revealPastEvents = () => {
    if (pastEvents.length === 0 || showPastEvents) return;
    setShowPastEvents(true);
  };

  const handleWheelCapture = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.deltaY < -16) {
      revealPastEvents();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const startY = touchStartYRef.current;
    const currentY = event.touches[0]?.clientY;
    if (startY === null || currentY === undefined) return;

    if (currentY - startY > 28) {
      revealPastEvents();
      touchStartYRef.current = currentY;
    }
  };

  if (events.length === 0) {
    return (
      <EmptyState 
        type={searchQuery ? 'search' : 'filter'}
        searchQuery={searchQuery}
        onReset={onReset}
      />
    );
  }

  return (
    <div
      className="space-y-6"
      onWheelCapture={handleWheelCapture}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Results Header */}
      <div className="flex items-center justify-between text-sm text-black/60 font-bold">
        <span>
          {upcomingEvents.length > 0
            ? `接下来 ${upcomingEvents.length} 场活动`
            : `暂无即将开始活动`}
        </span>
        {pastEvents.length > 0 && (
          <span className="text-accent text-right">
            {showPastEvents ? `${pastEvents.length} 场过往活动已展开` : `向上滚动查看 ${pastEvents.length} 场过往活动`}
          </span>
        )}
      </div>

      {pastEvents.length > 0 && !showPastEvents && (
        <button
          type="button"
          onClick={revealPastEvents}
          className="w-full rounded-lg border border-dashed border-black/15 bg-white/70 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-black/40 transition-all hover:border-black/25 hover:bg-primary/20 hover:text-black"
        >
          向上滚动或点击查看已结束活动
        </button>
      )}

      {pastEvents.length > 0 && showPastEvents && (
        <div className="space-y-6" aria-label="过往活动">
          <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-black/35">
            <span className="h-px flex-1 bg-black/10" />
            <span>已结束活动</span>
            <span className="h-px flex-1 bg-black/10" />
          </div>
          <AnimatePresence mode="popLayout">
            {pastEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index < 8 ? index * 0.03 : 0 }}
              >
                <EventCard
                  event={event}
                  onClick={onEventClick}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div
        ref={upcomingAnchorRef}
        className="scroll-mt-28 rounded-lg border border-black/10 bg-white/80 px-4 py-3 text-sm font-black text-black shadow-[4px_4px_0_rgba(23,100,255,0.12)] sm:scroll-mt-32"
      >
        {upcomingEvents.length > 0 ? '接下来' : '暂无即将开始的活动'}
      </div>

      {upcomingEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-6" aria-label="即将开始活动">
          <AnimatePresence mode="popLayout">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index < 8 ? index * 0.03 : 0 }}
              >
                <EventCard
                  event={event}
                  onClick={onEventClick}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="rounded-lg border border-black/10 bg-white/80 px-5 py-8 text-center text-sm font-bold text-black/50">
          可以向上查看已经结束的活动。
        </div>
      )}
    </div>
  );
};

export default ListView;
