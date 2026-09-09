import React, { useState } from 'react';
import {
  Scan,
  History,
  Info,
  FileCheck2,
  Menu,
  X,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { motion, useScroll, useSpring } from 'motion/react';
import { PackScanLogo } from './PackScanLogo';
import { GlowButton } from './GlowButton';

export type NavPage = 'home' | 'scan' | 'results' | 'history' | 'about';

interface NavbarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  hasActiveResult?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  hasActiveResult = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll Progress Animation Indicator
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.001,
  });

  const navItems = [
    { id: 'home', label: 'Overview', icon: ShieldCheck },
    { id: 'scan', label: 'Verify Package', icon: Scan },
    ...(hasActiveResult ? [{ id: 'results', label: 'Audit Findings', icon: FileCheck2 }] : []),
    { id: 'history', label: 'Inspection Logs', icon: History },
    { id: 'about', label: 'Regulatory Framework', icon: Info },
  ];

  const handleNavClick = (page: NavPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#D1D5DB] shadow-2xs">
      {/* Scroll Progress Bar */}
      <motion.div
        className="h-1 bg-[#166534] origin-left fixed top-0 left-0 right-0 z-50 pointer-none pointer-events-none"
        style={{ scaleX }}
      />

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Official PackScan.Ai Logo */}
        <div
          onClick={() => handleNavClick('home')}
          className="cursor-pointer group flex items-center shrink-0"
          id="brand-logo"
        >
          <PackScanLogo size="md" showWordmark={true} />
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center space-x-1 bg-stone-100/80 p-1 rounded-full border border-[#D1D5DB]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as NavPage)}
                className={`relative px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-white text-[#166534] shadow-xs font-bold border border-[#BBF7D0]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#166534]' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right CTA Button (Framework Pill Style with Cursor-Aware Glow) */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <GlowButton
            id="nav-scan-cta"
            onClick={() => handleNavClick('scan')}
            icon={<Scan className="w-3.5 h-3.5" />}
            size="sm"
            variant="primary"
            showArrow={true}
            glowColor="rgba(34, 197, 94, 0.4)"
          >
            Verify Package
          </GlowButton>
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => handleNavClick('scan')}
            className="p-2 bg-[#166534] text-white rounded-xl text-xs font-bold flex items-center gap-1"
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="sm:hidden">Verify</span>
          </button>
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#D1D5DB] bg-white px-4 pt-2 pb-4 space-y-1 shadow-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as NavPage)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                  isActive
                    ? 'bg-[#F0FDF4] text-[#166534] font-bold border border-[#BBF7D0]'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#166534]' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
