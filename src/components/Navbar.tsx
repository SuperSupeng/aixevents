import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

interface NavbarProps {
  onExploreClick: () => void;
  onHackathonsClick: () => void;
  onPartnersClick: () => void;
  onResourcesClick: () => void;
  onSubmitClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  onExploreClick,
  onHackathonsClick,
  onPartnersClick,
  onResourcesClick,
  onSubmitClick
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-4">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-6 py-3 bg-white/90 border-2 border-black/90 rounded-lg shadow-[0_5px_0_rgba(5,5,5,0.92)] sm:shadow-[6px_6px_0_rgba(5,5,5,0.92)] backdrop-blur-xl relative">
        <button 
          onClick={scrollToTop}
          className="flex min-w-0 items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity group"
        >
          <Logo size={34} className="max-w-[168px] sm:max-w-[224px] group-hover:scale-[1.03] transition-transform duration-300" />
        </button>
        
        <div className="hidden md:flex items-center gap-5 text-base font-black tracking-wide uppercase text-black">
          <button onClick={onExploreClick} className="hover:text-accent transition-colors">活动日历</button>
          <button onClick={onHackathonsClick} className="hover:text-accent transition-colors">Hackathon</button>
          <button onClick={onPartnersClick} className="hover:text-accent transition-colors">生态伙伴</button>
          <button onClick={onResourcesClick} className="hover:text-accent transition-colors">资源</button>
          <button onClick={onSubmitClick} className="bg-primary px-4 py-2 border-2 border-black hover:bg-primary-light transition-colors">提交活动</button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-black hover:text-accent transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="打开菜单"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-white border-2 border-black rounded-lg p-6 shadow-[6px_6px_0_rgba(5,5,5,0.92)] animate-in fade-in slide-in-from-top-5">
          <div className="flex flex-col gap-4">
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
