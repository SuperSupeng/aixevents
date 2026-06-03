import React, { useMemo } from 'react';
import { ArrowDown, ArrowLeft, ArrowUpRight, ChevronUp, ExternalLink, Globe2, Loader2, MapPin, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useEvents } from '../hooks/useEvents';
import { usePastEventsReveal } from '../hooks/usePastEventsReveal';
import type { TechEvent } from '../types';
import { splitEventsByTimeSection } from '../utils/eventSections';

interface HackathonsProps {
  onBack: () => void;
  onSubmitClick: () => void;
  onEventClick: (event: TechEvent) => void;
}

function formatEventDate(date: string): string {
  return format(new Date(date), 'yyyy年M月d日 HH:mm', { locale: zhCN });
}

function getLocationLabel(event: TechEvent): string {
  if (event.format === 'online') return '线上';
  if (event.format === 'hybrid') return event.location?.city ? `${event.location.city} + 线上` : '线上 + 线下';
  return event.location?.city || '城市待定';
}

const Hackathons: React.FC<HackathonsProps> = ({ onBack, onSubmitClick, onEventClick }) => {
  const { data: events = [], isLoading } = useEvents(
    { tag: 'challenge', limit: 300 },
    { refetchOnMount: 'always', staleTime: 30 * 1000 }
  );

  const { allEvents: hackathons, upcomingEvents, pastEvents } = useMemo(() => {
    return splitEventsByTimeSection(events);
  }, [events]);

  const visibleCount = hackathons.length;
  const onlineCount = hackathons.filter((event) => event.format === 'online').length;
  const cityCount = new Set(hackathons.map((event) => event.location?.city).filter(Boolean)).size;
  const {
    showPastEvents,
    revealPastEvents,
    collapsePastEvents,
    scrollToUpcomingEvents,
    historyControlsRef,
    upcomingSectionRef,
    handleWheelCapture,
    handleTouchStart,
    handleTouchMove,
  } = usePastEventsReveal({
    pastCount: pastEvents.length,
    upcomingCount: upcomingEvents.length,
  });
  const renderEventCard = (event: TechEvent) => (
    <article
      key={event.id}
      className="grid gap-4 border-2 border-black/15 bg-white/90 p-4 shadow-[5px_5px_0_rgba(23,100,255,0.14)] transition-transform hover:-translate-y-0.5 sm:grid-cols-[8.5rem_1fr_auto] sm:items-center sm:p-5"
    >
      <div className="flex items-center gap-3 sm:block">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={`${event.title} 海报`}
            className="h-20 w-20 shrink-0 border-2 border-black object-cover sm:h-28 sm:w-28"
            loading="lazy"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center border-2 border-black bg-primary text-black sm:h-28 sm:w-28">
            <span className="text-3xl font-black leading-none">{format(new Date(event.startTime), 'dd')}</span>
            <span className="mt-1 text-[11px] font-black leading-none text-black/60">{format(new Date(event.startTime), 'M月', { locale: zhCN })}</span>
          </div>
        )}
        <p className="text-xs font-black leading-5 text-black/50 sm:mt-3">
          {formatEventDate(event.startTime)}
        </p>
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="border border-black/10 bg-black/[0.035] px-2 py-1 text-[10px] font-black text-black/60">
            {event.organizers?.length ? event.organizers.join(' / ') : event.organizer.name}
          </span>
          <span className="inline-flex max-w-full items-center gap-1.5 border border-black/10 bg-primary/20 px-2 py-1 text-[10px] font-black text-accent">
            {event.format === 'online' ? <Globe2 size={12} /> : <MapPin size={12} />}
            <span className="truncate">{getLocationLabel(event)}</span>
          </span>
        </div>
        <h2 className="text-xl font-black leading-tight text-black sm:text-2xl">{event.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-black/60">{event.summary}</p>
      </div>

      <button
        type="button"
        onClick={() => onEventClick(event)}
        className="btn-secondary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
      >
        查看详情 <ArrowUpRight size={16} />
      </button>
    </article>
  );

  return (
    <div className="poster-app min-h-screen px-4 py-24 text-black sm:px-6">
      <div className="relative z-10 mx-auto max-w-[72rem]">
        <button
          onClick={onBack}
          className="page-back-button"
        >
          <ArrowLeft size={18} />
          <span>返回首页</span>
        </button>

        <header className="grid gap-6 border-2 border-black bg-white/90 p-5 shadow-[7px_7px_0_rgba(5,5,5,0.92)] sm:p-7 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div className="min-w-0">
            <div className="mb-5 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-wide">
              <Trophy size={15} className="text-accent" />
              AI+X Hackathon
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.02] text-black sm:text-6xl">
              AI+X Hackathon
            </h1>
            <p className="mt-5 max-w-3xl text-base font-bold leading-8 text-black/70 sm:text-lg">
              单独收录黑客松相关活动，包括 Hackathon、挑战赛、Demo Day 和以作品产出为核心的实践活动。默认按活动开始时间排序，报名截止以主办方页面或海报二维码为准。
            </p>
          </div>

          <div className="grid grid-cols-3 border-2 border-black bg-[#f7f8f1]">
            {[
              ['收录', visibleCount],
              ['线上', onlineCount],
              ['城市', cityCount],
            ].map(([label, value]) => (
              <div key={label} className="border-l-2 border-black/15 p-4 first:border-l-0">
                <p className="text-[11px] font-black text-accent">{label}</p>
                <p className="mt-2 text-3xl font-black text-black">{value}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="mt-7 flex flex-col gap-3 border-b-2 border-dashed border-black/20 pb-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm font-bold leading-7 text-black/60">
            适合有明确主题、任务制产出和作品展示的黑客松相关活动。生态伙伴可以提交信息，确认后同步进入主活动日历。
          </p>
          <button onClick={onSubmitClick} className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm">
            提交 Hackathon <ExternalLink size={16} />
          </button>
        </div>

        <section
          className="mt-8 grid gap-4"
          onWheelCapture={handleWheelCapture}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 border-2 border-black/15 bg-white/90 p-10 text-sm font-black text-black/60">
              <Loader2 size={20} className="animate-spin text-accent" />
              正在加载 Hackathon...
            </div>
          ) : hackathons.length === 0 ? (
            <div className="border-2 border-dashed border-black/25 bg-white/75 p-7 sm:p-8">
              <p className="text-2xl font-black text-black">暂时没有确认收录的 Hackathon。</p>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-black/60">
                如果你正在组织 AI 黑客松或相关挑战活动，可以提交活动信息；确认通过后会出现在这里和主活动日历中。
              </p>
            </div>
          ) : (
            <>
              <div ref={historyControlsRef} className="flex flex-col gap-1 text-sm font-bold text-black/60 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span>
                  {upcomingEvents.length > 0
                    ? `即将开始 ${upcomingEvents.length} 场 Hackathon`
                    : '暂无即将开始的 Hackathon'}
                </span>
                {pastEvents.length > 0 && (
                  <span className="text-left text-accent sm:text-right">
                    {showPastEvents ? `${pastEvents.length} 场历史活动已展开` : `向上滚动查看 ${pastEvents.length} 场历史活动`}
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
                <section className="grid gap-4" aria-label="历史 Hackathon">
                  <div className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.18em] text-black/35 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-center gap-3">
                      <span className="h-px flex-1 bg-black/10" />
                      <span>已结束活动</span>
                      <span className="h-px flex-1 bg-black/10" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={collapsePastEvents}
                        className="inline-flex w-fit items-center gap-1.5 border border-black/10 bg-white/80 px-3 py-1.5 text-[11px] font-black tracking-[0.06em] text-black/55 transition-all hover:border-black/25 hover:bg-primary/25 hover:text-black"
                      >
                        收起过往活动 <ChevronUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={scrollToUpcomingEvents}
                        className="inline-flex w-fit items-center gap-1.5 border border-black/10 bg-white/80 px-3 py-1.5 text-[11px] font-black tracking-[0.06em] text-black/55 transition-all hover:border-black/25 hover:bg-primary/25 hover:text-black"
                      >
                        跳到即将开始 <ArrowDown size={13} />
                      </button>
                    </div>
                  </div>
                  {pastEvents.map(renderEventCard)}
                </section>
              )}

              <div
                ref={upcomingSectionRef}
                className="scroll-mt-28 rounded-lg border border-black/10 bg-white/80 px-4 py-3 text-sm font-black text-black shadow-[4px_4px_0_rgba(23,100,255,0.12)] sm:scroll-mt-32"
              >
                {upcomingEvents.length > 0 ? '即将开始' : '暂无即将开始的 Hackathon'}
              </div>

              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(renderEventCard)
              ) : (
                <div className="rounded-lg border border-black/10 bg-white/80 px-5 py-8 text-center text-sm font-bold text-black/50">
                  可以向上查看已经结束的 Hackathon。
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Hackathons;
