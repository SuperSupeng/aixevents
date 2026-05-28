import React, { useMemo } from 'react';
import { ArrowLeft, ExternalLink, Globe2, Loader2, MapPin, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useEvents } from '../hooks/useEvents';
import type { TechEvent } from '../types';

interface HackathonsProps {
  onBack: () => void;
  onSubmitClick: () => void;
}

function formatEventDate(date: string): string {
  return format(new Date(date), 'yyyy年M月d日 HH:mm', { locale: zhCN });
}

function getLocationLabel(event: TechEvent): string {
  if (event.format === 'online') return '线上';
  if (event.format === 'hybrid') return event.location?.city ? `${event.location.city} + 线上` : '线上 + 线下';
  return event.location?.city || '城市待定';
}

const Hackathons: React.FC<HackathonsProps> = ({ onBack, onSubmitClick }) => {
  const { data: events = [], isLoading } = useEvents({ tag: 'hackathon', limit: 100 });

  const hackathons = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events]);

  const visibleCount = hackathons.length;
  const onlineCount = hackathons.filter((event) => event.format === 'online').length;
  const cityCount = new Set(hackathons.map((event) => event.location?.city).filter(Boolean)).size;

  return (
    <div className="poster-app min-h-screen px-4 py-24 text-black sm:px-6">
      <div className="relative z-10 mx-auto max-w-7xl">
        <button
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 text-sm font-black text-black/60 transition-colors hover:text-accent"
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
              Hackathon 与作品挑战
            </h1>
            <p className="mt-5 max-w-3xl text-base font-bold leading-8 text-black/70 sm:text-lg">
              单独收录黑客松、创造营、作品挑战和 Agent 实战活动。默认按活动开始时间排序，报名截止以主办方页面或海报二维码为准。
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
            适合有明确主题、任务制产出和作品展示的活动。生态伙伴可以提交信息，确认后同步进入主活动日历。
          </p>
          <button onClick={onSubmitClick} className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm">
            提交 Hackathon <ExternalLink size={16} />
          </button>
        </div>

        <section className="mt-8 grid gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 border-2 border-black/15 bg-white/90 p-10 text-sm font-black text-black/60">
              <Loader2 size={20} className="animate-spin text-accent" />
              正在加载 Hackathon...
            </div>
          ) : hackathons.length === 0 ? (
            <div className="border-2 border-dashed border-black/25 bg-white/75 p-7 sm:p-8">
              <p className="text-2xl font-black text-black">暂时没有确认收录的 Hackathon。</p>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-black/60">
                如果你正在组织 AI 黑客松、创造营或作品挑战，可以提交活动信息；确认通过后会出现在这里和主活动日历中。
              </p>
            </div>
          ) : (
            hackathons.map((event) => {
              const detailUrl = event.links.registration || event.links.officialSite || event.links.poster;
              return (
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

                  {detailUrl ? (
                    <a
                      href={detailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
                    >
                      查看详情 <ExternalLink size={16} />
                    </a>
                  ) : (
                    <span className="border-2 border-black/10 bg-black/[0.035] px-5 py-3 text-center text-sm font-black text-black/50">
                      待补充链接
                    </span>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
};

export default Hackathons;
