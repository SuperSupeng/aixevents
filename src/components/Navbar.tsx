import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

interface NavbarProps {
  onExploreClick: () => void;
  onHackathonsClick: () => void;
  onCreatorsDayClick: () => void;
  onWaicClick: () => void;
  onPartnersClick: () => void;
  onResourcesClick: () => void;
  onSubmitClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  onExploreClick,
  onHackathonsClick,
  onCreatorsDayClick,
  onWaicClick,
  onPartnersClick,
  onResourcesClick,
  onSubmitClick
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-2.5 py-3 sm:px-5 sm:py-4">
      <div className="mx-auto flex w-full max-w-[72rem] items-center justify-between rounded-lg border-2 border-black/90 bg-white/90 px-3 py-3 shadow-[0_5px_0_rgba(5,5,5,0.92)] backdrop-blur-xl sm:px-5 sm:shadow-[6px_6px_0_rgba(5,5,5,0.92)]">
        <button 
          onClick={scrollToTop}
          className="flex min-w-0 items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity group"
        >
          <Logo size={34} className="max-w-[168px] sm:max-w-[224px] group-hover:scale-[1.03] transition-transform duration-300" />
        </button>
        
        <div className="hidden lg:flex items-center gap-3 text-base font-black tracking-wide uppercase text-black xl:gap-4">
          <button
            onClick={onWaicClick}
            className="relative border-2 border-black bg-white px-2.5 py-1.5 text-xs font-black tracking-normal text-accent shadow-[3px_3px_0_rgba(23,100,255,0.2)] transition hover:-translate-y-0.5 hover:bg-primary/10"
          >
            WAIC 2026
            <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 border border-black bg-primary" aria-hidden="true" />
          </button>
          <button onClick={onExploreClick} className="hover:text-accent transition-colors">活动日历</button>
          <button onClick={onHackathonsClick} className="hover:text-accent transition-colors">Hackathon</button>
          <button onClick={onCreatorsDayClick} className="hover:text-accent transition-colors">创造节</button>
          <button onClick={onPartnersClick} className="hover:text-accent transition-colors">生态伙伴</button>
          <button onClick={onResourcesClick} className="hover:text-accent transition-colors">资源</button>
          <button onClick={onSubmitClick} className="bg-primary px-4 py-2 border-2 border-black hover:bg-primary-light transition-colors">提交活动</button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="p-2 text-black transition-colors hover:text-accent lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="打开菜单"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute left-3 right-3 top-full mt-2 rounded-lg border-2 border-black bg-white p-5 shadow-[6px_6px_0_rgba(5,5,5,0.92)] animate-in fade-in slide-in-from-top-5 lg:hidden sm:left-5 sm:right-5 sm:p-6">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => { onWaicClick(); setMobileMenuOpen(false); }}
              className="flex items-center justify-between border-2 border-black bg-white px-3 py-2.5 text-left text-sm font-black text-accent shadow-[3px_3px_0_rgba(23,100,255,0.2)]"
            >
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 bg-primary" />WAIC 2026 周边活动</span>
              <span aria-hidden="true">→</span>
            </button>
            <button
              onClick={() => { onExploreClick(); setMobileMenuOpen(false); }}
              className="text-black hover:text-accent transition-colors py-2 font-black text-left text-base"
            >
              活动日历
            </button>
            <button
              onClick={() => { onHackathonsClick(); setMobileMenuOpen(false); }}
              className="text-black/70 hover:text-accent transition-colors py-2 text-left font-black text-base"
            >
              Hackathon
            </button>
            <button
              onClick={() => { onCreatorsDayClick(); setMobileMenuOpen(false); }}
              className="text-black/70 hover:text-accent transition-colors py-2 text-left font-black text-base"
            >
              创造节
            </button>
            <button
              onClick={() => { onPartnersClick(); setMobileMenuOpen(false); }}
              className="text-black/70 hover:text-accent transition-colors py-2 text-left font-black text-base"
            >
              生态伙伴
            </button>
            <button 
              onClick={() => { onResourcesClick(); setMobileMenuOpen(false); }} 
              className="text-black/70 hover:text-accent transition-colors py-2 text-left font-black text-base"
            >
              资源
            </button>
            <button 
              onClick={() => { onSubmitClick(); setMobileMenuOpen(false); }} 
              className="text-black/70 hover:text-accent transition-colors py-2 text-left font-black text-base"
            >
              提交活动
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
