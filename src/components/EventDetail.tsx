import React, { useState } from 'react';
import { TechEvent } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Globe, User, ArrowUpRight, ChevronDown, Download, Info, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  downloadICS,
  getGoogleCalendarUrl,
  getOutlookUrl,
  addToAppleCalendar
} from '../utils/calendar';
import { identifyTags, getTagColorClasses } from '../utils/tags';
import { getActivityTypeLabel } from '../constants/activityTaxonomy';

interface EventDetailProps {
  event: TechEvent | null;
  onClose: () => void;
  onToast?: (message: string) => void;
}

const EventDetail: React.FC<EventDetailProps> = ({ event, onClose, onToast }) => {
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);

  if (!event) return null;

  const smartTags = identifyTags(event);
  const detailUrl = event.links.registration || event.links.officialSite;
  const hasDetailUrl = Boolean(detailUrl && detailUrl !== '#');
  const formatLabel = event.format === 'online' ? '线上活动' : event.format === 'hybrid' ? '线上 + 线下' : '线下活动';
  const locationLabel = event.format === 'online'
    ? '线上'
    : [event.location?.city, event.location?.address].filter(Boolean).join(' · ') || '地点待定';
  const primaryTag = getActivityTypeLabel(event.activityType);
  const organizerLabel = event.organizers?.length ? event.organizers.join(' / ') : event.organizer.name;

  const handleAddToCalendar = (type: 'google' | 'apple' | 'outlook' | 'ics') => {
    let message = '';
    switch (type) {
      case 'google':
        window.open(getGoogleCalendarUrl(event), '_blank');
        message = '正在打开 Google Calendar...';
        break;
      case 'apple':
        addToAppleCalendar(event);
        message = '日历文件已下载';
        break;
      case 'outlook':
        window.open(getOutlookUrl(event), '_blank');
        message = '正在打开 Outlook Calendar...';
        break;
      case 'ics':
        downloadICS(event);
        message = '日历文件已下载';
        break;
    }
    setShowCalendarDropdown(false);
    onToast?.(message);
  };

  const handleCopyLink = async () => {
    if (!hasDetailUrl || !detailUrl) {
      onToast?.('这场活动暂时没有公开链接，请查看海报二维码');
      return;
    }

    try {
      await navigator.clipboard.writeText(detailUrl);
      onToast?.('链接已复制');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 34 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 34 }}
          className="relative flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border-2 border-black bg-white text-black shadow-[8px_8px_0_rgba(5,5,5,0.92)]"
        >
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-20 border-2 border-black bg-white p-2 text-black transition-colors hover:bg-primary"
            aria-label="关闭活动详情"
          >
            <X size={20} />
          </button>

          <div className="overflow-y-auto">
            <div className="grid gap-0 md:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
              <aside className="border-b-2 border-black bg-black/[0.035] p-5 md:border-b-0 md:border-r-2">
                {event.coverImage ? (
                  <div className="overflow-hidden rounded-md border-2 border-black bg-white">
                    <img
                      src={event.coverImage}
                      alt={`${event.title} 活动海报`}
                      className="max-h-[62vh] w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[20rem] flex-col justify-between rounded-md border-2 border-black bg-white p-5">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">DATAWHALE</span>
                    <div>
                      <p className="text-6xl font-black leading-none">AI+X</p>
                      <p className="mt-2 text-sm font-black text-black/55">活动日历</p>
                    </div>
                  </div>
                )}
              </aside>

              <section className="min-w-0 p-6 sm:p-8">
                <div className="mb-5 flex flex-wrap gap-2 pr-12">
                  <span className="border border-black bg-primary px-2.5 py-1 text-[10px] font-black text-black">
                    {primaryTag}
                  </span>
                  <span className="border border-black/15 bg-black/[0.035] px-2.5 py-1 text-[10px] font-black text-black/65">
                    {formatLabel}
                  </span>
                </div>

                <h2 className="mb-6 text-3xl font-black leading-tight text-black sm:text-4xl">
                  {event.title}
                </h2>

                <div className="mb-7 grid gap-3 border-y-2 border-black/12 py-5">
                  <div className="grid gap-1 sm:grid-cols-[5rem_1fr] sm:gap-4">
                    <div className="flex items-center gap-2 text-xs font-black text-accent">
                      <Calendar size={15} />
                      时间
                    </div>
                    <div className="text-sm font-black leading-6 text-black">
                      {format(new Date(event.startTime), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
                      <span className="ml-2 text-xs font-bold text-black/45">你的本地时间</span>
                    </div>
                  </div>
                  <div className="grid gap-1 sm:grid-cols-[5rem_1fr] sm:gap-4">
                    <div className="flex items-center gap-2 text-xs font-black text-accent">
                      {event.format === 'online' ? <Globe size={15} /> : <MapPin size={15} />}
                      地点
                    </div>
                    <div className="text-sm font-black leading-6 text-black">{locationLabel}</div>
                  </div>
                  <div className="grid gap-1 sm:grid-cols-[5rem_1fr] sm:gap-4">
                    <div className="flex items-center gap-2 text-xs font-black text-accent">
                      <User size={15} />
                      主办
                    </div>
                    <div className="text-sm font-black leading-6 text-black">{organizerLabel}</div>
                  </div>
                </div>

                <div className="mb-7">
                  <h4 className="mb-3 text-xs font-black text-black/45">活动简介</h4>
                  <p className="whitespace-pre-line text-base font-bold leading-8 text-black/72">
                    {event.summary}
                  </p>
                </div>

                {(smartTags.length > 0 || (event.customTags || []).length > 0) && (
                  <div className="mb-7">
                    <h4 className="mb-3 text-xs font-black text-black/45">标签</h4>
                    <div className="flex flex-wrap gap-2">
                      {smartTags.map((tag, idx) => {
                        const colors = getTagColorClasses(tag.color);
                        return (
                          <span
                            key={`smart-${idx}`}
                            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-black ${colors.text} ${colors.bg} ${colors.border}`}
                          >
                            <span>{tag.icon}</span>
                            {tag.label}
                          </span>
                        );
                      })}
                      {(event.customTags || []).map((tag) => (
                        <span key={tag} className="rounded-md border border-black/10 bg-black/[0.035] px-2.5 py-1 text-xs font-black text-black/62">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <button
                      onClick={() => {
                        if (hasDetailUrl && detailUrl) window.open(detailUrl, '_blank');
                      }}
                      disabled={!hasDetailUrl}
                      className="btn-primary flex items-center justify-center gap-3 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {hasDetailUrl ? '报名/详情' : '以海报二维码为准'} <ArrowUpRight size={18} />
                    </button>

                    {hasDetailUrl && (
                      <button
                        onClick={handleCopyLink}
                        className="btn-secondary flex items-center justify-center gap-3 px-5 py-3 text-sm"
                      >
                        <Link2 size={18} /> 复制链接
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                      className="btn-secondary flex w-full items-center justify-center gap-3 px-5 py-3 text-sm"
                    >
                      <Calendar size={18} /> 添加到日历 <ChevronDown size={16} />
                    </button>

                    {showCalendarDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-md border-2 border-black bg-white shadow-[5px_5px_0_rgba(5,5,5,0.92)]"
                      >
                        <button
                          onClick={() => handleAddToCalendar('google')}
                          className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm font-black text-black/72 transition-all hover:bg-primary/25 hover:text-black"
                        >
                          <Globe size={16} className="text-accent" />
                          Google Calendar
                        </button>
                        <button
                          onClick={() => handleAddToCalendar('apple')}
                          className="flex w-full items-center gap-3 border-t border-black/10 px-5 py-3 text-left text-sm font-black text-black/72 transition-all hover:bg-primary/25 hover:text-black"
                        >
                          <Calendar size={16} className="text-accent" />
                          Apple 日历
                        </button>
                        <button
                          onClick={() => handleAddToCalendar('outlook')}
                          className="flex w-full items-center gap-3 border-t border-black/10 px-5 py-3 text-left text-sm font-black text-black/72 transition-all hover:bg-primary/25 hover:text-black"
                        >
                          <Globe size={16} className="text-accent" />
                          Outlook
                        </button>
                        <button
                          onClick={() => handleAddToCalendar('ics')}
                          className="flex w-full items-center gap-3 border-t border-black/10 px-5 py-3 text-left text-sm font-black text-black/72 transition-all hover:bg-primary/25 hover:text-black"
                        >
                          <Download size={16} className="text-accent" />
                          下载 .ics
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="mt-7 flex items-start gap-2 border-t border-black/10 pt-4 text-xs font-bold leading-5 text-black/45">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  <p>完整信息请以主办方官方页面、报名页或海报二维码为准。</p>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EventDetail;
