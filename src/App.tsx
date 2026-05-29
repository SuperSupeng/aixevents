import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, Loader2, MessageCircle, CalendarDays, Link as LinkIcon, BookOpen, PencilLine, TrendingUp, X } from 'lucide-react';
import { TechEvent, ViewMode } from './types';
import { useEvents, useLocations } from './hooks/useEvents';
import { fetchEventById } from './api/events';
import Calendar from './components/Calendar';
import WeekView from './components/WeekView';
import ListView from './components/ListView';
import EventDetail from './components/EventDetail';
import FilterPanel from './components/FilterPanel';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ComingSoon from './components/ComingSoon';
import Toast from './components/Toast';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Resources from './pages/Resources';
import Hackathons from './pages/Hackathons';
import QuickFilters from './components/QuickFilters';
import FeaturedEvents from './components/FeaturedEvents';
import SubscribeModal from './components/SubscribeModal';
import SubmitEventModal from './components/SubmitEventModal';
import { useToast } from './hooks/useToast';
import { generateBaseSchema, generateEventSchema, getEventSEO, getPageSEO, injectStructuredData, removeStructuredData, updatePageSEO } from './utils/seo';

type Page = 'home' | 'privacy' | 'terms' | 'resources' | 'hackathons' | 'edit' | 'event';

function getRouteFromPath(): { page: Page; editToken?: string; eventId?: string } {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/privacy') return { page: 'privacy' };
  if (path === '/terms') return { page: 'terms' };
  if (path === '/resources') return { page: 'resources' };
  if (path === '/hackathons') return { page: 'hackathons' };
  if (path.startsWith('/events/')) {
    const eventId = decodeURIComponent(path.replace('/events/', '').trim());
    if (eventId) return { page: 'event', eventId };
  }
  if (path.startsWith('/edit/')) {
    return { page: 'edit', editToken: decodeURIComponent(path.replace('/edit/', '').trim()) };
  }
  return { page: 'home' };
}

const PixelWhale: React.FC = () => {
  const pixels = [
    [6, 0], [7, 1], [5, 1], [7, 2],
    [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],
    [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4],
    [1, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5],
    [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6],
    [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7],
    [0, 8], [1, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8],
    [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9],
    [5, 10], [6, 10], [7, 10], [8, 10], [9, 10],
  ];
  const accentPixels = [
    [14, 5], [15, 4], [15, 6], [16, 3], [16, 7],
    [2, 3], [3, 2], [4, 2],
  ];

  return (
    <svg className="poster-whale" viewBox="0 0 144 96" preserveAspectRatio="xMidYMid meet" aria-hidden>
      {pixels.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x * 8} y={y * 8} width="8" height="8" />
      ))}
      {accentPixels.map(([x, y]) => (
        <rect key={`accent-${x}-${y}`} x={x * 8} y={y * 8} width="8" height="8" className="poster-whale-accent" />
      ))}
      <rect x="88" y="48" width="8" height="8" className="poster-whale-eye" />
      <rect x="72" y="72" width="40" height="8" className="poster-whale-smile" />
      <rect x="64" y="80" width="24" height="8" className="poster-whale-smile" />
    </svg>
  );
};

const GroupQrModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <AnimatePresence>
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 24 }}
        className="relative w-full max-w-sm rounded-lg border-2 border-black bg-white p-6 text-black shadow-[8px_8px_0_rgba(5,5,5,0.92)]"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 border-2 border-black bg-white p-2 transition-colors hover:bg-primary"
          aria-label="关闭活动群二维码"
        >
          <X size={18} />
        </button>
        <div className="mb-5 pr-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">AI+X 活动群</p>
          <h2 className="mt-2 text-3xl font-black leading-tight">扫码加入活动群</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-black/60">微信扫码获取活动同步、生态伙伴活动与共创信息。</p>
        </div>
        <div className="rounded-md border-2 border-black bg-white p-3">
          <img
            src="/brand/activity-group-qr.png"
            alt="AI+X 活动群二维码"
            className="aspect-square w-full"
            loading="lazy"
          />
        </div>
      </motion.div>
    </div>
  </AnimatePresence>
);

const App: React.FC = () => {
  const initialRoute = useMemo(getRouteFromPath, []);

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<TechEvent | null>(null);
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(initialRoute.page);
  const [editToken, setEditToken] = useState(initialRoute.editToken || '');
  const [eventId, setEventId] = useState(initialRoute.eventId || '');
  const [routeEvent, setRouteEvent] = useState<TechEvent | null>(null);
  const [routeEventLoading, setRouteEventLoading] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showSubmitEventModal, setShowSubmitEventModal] = useState(false);
  const [showGroupQrModal, setShowGroupQrModal] = useState(false);
  
  // Toast notifications
  const { toasts, removeToast, success } = useToast();
  
  // Refs for smooth scrolling
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Smooth scroll to calendar
  const scrollToCalendar = () => {
    calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setViewMode('month'); // 确保显示日历视图
  };

  const openGroupQrModal = () => {
    setShowGroupQrModal(true);
  };

  // 🆕 使用 API 获取数据
  const { 
    data: events = [], 
    isLoading: eventsLoading, 
    isFetching: eventsFetching,
    error: eventsError 
  } = useEvents({
    search: searchQuery,
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

  const openEventDetail = (event: TechEvent) => {
    const encodedId = encodeURIComponent(event.id);
    setSelectedEvent(event);
    setRouteEvent(event);
    setEventId(event.id);
    setEditToken('');
    setCurrentPage('event');
    window.history.pushState({}, '', `/events/${encodedId}`);
  };

  // 处理浏览器前进/后退按钮
  React.useEffect(() => {
    const handlePopState = () => {
      const route = getRouteFromPath();
      setCurrentPage(route.page);
      setEditToken(route.editToken || '');
      setEventId(route.eventId || '');
      setSelectedEvent(null);
      setRouteEvent(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const posterFeatures = [
    {
      icon: <LinkIcon size={34} strokeWidth={2.6} />,
      title: '连接',
      body: '连接城市、高校与真实场景',
    },
    {
      icon: <BookOpen size={34} strokeWidth={2.6} />,
      title: '学习',
      body: '从知识输入走向动手实践',
    },
    {
      icon: <PencilLine size={34} strokeWidth={2.6} />,
      title: '创造',
      body: '用 AI 做出可展示的作品',
    },
    {
      icon: <TrendingUp size={34} strokeWidth={2.6} />,
      title: '成长',
      body: '让作品被更多人看见',
    },
  ];

  // 如果在法律页面，只显示该页面
  if (currentPage === 'privacy') {
    return <PrivacyPolicy onBack={navigateToHome} />;
  }

  if (currentPage === 'terms') {
    return <TermsOfService onBack={navigateToHome} />;
  }

  if (currentPage === 'resources') {
    return (
      <>
        <Resources onBack={navigateToHome} onGroupClick={openGroupQrModal} />
        {showGroupQrModal && <GroupQrModal onClose={() => setShowGroupQrModal(false)} />}
        <Toast toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (currentPage === 'hackathons') {
    return (
      <>
        <Hackathons onBack={navigateToHome} onSubmitClick={() => setShowSubmitEventModal(true)} />
        <SubmitEventModal
          isOpen={showSubmitEventModal}
          onClose={() => setShowSubmitEventModal(false)}
          onSubmitted={success}
        />
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
          onResourcesClick={navigateToResources}
          onSubmitClick={() => setShowSubmitEventModal(true)}
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
        <SubmitEventModal
          isOpen
          editToken={editToken}
          onClose={navigateToHome}
          onSubmitted={success}
        />
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
          onResourcesClick={navigateToResources}
          onSubmitClick={() => setShowSubmitEventModal(true)}
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
        <EventDetail
          event={displayEvent}
          onClose={navigateToHome}
          onToast={success}
          shareUrl={shareUrl}
        />
        <SubmitEventModal
          isOpen={showSubmitEventModal}
          onClose={() => setShowSubmitEventModal(false)}
          onSubmitted={success}
        />
        {showGroupQrModal && <GroupQrModal onClose={() => setShowGroupQrModal(false)} />}
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
        onResourcesClick={navigateToResources}
        onSubmitClick={() => setShowSubmitEventModal(true)}
      />

      <main className="relative z-10">
        {/* Hero Section - poster style */}
        <section className="poster-hero-section relative z-10 w-full">
          <div className="poster-hero-shell">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="poster-kicker"
            >
              <span className="w-2 h-2 bg-primary block" />
              AI+X 生态活动持续收录中
            </motion.div>

            <div className="poster-hero-grid">
              <div className="poster-hero-copy">
                <h1 className="poster-hero-title hero-title">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, delay: 0.12 }}
                    className="poster-title-line"
                  >
                    AI+X
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, delay: 0.24 }}
                    className="poster-title-line poster-title-line-secondary hero-accent"
                  >
                    活动日历
                  </motion.div>
                </h1>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.4 }}
                  className="poster-organizers"
                >
                  <div><strong>发起方：</strong><span>Datawhale</span></div>
                  <div><strong>活动：</strong><span>AI 学习者、开发者、高校学生与创造者共同参与</span></div>
                  <div><strong>目标：</strong><span>用 AI 解决真实问题，让作品进入生态循环</span></div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.46 }}
                  className="poster-hero-quote"
                >
                  <span className="block">让你在真实场景中，</span>
                  <span className="block">亲手用 AI 完成一件作品。</span>
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                  className="poster-learn-line"
                >
                  <span>学用 AI，就来 </span>
                  <span className="bg-accent text-white px-2 py-0.5">Datawhale</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.58 }}
                  className="poster-cta-row"
                >
                  <button
                    onClick={scrollToCalendar}
                    className="btn-primary poster-cta-button flex items-center justify-center gap-2"
                  >
                    查看活动日历 <Zap size={18} />
                  </button>
                  <button
                    onClick={openGroupQrModal}
                    className="btn-secondary poster-cta-button flex items-center justify-center gap-2 group"
                  >
                    <MessageCircle size={18} className="group-hover:rotate-12 transition-transform" />
                    加入 AI+X 活动群
                  </button>
                </motion.div>
              </div>

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
                      <p className="text-2xl font-black text-black leading-none">AI+X 活动日历</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="poster-data-row">
                      <strong>站点：</strong>
                      <span>生态活动索引</span>
                    </div>
                    <div className="poster-data-row">
                      <strong>主题：</strong>
                      <span>AI/开发者/创业/OPC</span>
                    </div>
                    <div className="poster-data-row">
                      <strong>覆盖：</strong>
                      <span>28 省份 / 50+ 城市 / 300+ 高校</span>
                    </div>
                  </div>
                  <div className="poster-rule mt-8 mb-5" />
                  <p className="poster-info-card-title">
                    找到值得去的 AI 科技活动。
                  </p>
                </div>
                <div className="poster-whale-wrap" aria-hidden>
                  <PixelWhale />
                  <div className="poster-squiggle" />
                </div>
              </motion.aside>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.72 }}
              className="poster-feature-strip"
            >
              {posterFeatures.map((feature) => (
                <div key={feature.title} className="poster-feature">
                  <div className="pixel-icon mb-4">{feature.icon}</div>
                  <h3 className="text-2xl sm:text-3xl font-black text-black mb-1">{feature.title}</h3>
                  <p className="text-sm sm:text-base font-bold text-black/70 leading-snug">{feature.body}</p>
                </div>
              ))}
            </motion.div>
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
              <p className="poster-panel-label">生态伙伴支持</p>
              <h3>提交活动共建生态</h3>
              <p>
                对于生态伙伴正在组织或计划组织的 AI 相关活动，Datawhale 将提供活动日历收录、公众号宣传、社群宣发、报名扩散等基础支持。
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
                onClick={() => setShowSubmitEventModal(true)}
                className="btn-primary poster-panel-button flex items-center justify-center gap-2"
              >
                提交活动信息 <Zap size={18} />
              </button>
              <p className="poster-review-note">提交信息将先进入确认，确认真实、完整、适合公开后再展示。</p>
            </div>
          </div>
        </section>

        {/* Filter & Search */}
        <div ref={calendarRef} className="relative z-20 content-section scroll-mt-28 sm:scroll-mt-32 max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-32 sm:pb-40">
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
                  <WeekView 
                    events={filteredEvents} 
                    onEventClick={openEventDetail}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="list-view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
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
                </motion.div>
              )}
              </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer 
        onCalendarClick={scrollToCalendar}
        onHackathonsClick={navigateToHackathons}
        onResourcesClick={navigateToResources}
        onSubscribeClick={() => setShowSubscribeModal(true)}
        onSubmitClick={() => setShowSubmitEventModal(true)}
        onSupportClick={() => setShowSubmitEventModal(true)}
        onGroupClick={openGroupQrModal}
        onPrivacyClick={navigateToPrivacy}
        onTermsClick={navigateToTerms}
      />
      
      {/* Coming Soon Modal */}
      <ComingSoon 
        isOpen={comingSoonFeature !== null}
        onClose={() => setComingSoonFeature(null)}
        feature={comingSoonFeature || undefined}
      />

      {/* Event Details Modal */}
      <EventDetail 
        event={selectedEvent} 
        onClose={() => setSelectedEvent(null)}
        onToast={success}
      />

      {/* Subscribe Modal */}
      <SubscribeModal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        onToast={success}
        formatFilter={formatFilter}
        locationFilter={locationFilter}
      />

      {/* Submit Event Modal */}
      <SubmitEventModal
        isOpen={showSubmitEventModal}
        onClose={() => setShowSubmitEventModal(false)}
        onSubmitted={success}
      />

      {showGroupQrModal && <GroupQrModal onClose={() => setShowGroupQrModal(false)} />}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default App;
