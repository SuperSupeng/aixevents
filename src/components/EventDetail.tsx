import React from 'react';
import { TechEvent } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Globe, User, ArrowUpRight, Info, Share2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { identifyTags, getTagColorClasses } from '../utils/tags';
import { getActivityTypeLabel } from '../constants/activityTaxonomy';

interface EventDetailProps {
  event: TechEvent | null;
  onClose: () => void;
  onToast?: (message: string) => void;
  shareUrl?: string;
}

function safeExternalUrl(url?: string): string {
  if (!url || url === '#') return '';

  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol) ? parsedUrl.toString() : '';
  } catch {
    return '';
  }
}

function safeImageUrl(url?: string): string {
  if (!url || url === '#') return '';

  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aixevents.datawhale.cn';
    const parsedUrl = new URL(url, baseUrl);
    return ['http:', 'https:'].includes(parsedUrl.protocol) ? url : '';
  } catch {
    return '';
  }
}

interface PosterPreviewModalProps {
  title: string;
  imageUrl: string;
  onClose: () => void;
}

const POSTER_MIN_ZOOM = 1;
const POSTER_MAX_ZOOM = 3;
const POSTER_ZOOM_STEP = 0.25;

export const PosterPreviewModal: React.FC<PosterPreviewModalProps> = ({ title, imageUrl, onClose }) => {
  const [zoom, setZoom] = React.useState(POSTER_MIN_ZOOM);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [isDragging, setDragging] = React.useState(false);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const dragRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  React.useEffect(() => {
    setZoom(POSTER_MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
  }, [imageUrl]);

  if (!imageUrl) return null;

  const zoomPercent = Math.round(zoom * 100);
  const stopPreviewClick = (clickEvent: React.MouseEvent<HTMLElement>) => clickEvent.stopPropagation();
  const clampOffset = (nextOffset: { x: number; y: number }, nextZoom = zoom) => {
    const stage = stageRef.current;
    const image = imageRef.current;

    if (!stage || !image || nextZoom <= POSTER_MIN_ZOOM) {
      return { x: 0, y: 0 };
    }

    const maxX = Math.max(0, (image.offsetWidth * nextZoom - stage.clientWidth) / 2);
    const maxY = Math.max(0, (image.offsetHeight * nextZoom - stage.clientHeight) / 2);

    return {
      x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
      y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
    };
  };
  const applyZoom = (nextZoom: number) => {
    const normalizedZoom = Math.min(POSTER_MAX_ZOOM, Math.max(POSTER_MIN_ZOOM, nextZoom));

    setZoom(normalizedZoom);
    setOffset((currentOffset) => clampOffset(currentOffset, normalizedZoom));
  };
  const zoomOut = () => applyZoom(zoom - POSTER_ZOOM_STEP);
  const zoomIn = () => applyZoom(zoom + POSTER_ZOOM_STEP);
  const resetZoom = () => applyZoom(POSTER_MIN_ZOOM);
  const toggleZoom = () => applyZoom(zoom === POSTER_MIN_ZOOM ? 2 : POSTER_MIN_ZOOM);
  const handlePointerDown = (pointerEvent: React.PointerEvent<HTMLImageElement>) => {
    if (zoom <= POSTER_MIN_ZOOM) return;

    pointerEvent.preventDefault();
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
    dragRef.current = {
      pointerId: pointerEvent.pointerId,
      startX: pointerEvent.clientX,
      startY: pointerEvent.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    setDragging(true);
  };
  const handlePointerMove = (pointerEvent: React.PointerEvent<HTMLImageElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointerEvent.pointerId) return;

    setOffset(clampOffset({
      x: drag.offsetX + pointerEvent.clientX - drag.startX,
      y: drag.offsetY + pointerEvent.clientY - drag.startY,
    }));
  };
  const stopDragging = (pointerEvent: React.PointerEvent<HTMLImageElement>) => {
    if (dragRef.current?.pointerId === pointerEvent.pointerId) {
      dragRef.current = null;
      setDragging(false);
    }
  };
  const handleWheel = (wheelEvent: React.WheelEvent<HTMLDivElement>) => {
    if (zoom <= POSTER_MIN_ZOOM) return;

    wheelEvent.preventDefault();
    setOffset((currentOffset) => clampOffset({
      x: currentOffset.x - wheelEvent.deltaX,
      y: currentOffset.y - wheelEvent.deltaY,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="活动海报预览"
      className="fixed inset-0 z-[130] flex flex-col bg-black/85 text-white backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/15 bg-black/55 px-4 py-3 sm:px-6">
        <p className="min-w-0 truncate text-sm font-black">{title}</p>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-white/15 bg-white/10 p-1" onClick={stopPreviewClick}>
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoom <= POSTER_MIN_ZOOM}
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/15 bg-white text-black transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="缩小海报"
              title="缩小海报"
            >
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              disabled={zoom === POSTER_MIN_ZOOM}
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/15 bg-white text-black transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="适合屏幕"
              title="适合屏幕"
            >
              <Maximize2 size={15} />
            </button>
            <button
              type="button"
              onClick={zoomIn}
              disabled={zoom >= POSTER_MAX_ZOOM}
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/15 bg-white text-black transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="放大海报"
              title="放大海报"
            >
              <ZoomIn size={16} />
            </button>
            <span className="min-w-12 px-1 text-center text-xs font-black tabular-nums text-white/75">{zoomPercent}%</span>
          </div>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white px-3 py-2 text-xs font-black text-black transition-colors hover:bg-primary"
            onClick={stopPreviewClick}
          >
            打开原图 <ArrowUpRight size={15} />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white text-black transition-colors hover:bg-primary"
            aria-label="关闭海报预览"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div ref={stageRef} className="min-h-0 flex-1 overflow-hidden overscroll-contain p-3 sm:p-5" onWheel={handleWheel}>
        <div
          className="flex h-full w-full items-center justify-center overflow-hidden rounded-md bg-black/25"
          onClick={stopPreviewClick}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt={`${title} 活动海报大图`}
            aria-label="拖拽查看海报细节"
            className={`h-auto max-h-full max-w-full select-none rounded-md border-2 border-white bg-white object-contain shadow-[0_20px_70px_rgba(0,0,0,0.45)] transition-transform duration-200 ${zoom > POSTER_MIN_ZOOM ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}
            draggable={false}
            onDoubleClick={toggleZoom}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            style={{
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
              transformOrigin: 'center',
              touchAction: 'none',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

const EventDetail: React.FC<EventDetailProps> = ({ event, onClose, onToast, shareUrl }) => {
  const [isPosterPreviewOpen, setPosterPreviewOpen] = React.useState(false);
  const [isPosterScrollable, setPosterScrollable] = React.useState(false);

  React.useEffect(() => {
    setPosterPreviewOpen(false);
  }, [event?.id]);

  React.useEffect(() => {
    if (!isPosterPreviewOpen) return;

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        setPosterPreviewOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPosterPreviewOpen]);

  if (!event) return null;

  const smartTags = identifyTags(event);
  const detailUrl = safeExternalUrl(event.links.registration || event.links.officialSite);
  const hasDetailUrl = Boolean(detailUrl);
  const coverImageUrl = safeImageUrl(event.coverImage);
  const detailPosterSource = safeImageUrl(event.links.poster) || coverImageUrl;
  const posterPreviewSource = detailPosterSource;
  const internalShareUrl = shareUrl || (
    typeof window !== 'undefined'
      ? `${window.location.origin}/events/${encodeURIComponent(event.id)}`
      : `/events/${encodeURIComponent(event.id)}`
  );
  const formatLabel = event.format === 'online' ? '线上活动' : event.format === 'hybrid' ? '线上 + 线下' : '线下活动';
  const locationLabel = event.format === 'online'
    ? '线上'
    : [event.location?.city, event.location?.address].filter(Boolean).join(' · ') || '地点待定';
  const primaryTag = getActivityTypeLabel(event.activityType);
  const organizerLabel = event.organizers?.length ? event.organizers.join(' / ') : event.organizer.name;

  React.useEffect(() => {
    setPosterScrollable(false);
  }, [detailPosterSource]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(internalShareUrl);
      onToast?.('活动分享链接已复制');
    } catch (err) {
      onToast?.('复制失败，请稍后再试');
    }
  };

  const handlePosterLoad = (imageEvent: React.SyntheticEvent<HTMLImageElement>) => {
    const image = imageEvent.currentTarget;
    const frameRect = image.closest('button')?.getBoundingClientRect();

    if (!frameRect || !image.naturalWidth || !image.naturalHeight) {
      setPosterScrollable(false);
      return;
    }

    const scaledPosterHeight = frameRect.width * (image.naturalHeight / image.naturalWidth);
    setPosterScrollable(scaledPosterHeight > frameRect.height + 2);
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
          className="relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border-2 border-black bg-white text-black shadow-[8px_8px_0_rgba(5,5,5,0.92)] md:max-h-[88vh]"
        >
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-20 border-2 border-black bg-white p-2 text-black transition-colors hover:bg-primary"
            aria-label="关闭活动详情"
          >
            <X size={20} />
          </button>

          <div className="overflow-y-auto pt-14 md:max-h-[88vh] md:overflow-hidden md:pt-0">
            <div className="grid gap-0 md:min-h-0 md:grid-cols-[minmax(20rem,1fr)_minmax(0,1fr)]">
              <aside className="p-4 sm:p-5 md:relative md:min-h-0 md:overflow-hidden md:p-6 md:pr-4">
                {detailPosterSource ? (
                  <button
                    type="button"
                    onClick={() => setPosterPreviewOpen(true)}
                    className="poster-scroll-area group relative flex h-[min(70vh,38rem)] w-full cursor-zoom-in items-start justify-center overflow-hidden rounded-md border-2 border-black bg-black text-left shadow-[4px_4px_0_rgba(5,5,5,0.88)] transition-transform active:scale-[0.99] md:absolute md:inset-y-6 md:left-6 md:right-4 md:h-auto md:w-auto md:overflow-y-auto md:overscroll-contain"
                    aria-label={`预览${event.title}活动海报大图`}
                    title="点击预览活动海报"
                  >
                    <img
                      src={detailPosterSource}
                      alt={`${event.title} 活动海报`}
                      className={`block ${isPosterScrollable ? 'h-full md:h-auto' : 'h-full'} w-full object-contain object-top`}
                      loading="lazy"
                      onLoad={handlePosterLoad}
                    />
                    <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-md border-2 border-black bg-white text-black shadow-[3px_3px_0_rgba(5,5,5,0.75)] transition-colors group-hover:bg-primary">
                      <ZoomIn size={18} />
                    </span>
                  </button>
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

              <section className="min-w-0 p-6 sm:p-8 md:flex md:max-h-[88vh] md:min-h-0 md:flex-col md:overflow-hidden md:pl-5">
                <div className="md:min-h-0 md:flex-auto md:overflow-y-auto md:pr-2">
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
                          if (hasDetailUrl) window.open(detailUrl, '_blank', 'noopener,noreferrer');
                        }}
                        disabled={!hasDetailUrl}
                        className="btn-primary flex items-center justify-center gap-3 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {hasDetailUrl ? '报名/详情' : '以海报二维码为准'} <ArrowUpRight size={18} />
                      </button>

                      <button
                        onClick={handleCopyLink}
                        className="btn-secondary flex items-center justify-center gap-3 px-5 py-3 text-sm"
                      >
                        <Share2 size={18} /> 复制分享链接
                      </button>
                    </div>

                  </div>
                </div>

                <div className="mt-7 flex items-start gap-2 border-t border-black/10 pt-4 text-xs font-bold leading-5 text-black/45 md:mt-4 md:shrink-0">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  <p>完整信息请以主办方官方页面、报名页或海报二维码为准。</p>
                </div>
              </section>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {isPosterPreviewOpen && posterPreviewSource && (
            <PosterPreviewModal
              title={event.title}
              imageUrl={posterPreviewSource}
              onClose={() => setPosterPreviewOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};

export default EventDetail;
