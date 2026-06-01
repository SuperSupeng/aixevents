import React, { useMemo, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, Clipboard, Loader2, MapPin, MessageCircle, Search, Users, Zap } from 'lucide-react';
import { CITY_GROUPS, FALLBACK_CITY_GROUP, findCityGroup, getShareCityParam, type CityGroup } from '../data/cityGroups';
import { useEvents } from '../hooks/useEvents';
import type { TechEvent } from '../types';
import { isEventActiveByEndTime } from '../utils/timeUtils';

interface JoinGroupsProps {
  onBack: () => void;
  onCalendarClick: (city?: string) => void;
  onSubmitClick: (city?: string) => void;
  onEventClick: (event: TechEvent) => void;
}

function readInitialCityQuery(): string {
  return new URLSearchParams(window.location.search).get('city') || '';
}

function formatEventTime(value: string): string {
  const date = parseISO(value);
  if (!isValid(date)) return '时间待定';
  return format(date, 'MM.dd HH:mm');
}

function getGroupUrl(group: CityGroup): string {
  const url = new URL(window.location.href);
  url.pathname = '/join';
  url.searchParams.set('city', getShareCityParam(group));
  return url.toString();
}

function setJoinUrl(group: CityGroup | null) {
  const url = new URL(window.location.href);
  url.pathname = '/join';
  if (group) {
    url.searchParams.set('city', getShareCityParam(group));
  } else {
    url.searchParams.delete('city');
  }
  window.history.replaceState({}, '', `${url.pathname}${url.search}`);
}

const JoinGroups: React.FC<JoinGroupsProps> = ({ onBack, onCalendarClick, onSubmitClick, onEventClick }) => {
  const [selectedCityQuery, setSelectedCityQuery] = useState(readInitialCityQuery);
  const [citySearch, setCitySearch] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedGroup = useMemo(() => findCityGroup(selectedCityQuery), [selectedCityQuery]);
  const hasRequestedCity = selectedCityQuery.trim().length > 0;
  const requestedCity = hasRequestedCity ? decodeURIComponent(selectedCityQuery).trim() : '';
  const isMissingCity = hasRequestedCity && !selectedGroup;
  const activeGroup = selectedGroup || FALLBACK_CITY_GROUP;
  const activeCityForEvents = activeGroup.slug === FALLBACK_CITY_GROUP.slug ? undefined : activeGroup.city;

  const { data: cityEvents = [], isLoading: eventsLoading } = useEvents(
    activeCityForEvents ? { location: activeCityForEvents } : {},
    { staleTime: 2 * 60 * 1000 }
  );

  const featuredGroups = useMemo(() => CITY_GROUPS.filter((group) => group.featured), []);
  const filteredGroups = useMemo(() => {
    const keyword = citySearch.trim().toLowerCase();
    if (!keyword) return CITY_GROUPS;
    return CITY_GROUPS.filter((group) => {
      const candidates = [group.city, group.slug, ...(group.aliases || [])].join(' ').toLowerCase();
      return candidates.includes(keyword);
    });
  }, [citySearch]);

  const previewEvents = cityEvents.filter((event) => isEventActiveByEndTime(event.endTime)).slice(0, 4);

  const selectGroup = (group: CityGroup | null) => {
    setCopied(false);
    setSelectedCityQuery(group ? group.slug : '');
    setJoinUrl(group);
  };

  const copyCurrentLink = async () => {
    try {
      await navigator.clipboard.writeText(getGroupUrl(activeGroup));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

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
              <Users size={15} className="text-accent" />
              AI+X City Groups
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] text-black sm:text-6xl">
              <span className="block">加入 Datawhale</span>
              <span className="block">城市/区域群</span>
            </h1>
            <p className="mt-5 max-w-3xl text-base font-bold leading-8 text-black/70 sm:text-lg">
              想找同城或同区域的 AI 伙伴，可以从这里进群。群里会同步近期活动和 AI
              资讯，也方便大家交流问题、约线下、一起做项目。暂时没有对应城市的话，先加入蹲蹲群。
            </p>
          </div>

          <div className="border-2 border-black bg-[#f7f8f1] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">已开通</p>
            <p className="mt-2 text-4xl font-black leading-none text-accent">{CITY_GROUPS.length}</p>
            <p className="mt-2 text-sm font-bold leading-6 text-black/60">个城市/区域群入口</p>
          </div>
        </header>

        <main className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <section className="space-y-6">
            <div className="border-2 border-black bg-white p-5 shadow-[5px_5px_0_rgba(5,5,5,0.88)] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-accent">City</p>
                  <h2 className="mt-2 text-2xl font-black leading-tight">选择城市/区域群</h2>
                </div>
                <label className="relative block w-full sm:max-w-xs">
                  <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35" />
                  <input
                    value={citySearch}
                    onChange={(event) => setCitySearch(event.target.value)}
                    className="w-full border-2 border-black bg-white py-3 pl-10 pr-3 text-sm font-bold outline-none transition-colors focus:border-accent"
                    placeholder="搜索城市或区域"
                  />
                </label>
              </div>

              <div className="mt-5">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-black/45">热门城市/区域</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {featuredGroups.map((group) => (
                    <button
                      key={group.slug}
                      onClick={() => selectGroup(group)}
                      className={`border-2 px-3 py-2 text-sm font-black transition-transform hover:-translate-y-0.5 ${
                        activeGroup.slug === group.slug
                          ? 'border-black bg-primary text-black shadow-[3px_3px_0_rgba(5,5,5,0.9)]'
                          : 'border-black bg-white text-black hover:bg-primary/15'
                      }`}
                    >
                      {group.city}
                    </button>
                  ))}
                  <button
                    onClick={() => selectGroup(null)}
                    className={`border-2 px-3 py-2 text-sm font-black transition-transform hover:-translate-y-0.5 ${
                      !hasRequestedCity
                        ? 'border-black bg-primary text-black shadow-[3px_3px_0_rgba(5,5,5,0.9)]'
                        : 'border-black bg-white text-black hover:bg-primary/15'
                    }`}
                  >
                    蹲蹲群
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-black/45">全部城市/区域</p>
                {filteredGroups.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                    {filteredGroups.map((group) => (
                      <button
                        key={group.slug}
                        onClick={() => selectGroup(group)}
                        className={`flex min-h-12 items-center justify-center gap-2 border-2 px-3 py-2 text-sm font-black transition-transform hover:-translate-y-0.5 ${
                          activeGroup.slug === group.slug
                            ? 'border-black bg-black [color:white] shadow-[3px_3px_0_rgba(255,122,24,0.5)]'
                            : 'border-black bg-white text-black hover:bg-[#f7f8f1]'
                        }`}
                      >
                        <MapPin size={15} />
                        {group.city}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-black/30 bg-[#f7f8f1] p-5 text-sm font-bold leading-7 text-black/60">
                    没有找到已开通的城市/区域群。可以先加入蹲蹲群，后续有对应入口再切换。
                  </div>
                )}
              </div>
            </div>

            <section className="border-2 border-black bg-white p-5 shadow-[5px_5px_0_rgba(5,5,5,0.88)] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-accent">Calendar</p>
                  <h2 className="mt-2 text-2xl font-black leading-tight">
                    {activeCityForEvents ? `${activeCityForEvents}近期活动` : '近期 AI+X 活动'}
                  </h2>
                </div>
                <button
                  onClick={() => onCalendarClick(activeCityForEvents)}
                  className="inline-flex items-center justify-center gap-2 border-2 border-black bg-primary px-4 py-3 text-sm font-black text-white transition-transform hover:-translate-y-0.5"
                >
                  查看活动日历 <CalendarDays size={16} />
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {eventsLoading && (
                  <div className="col-span-full flex items-center gap-2 border-2 border-black/15 bg-[#f7f8f1] p-4 text-sm font-bold text-black/60">
                    <Loader2 size={16} className="animate-spin" />
                    活动加载中...
                  </div>
                )}

                {!eventsLoading && previewEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="min-w-0 border-2 border-black bg-[#f7f8f1] p-4 text-left transition-transform hover:-translate-y-0.5 hover:bg-white"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-accent">{formatEventTime(event.startTime)}</p>
                    <h3 className="mt-2 line-clamp-2 text-base font-black leading-snug text-black">{event.title}</h3>
                    <p className="mt-2 flex items-center gap-1 text-xs font-bold text-black/55">
                      <MapPin size={13} />
                      {event.format === 'online' ? '线上活动' : event.location?.city || '城市待定'}
                    </p>
                  </button>
                ))}

                {!eventsLoading && previewEvents.length === 0 && (
                  <div className="col-span-full border-2 border-dashed border-black/30 bg-[#f7f8f1] p-5 text-sm font-bold leading-7 text-black/60">
                    当前没有可展示的近期活动。你也可以提交本地活动，或先查看完整活动日历。
                  </div>
                )}
              </div>
            </section>
          </section>

          <aside className={`${hasRequestedCity ? 'order-first ' : ''}lg:sticky lg:top-24 lg:order-none`}>
            <div className="border-2 border-black bg-white p-5 shadow-[7px_7px_0_rgba(5,5,5,0.92)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-accent">Wechat</p>
                  <h2 className="mt-2 text-2xl font-black leading-tight">
                    {isMissingCity ? '先加入蹲蹲群' : `${activeGroup.city}二维码`}
                  </h2>
                </div>
                <MessageCircle size={24} className="mt-1 text-accent" />
              </div>

              {isMissingCity && (
                <div className="mt-4 border-2 border-black bg-[#fff3d8] p-3 text-xs font-bold leading-6 text-black/70">
                  暂无“{requestedCity}”城市/区域群入口，先展示蹲蹲群兜底二维码。
                </div>
              )}

              {!hasRequestedCity && (
                <div className="mt-4 border-2 border-black bg-[#f7f8f1] p-3 text-xs font-bold leading-6 text-black/65">
                  还没选择城市时，默认展示蹲蹲群二维码。
                </div>
              )}

              <div className="mt-5 border-2 border-black bg-white p-3">
                <img
                  src={activeGroup.qrImage}
                  alt={`${activeGroup.city}二维码`}
                  className="aspect-square w-full object-contain"
                  loading="eager"
                  decoding="async"
                />
              </div>

              <p className="mt-4 text-sm font-bold leading-7 text-black/62">
                {activeGroup.description || `微信扫码加入 ${activeGroup.city} AI+X 交流群，获取本地活动同步与共创信息。`}
              </p>

              <div className="mt-5 grid gap-3">
                <button
                  onClick={copyCurrentLink}
                  className="inline-flex items-center justify-center gap-2 border-2 border-black bg-black px-4 py-3 text-sm font-black [color:white] transition-transform hover:-translate-y-0.5"
                >
                  {copied ? <Check size={16} /> : <Clipboard size={16} />}
                  {copied ? '已复制链接' : '复制分享链接'}
                </button>
                {hasRequestedCity && (
                  <button
                    onClick={() => selectGroup(null)}
                    className="inline-flex items-center justify-center gap-2 border-2 border-black bg-[#f7f8f1] px-4 py-3 text-sm font-black text-black transition-transform hover:-translate-y-0.5"
                  >
                    回到蹲蹲群
                  </button>
                )}
                <button
                  onClick={() => onSubmitClick(activeCityForEvents)}
                  className="inline-flex items-center justify-center gap-2 border-2 border-black bg-white px-4 py-3 text-sm font-black text-accent transition-transform hover:-translate-y-0.5"
                >
                  提交本地活动 <Zap size={16} />
                </button>
              </div>

              <a
                href={getGroupUrl(activeGroup)}
                className="mt-4 inline-flex w-full min-w-0 items-center justify-center gap-2 break-all text-center text-xs font-black leading-5 text-black/40 transition-colors hover:text-accent"
              >
                城市/区域专属入口 <ArrowUpRight size={13} />
              </a>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default JoinGroups;
