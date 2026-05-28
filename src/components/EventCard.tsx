import React from 'react';
import { TechEvent } from '../types';
import { MapPin, Globe, ExternalLink, Tag, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { identifyTags, getTagColorClasses } from '../utils/tags';
import { getTimeUrgency } from '../utils/timeUtils';
import { getActivityTypeLabel } from '../constants/activityTaxonomy';

interface EventCardProps {
  event: TechEvent;
  onClick: (event: TechEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const smartTags = identifyTags(event);
  const timeUrgency = getTimeUrgency(event.startTime);
  const category = getActivityTypeLabel(event.activityType);
  const cityLabel = event.format === 'online' ? '线上活动' : event.location?.city || '城市待定';
  const organizerLabel = event.organizers?.length ? event.organizers.join(' / ') : event.organizer.name;
  
  return (
    <div 
      onClick={() => onClick(event)}
      className="glass-panel overflow-hidden cursor-pointer group active:scale-[0.99] transition-transform"
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative min-h-[150px] overflow-hidden border-b border-black/10 bg-black/[0.035] md:w-52 md:min-h-full md:border-b-0 md:border-r">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={`${event.title} 活动海报`}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(imageEvent) => {
                imageEvent.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">DATAWHALE</span>
              <div>
                <p className="text-3xl font-black leading-none text-black">AI+X</p>
                <p className="mt-1 text-xs font-black text-black/55">活动日历</p>
              </div>
            </div>
          )}
          <div className="absolute left-3 top-3 flex h-16 w-16 flex-col items-center justify-center border-2 border-black bg-primary text-black shadow-[3px_3px_0_rgba(5,5,5,0.85)]">
            <span className="text-2xl font-black leading-none">
              {format(new Date(event.startTime), 'dd')}
            </span>
            <span className="mt-1 text-[10px] font-black leading-none text-black/60">
              {format(new Date(event.startTime), 'M月', { locale: zhCN })}
            </span>
          </div>
          <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate border border-black/15 bg-white/90 px-2.5 py-1 text-[10px] font-black text-black">
            {category}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {/* Time Urgency Badge */}
            {timeUrgency && (
              <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${timeUrgency.color} ${timeUrgency.bgColor} ${timeUrgency.borderColor}`}>
                <Calendar size={11} />
                {timeUrgency.label}
              </span>
            )}
            
            {event.format === 'online' ? (
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-400/10 px-2.5 py-1 rounded-md border border-emerald-500/25">
                <Globe size={11} /> <span>线上活动</span>
              </span>
            ) : (
              <span className="flex max-w-[180px] items-center gap-1.5 whitespace-nowrap text-[10px] font-black text-accent uppercase tracking-widest bg-primary/25 px-2.5 py-1 rounded-md border border-black/10">
                <MapPin size={11} className="shrink-0" /> <span className="truncate">{cityLabel}</span>
              </span>
            )}
            <span className="text-[10px] font-black text-black/50 uppercase tracking-widest bg-black/[0.035] px-2.5 py-1 rounded-md border border-black/10 truncate max-w-[150px]">
              {organizerLabel}
            </span>
          </div>
          
          <h3 className="text-lg sm:text-xl md:text-2xl font-black text-black mb-2 leading-tight group-hover:translate-x-1 transition-transform duration-300">
            {event.title}
          </h3>
          
          <p className="text-[14px] text-black/60 line-clamp-2 mb-4 font-sans leading-relaxed">
            {event.summary}
          </p>
          
          {/* Smart Tags */}
          {smartTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {smartTags.slice(0, 4).map((tag, idx) => {
                const colors = getTagColorClasses(tag.color);
                return (
                  <span
                    key={idx}
                    className={`flex items-center gap-1.5 text-[10px] font-medium ${colors.text} ${colors.bg} px-2.5 py-1 rounded-lg border ${colors.border}`}
                  >
                    <span>{tag.icon}</span>
                    {tag.label}
                  </span>
                );
              })}
              {smartTags.length > 4 && (
                <span className="text-[10px] text-black/40 px-2 py-1">
                  +{smartTags.length - 4}
                </span>
              )}
            </div>
          )}
          
          <div className="mt-auto flex flex-wrap gap-2">
            {(event.customTags || []).map(tag => (
              <span key={tag} className="flex items-center gap-1.5 text-[10px] font-bold text-black/60 bg-black/[0.035] px-3 py-1.5 rounded-md border border-black/10">
                <Tag size={12} /> #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Section */}
        <div className="flex flex-shrink-0 items-end justify-end p-4 pt-0 md:items-center md:p-6 md:pl-0">
          <div className="w-12 h-12 rounded-md bg-white border border-black/15 flex items-center justify-center text-black/40 group-hover:bg-accent group-hover:!text-white group-hover:border-accent transition-all duration-300 group-hover:rotate-12">
            <ExternalLink size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
