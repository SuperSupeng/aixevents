import React from 'react';
import { ArrowLeft, MessageCircle, Sparkles } from 'lucide-react';
import { PARTNER_CATEGORIES, ecosystemPartners, getPartnersByCategory } from '../data/partners';

interface PartnersProps {
  onBack: () => void;
  onGroupClick: () => void;
}

const Partners: React.FC<PartnersProps> = ({ onBack, onGroupClick }) => {
  return (
    <div className="poster-app min-h-screen px-4 py-24 text-black sm:px-6">
      <div className="relative z-10 mx-auto max-w-7xl">
        <button
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 text-sm font-black text-black/60 transition-colors hover:text-accent"
        >
          <ArrowLeft size={18} />
          <span>返回首页</span>
        </button>

        <header className="partner-page-header">
          <div className="min-w-0">
            <div className="mb-5 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-wide">
              <Sparkles size={15} className="text-accent" />
              AI+X Partners
            </div>
            <h1>生态伙伴</h1>
            <p>
              这里收录与 Datawhale AI+X 活动日历共同推动活动发生的社区、高校、科技企业、媒体、政府园区、投资机构和在地社区伙伴。
            </p>
          </div>

          <div className="partner-page-stat">
            <p>首批收录</p>
            <strong>{ecosystemPartners.length}</strong>
            <span>个伙伴 logo</span>
          </div>
        </header>

        <div className="partner-category-nav" aria-label="生态伙伴分类">
          {PARTNER_CATEGORIES.map((category) => (
            <a key={category} href={`#${category}`} className="partner-category-chip">
              {category}
              <span>{getPartnersByCategory(category).length}</span>
            </a>
          ))}
        </div>

        <div className="partner-directory">
          {PARTNER_CATEGORIES.map((category) => {
            const partners = getPartnersByCategory(category);
            return (
              <section key={category} id={category} className="partner-directory-section">
                <div className="partner-directory-heading">
                  <h2>{category}</h2>
                  <span>{partners.length} 个</span>
                </div>
                <div className="partner-directory-grid">
                  {partners.map((partner) => (
                    <article key={partner.id} className="partner-directory-card">
                      <img src={partner.logo} alt={partner.name} loading="lazy" decoding="async" />
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="partner-page-join">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent">Join the ecosystem</p>
            <h2>想共建 AI+X 活动，先加入活动群。</h2>
          </div>
          <button onClick={onGroupClick} className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm">
            加入活动群 <MessageCircle size={16} />
          </button>
        </section>
      </div>
    </div>
  );
};

export default Partners;
