import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ecosystemPartners } from '../data/partners';

interface PartnerLogoWallProps {
  onViewAll: () => void;
}

const PartnerLogoWall: React.FC<PartnerLogoWallProps> = ({ onViewAll }) => {
  const rows = [0, 1, 2].map((rowIndex) =>
    ecosystemPartners.filter((_, index) => index % 3 === rowIndex)
  );

  return (
    <section className="partner-wall-section">
      <div className="partner-wall-shell">
        <div className="partner-wall-header">
          <div>
            <p className="poster-section-kicker">
              <span className="block h-2 w-2 bg-primary" />
              生态伙伴
            </p>
            <h2>和更多社区、高校与产业伙伴一起发生</h2>
            <p className="partner-wall-note">排名不分先后</p>
          </div>
          <button
            onClick={onViewAll}
            className="btn-secondary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
          >
            查看生态伙伴 <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="partner-marquee" aria-label="生态伙伴 logo 墙">
          {rows.map((row, rowIndex) => {
            const logos = [...row, ...row];
            return (
              <div key={rowIndex} className="partner-marquee-row">
                <div className={`partner-marquee-track ${rowIndex === 1 ? 'partner-marquee-track-reverse' : ''}`}>
                  {logos.map((partner, index) => (
                    <div key={`${partner.id}-${index}`} className="partner-logo-tile">
                      <img src={partner.logo} alt={partner.name} loading="lazy" decoding="async" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PartnerLogoWall;
