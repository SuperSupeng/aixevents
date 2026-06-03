import { useEffect, useRef, useState, type TouchEvent, type WheelEvent } from 'react';

interface UsePastEventsRevealOptions {
  pastCount: number;
  upcomingCount: number;
}

interface UpcomingScrollTopOptions {
  elementTop: number;
  scrollY: number;
  offset?: number;
}

export function getUpcomingScrollTop({ elementTop, scrollY, offset = 112 }: UpcomingScrollTopOptions): number {
  return Math.max(elementTop + scrollY - offset, 0);
}

export function usePastEventsReveal({ pastCount, upcomingCount }: UsePastEventsRevealOptions) {
  const historyControlsRef = useRef<HTMLDivElement | null>(null);
  const upcomingSectionRef = useRef<HTMLDivElement | null>(null);
  const pendingCollapseScrollRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);

  useEffect(() => {
    pendingCollapseScrollRef.current = false;
    setShowPastEvents(false);
  }, [pastCount, upcomingCount]);

  useEffect(() => {
    if (!pendingCollapseScrollRef.current || showPastEvents) return;
    pendingCollapseScrollRef.current = false;

    const historyControls = historyControlsRef.current;
    if (!historyControls) return;

    const top = getUpcomingScrollTop({
      elementTop: historyControls.getBoundingClientRect().top,
      scrollY: window.scrollY,
    });

    window.scrollTo({
      behavior: 'smooth',
      top,
    });
  }, [showPastEvents]);

  const revealPastEvents = () => {
    if (pastCount === 0 || showPastEvents) return;
    setShowPastEvents(true);
  };

  const collapsePastEvents = () => {
    if (!showPastEvents) return;
    pendingCollapseScrollRef.current = true;
    setShowPastEvents(false);
  };

  const handleWheelCapture = (event: WheelEvent<HTMLElement>) => {
    if (event.deltaY < -16) {
      revealPastEvents();
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: TouchEvent<HTMLElement>) => {
    const startY = touchStartYRef.current;
    const currentY = event.touches[0]?.clientY;
    if (startY === null || currentY === undefined) return;

    if (currentY - startY > 28) {
      revealPastEvents();
      touchStartYRef.current = currentY;
    }
  };

  const scrollToUpcomingEvents = () => {
    const upcomingSection = upcomingSectionRef.current;
    if (!upcomingSection) return;

    const top = getUpcomingScrollTop({
      elementTop: upcomingSection.getBoundingClientRect().top,
      scrollY: window.scrollY,
    });

    window.scrollTo({
      behavior: 'smooth',
      top,
    });
  };

  return {
    showPastEvents,
    revealPastEvents,
    collapsePastEvents,
    scrollToUpcomingEvents,
    historyControlsRef,
    upcomingSectionRef,
    handleWheelCapture,
    handleTouchStart,
    handleTouchMove,
  };
}
