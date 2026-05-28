import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, Globe2 } from 'lucide-react';

interface ResourcesProps {
  onBack: () => void;
}

const Resources: React.FC<ResourcesProps> = ({ onBack }) => {
  const calendars = [
    {
      region: '中国',
      title: '中国 AI 里程碑',
      description: '重要 AI 发布、政策、融资与技术突破。',
      subscribeUrl: 'https://www.zhihu.com/api/v4/brand_influence/api/ai-calendar/subscription.ics',
      sourceName: '知乎 AI 日历',
      sourceUrl: 'https://www.zhihu.com/ailab/app/calendar',
    },
    {
      region: '全球',
      title: '全球 AI 动态',
      description: '跨地区 AI 关键时刻与产业变化。',
      subscribeUrl: '',
    },
  ];
  const chinaCalendar = calendars.find((calendar) => calendar.region === '中国');
  const [zhihuEvents, setZhihuEvents] = useState<Array<{ date: string; title: string; url?: string }>>([]);
  const [zhihuLoading, setZhihuLoading] = useState(false);
  const [zhihuError, setZhihuError] = useState<string | null>(null);

  const parseIcsEvents = (icsText: string) => {
    const blocks = icsText.split('BEGIN:VEVENT').slice(1);
    const events = blocks.map((block) => {
      const dateMatch = block.match(/DTSTART(?:;VALUE=DATE)?:([0-9]{8})/);
      const titleMatch = block.match(/SUMMARY:(.+)/);
      const urlMatch = block.match(/DESCRIPTION:(https?:\/\/\S+)/);
      const rawDate = dateMatch?.[1] ?? '';
      const date =
        rawDate.length === 8
          ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
          : '';
      return {
        date,
        title: titleMatch?.[1]?.trim() ?? '',
        url: urlMatch?.[1],
      };
    });

    return events
      .filter((event) => event.title && event.date)
      .slice(0, 8);
  };

  useEffect(() => {
    if (!chinaCalendar?.subscribeUrl) return;
    let isMounted = true;
    const loadCalendar = async () => {
      setZhihuLoading(true);
      setZhihuError(null);
      try {
        const response = await fetch(chinaCalendar.subscribeUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const text = await response.text();
        const events = parseIcsEvents(text);
        if (isMounted) {
          setZhihuEvents(events);
        }
      } catch (error) {
        if (isMounted) {
          setZhihuError('暂时无法加载日历源，请通过链接直接订阅。');
        }
      } finally {
        if (isMounted) {
          setZhihuLoading(false);
        }
      }
    };

    loadCalendar();
    return () => {
      isMounted = false;
    };
  }, [chinaCalendar?.subscribeUrl]);

  const hasZhihuEvents = useMemo(() => zhihuEvents.length > 0, [zhihuEvents.length]);

  return (
    <div className="poster-app min-h-screen bg-[#030303] text-white py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft size={20} />
          <span>返回首页</span>
        </button>

        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium">
            <Globe2 size={14} />
            全球 AI 资源
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-6 mb-4">
            全球 AI 进展、日历与信号
          </h1>
          <p className="text-white/60 text-base md:text-lg max-w-3xl">
            汇总不同地区的 AI 里程碑与高可信资源。你可以先订阅区域日历，后续我们会持续扩展全球覆盖。
          </p>
        </header>

        <section className="mb-14">
          <h2 className="text-2xl font-semibold mb-4">AI 进展</h2>
          <p className="text-white/55 text-sm mb-6">
            订阅区域 AI 里程碑日历。每个日历都保持轻量，只收录高信号事件。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {calendars.map((calendar) => (
              <div
                key={calendar.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-white/40">
                    {calendar.region}
                  </span>
                  <Calendar size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{calendar.title}</h3>
                  <p className="text-white/60 text-sm mt-2">{calendar.description}</p>
                </div>
                {calendar.sourceName && calendar.sourceUrl && (
                  <a
                    href={calendar.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white/50 hover:text-white transition-colors"
                  >
                    来源：{calendar.sourceName}
                  </a>
                )}
                {calendar.subscribeUrl ? (
                  <a
                    href={calendar.subscribeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:text-white hover:border-white/30 transition-colors"
                  >
                    订阅日历
                  </a>
                ) : (
                  <span className="text-xs text-white/40">
                    订阅链接即将补充。
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {chinaCalendar && (
          <section className="mb-14">
            <h2 className="text-2xl font-semibold mb-4">中国 AI 里程碑</h2>
            <p className="text-white/55 text-sm mb-6">
              我们订阅源日历并展示近期条目。来源：{chinaCalendar.sourceName}。
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              {zhihuLoading && (
                <p className="text-white/50 text-sm">正在加载日历源...</p>
              )}
              {!zhihuLoading && zhihuError && (
                <div className="text-white/50 text-sm">
                  <p>{zhihuError}</p>
                </div>
              )}
              {!zhihuLoading && !zhihuError && hasZhihuEvents && (
                <ul className="space-y-4">
                  {zhihuEvents.map((event) => (
                    <li
                      key={`${event.date}-${event.title}`}
                      className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
                    >
                      <p className="text-xs uppercase tracking-widest text-white/40">
                        {event.date}
                      </p>
                      <p className="text-white/80 text-sm mt-2">{event.title}</p>
                      {event.url && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-light hover:text-white transition-colors mt-2 inline-block"
                        >
                          查看详情
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {!zhihuLoading && !zhihuError && !hasZhihuEvents && (
                <p className="text-white/50 text-sm">
                  暂无加载结果。可以直接订阅或稍后刷新。
                </p>
              )}
              <div className="mt-6 text-xs text-white/40 flex items-center justify-between gap-4">
                <span>更想用自己的日历应用？可以通过 ICS 链接订阅。</span>
                <a
                  href={chinaCalendar.subscribeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-light hover:text-white transition-colors"
                >
                  打开 ICS
                </a>
              </div>
            </div>
          </section>
        )}

        <section className="mb-14">
          <h2 className="text-2xl font-semibold mb-4">精选 AI 资源</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold">研究与评测</h3>
              <p className="text-white/60 text-sm mt-2">
                持续整理报告、评测与可信基准。
              </p>
              <p className="text-white/40 text-xs mt-4">即将上线。</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold">工具与开源</h3>
              <p className="text-white/60 text-sm mt-2">
                精选正在塑造下一波 AI 的工具与仓库。
              </p>
              <p className="text-white/40 text-xs mt-4">即将上线。</p>
            </div>
          </div>
        </section>

        <section className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2">贡献资源</h2>
          <p className="text-white/70 text-sm">
            如果你有可信的区域日历或资源，欢迎通过首页的活动群二维码分享给社区。
          </p>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-full border border-primary/40 px-4 py-2 text-sm text-primary-light hover:text-white hover:border-primary/80 transition-colors mt-4"
          >
            返回首页扫码加入
          </button>
        </section>
      </div>
    </div>
  );
};

export default Resources;
