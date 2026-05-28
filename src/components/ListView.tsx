import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TechEvent } from '../types';
import EventCard from './EventCard';
import EmptyState from './EmptyState';
import { Loader2 } from 'lucide-react';

interface ListViewProps {
  events: TechEvent[];
  onEventClick: (event: TechEvent) => void;
  searchQuery: string;
  onReset: () => void;
}

const ITEMS_PER_PAGE = 20;

const ListView: React.FC<ListViewProps> = ({ events, onEventClick, searchQuery, onReset }) => {
  const [displayedItems, setDisplayedItems] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Reset displayed items when events change
  useEffect(() => {
    setDisplayedItems(ITEMS_PER_PAGE);
  }, [events]);

  // Load more items
  const loadMore = useCallback(() => {
    if (displayedItems >= events.length || isLoading) return;

    setIsLoading(true);
    // Simulate loading delay for smooth UX
    setTimeout(() => {
      setDisplayedItems(prev => Math.min(prev + ITEMS_PER_PAGE, events.length));
      setIsLoading(false);
    }, 300);
  }, [displayedItems, events.length, isLoading]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && displayedItems < events.length) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore, isLoading, displayedItems, events.length]);

  if (events.length === 0) {
    return (
      <EmptyState 
        type={searchQuery ? 'search' : 'filter'}
        searchQuery={searchQuery}
        onReset={onReset}
      />
    );
  }

  const visibleEvents = events.slice(0, displayedItems);
  const hasMore = displayedItems < events.length;

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between text-sm text-black/60 font-bold">
        <span>
          正在显示 {visibleEvents.length} / {events.length} 场活动
        </span>
        {hasMore && (
          <span className="text-accent">
            向下滚动查看更多
          </span>
        )}
      </div>

      {/* Events Grid with Animation */}
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {visibleEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index < ITEMS_PER_PAGE ? index * 0.05 : 0 }}
            >
              <EventCard 
                event={event} 
                onClick={onEventClick} 
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Loading Indicator & Observer Target */}
      {hasMore && (
        <div ref={observerTarget} className="flex flex-col items-center justify-center py-12">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 text-black/50 font-bold"
            >
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">加载更多活动...</span>
            </motion.div>
          ) : (
            <button
              onClick={loadMore}
              className="px-6 py-3 rounded-md bg-white hover:bg-primary border border-black/15 hover:border-black/30 text-black/70 hover:text-black transition-all text-sm font-black"
            >
              加载更多（剩余 {events.length - displayedItems} 场）
            </button>
          )}
        </div>
      )}

      {/* End Indicator */}
      {!hasMore && events.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-center py-8 text-black/40 text-sm font-bold">
          <span>✓ 已加载全部活动</span>
        </div>
      )}
    </div>
  );
};

export default ListView;
