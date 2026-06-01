import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarPlus, Copy, Check, ExternalLink, Rss, Download, Link2, AlertCircle } from 'lucide-react';
import { getActivityFilterLabel } from '../constants/activityTaxonomy';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (message: string) => void;
  formatFilter?: string;
  locationFilter?: string;
  tagFilter?: string;
  searchQuery?: string;
}

type CopyTarget = 'subscribe' | 'google' | null;

const DEFAULT_PUBLIC_SITE_URL = 'https://aixevents.datawhale.cn';

const getStableSiteUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();
  const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const isLocalRuntime = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(runtimeOrigin);
  const siteUrl = configuredUrl || (!isLocalRuntime && runtimeOrigin) || DEFAULT_PUBLIC_SITE_URL;

  return siteUrl.replace(/\/+$/, '');
};

const toWebcalUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.protocol = 'webcal:';
    return parsedUrl.toString();
  } catch {
    return url.replace(/^https?:\/\//, 'webcal://');
  }
};

const SubscribeModal: React.FC<SubscribeModalProps> = ({
  isOpen,
  onClose,
  onToast,
  formatFilter = 'all',
  locationFilter = 'all',
  tagFilter = '',
  searchQuery = '',
}) => {
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget>(null);

  const subscription = useMemo(() => {
    const siteUrl = getStableSiteUrl();
    const baseUrl = `${siteUrl}/api/calendar`;
    const params = new URLSearchParams();

    if (formatFilter !== 'all') {
      params.append('format', formatFilter);
    }
    if (locationFilter !== 'all') {
      params.append('location', locationFilter);
    }
    if (tagFilter) {
      params.append('tags', tagFilter);
    }
    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }

    const queryString = params.toString();
    const feedUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    const downloadUrl = `${feedUrl}${queryString ? '&' : '?'}download=1`;
    const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const isLocalPreview = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(runtimeOrigin);

    return {
      feedUrl,
      webcalUrl: toWebcalUrl(feedUrl),
      downloadUrl,
      isLocalPreview,
    };
  }, [formatFilter, locationFilter, tagFilter, searchQuery]);

  const activeFilters = useMemo(() => {
    const filters: string[] = [];

    if (formatFilter !== 'all') filters.push(formatFilter === 'online' ? '线上活动' : '线下活动');
    if (locationFilter !== 'all') filters.push(locationFilter);
    if (tagFilter) filters.push(getActivityFilterLabel(tagFilter));
    if (searchQuery.trim()) filters.push(`搜索：${searchQuery.trim()}`);

    return filters;
  }, [formatFilter, locationFilter, tagFilter, searchQuery]);

  const copyUrl = async (url: string, target: CopyTarget, message: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedTarget(target);
      onToast?.(message);
      setTimeout(() => setCopiedTarget(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      onToast?.('复制失败，请手动复制订阅链接');
    }
  };

  const handleCopyUrl = () => {
    copyUrl(subscription.feedUrl, 'subscribe', '自动更新订阅链接已复制');
  };

  const handleDownloadIcs = () => {
    window.open(subscription.downloadUrl, '_blank', 'noopener,noreferrer');
    onToast?.('正在下载当前日历快照');
  };

  const handleOpenSystemCalendar = () => {
    window.location.href = subscription.webcalUrl;
    onToast?.('正在打开系统日历订阅');
  };

  const handleSubscribeGoogle = async () => {
    await copyUrl(subscription.feedUrl, 'google', '链接已复制，请粘贴到 Google Calendar');
    window.open('https://calendar.google.com/calendar/u/0/r/settings/addbyurl', '_blank', 'noopener,noreferrer');
  };

  const handleSubscribeOutlook = () => {
    const outlookUrl = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(subscription.feedUrl)}&name=${encodeURIComponent('Datawhale AI+X 活动日历')}`;
    window.open(outlookUrl, '_blank', 'noopener,noreferrer');
    onToast?.('正在打开 Outlook 订阅');
  };

  if (!isOpen) return null;

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
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] shadow-2xl overflow-hidden"
        >
          {/* Header Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-black transition-all z-20"
          >
            <X size={18} />
          </button>

          <div className="p-8 pt-12">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
              <Rss size={28} className="text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              订阅活动日历
            </h2>
            <p className="text-white/60 text-sm mb-8">
              使用订阅链接添加后，新活动会自动同步；下载 .ics 仅作为一次性导入。
              {activeFilters.length > 0 && (
                <span className="block mt-2 text-primary-light text-xs">
                  当前订阅范围：{activeFilters.join(' / ')}
                </span>
              )}
            </p>

            {subscription.isLocalPreview && (
              <div className="mb-6 flex gap-3 rounded-xl border border-primary/25 bg-primary/10 p-4 text-xs leading-5 text-primary-light">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>当前页面是本地预览，订阅链接已切到线上公开地址，便于 Google、Outlook 和系统日历长期访问。</p>
              </div>
            )}

            {/* Subscription URL */}
            <div className="mb-6">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 block">
                自动更新订阅链接
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 font-mono truncate">
                  {subscription.feedUrl}
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="p-3 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-accent/40 rounded-xl text-white/60 hover:text-black transition-all"
                  title="复制链接"
                >
                  {copiedTarget === 'subscribe' ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Quick Subscribe Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleOpenSystemCalendar}
                className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-accent/40 rounded-xl text-white/80 hover:text-black transition-all group"
              >
                <div className="flex items-center gap-3">
                  <CalendarPlus size={20} className="text-white/60 group-hover:text-accent" />
                  <div className="text-left">
                    <div className="font-medium">系统日历 / Apple 日历</div>
                    <div className="text-xs text-white/40 mt-0.5">通过 webcal 添加为可更新订阅</div>
                  </div>
                </div>
                <ExternalLink size={16} className="text-white/40 group-hover:text-accent" />
              </button>

              <button
                onClick={handleSubscribeGoogle}
                className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-accent/40 rounded-xl text-white/80 hover:text-black transition-all group"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-white/60 group-hover:text-accent" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM12 18.75a6.75 6.75 0 110-13.5 6.75 6.75 0 010 13.5z"/>
                    <path d="M12 6.75v5.25l3.75 2.25"/>
                  </svg>
                  <div className="text-left">
                    <div className="font-medium">Google Calendar</div>
                    <div className="text-xs text-white/40 mt-0.5">复制订阅源，再到“通过网址添加”粘贴</div>
                  </div>
                </div>
                {copiedTarget === 'google' ? (
                  <Check size={16} className="text-green-400" />
                ) : (
                  <ExternalLink size={16} className="text-white/40 group-hover:text-accent" />
                )}
              </button>

              <button
                onClick={handleSubscribeOutlook}
                className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-accent/40 rounded-xl text-white/80 hover:text-black transition-all group"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-white/60 group-hover:text-accent" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.17 2.06A2.16 2.16 0 0019.5 1.5H8.83a2.17 2.17 0 00-2 1.44l-.18.56v.5l.5 14 .18.56a2.17 2.17 0 002 1.44h10.67a2.16 2.16 0 001.67-.56 2.17 2.17 0 00.83-1.44V3.5a2.17 2.17 0 00-.83-1.44zM14 10.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                  </svg>
                  <span className="font-medium">Outlook</span>
                </div>
                <ExternalLink size={16} className="text-white/40 group-hover:text-accent" />
              </button>

              <button
                onClick={handleDownloadIcs}
                className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-accent/40 rounded-xl text-white/80 hover:text-black transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Download size={20} className="text-white/60 group-hover:text-accent" />
                  <div className="text-left">
                    <div className="font-medium">下载 .ics 快照</div>
                    <div className="text-xs text-white/40 mt-0.5">一次性导入，不会自动同步后续活动</div>
                  </div>
                </div>
                <Link2 size={16} className="text-white/40 group-hover:text-accent" />
              </button>
            </div>

            {/* Footer Note */}
            <p className="mt-6 text-[11px] text-white/30 text-center">
              订阅源公开可访问，无需注册账号；日历客户端会按自身频率同步更新。
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SubscribeModal;
