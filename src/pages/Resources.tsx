import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Calendar, ExternalLink, FileText, Globe2, Loader2, MessageCircle, Users } from 'lucide-react';

interface ResourcesProps {
  onBack: () => void;
  onGroupClick: () => void;
}

const Resources: React.FC<ResourcesProps> = ({ onBack, onGroupClick }) => {
  const chinaCalendar = {
    region: '中国',
    title: '中国 AI 里程碑',
    description: '重要 AI 发布、政策、融资与技术突破。作为外部日历源补充参考。',
    subscribeUrl: 'https://www.zhihu.com/api/v4/brand_influence/api/ai-calendar/subscription.ics',
    sourceName: '知乎 AI 日历',
    sourceUrl: 'https://www.zhihu.com/ailab/app/calendar',
  };

  const [zhihuEvents, setZhihuEvents] = useState<Array<{ date: string; title: string; url?: string }>>([]);
  const [zhihuLoading, setZhihuLoading] = useState(false);
  const [zhihuError, setZhihuError] = useState<string | null>(null);

  const resourceGroups = [
    {
      icon: <Calendar size={22} />,
      title: '活动日历',
      body: '按城市、线上线下和活动类型发现 AI+X 生态活动。',
    },
    {
      icon: <Users size={22} />,
      title: '生态共建',
      body: '面向高校、城市、产业伙伴和社区组织者开放活动提交。',
    },
    {
      icon: <BookOpen size={22} />,
      title: '学习实践',
      body: '优先关注真实场景、动手任务和作品展示。',
    },
    {
      icon: <FileText size={22} />,
      title: '可信资源',
      body: '持续整理日历源、活动信息和高信号 AI 资源。',
    },
  ];

  const parseIcsEvents = (icsText: string) => {
    const unfoldedText = icsText.replace(/\r?\n[ \t]/g, '');
    const blocks = unfoldedText.split('BEGIN:VEVENT').slice(1);
    const events = blocks.map((block) => {
      const dateMatch = block.match(/DTSTART(?:;VALUE=DATE)?:([0-9]{8})/);
      const titleMatch = block.match(/SUMMARY:(.+)/);
      const urlMatch = block.match(/(?:URL|DESCRIPTION):(https?:\/\/\S+)/);
      const rawDate = dateMatch?.[1] ?? '';
      const date =
        rawDate.length === 8
          ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
          : '';

      return {
        date,
        title: titleMatch?.[1]?.replace(/\\,/g, ',').replace(/\\n/g, ' ').trim() ?? '',
        url: urlMatch?.[1]?.replace(/\\,/g, ','),
      };
    });

    return events
      .filter((event) => event.title && event.date)
      .slice(0, 8);
  };

  useEffect(() => {
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
      } catch {
        if (isMounted) {
          setZhihuError('暂时无法加载日历源，可以通过来源页面或订阅链接查看。');
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
  }, [chinaCalendar.subscribeUrl]);

  return (
    <div className="poster-app min-h-screen px-4 py-24 text-black sm:px-6">
      <div className="relative z-10 mx-auto max-w-[72rem]">
        <button
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 text-sm font-black text-black/60 transition-colors hover:text-accent"
        >
          <ArrowLeft size={18} />
          <span>返回首页</span>
        </button>

        <header className="grid gap-6 border-2 border-black bg-white/90 p-5 shadow-[7px_7px_0_rgba(5,5,5,0.92)] sm:p-7 lg:grid-cols-[1fr_24rem] lg:items-end">
          <div className="min-w-0">
            <div className="mb-5 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-wide">
              <Globe2 size={15} className="text-accent" />
              AI+X Resources
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.02] text-black sm:text-6xl">
              资源与参考
            </h1>
            <p className="mt-5 max-w-3xl text-base font-bold leading-8 text-black/70 sm:text-lg">
              这里收录 AI 里程碑、外部参考源和生态共建入口。资源页保持轻量，重点帮助你找到可追踪、可参与的信息源。
            </p>
          </div>

          <div className="border-2 border-black bg-[#f7f8f1] p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent">Current Focus</p>
            <p className="mt-3 text-2xl font-black leading-tight text-black">
              让活动信息从分散传播变成稳定入口。
            </p>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resourceGroups.map((item) => (
            <article key={item.title} className="border-2 border-black/15 bg-white/90 p-5 shadow-[4px_4px_0_rgba(23,100,255,0.12)]">
              <div className="mb-4 inline-flex text-accent drop-shadow-[3px_3px_0_rgba(167,240,0,0.75)]">
                {item.icon}
              </div>
              <h2 className="text-xl font-black leading-tight text-black">{item.title}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-black/60">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 border-2 border-black/15 bg-white/88 p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-accent">External Source</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-black">{chinaCalendar.title}</h2>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-black/62">
                {chinaCalendar.description}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:w-52 lg:flex-col">
              <a
                href={chinaCalendar.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
              >
                来源：知乎 AI 日历 <ExternalLink size={16} />
              </a>
              <a
                href={chinaCalendar.subscribeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border-2 border-black bg-white px-5 py-3 text-sm font-black text-accent shadow-[4px_4px_0_rgba(23,100,255,0.22)] transition-transform hover:-translate-y-0.5"
              >
                订阅 ICS
              </a>
            </div>
          </div>

          <div className="mt-5 border-t-2 border-dashed border-black/15 pt-5">
            {zhihuLoading && (
              <div className="flex items-center gap-2 text-sm font-black text-black/50">
                <Loader2 size={18} className="animate-spin text-accent" />
                正在加载日历源...
              </div>
            )}

            {!zhihuLoading && zhihuError && (
              <p className="text-sm font-bold leading-6 text-black/50">{zhihuError}</p>
            )}

            {!zhihuLoading && !zhihuError && zhihuEvents.length > 0 && (
              <ul className="divide-y divide-black/10">
                {zhihuEvents.map((event) => (
                  <li
                    key={`${event.date}-${event.title}`}
                    className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[7rem_1fr]"
                  >
                    <p className="text-xs font-black leading-6 text-accent">{event.date}</p>
                    <div>
                      <p className="text-sm font-bold leading-6 text-black/80">{event.title}</p>
                      {event.url && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-black text-black/50 transition-colors hover:text-accent"
                        >
                          查看详情 <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!zhihuLoading && !zhihuError && zhihuEvents.length === 0 && (
              <p className="text-sm font-bold leading-6 text-black/50">暂无加载结果。可以直接订阅或稍后刷新。</p>
            )}
          </div>
        </section>

        <section className="mt-10 border-2 border-black bg-primary p-5 text-black shadow-[5px_5px_0_rgba(5,5,5,0.9)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em]">Contribute</p>
              <h2 className="mt-2 text-2xl font-black leading-tight">想共建资源，先加入活动群</h2>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-black/70">
                如果你有可信的区域日历、活动资源或 AI 生态信息源，可以先扫码加入活动群，再和社区一起补充、校对和持续维护。
              </p>
            </div>
            <button
              type="button"
              onClick={onGroupClick}
              className="inline-flex items-center justify-center gap-2 border-2 border-black bg-white px-5 py-3 text-sm font-black text-accent shadow-[4px_4px_0_rgba(23,100,255,0.22)] transition-transform hover:-translate-y-0.5"
            >
              加入活动群 <MessageCircle size={17} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Resources;
