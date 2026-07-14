import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  MessageCircle,
  Plus,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import Logo from '../components/Logo';
import type { TechEvent } from '../types';
import { getActivityTypeLabel } from '../constants/activityTaxonomy';

interface Waic2026Props {
  events: TechEvent[];
  isLoading?: boolean;
  onBack: () => void;
  onEventClick: (event: TechEvent) => void;
  onSubmitClick: () => void;
}

const WAIC_DATES = ['2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19', '2026-07-20'];
const SHANGHAI_TIMEZONE = 'Asia/Shanghai';
const HIGHLIGHT_EVENT_TITLE_FRAGMENTS = [
  '人文，不做旁观者',
  "AI Pioneers' Night",
  'AI for Science Night',
];

const filters = [
  { id: 'all', label: '全部' },
  { id: 'tech', label: '技术与研究' },
  { id: 'startup', label: '创业与出海' },
  { id: 'social', label: '聚会与社交' },
  { id: 'humanity', label: '人文与设计' },
] as const;

type FilterId = (typeof filters)[number]['id'];

function getShanghaiDate(value: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SHANGHAI_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(typeof value === 'string' ? new Date(value) : value);
}

function getTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function getDateLabel(date: string): { day: string; weekday: string } {
  const value = new Date(`${date}T00:00:00+08:00`);
  return {
    day: new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', timeZone: SHANGHAI_TIMEZONE }).format(value),
    weekday: new Intl.DateTimeFormat('zh-CN', { weekday: 'short', timeZone: SHANGHAI_TIMEZONE }).format(value),
  };
}

function isWaicEvent(event: TechEvent): boolean {
  return [...(event.tags || []), ...(event.customTags || [])]
    .some((tag) => tag.replace(/\s+/g, '').toLowerCase() === 'waic2026');
}

function matchesFilter(event: TechEvent, filter: FilterId): boolean {
  if (filter === 'all') return true;
  const haystack = [event.title, event.summary, event.activityType, ...(event.tags || []), ...(event.customTags || [])]
    .join(' ')
    .toLowerCase();

  if (filter === 'tech') return /(技术|研究|开源|模型|agent|llm|硬件|具身|demo|推理|开发)/i.test(haystack);
  if (filter === 'startup') return /(创业|投资|资本|出海|全球化|founder|商业|峰会)/i.test(haystack);
  if (filter === 'social') return /(聚会|派对|party|night|酒会|社交|交流|after)/i.test(haystack);
  return /(人文|设计|教育|历史|社会|艺术|文化)/i.test(haystack);
}

const Waic2026: React.FC<Waic2026Props> = ({
  events,
  isLoading = false,
  onBack,
  onEventClick,
  onSubmitClick,
}) => {
  const scheduleRef = useRef<HTMLElement>(null);
  const initialDate = useMemo(() => {
    const today = getShanghaiDate(new Date());
    if (WAIC_DATES.includes(today)) return today;
    return WAIC_DATES.find((date) => date >= today) || WAIC_DATES[0];
  }, []);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [showGroupQr, setShowGroupQr] = useState(false);

  const waicEvents = useMemo(() => events
    .filter(isWaicEvent)
    .filter((event) => WAIC_DATES.includes(getShanghaiDate(event.startTime)))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()), [events]);

  const selectedEvents = useMemo(() => waicEvents
    .filter((event) => getShanghaiDate(event.startTime) === selectedDate)
    .filter((event) => matchesFilter(event, activeFilter)), [activeFilter, selectedDate, waicEvents]);

  const nextEvents = useMemo(() => {
    return HIGHLIGHT_EVENT_TITLE_FRAGMENTS
      .map((titleFragment) => waicEvents.find((event) => event.title.includes(titleFragment)))
      .filter((event): event is TechEvent => Boolean(event));
  }, [waicEvents]);

  useEffect(() => {
    if (!showGroupQr) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowGroupQr(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showGroupQr]);

  const openSchedule = () => scheduleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen bg-[#f2f5ec] text-[#101410]">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f2f5ec]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-black text-black/70 transition hover:text-black">
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">返回活动日历</span>
          </button>
          <Logo size={28} />
          <button onClick={() => setShowGroupQr(true)} className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-3 py-2 text-xs font-black shadow-[3px_3px_0_#101410] transition hover:-translate-y-0.5 hover:bg-primary">
            <MessageCircle size={15} /> 加入交流群
          </button>
        </div>
      </header>

      <main>
        <section
          className="relative overflow-hidden border-b-2 border-black bg-[#f2f5ec] text-black"
          style={{
            backgroundImage: 'linear-gradient(rgba(16,20,16,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(16,20,16,0.035) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        >
          <div className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full border-[52px] border-accent/10" />
          <div className="pointer-events-none absolute bottom-10 left-[52%] h-24 w-24 rotate-12 bg-accent/12" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-accent shadow-[3px_3px_0_#101410]">
                <Sparkles size={14} /> 2026 WAIC · Side Events
              </div>
              <h1 className="max-w-4xl [font-size:clamp(2rem,10vw,2.35rem)] font-black leading-[1.02] tracking-[-0.045em] sm:text-[4rem] lg:text-[4.7rem] xl:text-[5rem]">
                <span className="block whitespace-nowrap">WAIC 主会场之外，</span>
                <span className="block whitespace-nowrap">还有这些 AI 活动。</span>
              </h1>
              <p className="mt-7 max-w-[46rem] text-base font-bold leading-8 text-black/65 [text-wrap:pretty] sm:text-lg">
                WAIC 大会于 7 月 17–20 日举行，周边活动从 7 月 15 日起陆续开始。技术分享、创业交流、Demo Day、研究者聚会与 After Party 持续发生，选一场去现场碰个头。
              </p>
              <a
                href="https://www.worldaic.com.cn/"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-black text-accent underline decoration-2 underline-offset-4 transition hover:text-black"
              >
                查看 WAIC 官方网站 <ExternalLink size={14} />
              </a>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={openSchedule} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-primary-light">
                  查看完整日程 <ArrowRight size={17} />
                </button>
                <button onClick={() => setShowGroupQr(true)} className="inline-flex min-h-12 items-center gap-2 rounded-md border-2 border-black bg-white px-6 py-3 text-sm font-black text-accent shadow-[4px_4px_0_#c7d8ff] transition hover:-translate-y-0.5 hover:bg-white">
                  <Users size={17} /> 来 WAIC 2026 碰个头
                </button>
              </div>
            </div>

            <div className="border-2 border-black bg-white p-5 shadow-[9px_9px_0_#c7d8ff] sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">持续更新</p>
              <p className="mt-3 text-6xl font-black text-accent">{waicEvents.length}</p>
              <p className="mt-1 text-sm font-bold text-black/65">场 WAIC 周边活动已收录</p>
              <div className="mt-6 grid grid-cols-2 gap-2 text-xs font-black">
                <div className="border border-black/15 bg-[#f2f5ec] p-3"><CalendarDays className="mb-2 text-accent" size={18} />大会 7.17–7.20<br /><span className="text-black/45">Side Events 7.15 起</span></div>
                <div className="border border-black/15 bg-[#f2f5ec] p-3"><MapPin className="mb-2 text-accent" size={18} />上海及线上</div>
              </div>
            </div>
          </div>
        </section>

        {nextEvents.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-accent">Next up</p>
                <h2 className="mt-1 text-3xl font-black">接下来值得关注</h2>
              </div>
              <button onClick={openSchedule} className="text-sm font-black text-black/55 hover:text-black">查看全部 →</button>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {nextEvents.map((event) => (
                <button key={event.id} onClick={() => onEventClick(event)} className="group border-2 border-black bg-white p-5 text-left shadow-[5px_5px_0_#101410] transition hover:-translate-y-1 hover:bg-primary/10">
                  <p className="text-xs font-black text-accent">{getShanghaiDate(event.startTime).slice(5).replace('-', '/')} · {getTime(event.startTime)}</p>
                  <h3 className="mt-3 line-clamp-2 text-xl font-black leading-tight group-hover:text-accent">{event.title}</h3>
                  <p className="mt-4 flex items-center gap-1.5 truncate text-xs font-bold text-black/50"><MapPin size={14} />{event.location?.address || event.location?.city || '地点待通知'}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        <section ref={scheduleRef} className="scroll-mt-20 border-y-2 border-black bg-white py-10 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-7">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-accent">WAIC activity guide</p>
              <h2 className="mt-1 text-3xl font-black sm:text-4xl">按日期找活动</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-black/55">活动时间和地点可能临时调整，请以主办方最新通知为准。</p>
            </div>

            <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              <div className="flex min-w-max gap-2">
                {WAIC_DATES.map((date) => {
                  const label = getDateLabel(date);
                  const count = waicEvents.filter((event) => getShanghaiDate(event.startTime) === date).length;
                  const selected = selectedDate === date;
                  return (
                    <button key={date} aria-pressed={selected} onClick={() => setSelectedDate(date)} className={`min-w-[84px] border-2 px-4 py-3 text-left transition ${selected ? 'border-black bg-primary shadow-[3px_3px_0_#101410]' : 'border-black/15 bg-[#f2f5ec] hover:border-black'}`}>
                      <span className="block text-lg font-black">{label.day}</span>
                      <span className="mt-0.5 block text-[11px] font-black text-black/48">{label.weekday} · {count} 场</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button key={filter.id} aria-pressed={activeFilter === filter.id} onClick={() => setActiveFilter(filter.id)} className={`rounded-full border px-3 py-2 text-xs font-black transition ${activeFilter === filter.id ? 'border-black bg-black text-white' : 'border-black/15 bg-white text-black/58 hover:border-black'}`}>
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="mt-7 space-y-3">
              {isLoading ? (
                <div className="border-2 border-dashed border-black/20 p-10 text-center text-sm font-black text-black/45">正在读取活动日程…</div>
              ) : selectedEvents.length === 0 ? (
                <div className="border-2 border-dashed border-black/20 p-10 text-center">
                  <p className="text-lg font-black">这个分类暂时没有活动</p>
                  <button onClick={() => setActiveFilter('all')} className="mt-3 text-sm font-black text-accent">查看当天全部活动</button>
                </div>
              ) : selectedEvents.map((event) => {
                const registration = event.links.registration || event.links.officialSite;
                const ended = new Date(event.endTime).getTime() < Date.now();
                return (
                  <article key={event.id} className="grid gap-4 border-2 border-black bg-[#f8faf4] p-4 transition hover:bg-primary/[0.07] sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center sm:p-5">
                    <div>
                      <p className="text-2xl font-black tabular-nums">{getTime(event.startTime)}</p>
                      <p className="mt-1 text-xs font-black text-black/45">至 {getTime(event.endTime)}</p>
                      {ended && <span className="mt-2 inline-block bg-black/8 px-2 py-1 text-[10px] font-black text-black/45">已结束</span>}
                    </div>
                    <button onClick={() => onEventClick(event)} className="min-w-0 text-left">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wide text-accent">
                        <span>{getActivityTypeLabel(event.activityType)}</span>
                        <span className="text-black/25">/</span>
                        <span className="max-w-[16rem] truncate text-black/45">{event.organizer.name}</span>
                      </div>
                      <h3 className="mt-1.5 text-xl font-black leading-tight hover:text-accent sm:text-2xl">{event.title}</h3>
                      <p className="mt-2 flex items-center gap-1.5 truncate text-xs font-bold text-black/50"><MapPin size={14} />{event.location?.address || event.location?.city || '地点待通知'}</p>
                    </button>
                    <div className="flex gap-2 sm:flex-col">
                      <button onClick={() => onEventClick(event)} className="inline-flex flex-1 items-center justify-center gap-1.5 border border-black px-3 py-2 text-xs font-black hover:bg-black hover:text-white sm:flex-none">详情 <ArrowRight size={14} /></button>
                      {registration && registration !== '#' && !ended && (
                        <a href={registration} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 bg-accent px-3 py-2 text-xs font-black text-white hover:bg-black sm:flex-none">报名 <ExternalLink size={13} /></a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-primary py-12 sm:py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">Datawhale community</p>
              <h2 className="mt-2 max-w-3xl text-4xl font-black leading-none tracking-[-0.04em] sm:text-6xl">来 WAIC 2026<br />碰个头 @Datawhale</h2>
              <p className="mt-5 max-w-2xl text-sm font-bold leading-7 text-black/65 sm:text-base">加入活动交流群，获取临时新增活动、时间地点变更、余票信息和现场约伴。非 WAIC 官方社群。</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button onClick={() => setShowGroupQr(true)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-black text-white hover:bg-accent"><MessageCircle size={17} />查看入群二维码</button>
                <button onClick={onSubmitClick} className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-black bg-white px-6 py-3 text-sm font-black shadow-[3px_3px_0_#101410] hover:-translate-y-0.5"><Plus size={17} />提交 WAIC 活动</button>
              </div>
            </div>
            <button onClick={() => setShowGroupQr(true)} className="hidden w-48 rotate-2 border-2 border-black bg-white p-2 shadow-[8px_8px_0_#101410] transition hover:rotate-0 lg:block">
              <img src="/brand/waic-2026-group-qr.png" alt="来 WAIC 2026 碰个头 Datawhale 交流群二维码" className="w-full" />
            </button>
          </div>
        </section>

        <section className="border-t-2 border-black bg-[#101410] py-10 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div><Logo size={28} variant="white" /><p className="mt-3 text-xs font-bold text-white/45">活动持续更新，以主办方最新通知为准。</p></div>
            <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-black text-primary">查看 Datawhale AI+X 完整活动日历 <ArrowRight size={16} /></button>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-black bg-white p-2 sm:hidden">
        <button onClick={openSchedule} className="flex min-h-11 flex-1 items-center justify-center gap-2 text-xs font-black"><Clock3 size={16} />查看日程</button>
        <button onClick={() => setShowGroupQr(true)} className="flex min-h-11 flex-1 items-center justify-center gap-2 bg-primary text-xs font-black"><MessageCircle size={16} />加入交流群</button>
      </div>

      {showGroupQr && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setShowGroupQr(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="waic-group-title" className="relative max-h-[92vh] w-full max-w-md overflow-y-auto border-2 border-black bg-white p-5 shadow-[10px_10px_0_#a7f000]" onClick={(event) => event.stopPropagation()}>
            <button onClick={() => setShowGroupQr(false)} className="absolute right-3 top-3 z-10 border-2 border-black bg-white p-2 hover:bg-primary" aria-label="关闭二维码"><X size={17} /></button>
            <p className="pr-10 text-xs font-black uppercase tracking-[0.16em] text-accent">WAIC 2026 community</p>
            <h2 id="waic-group-title" className="mt-2 text-3xl font-black leading-tight">来 WAIC 2026<br />碰个头 @Datawhale</h2>
            <img src="/brand/waic-2026-group-qr.png" alt="来 WAIC 2026 碰个头 Datawhale 交流群二维码" className="mx-auto mt-4 max-h-[58vh] w-auto max-w-full border border-black/10 object-contain" />
            <p className="mt-4 text-center text-xs font-bold leading-6 text-black/55">使用微信扫码加入。二维码有效期以图片提示为准；若失效，我们会及时更新。</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Waic2026;
