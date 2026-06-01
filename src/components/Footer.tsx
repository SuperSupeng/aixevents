import React from 'react';
import Logo from './Logo';

interface FooterProps {
  onSubmitClick: () => void;
  onSupportClick: () => void;
  onGroupClick: () => void;
  onPrivacyClick: () => void;
  onTermsClick: () => void;
}

const Footer: React.FC<FooterProps> = ({
  onSubmitClick,
  onSupportClick,
  onGroupClick,
  onPrivacyClick,
  onTermsClick
}) => {
  return (
    <footer className="py-12 sm:py-20 relative z-10 footer-section">
      {/* Footer Transition Overlay - 从上方逐渐淡出黑色遮罩，让shader显现 */}
      <div className="footer-transition-overlay" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 mb-12 sm:mb-20">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Logo size={32} className="max-w-[220px]" />
              </div>
              <p className="text-white/80 max-w-sm leading-relaxed font-sans text-sm sm:text-[15px]">
                收录 AI+X 生态活动，帮助学习者、开发者、高校学生、产业从业者和个人创造者找到真实场景中的连接、实践与共创机会。
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6 text-sm">社区</h4>
              <ul className="space-y-4 text-white/75 text-sm">
                <li><button onClick={onSubmitClick} className="hover:text-white transition-colors">提交活动</button></li>
                <li><button onClick={onSupportClick} className="hover:text-white transition-colors">生态支持</button></li>
                <li><button onClick={onGroupClick} className="hover:text-white transition-colors">活动群</button></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 pt-6 sm:pt-10 border-t border-white/10 text-white/65 text-xs sm:text-sm font-sans text-center">
            <p>© 2026 Datawhale AI+X 活动日历. 让 AI+X 在更多城市、高校与产业场景持续发生。</p>
            <div className="flex items-center gap-4 text-white/65 text-xs">
              <button onClick={onPrivacyClick} className="hover:text-white transition-colors">隐私政策</button>
              <span>·</span>
              <button onClick={onTermsClick} className="hover:text-white transition-colors">服务条款</button>
            </div>
            <p className="text-white/55 text-[10px] sm:text-xs">活动提交确认后公开展示。</p>
          </div>
        </div>
      </footer>
  );
};

export default Footer;
