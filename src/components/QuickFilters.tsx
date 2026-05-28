import React from 'react';
import { BookOpenCheck, Code2, GraduationCap, Hammer, Mic2, Rocket, Trophy, UsersRound, X } from 'lucide-react';
import { PUBLIC_ACTIVITY_TYPES, getActivityTypeLabel, type ActivityType } from '../constants/activityTaxonomy';

interface QuickFilter {
  id: ActivityType;
  label: string;
  icon: React.ReactNode;
}

interface QuickFiltersProps {
  onFilterClick: (searchTerm: string) => void;
  onTagFilterClick?: (tag: string) => void;
  activeFilter?: string;
  onClear?: () => void;
}

const iconMap: Partial<Record<ActivityType, React.ReactNode>> = {
  meetup: <UsersRound size={14} />,
  workshop: <Hammer size={14} />,
  hackathon: <Trophy size={14} />,
  talk: <Mic2 size={14} />,
  training: <BookOpenCheck size={14} />,
  demo_day: <Rocket size={14} />,
  conference: <GraduationCap size={14} />,
  competition: <Code2 size={14} />,
};

const QuickFilters: React.FC<QuickFiltersProps> = ({ onFilterClick, onTagFilterClick, activeFilter, onClear }) => {
  const filters: QuickFilter[] = PUBLIC_ACTIVITY_TYPES.map((type) => ({
    id: type.value,
    label: type.label,
    icon: iconMap[type.value] || <UsersRound size={14} />,
  }));

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            onClick={() => {
              if (isActive) {
                onClear?.();
                return;
              }

              if (onTagFilterClick) {
                onTagFilterClick(filter.id);
              } else {
                onFilterClick(filter.label);
              }
            }}
            className={`group flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-black transition-all active:scale-95 ${
              isActive
                ? 'border-black bg-primary text-black shadow-[3px_3px_0_rgba(5,5,5,0.65)]'
                : 'border-black/15 bg-white text-black shadow-[3px_3px_0_rgba(5,5,5,0.08)] hover:border-black hover:bg-primary'
            }`}
            aria-pressed={isActive}
          >
            <span className={`${isActive ? 'text-black' : 'text-accent group-hover:text-black'} transition-colors`}>
              {filter.icon}
            </span>
            <span className="font-semibold">{filter.label}</span>
          </button>
        );
      })}

      {activeFilter && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-md border border-black/15 bg-white px-3 py-2 text-xs font-black text-black/62 shadow-[3px_3px_0_rgba(5,5,5,0.08)] transition-all hover:border-black hover:text-black active:scale-95"
        >
          已筛选：{getActivityTypeLabel(activeFilter)}
          <X size={13} />
        </button>
      )}
    </div>
  );
};

export default QuickFilters;
