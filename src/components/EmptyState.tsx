import React from 'react';
import { Calendar, Search, Filter, Bot, Trophy, Wrench } from 'lucide-react';

interface EmptyStateProps {
  type?: 'search' | 'filter' | 'calendar';
  searchQuery?: string;
  onReset?: () => void;
  onQuickFilter?: (searchTerm: string) => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  type = 'search', 
  searchQuery,
  onReset,
  onQuickFilter
}) => {
  const configs = {
    search: {
      icon: Search,
      title: '没有找到活动',
      description: searchQuery 
        ? `没有与「${searchQuery}」匹配的结果`
        : '试试调整搜索关键词',
    },
    filter: {
      icon: Filter,
      title: '没有匹配活动',
      description: '试试更换筛选条件查看更多活动',
    },
    calendar: {
      icon: Calendar,
      title: '这个月暂无活动',
      description: '可以切换月份或清除筛选条件',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="glass-panel p-16 sm:p-24 text-center border-dashed border-white/10">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white/30">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl sm:text-2xl font-serif italic mb-3 text-white/90">
        {config.title}
      </h3>
      <p className="text-sm sm:text-base text-white/50 mb-6 max-w-md mx-auto leading-relaxed">
        {config.description}
      </p>
      <div className="flex flex-col items-center gap-4">
        {onReset && (
          <button
            onClick={onReset}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-sm text-white/70 hover:text-white transition-all font-medium"
          >
            清除筛选
          </button>
        )}
        
        {/* Quick suggestions */}
        {onQuickFilter && (type === 'search' || type === 'filter') && (
          <div className="mt-4">
            <p className="text-xs text-white/40 mb-3">试试探索：</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => onQuickFilter('AI 实践')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-full text-white/60 hover:text-white transition-all text-xs"
              >
                <Bot size={12} />
                <span>AI 实践</span>
              </button>
              <button
                onClick={() => onQuickFilter('黑客松')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-full text-white/60 hover:text-white transition-all text-xs"
              >
                <Trophy size={12} />
                <span>黑客松</span>
              </button>
              <button
                onClick={() => onQuickFilter('工作坊')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-full text-white/60 hover:text-white transition-all text-xs"
              >
                <Wrench size={12} />
                <span>工作坊</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
