import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, MapPin, Globe, ChevronDown, X } from 'lucide-react';
import { ViewMode } from '../types';

interface FilterPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  formatFilter: string;
  onFormatChange: (format: string) => void;
  locationFilter: string;
  onLocationChange: (location: string) => void;
  allLocations: string[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onClearFilters: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  searchQuery,
  onSearchChange,
  formatFilter,
  onFormatChange,
  locationFilter,
  onLocationChange,
  allLocations,
  viewMode,
  onViewModeChange,
  onClearFilters
}) => {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 360,
    maxHeight: 320,
  });
  const locationContainerRef = useRef<HTMLDivElement>(null);
  const locationButtonRef = useRef<HTMLButtonElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  
  // 筛选地点列表
  const filteredLocations = allLocations.filter(location =>
    location.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  const updateDropdownPosition = useCallback(() => {
    const button = locationButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const viewportPadding = 16;
    const isDesktop = window.innerWidth >= 1024;
    const width = isDesktop
      ? 360
      : Math.max(280, window.innerWidth - viewportPadding * 2);
    const left = isDesktop
      ? Math.min(Math.max(rect.left, viewportPadding), window.innerWidth - width - viewportPadding)
      : viewportPadding;
    const top = rect.bottom + 8;

    setDropdownPosition({
      top,
      left,
      width,
      maxHeight: Math.max(180, Math.min(320, window.innerHeight - top - viewportPadding)),
    });
  }, []);

  useEffect(() => {
    if (!showLocationDropdown) return;

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);

    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [showLocationDropdown, updateDropdownPosition]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inButton = locationContainerRef.current?.contains(target);
      const inDropdown = locationDropdownRef.current?.contains(target);

      if (!inButton && !inDropdown) {
        setShowLocationDropdown(false);
        setLocationSearchQuery('');
      }
    };

    if (showLocationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLocationDropdown]);

  // 检查是否有激活的筛选条件
  const hasActiveFilters = searchQuery || formatFilter !== 'all' || locationFilter !== 'all';
  const segmentButtonClass =
    'flex h-full min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-2.5 text-sm font-black leading-none transition-all active:scale-[0.98] whitespace-nowrap';
  const segmentActiveClass = 'border border-black/20 bg-primary text-black';
  const segmentInactiveClass = 'text-black/60 hover:bg-black/[0.035] hover:text-black';
  const viewActiveClass = 'border border-accent bg-accent !text-white';

  const locationDropdown = showLocationDropdown
    ? createPortal(
        <div
          ref={locationDropdownRef}
          className="fixed z-[9999] overflow-hidden rounded-lg border border-black/15 bg-white shadow-2xl backdrop-blur-xl"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
          data-testid="location-filter-dropdown"
        >
          {/* Search Input */}
          <div className="p-4 border-b border-black/10">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
              <input
                type="text"
                placeholder="搜索城市..."
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black/[0.03] border border-black/10 rounded-md text-black text-sm placeholder:text-black/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>

          {/* Location List */}
          <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: dropdownPosition.maxHeight }}>
            <button
              onClick={() => { onLocationChange('all'); setShowLocationDropdown(false); setLocationSearchQuery(''); }}
              className={`w-full px-5 py-3.5 text-left text-sm hover:bg-primary/20 active:bg-primary/30 transition-colors font-bold ${locationFilter === 'all' ? 'bg-primary text-black' : 'text-black/70'}`}
            >
              全部城市
            </button>
            {filteredLocations.length > 0 ? (
              <>
                <div className="border-t border-black/10 my-1"></div>
                {filteredLocations.map(location => (
                  <button
                    key={location}
                    onClick={() => { onLocationChange(location); setShowLocationDropdown(false); setLocationSearchQuery(''); }}
                    className={`w-full px-5 py-3.5 text-left text-sm hover:bg-primary/20 active:bg-primary/30 transition-colors font-bold ${locationFilter === location ? 'bg-primary text-black' : 'text-black/70'}`}
                  >
                    <MapPin size={14} className="inline mr-2 text-accent" />
                    {location}
                  </button>
                ))}
              </>
            ) : (
              <div className="border-t border-black/10 px-5 py-12 text-center text-black/40 text-sm">
                <Search size={24} className="mx-auto mb-2 opacity-30" />
                <p>{locationSearchQuery ? '没有找到城市' : '暂无已收录线下城市'}</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className="relative z-[80] mb-5 sm:mb-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          {/* Search Bar */}
          <div className="relative group flex-1 xl:min-w-[300px]">
            <div className="pointer-events-none absolute left-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md border border-black/10 bg-accent text-white shadow-[2px_2px_0_rgba(0,0,0,0.18)] transition-colors group-focus-within:bg-primary group-focus-within:text-black">
              <Search size={15} strokeWidth={2.5} />
            </div>
            <input 
              type="text"
              placeholder="搜索活动、主题或主办方..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-[56px] w-full bg-white/90 border border-black/15 rounded-lg pl-14 pr-4 text-black text-sm placeholder:text-black/40 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 backdrop-blur-2xl transition-all font-sans shadow-lg shadow-black/30"
            />
          </div>

          {/* Location Filter - Desktop: 旁边, Mobile: 下方 */}
          <div ref={locationContainerRef} className={`relative w-full xl:w-[190px] xl:flex-none ${showLocationDropdown ? 'z-[120]' : 'z-30'}`}>
            <button
              ref={locationButtonRef}
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              data-testid="location-filter-button"
              className="flex h-[56px] w-full items-center justify-between gap-2 bg-white/90 border border-black/15 rounded-lg px-4 text-black/70 hover:text-black hover:border-black/30 active:scale-[0.98] transition-all backdrop-blur-2xl shadow-lg shadow-black/30"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <MapPin size={18} className="text-accent flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                  {locationFilter === 'all' ? '全部城市' : locationFilter}
                </span>
              </div>
              <ChevronDown size={16} className={`text-black/40 flex-shrink-0 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Format Select */}
          <div className="relative z-20 flex h-[56px] min-w-0 flex-1 items-center gap-1 overflow-hidden rounded-lg border border-black/15 bg-white/90 p-1 shadow-lg shadow-black/30 backdrop-blur-2xl xl:w-[310px] xl:flex-none">
            <button 
              onClick={() => onFormatChange('all')}
              className={`${segmentButtonClass} ${formatFilter === 'all' ? segmentActiveClass : segmentInactiveClass}`}
            >
              全部
            </button>
            <button 
              onClick={() => onFormatChange('online')}
              data-testid="format-filter-online"
              className={`${segmentButtonClass} ${formatFilter === 'online' ? segmentActiveClass : segmentInactiveClass}`}
            >
              <Globe size={14} className="shrink-0" />
              <span>线上</span>
            </button>
            <button 
              onClick={() => onFormatChange('offline')}
              data-testid="format-filter-offline"
              className={`${segmentButtonClass} ${formatFilter === 'offline' ? segmentActiveClass : segmentInactiveClass}`}
            >
              <MapPin size={14} className="shrink-0" />
              <span>线下</span>
            </button>
          </div>

          {/* View Switcher */}
          <div className="relative z-20 flex h-[56px] min-w-0 flex-1 items-center gap-1 overflow-hidden rounded-lg border border-black/15 bg-white/90 p-1 shadow-lg shadow-black/30 backdrop-blur-2xl xl:w-[230px] xl:flex-none">
            <button 
              onClick={() => onViewModeChange('month')}
              className={`${segmentButtonClass} ${viewMode === 'month' ? viewActiveClass : segmentInactiveClass}`}
            >
              月历
            </button>
            <button 
              onClick={() => onViewModeChange('week')}
              data-testid="view-mode-week"
              className={`${segmentButtonClass} ${viewMode === 'week' ? viewActiveClass : segmentInactiveClass}`}
            >
              周历
            </button>
            <button 
              onClick={() => onViewModeChange('list')}
              className={`${segmentButtonClass} ${viewMode === 'list' ? viewActiveClass : segmentInactiveClass}`}
            >
              列表
            </button>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters ? (
            <button
              onClick={onClearFilters}
              className="flex h-[56px] items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-4 text-sm font-bold text-black/60 shadow-lg shadow-black/10 transition-all hover:border-black/30 hover:bg-primary hover:text-black active:scale-95 xl:w-[82px] xl:flex-none"
            >
              <X size={16} />
              <span className="whitespace-nowrap">清除</span>
            </button>
          ) : (
            <div className="hidden h-[56px] xl:block xl:w-[82px] xl:flex-none" aria-hidden />
          )}
        </div>
      </div>

      {locationDropdown}
    </>
  );
};

export default FilterPanel;
