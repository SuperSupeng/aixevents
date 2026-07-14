import React from 'react';
import { TechEvent } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MapPin, Globe, Calendar, Sparkles } from 'lucide-react';
import { getTimeUrgency, isEventActiveByEndTime } from '../utils/timeUtils';
import { getActivityTypeLabel } from '../constants/activityTaxonomy';

interface FeaturedEventsProps {
  events: TechEvent[];
  onEventClick: (event: TechEvent) => void;
}

const MAX_FEATURED_EVENTS = 3;

const FeaturedEvents: React.FC<FeaturedEventsProps> = ({ events, onEventClick }) => {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const featuredEvents = events
    .filter((event) => event.isFeatured && isEventActiveByEndTime(event.endTime, now))
    .sort((a, b) => {
      const rankA = a.featuredRank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.featuredRank ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;

      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    })
    .slice(0, MAX_FEATURED_EVENTS);

  if (featuredEvents.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      {/* Header - 图标强化，置於月历之前 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary border-2 border-black text-black shadow-[4px_4px_0_rgba(5,5,5,0.9)]">
          <Sparkles size={28} strokeWidth={2} aria-hidden />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-accent mb-1 block">精选</span>
          <h2 className="text-2xl sm:text-3xl font-black text-black">
            本周推荐
          </h2>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {featuredEvents.map((event) => {
          const timeUrgency = getTimeUrgency(event.startTime);
          const category = getActivityTypeLabel(event.activityType);
          
          return (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className="group glass-panel cursor-pointer overflow-hidden hover:border-black/30 transition-all active:scale-[0.99]"
            >
              <div className="relative aspect-[16/9] overflow-hidden border-b border-black/10 bg-black/[0.035]">
                {event.coverImage ? (
                  <>
                    <img
                      src={event.coverImage}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-xl"
                      loading="lazy"
                    />
                    <img
                      src={event.coverImage}
                      alt={`${event.title} 活动海报`}
                      className="absolute inset-0 h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                      onError={(imageEvent) => {
                        imageEvent.currentTarget.style.display = 'none';
                      }}
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col justify-between p-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">DATAWHALE</span>
                    <div>
                      <p className="text-4xl font-black leading-none text-black">AI+X</p>
                      <p className="mt-1 text-xs font-black text-black/55">活动日历</p>
                    </div>
                  </div>
                )}
                <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate border border-black/15 bg-white/90 px-2.5 py-1 text-[10px] font-black text-black">
                  {category}
                </span>
              </div>
              <div className="p-5 sm:p-6">
              {/* Time Urgency Badge */}
              {timeUrgency && (
                <div className="flex items-center justify-between mb-4">
                  <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${timeUrgency.color} ${timeUrgency.bgColor} ${timeUrgency.borderColor}`}>
                    <Calendar size={10} />
                    {timeUrgency.label}
                  </span>
                </div>
              )}

              {/* Event Title */}
              <h3 className="text-lg sm:text-xl font-black text-black mb-3 leading-tight group-hover:text-accent transition-colors line-clamp-2">
                {event.title}
              </h3>

              {/* Event Meta */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-black/70 text-sm">
                  <Calendar size={14} className="flex-shrink-0 text-accent" />
                  <span className="text-xs">{format(new Date(event.startTime), 'yyyy年M月d日 · HH:mm', { locale: zhCN })}</span>
                </div>
                <div className="flex items-center gap-2 text-black/70 text-sm">
                  {event.format === 'online' ? (
                    <>
                      <Globe size={14} className="text-emerald-400 flex-shrink-0" />
                      <span className="text-xs text-emerald-500 whitespace-nowrap">线上活动</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={14} className="text-primary flex-shrink-0" />
                      <span className="text-xs truncate">{event.location?.city || '地点待定'}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Event Summary */}
              {event.summary && (
                <p className="text-black/60 text-xs leading-relaxed line-clamp-2 mb-4">
                  {event.summary}
                </p>
              )}

              {/* Tags */}
              {event.customTags && event.customTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {event.customTags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="text-[10px] px-2 py-0.5 bg-black/[0.035] border border-black/10 rounded-md text-black/70 font-bold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturedEvents;
