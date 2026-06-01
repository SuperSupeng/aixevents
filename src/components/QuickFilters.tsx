import React from 'react';
import { BookOpenCheck, Hammer, Trophy, UsersRound, X } from 'lucide-react';
import { ACTIVITY_FILTER_GROUPS, getActivityFilterLabel } from '../constants/activityTaxonomy';

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface QuickFiltersProps {
  onFilterClick: (searchTerm: string) => void;
  onTagFilterClick?: (tag: string) => void;
  activeFilter?: string;
  onClear?: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  sharing: <UsersRound size={14} />,
  workshop: <Hammer size={14} />,
  challenge: <Trophy size={14} />,
  training: <BookOpenCheck size={14} />,
};

const QuickFilters: React.FC<QuickFiltersProps> = ({ onFilterClick, onTagFilterClick, activeFilter, onClear }) => {
  const filters: QuickFilter[] = ACTIVITY_FILTER_GROUPS.map((filterGroup) => ({
    id: filterGroup.id,
    label: filterGroup.label,
    icon: iconMap[filterGroup.id] || <UsersRound size={14} />,
  }));

  return (
    <div className="-mx-4 mb-5 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
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
            className={`group flex min-w-[7rem] shrink-0 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-black transition-all active:scale-95 sm:min-w-0 ${
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
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-black/15 bg-white px-3 py-2 text-xs font-black text-black/62 shadow-[3px_3px_0_rgba(5,5,5,0.08)] transition-all hover:border-black hover:text-black active:scale-95"
        >
          已筛选：{getActivityFilterLabel(activeFilter)}
          <X size={13} />
        </button>
      )}
    </div>
  );
};

export default QuickFilters;
