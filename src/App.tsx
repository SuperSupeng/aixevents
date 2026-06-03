import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Zap, ChevronDown, Loader2, MessageCircle, CalendarDays } from 'lucide-react';
import type { TechEvent, ViewMode } from './types';
import { useEvents, useLocations } from './hooks/useEvents';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { fetchEventById } from './api/events';
import Calendar from './components/Calendar';
import FilterPanel from './components/FilterPanel';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import QuickFilters from './components/QuickFilters';
import FeaturedEvents from './components/FeaturedEvents';
import PartnerLogoWall from './components/PartnerLogoWall';
import { useToast } from './hooks/useToast';
import { generateBaseSchema, generateEventItemListSchema, generateEventSchema, getEventSEO, getPageSEO, injectStructuredData, removeStructuredData, updatePageSEO } from './utils/seo';
import type { ActivityType } from './constants/activityTaxonomy';

type Page = 'home' | 'privacy' | 'terms' | 'resources' | 'hackathons' | 'creatorsDay' | 'partners' | 'join' | 'edit' | 'event';

const PARTNERS_COMING_SOON_FEATURE = '生态伙伴页面';

const WeekView = React.lazy(() => import('./components/WeekView'));
const ListView = React.lazy(() => import('./components/ListView'));
const EventDetail = React.lazy(() => import('./components/EventDetail'));
const ComingSoon = React.lazy(() => import('./components/ComingSoon'));
const SubscribeModal = React.lazy(() => import('./components/SubscribeModal'));
const SubmitEventModal = React.lazy(() => import('./components/SubmitEventModal'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const Resources = React.lazy(() => import('./pages/Resources'));
const Hackathons = React.lazy(() => import('./pages/Hackathons'));
const CreatorsDay = React.lazy(() => import('./pages/CreatorsDay'));
const Partners = React.lazy(() => import('./pages/Partners'));
const JoinGroups = React.lazy(() => import('./pages/JoinGroups'));

type EventReturnState = {
  path: string;
  page: Page;
  scrollY: number;
};

type RouteState = {
  page: Page;
  editToken?: string;
  eventId?: string;
  blockedFeature?: string;
  searchQuery?: string;
};

const HERO_REVEAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const heroCopyVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.08,
      staggerChildren: 0.1,
    },
  },
};

const heroTitleVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const heroTitleLineVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.78, ease: HERO_REVEAL_EASE },
  },
};

const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.74, ease: HERO_REVEAL_EASE },
  },
};

function getRouteFromPath(): RouteState {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/privacy') return { page: 'privacy' };
  if (path === '/terms') return { page: 'terms' };
  if (path === '/resources') return { page: 'resources' };
  if (path === '/hackathons') return { page: 'hackathons' };
  if (path === '/creators-day') return { page: 'creatorsDay' };
  if (path === '/join') return { page: 'join' };
  if (path === '/partners') return { page: 'home', blockedFeature: PARTNERS_COMING_SOON_FEATURE };
  if (path.startsWith('/events/')) {
    const eventId = decodeURIComponent(path.replace('/events/', '').trim());
    if (eventId) return { page: 'event', eventId };
  }
  if (path.startsWith('/edit/')) {
    return { page: 'edit', editToken: decodeURIComponent(path.replace('/edit/', '').trim()) };
  }
  return { page: 'home', searchQuery: new URLSearchParams(window.location.search).get('q') || '' };
}

const LazyFallback: React.FC<{ label?: string }> = ({ label = '页面加载中...' }) => (
  <div className="flex min-h-[16rem] items-center justify-center px-4 text-sm font-bold text-black/60">
    <Loader2 size={18} className="mr-2 animate-spin text-accent" />
    {label}
  </div>
);

const LazySection: React.FC<{ children: React.ReactNode; label?: string }> = ({ children, label }) => (
  <React.Suspense fallback={label ? <LazyFallback label={label} /> : null}>
    {children}
  </React.Suspense>
);

const PixelWhale: React.FC = () => {
  const pixels = [
    [6, 0], [7, 1], [5, 1], [7, 2],
    [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],
    [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4],
    [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5],
    [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6],
    [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7],
    [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8],
    [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9],
    [5, 10], [6, 10], [7, 10], [8, 10], [9, 10],
  ];
  const tailPixels = [[1, 5], [0, 6], [1, 6], [2, 6], [1, 7], [2, 7], [0, 8], [1, 8]];
  const sprayPixels = [[2, 3], [3, 2], [4, 2]];

  return (
    <svg className="poster-whale" viewBox="0 0 144 96" preserveAspectRatio="xMidYMid meet" aria-hidden>
      {pixels.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x * 8} y={y * 8} width="8" height="8" />
      ))}
      {sprayPixels.map(([x, y]) => (
        <rect key={`spray-${x}-${y}`} x={x * 8} y={y * 8} width="8" height="8" className="poster-whale-accent" />
      ))}
      <g className="poster-whale-tail-group">
        {tailPixels.map(([x, y]) => (
          <rect key={`tail-${x}-${y}`} x={x * 8} y={y * 8} width="8" height="8" className="poster-whale-tail" />
        ))}
      </g>
      <rect x="88" y="48" width="8" height="8" className="poster-whale-eye" />
      <rect x="72" y="72" width="40" height="8" className="poster-whale-smile" />
      <rect x="64" y="80" width="24" height="8" className="poster-whale-smile" />
    </svg>
  );
};

const App: React.FC = () => {
  const initialRoute = useMemo(getRouteFromPath, []);

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [searchQuery, setSearchQuery] = useState(initialRoute.searchQuery || '');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<TechEvent | null>(null);
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(initialRoute.blockedFeature || null);
  const [currentPage, setCurrentPage] = useState<Page>(initialRoute.page);
  const [editToken, setEditToken] = useState(initialRoute.editToken || '');
  const [eventId, setEventId] = useState(initialRoute.eventId || '');
  const [routeEvent, setRouteEvent] = useState<TechEvent | null>(null);
  const [routeEventLoading, setRouteEventLoading] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showSubmitEventModal, setShowSubmitEventModal] = useState(false);
  const [submitInitialActivityType, setSubmitInitialActivityType] = useState<ActivityType | undefined>();
  const [submitInitialCity, setSubmitInitialCity] = useState('');
  
  // Toast notifications
  const { toasts, removeToast, success } = useToast();
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 280);
  
  // Refs for smooth scrolling
  const calendarRef = useRef<HTMLDivElement>(null);
  const eventReturnStateRef = useRef<EventReturnState | null>(null);
  
  // Smooth scroll to calendar
  const scrollToCalendar = () => {
    calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setViewMode('month'); // 确保显示日历视图
  };

  const openSubmitEventModal = (initialActivityType?: ActivityType, initialCity?: string) => {
    setSubmitInitialActivityType(initialActivityType);
    setSubmitInitialCity(initialCity || '');
    setShowSubmitEventModal(true);
  };

  const closeSubmitEventModal = () => {
    setShowSubmitEventModal(false);
    setSubmitInitialActivityType(undefined);
    setSubmitInitialCity('');
  };

  const showPartnersComingSoon = () => {
    setComingSoonFeature(PARTNERS_COMING_SOON_FEATURE);
  };

  // 🆕 使用 API 获取数据
  const { 
    data: events = [], 
    isLoading: eventsLoading, 
    isFetching: eventsFetching,
    error: eventsError 
  } = useEvents({
    search: debouncedSearchQuery,
    tag: tagFilter || undefined,
    format: formatFilter as any,
    location: locationFilter,
  });

  const { data: allLocations = [] } = useLocations();

  // 过滤逻辑已由 API 处理，直接使用返回的数据
  const filteredEvents = useMemo(() => {
    return events;
  }, [events]);

  React.useEffect(() => {
    const basePage = currentPage === 'event' ? 'home' : currentPage;
    const eventForSEO = currentPage === 'event' ? routeEvent : null;

    updatePageSEO(eventForSEO ? getEventSEO(eventForSEO) : getPageSEO(basePage));
    injectStructuredData('page', generateBaseSchema(basePage));

    if (eventForSEO) {
      injectStructuredData('event', generateEventSchema(eventForSEO));
    } else {
      removeStructuredData('event');
    }

    return () => {
      removeStructuredData('page');
      removeStructuredData('event');
    };
  }, [currentPage, routeEvent]);

  React.useEffect(() => {
    if (currentPage === 'home' && events.length > 0) {
      injectStructuredData('event-list', generateEventItemListSchema(events));
    } else {
      removeStructuredData('event-list');
    }

    return () => {
      removeStructuredData('event-list');
    };
  }, [currentPage, events]);

  React.useEffect(() => {
    if (currentPage !== 'event' || !eventId) {
      setRouteEvent(null);
      setRouteEventLoading(false);
      return;
    }

    const cachedEvent = events.find((event) => event.id === eventId);
    if (cachedEvent) {
      setRouteEvent(cachedEvent);
      setRouteEventLoading(false);
      return;
    }

    let isActive = true;
    setRouteEventLoading(true);

    fetchEventById(eventId)
      .then((event) => {
        if (isActive) setRouteEvent(event);
      })
      .finally(() => {
        if (isActive) setRouteEventLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [currentPage, eventId, events]);

  // 处理页面导航（更新 URL 和状态）
  const resetRouteState = () => {
    setEditToken('');
    setEventId('');
    setSelectedEvent(null);
    setRouteEvent(null);
  };

  const navigateToPrivacy = () => {
    setCurrentPage('privacy');
    resetRouteState();
    window.history.pushState({}, '', '/privacy');
    window.scrollTo(0, 0);
  };

  const navigateToTerms = () => {
    setCurrentPage('terms');
    resetRouteState();
    window.history.pushState({}, '', '/terms');
    window.scrollTo(0, 0);
  };

  const navigateToHome = () => {
    setCurrentPage('home');
    resetRouteState();
    window.history.pushState({}, '', '/');
    window.scrollTo(0, 0);
  };

  const navigateToResources = () => {
    setCurrentPage('resources');
    resetRouteState();
    window.history.pushState({}, '', '/resources');
    window.scrollTo(0, 0);
  };

  const navigateToHackathons = () => {
    setCurrentPage('hackathons');
    resetRouteState();
    window.history.pushState({}, '', '/hackathons');
    window.scrollTo(0, 0);
  };

  const navigateToCreatorsDay = () => {
    setCurrentPage('creatorsDay');
    resetRouteState();
    window.history.pushState({}, '', '/creators-day');
    window.scrollTo(0, 0);
  };

  const navigateToPartners = () => {
    showPartnersComingSoon();
  };

  const navigateToJoin = (city?: string) => {
    setCurrentPage('join');
    resetRouteState();

    const params = new URLSearchParams();
    if (city) params.set('city', city);

    const queryString = params.toString();
    window.history.pushState({}, '', `/join${queryString ? `?${queryString}` : ''}`);
    window.scrollTo(0, 0);
  };

  const navigateToCalendar = (city?: string) => {
    setCurrentPage('home');
    resetRouteState();
    if (city) {
      setSearchQuery('');
      setTagFilter('');
      setFormatFilter('all');
      setLocationFilter(city);
    }
    window.history.pushState({}, '', '/');
    window.setTimeout(() => {
      calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const openEventDetail = (event: TechEvent) => {
    const encodedId = encodeURIComponent(event.id);
    eventReturnStateRef.current = {
      page: currentPage,
      path: `${window.location.pathname}${window.location.search}`,
      scrollY: window.scrollY,
    };
    setSelectedEvent(event);
    setRouteEvent(event);
    setEventId(event.id);
    setEditToken('');
    setCurrentPage('event');
    window.history.pushState({}, '', `/events/${encodedId}`);
  };

  const closeEventDetail = () => {
    const returnState = eventReturnStateRef.current;

    if (!returnState || returnState.page === 'event') {
      navigateToHome();
      return;
    }

    eventReturnStateRef.current = null;
    setCurrentPage(returnState.page);
    resetRouteState();
    window.history.replaceState({}, '', returnState.path);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: returnState.scrollY, left: 0, behavior: 'auto' });
    });
  };

  // 处理浏览器前进/后退按钮
  React.useEffect(() => {
    if (initialRoute.blockedFeature) {
      window.history.replaceState({}, '', '/');
    }

    const handlePopState = () => {
      const route = getRouteFromPath();
      setCurrentPage(route.page);
      setEditToken(route.editToken || '');
      setEventId(route.eventId || '');
      setSearchQuery(route.searchQuery || '');
      setSelectedEvent(null);
      setRouteEvent(null);
      eventReturnStateRef.current = null;
      if (route.blockedFeature) {
        setComingSoonFeature(route.blockedFeature);
        window.history.replaceState({}, '', '/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialRoute.blockedFeature]);

  // 如果在法律页面，只显示该页面
  if (currentPage === 'privacy') {
    return (
      <LazySection label="隐私政策加载中...">
        <PrivacyPolicy onBack={navigateToHome} />
      </LazySection>
    );
  }

  if (currentPage === 'terms') {
    return (
      <LazySection label="服务条款加载中...">
        <TermsOfService onBack={navigateToHome} />
      </LazySection>
    );
  }

  if (currentPage === 'resources') {
    return (
      <>
        <LazySection label="资源页加载中...">
          <Resources onBack={navigateToHome} onGroupClick={() => navigateToJoin()} />
        </LazySection>
        <Toast toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (currentPage === 'hackathons') {
    return (
      <>
        <LazySection label="Hackathon 页面加载中...">
          <Hackathons
            onBack={navigateToHome}
            onSubmitClick={() => openSubmitEventModal('hackathon')}
            onEventClick={openEventDetail}
          />
        </LazySection>
        {showSubmitEventModal && (
          <LazySection>
            <SubmitEventModal
              isOpen
              onClose={closeSubmitEventModal}
              onSubmitted={success}
              initialActivityType={submitInitialActivityType}
              initialCity={submitInitialCity}
            />
          </LazySection>
        )}
        <Toast toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (currentPage === 'creatorsDay') {
    return (
      <>
        <LazySection label="创造节页面加载中...">
          <CreatorsDay
            onBack={navigateToHome}
            onSubmitClick={() => openSubmitEventModal('creator_day')}
            onEventClick={openEventDetail}
          />
        </LazySection>
        {showSubmitEventModal && (
          <LazySection>
            <SubmitEventModal
              isOpen
              onClose={closeSubmitEventModal}
              onSubmitted={success}
              initialActivityType={submitInitialActivityType}
              initialCity={submitInitialCity}
            />
          </LazySection>
        )}
        <Toast toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (currentPage === 'partners') {
    return (
      <>
        <LazySection label="生态伙伴页面加载中...">
          <Partners onBack={navigateToHome} onGroupClick={() => navigateToJoin()} />
        </LazySection>
        <Toast toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (currentPage === 'join') {
    return (
      <>
        <LazySection label="加群页面加载中...">
          <JoinGroups
            onBack={navigateToHome}
            onCalendarClick={navigateToCalendar}
            onSubmitClick={(city) => openSubmitEventModal(undefined, city)}
            onEventClick={openEventDetail}
          />
        </LazySection>
        {showSubmitEventModal && (
          <LazySection>
            <SubmitEventModal
              isOpen
              onClose={closeSubmitEventModal}
              onSubmitted={success}
              initialActivityType={submitInitialActivityType}
              initialCity={submitInitialCity}
            />
          </LazySection>
        )}
        <Toast toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (currentPage === 'edit') {
    return (
      <div className="poster-app min-h-screen relative overflow-x-hidden">
        <Navbar
          onExploreClick={navigateToHome}
          onHackathonsClick={navigateToHackathons}
          onCreatorsDayClick={navigateToCreatorsDay}
          onPartnersClick={navigateToPartners}
          onResourcesClick={navigateToResources}
          onSubmitClick={() => openSubmitEventModal()}
        />
        <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24">
          <div className="max-w-xl rounded-lg border-2 border-black bg-white p-6 text-black shadow-[8px_8px_0_rgba(5,5,5,0.92)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Datawhale AI+X</p>
            <h1 className="mt-3 text-3xl font-black leading-tight">活动信息修改</h1>
            <p className="mt-3 text-sm font-bold leading-7 text-black/62">
              正在打开编辑窗口。修改提交后会先进入确认，确认通过前不会影响公开日历中的信息。
            </p>
          </div>
        </main>
        <LazySection>
          <SubmitEventModal
            isOpen
            editToken={editToken}
            onClose={navigateToHome}
            onSubmitted={success}
          />
        </LazySection>
        {comingSoonFeature !== null && (
          <LazySection>
            <ComingSoon
              isOpen
              onClose={() => setComingSoonFeature(null)}
              feature={comingSoonFeature || undefined}
            />
          </LazySection>
        )}
        <Toast toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  if (currentPage === 'event') {
    const displayEvent = routeEvent || selectedEvent;
    const shareId = displayEvent?.id || eventId;
    const shareUrl = shareId
      ? `${window.location.origin}/events/${encodeURIComponent(shareId)}`
      : `${window.location.origin}/`;

    return (
      <div className="poster-app min-h-screen relative overflow-x-hidden">
        <Navbar
          onExploreClick={navigateToHome}
          onHackathonsClick={navigateToHackathons}
          onCreatorsDayClick={navigateToCreatorsDay}
          onPartnersClick={navigateToPartners}
          onResourcesClick={navigateToResources}
          onSubmitClick={() => openSubmitEventModal()}
        />
        <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-28">
          {!displayEvent && (
            <div className="max-w-xl rounded-lg border-2 border-black bg-white p-6 text-black shadow-[8px_8px_0_rgba(5,5,5,0.92)]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Datawhale AI+X</p>
              <h1 className="mt-3 text-3xl font-black leading-tight">
                {routeEventLoading ? '活动加载中' : '活动暂时不可访问'}
              </h1>
              <p className="mt-3 text-sm font-bold leading-7 text-black/62">
                {routeEventLoading
                  ? '正在读取公开活动详情。'
                  : '这场活动可能尚未公开、已下架，或链接地址不完整。'}
              </p>
              {!routeEventLoading && (
                <button
                  onClick={navigateToHome}
                  className="btn-primary mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
                >
                  返回活动日历 <Zap size={16} />
                </button>
              )}
            </div>
          )}
        </main>
        <LazySection>
          <EventDetail
            event={displayEvent}
            onClose={closeEventDetail}
            onToast={success}
            shareUrl={shareUrl}
          />
        </LazySection>
        {showSubmitEventModal && (
          <LazySection>
            <SubmitEventModal
              isOpen
              onClose={closeSubmitEventModal}
              onSubmitted={success}
              initialActivityType={submitInitialActivityType}
              initialCity={submitInitialCity}
            />
          </LazySection>
        )}
        {comingSoonFeature !== null && (
          <LazySection>
            <ComingSoon
              isOpen
              onClose={() => setComingSoonFeature(null)}
              feature={comingSoonFeature || undefined}
            />
          </LazySection>
        )}
        <Toast toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  return (
    <div className="poster-app min-h-screen relative overflow-x-hidden">
      {/* Navigation */}
      <Navbar 
        onExploreClick={scrollToCalendar}
        onHackathonsClick={navigateToHackathons}
        onCreatorsDayClick={navigateToCreatorsDay}
        onPartnersClick={navigateToPartners}
        onResourcesClick={navigateToResources}
        onSubmitClick={() => openSubmitEventModal()}
      />

      <main className="relative z-10">
        {/* Hero Section - poster style */}
        <section className="poster-hero-section relative z-10 w-full">
          <div className="poster-hero-shell">
            <motion.div
              variants={heroItemVariants}
              initial="hidden"
              animate="show"
              className="poster-kicker"
            >
              <span className="w-2 h-2 bg-primary block" />
              Datawhale AI+X 社区活动日历
            </motion.div>

            <div className="poster-hero-grid">
              <motion.div
                variants={heroCopyVariants}
                initial="hidden"
                animate="show"
                className="poster-hero-copy"
              >
                <motion.h1 variants={heroTitleVariants} className="poster-hero-title hero-title">
                  <motion.div
                    variants={heroTitleLineVariants}
                    className="poster-title-line"
                  >
                    AI+X
                  </motion.div>
                  <motion.div
                    variants={heroTitleLineVariants}
                    className="poster-title-line poster-title-line-secondary hero-accent"
                  >
                    活动日历
                  </motion.div>
                </motion.h1>

                <motion.p
                  variants={heroItemVariants}
                  className="poster-hero-quote"
                >
                  <span className="block">找到值得去的</span>
                  <span className="block">AI 科技活动。</span>
                </motion.p>
                <motion.div
                  variants={heroItemVariants}
                  className="poster-learn-line"
                >
                  <span>学用 AI，就来 </span>
                  <span className="poster-brand-chip">Datawhale</span>
                </motion.div>

                <motion.div
                  variants={heroItemVariants}
                  className="poster-cta-row"
                >
                  <button
                    onClick={scrollToCalendar}
                    className="btn-primary poster-cta-button flex items-center justify-center gap-2"
                  >
                    查看活动日历 <Zap size={18} />
                  </button>
                  <button
                    onClick={() => navigateToJoin()}
                    className="btn-secondary poster-cta-button flex items-center justify-center gap-2 group"
                  >
                    <MessageCircle size={18} className="group-hover:rotate-12 transition-transform" />
                    加入 AI+X 活动群
                  </button>
                </motion.div>
                <motion.div
                  variants={heroItemVariants}
                  className="poster-hero-tide-strip"
                  aria-hidden="true"
                >
                  <span>Meetup</span>
                  <span>Workshop</span>
                  <span>Hackathon</span>
                  <span>AI+X</span>
                </motion.div>
              </motion.div>

              <motion.aside
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.32 }}
                className="poster-side-panel"
              >
                <div className="poster-info-card">
                  <div className="flex items-center gap-3 mb-6">
                    <CalendarDays size={34} className="text-accent" strokeWidth={2.5} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/50">DATAWHALE</p>
                      <p className="text-2xl font-black text-black leading-none">AI+X 社区活动日历</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="poster-data-row">
                      <strong>站点：</strong>
                      <span>生态活动索引</span>
                    </div>
                    <div className="poster-data-row">
                      <strong>收录：</strong>
                      <span>Meetup、Workshop、Hackathon 等活动</span>
                    </div>
                    <div className="poster-data-row">
                      <strong>共建：</strong>
                      <span>社区 / 高校 / 城市 / 产业</span>
                    </div>
                  </div>
                  <div className="poster-rule mt-8 mb-5" />
                  <p className="poster-info-card-title">
                    活动信息持续收录中～
                  </p>
                </div>
                <div className="poster-whale-wrap" aria-hidden>
                  <span className="poster-sea-fish poster-sea-fish-one" />
                  <span className="poster-sea-fish poster-sea-fish-two" />
                  <span className="poster-sea-bubble poster-sea-bubble-one" />
                  <span className="poster-sea-bubble poster-sea-bubble-two" />
                  <div className="poster-whale-swim-layer">
                    <div className="poster-whale-drift">
                      <div className="poster-whale-bob">
                        <PixelWhale />
                      </div>
                    </div>
                    <div className="poster-squiggle" />
                  </div>
                </div>
              </motion.aside>
            </div>
          </div>

          {/* 滚动指示器 */}
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 6 }}
            transition={{ duration: 1, delay: 1.2, repeat: Infinity, repeatType: "reverse" }}
            className="poster-scroll-indicator"
            onClick={scrollToCalendar}
          >
            <span className="text-xs font-black uppercase tracking-widest mb-1 whitespace-nowrap">查看日历</span>
            <ChevronDown size={20} className="sm:w-6 sm:h-6 animate-bounce" />
          </motion.div>
        </section>

        {/* Ecosystem Mission */}
        <section className="poster-ecosystem-section">
          <div className="poster-ecosystem-shell">
            <div className="poster-ecosystem-copy">
              <div className="poster-section-kicker">
                <span className="block h-2 w-2 bg-primary" />
                AI+X 生态活动体系
              </div>
              <h2>让 AI+X 在更多城市、高校与产业场景持续发生</h2>
              <p>
                AI 正在从少数技术人关注的前沿议题，变成各行各业都需要理解、学习和使用的基础能力。真正重要的问题已经不只是“AI 是什么”，而是“我如何用 AI 做出一个作品、解决一个问题、参与一次真实的创造”。
              </p>
              <p>
                Datawhale 希望围绕 AI+X，推动一套面向真实场景、真实人群、真实作品的生态活动体系。这里的 X，可以是高校、城市、产业、出海、硬件、内容创作、企业应用，也可以是每一个具体行业和具体问题。
              </p>
            </div>

            <div className="poster-ecosystem-panel">
              <p className="poster-panel-label">活动日历收录</p>
              <h3>有活动想被更多人看到？</h3>
              <p>
                正在组织 AI 相关活动，想放到日历里让更多人看到？把活动信息提交过来就行。确认后，我们会展示在活动日历上；适合扩散的，也会视情况同步到公众号和社群。
              </p>
              <div className="poster-support-list">
                <span>日历收录</span>
                <span>公众号宣传</span>
                <span>社群宣发</span>
                <span>报名扩散</span>
                <span>场地申请</span>
                <span>讲师协同</span>
                <span>志愿者支持</span>
                <span>社区协办</span>
              </div>
              <button
                onClick={() => openSubmitEventModal()}
                className="btn-primary poster-panel-button flex items-center justify-center gap-2"
              >
                提交活动信息 <Zap size={18} />
              </button>
              <p className="poster-review-note">提交信息将先进入确认，确认真实、完整、适合公开后再展示。</p>
            </div>
          </div>
        </section>

        {/* Filter & Search */}
        <div ref={calendarRef} className="relative z-20 content-section mx-auto max-w-[72rem] scroll-mt-24 px-3.5 pb-24 pt-20 sm:scroll-mt-32 sm:px-6 sm:pb-36 sm:pt-28 lg:pb-40 lg:pt-32">
          {/* Quick Filters */}
          <QuickFilters 
            onFilterClick={(searchTerm) => {
              setSearchQuery(searchTerm);
              setTagFilter('');
            }}
            onTagFilterClick={(tag) => {
              setTagFilter(tag);
              setSearchQuery('');
            }}
            activeFilter={tagFilter}
            onClear={() => setTagFilter('')}
          />
          
          <FilterPanel 
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              setTagFilter('');
            }}
            formatFilter={formatFilter}
            onFormatChange={setFormatFilter}
            locationFilter={locationFilter}
            onLocationChange={setLocationFilter}
            allLocations={allLocations}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onClearFilters={() => {
              setSearchQuery('');
              setTagFilter('');
              setFormatFilter('all');
              setLocationFilter('all');
            }}
          />

          {/* Featured Events */}
          {!searchQuery && !tagFilter && locationFilter === 'all' && formatFilter === 'all' && events.length > 0 && (
            <FeaturedEvents 
              events={filteredEvents}
              onEventClick={openEventDetail}
            />
          )}

          {/* Main Content with View Transitions */}
          <div className="min-h-[300px] sm:min-h-[500px] relative">
            {/* 初次加载的全屏 Loading */}
            {eventsLoading && !events.length ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={48} className="animate-spin text-primary mb-4" />
                <p className="text-white/75 text-sm">活动加载中...</p>
              </div>
            ) : eventsError ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-red-400 mb-4">⚠️ 活动加载失败</div>
                <p className="text-white/75 text-sm">请检查网络连接后重试。</p>
              </div>
            ) : (
              <>
                {/* 筛选时的小型加载指示器 */}
                {eventsFetching && events.length > 0 && (
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-[#0a0a0a]/90 border border-white/10 rounded-full px-4 py-2 backdrop-blur-xl">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span className="text-white/80 text-xs font-medium">更新中...</span>
                  </div>
                )}
                
                <AnimatePresence mode="wait">
                  {viewMode === 'month' ? (
                    <motion.div
                      key="month-view"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Calendar
                        events={filteredEvents}
                        onEventClick={openEventDetail}
                        onSubscribeClick={() => setShowSubscribeModal(true)}
                      />
                    </motion.div>
                  ) : viewMode === 'week' ? (
                    <motion.div
                      key="week-view"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <LazySection label="周视图加载中...">
                        <WeekView
                          events={filteredEvents}
                          onEventClick={openEventDetail}
                        />
                      </LazySection>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list-view"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <LazySection label="列表视图加载中...">
                        <ListView
                          events={filteredEvents}
                          onEventClick={openEventDetail}
                          searchQuery={searchQuery}
                          onReset={() => {
                            setSearchQuery('');
                            setTagFilter('');
                            setFormatFilter('all');
                            setLocationFilter('all');
                          }}
                        />
                      </LazySection>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>

        <PartnerLogoWall onViewAll={navigateToPartners} />
      </main>

      {/* Footer */}
      <Footer 
        onSubmitClick={() => openSubmitEventModal()}
        onGroupClick={() => navigateToJoin()}
        onPrivacyClick={navigateToPrivacy}
        onTermsClick={navigateToTerms}
      />
      
      {/* Coming Soon Modal */}
      {comingSoonFeature !== null && (
        <LazySection>
          <ComingSoon
            isOpen
            onClose={() => setComingSoonFeature(null)}
            feature={comingSoonFeature || undefined}
          />
        </LazySection>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <LazySection>
          <EventDetail
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onToast={success}
          />
        </LazySection>
      )}

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <LazySection>
          <SubscribeModal
            isOpen
            onClose={() => setShowSubscribeModal(false)}
            onToast={success}
            formatFilter={formatFilter}
            locationFilter={locationFilter}
            tagFilter={tagFilter}
            searchQuery={searchQuery}
          />
        </LazySection>
      )}

      {/* Submit Event Modal */}
      {showSubmitEventModal && (
        <LazySection>
          <SubmitEventModal
            isOpen
            onClose={closeSubmitEventModal}
            onSubmitted={success}
            initialActivityType={submitInitialActivityType}
            initialCity={submitInitialCity}
          />
        </LazySection>
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default App;
