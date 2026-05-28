import React, { useMemo } from 'react';
import { ArrowLeft, ExternalLink, Loader2, MapPin, Globe, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useEvents } from '../hooks/useEvents';

interface HackathonsProps {
  onBack: () => void;
  onSubmitClick: () => void;
}

const Hackathons: React.FC<HackathonsProps> = ({ onBack, onSubmitClick }) => {
  const { data: events = [], isLoading } = useEvents({ tag: 'hackathon', limit: 100 });

  const hackathons = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events]);

  return (
    <div className="poster-app min-h-screen px-4 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft size={20} />
          <span>返回首页</span>
        </button>

        <header className="mb-10 border-2 border-black bg-white p-6 shadow-[6px_6px_0_rgba(5,5,5,0.92)] sm:p-8">
          <div className="mb-5 inline-flex items-center gap-2 border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wide">
            <Trophy size={15} className="text-accent" />
            Hackathon
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-black sm:text-6xl">
            AI+X Hackathon 收录
          </h1>
          <p className="mt-5 max-w-3xl text-base font-bold leading-8 text-black/70 sm:text-lg">
            单独整理黑客松、创造营、作品挑战和 Agent 实战活动。这里以活动开始时间作为默认提醒，具体报名截止以主办方页面或海报二维码为准。
          </p>
          <button onClick={onSubmitClick} className="btn-primary mt-7 inline-flex items-center gap-2 px-6 py-3 text-sm">
            提交 Hackathon <ExternalLink size={17} />
          </button>
        </header>

        <section className="grid gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 border border-black/10 bg-white/80 p-10 text-sm font-black text-black/55">
              <Loader2 size={20} className="animate-spin text-accent" />
              加载 Hackathon...
            </div>
          ) : hackathons.length === 0 ? (
            <div className="border-2 border-dashed border-black/20 bg-white/70 p-8">
              <p className="text-2xl font-black text-black">暂时没有确认收录的 Hackathon。</p>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-black/62">
                如果你正在组织 AI 黑客松、创造营或作品挑战，可以提交活动信息；确认通过后会出现在这里和主活动日历中。
              </p>
            </div>
          ) : (
            hackathons.map((event) => (
              <article key={event.id} className="grid gap-4 border border-black/15 bg-white/90 p-4 shadow-[4px_4px_0_rgba(23,100,255,0.16)] transition-transform hover:-translate-y-0.5 sm:grid-cols-[9rem_1fr_auto] sm:items-center sm:p-5">
                <div className="flex items-center gap-3 sm:block">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center border-2 border-black bg-primary text-black sm:mb-2">
                    <span className="text-2xl font-black leading-none">{format(new Date(event.startTime), 'dd')}</span>
                    <span className="mt-1 text-[10px] font-black leading-none text-black/60">{format(new Date(event.startTime), 'M月', { locale: zhCN })}</span>
                  </div>
                  <p className="text-xs font-black leading-5 text-black/52">
                    {format(new Date(event.startTime), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
                  </p>
                </div>

                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="border border-black/10 bg-black/[0.035] px-2 py-1 text-[10px] font-black text-black/60">
                      {event.organizers?.length ? event.organizers.join(' / ') : event.organizer.name}
                    </span>
                    <span className="inline-flex max-w-full items-center gap-1.5 truncate border border-black/10 bg-primary/20 px-2 py-1 text-[10px] font-black text-accent">
                      {event.format === 'online' ? <Globe size={12} /> : <MapPin size={12} />}
                      <span className="truncate">{event.format === 'online' ? '线上活动' : event.location?.city || '城市待定'}</span>
                    </span>
                  </div>
                  <h2 className="truncate text-xl font-black text-black sm:text-2xl">{event.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-black/62">{event.summary}</p>
                </div>

                <a
                  href={event.links.registration || event.links.officialSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
                >
                  详情 <ExternalLink size={16} />
                </a>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
};

export default Hackathons;
