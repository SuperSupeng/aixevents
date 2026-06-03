import React, { useMemo } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  BookOpenCheck,
  ChevronUp,
  ExternalLink,
  Globe2,
  Hammer,
  Handshake,
  Loader2,
  MapPin,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useEvents } from '../hooks/useEvents';
import { usePastEventsReveal } from '../hooks/usePastEventsReveal';
import type { TechEvent } from '../types';
import { splitEventsByTimeSection } from '../utils/eventSections';

interface CreatorsDayProps {
  onBack: () => void;
  onSubmitClick: () => void;
  onEventClick: (event: TechEvent) => void;
}

const CREATOR_DAY_ARTICLE_URL = 'https://mp.weixin.qq.com/s/rnGVMqYzoqUnEHS_7LU0Ng';

const missionItems = [
  {
    title: '连接',
    description: '连接线上与线下、城市与高校、场景与创造者，让 AI+X 在更多真实场景中持续发生。',
    icon: <Handshake size={20} />,
  },
  {
    title: '学习',
    description: '通过现场实操、任务驱动和工具掌握，让参与者从知识输入走向动手实践。',
    icon: <BookOpenCheck size={20} />,
  },
  {
    title: '创造',
    description: '围绕真实需求做出 Agent、工作流、内容作品、应用原型或解决方案。',
    icon: <Hammer size={20} />,
  },
  {
    title: '成长',
    description: '通过作品展示、生态传播和持续运营，让优秀作品与合作伙伴被更多人看见。',
    icon: <TrendingUp size={20} />,
  },
];

function formatEventDate(date: string): string {
  return format(new Date(date), 'yyyy年M月d日 HH:mm', { locale: zhCN });
}

function getLocationLabel(event: TechEvent): string {
  if (event.format === 'online') return '线上';
  if (event.format === 'hybrid') return event.location?.city ? `${event.location.city} + 线上` : '线上 + 线下';
  return event.location?.city || '城市待定';
}

const CreatorsDay: React.FC<CreatorsDayProps> = ({ onBack, onSubmitClick, onEventClick }) => {
  const { data: events = [], isLoading } = useEvents(
    { tag: 'creator_day', limit: 300 },
    { refetchOnMount: 'always', staleTime: 30 * 1000 }
  );

  const { allEvents: creatorEvents, upcomingEvents, pastEvents } = useMemo(() => {
    return splitEventsByTimeSection(events);
  }, [events]);

  const eventCount = creatorEvents.length;
  const onlineCount = creatorEvents.filter((event) => event.format === 'online').length;
  const cityCount = new Set(creatorEvents.map((event) => event.location?.city).filter(Boolean)).size;
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
      <div className="relative z-10 mx-auto w-full max-w-[72rem]">
        <button onClick={onBack} className="page-back-button">
          <ArrowLeft size={18} />
          <span>返回首页</span>
        </button>

        <header className="grid min-w-0 max-w-full gap-6 border-2 border-black bg-white/92 p-5 shadow-[7px_7px_0_rgba(5,5,5,0.92)] sm:p-7 lg:grid-cols-[1fr_21rem] lg:items-end">
          <div className="min-w-0">
            <div className="mb-5 inline-flex max-w-full flex-wrap items-center gap-2 border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase leading-4 tracking-wide sm:text-xs">
              <Sparkles size={15} className="text-accent" />
              <span className="min-w-0 break-words">Datawhale AI+X Creators' Day</span>
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] text-black sm:text-6xl">
              <a
                href={CREATOR_DAY_ARTICLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-2 text-black transition-colors hover:text-accent sm:gap-3"
                aria-label="阅读 AI+X 创造节公众号介绍"
              >
                <span>AI+X 创造节</span>
                <ExternalLink size={28} className="mt-1 shrink-0 sm:h-8 sm:w-8" />
              </a>
            </h1>
            <p className="mt-5 max-w-3xl break-words text-base font-bold leading-8 text-black/70 sm:text-lg">
              Datawhale 2026 夏季推出的 AI 动手实践类品牌活动，面向 AI 学习者、开发者、高校学生、个人创造者与产业从业者，鼓励大家在真实场景中学习 AI、使用 AI，并用 AI 做出可展示的作品。
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-3 overflow-hidden border-2 border-black bg-[#f7f8f1]">
            {[
              ['省份', '28'],
              ['城市', '50+'],
              ['高校', '300+'],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 border-l-2 border-black/15 p-3 first:border-l-0 sm:p-4">
                <p className="text-[11px] font-black text-accent">{label}</p>
                <p className="mt-2 whitespace-nowrap text-[1.65rem] font-black leading-none text-black sm:text-3xl">{value}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_22rem]">
          <div className="border-2 border-black bg-primary/90 p-4 shadow-[6px_6px_0_rgba(5,5,5,0.9)] sm:p-5">
            <div className="mb-3 inline-flex max-w-full flex-wrap items-center gap-2 border-2 border-black bg-white px-3 py-1 text-xs font-black">
              <Target size={15} className="text-accent" />
              <span>创造节的初心</span>
            </div>
            <h2 className="text-2xl font-black leading-tight text-black sm:text-3xl">
              让你在真实场景中，亲手用 AI 完成一件作品。
            </h2>
            <p className="mt-3 text-sm font-bold leading-6 text-black/68 sm:text-base sm:leading-7">
              很多人刷完教程、看完直播，却不知道用 AI 解决什么真实问题。创造节把高校里的 AI 原生创造者、城市里的真实需求和产业场景连接起来，让每一件作品对应一个真实问题。
            </p>
            <div className="mt-3 border-2 border-black bg-white p-3 shadow-[4px_4px_0_rgba(5,5,5,0.82)] sm:p-4">
              <p className="text-[11px] font-black uppercase tracking-wide text-accent">AI 新质生产力公式</p>
              <div className="mt-3 grid gap-2 text-sm font-black leading-6 text-black sm:grid-cols-[1fr_auto_1fr_auto_1.15fr] sm:items-center">
                <span className="border-2 border-black bg-[#f7f8f1] px-3 py-2">AI 原生能力</span>
                <span className="text-center text-xl leading-none text-accent">+</span>
                <span className="border-2 border-black bg-[#f7f8f1] px-3 py-2">真实场景洞察</span>
                <span className="text-center text-xl leading-none text-accent">=</span>
                <span className="border-2 border-black bg-primary px-3 py-2 shadow-[3px_3px_0_rgba(23,100,255,0.22)]">AI 新质生产力</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-black bg-white/92 p-5 shadow-[6px_6px_0_rgba(23,100,255,0.16)] sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">活动收录</p>
            <div className="mt-4 grid min-w-0 grid-cols-3 gap-2">
              {[
                ['创造节', eventCount],
                ['线上', onlineCount],
                ['城市', cityCount],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 border-2 border-black/10 bg-black/[0.03] p-2 sm:p-3">
                  <p className="text-[10px] font-black text-black/45">{label}</p>
                  <p className="mt-2 break-words text-xl font-black text-black sm:text-2xl">{value}</p>
                </div>
              ))}
            </div>
            <button onClick={onSubmitClick} className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm">
              提交创造节活动 <ExternalLink size={16} />
            </button>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {missionItems.map((item) => (
            <article key={item.title} className="border-2 border-black/15 bg-white/90 p-4 shadow-[4px_4px_0_rgba(5,5,5,0.08)]">
              <div className="mb-3 flex h-10 w-10 items-center justify-center border-2 border-black bg-primary text-black">
                {item.icon}
              </div>
              <h3 className="text-lg font-black text-black">{item.title}</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-black/62">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="mt-7 border-y-2 border-dashed border-black/20 py-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Creators' Day Events</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-black">创造节活动</h2>
            </div>
            <p className="max-w-2xl text-sm font-bold leading-7 text-black/60">
              每期围绕一个 AI+X 主题，从“听懂 AI”走向“用 AI 做出作品”，让学习成果进入展示、传播和持续共创。
            </p>
          </div>
        </section>

        <section
          className="mt-8 grid gap-4"
          onWheelCapture={handleWheelCapture}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 border-2 border-black/15 bg-white/90 p-10 text-sm font-black text-black/60">
              <Loader2 size={20} className="animate-spin text-accent" />
              正在加载创造节活动...
            </div>
          ) : creatorEvents.length === 0 ? (
            <div className="border-2 border-dashed border-black/25 bg-white/75 p-7 sm:p-8">
              <p className="text-2xl font-black text-black">暂时没有确认收录的创造节活动。</p>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-black/60">
                正在组织创造节活动？提交后经确认会同步到这里和活动日历。
              </p>
            </div>
          ) : (
            <>
              <div ref={historyControlsRef} className="flex flex-col gap-1 text-sm font-bold text-black/60 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span>
                  {upcomingEvents.length > 0
                    ? `即将开始 ${upcomingEvents.length} 场创造节活动`
                    : '暂无即将开始的创造节活动'}
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
                <section className="grid gap-4" aria-label="历史创造节活动">
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
                {upcomingEvents.length > 0 ? '即将开始' : '暂无即将开始的创造节活动'}
              </div>

              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(renderEventCard)
              ) : (
                <div className="rounded-lg border border-black/10 bg-white/80 px-5 py-8 text-center text-sm font-bold text-black/50">
                  可以向上查看已经结束的创造节活动。
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default CreatorsDay;
