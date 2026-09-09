import React, { useState } from 'react';
import {
  Scan,
  Menu,
  X,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { PackScanLogo } from './PackScanLogo';

export type NavPage = 'home' | 'scan' | 'results' | 'history' | 'howItWorks' | 'about';

interface NavbarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  hasActiveResult?: boolean;
  darkMode?: boolean;
  onToggleDark?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  hasActiveResult = false,
  darkMode = false,
  onToggleDark,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Overview' },
    { id: 'scan', label: 'Scan Package' },
    ...(hasActiveResult ? [{ id: 'results', label: 'Inspection Results' }] : []),
    { id: 'history', label: 'Audit History' },
    { id: 'howItWorks', label: 'Pipeline' },
    { id: 'about', label: 'Legal Basis' },
  ];

  const handleNavClick = (page: NavPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#D1D5DB] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick('home')}
          className="flex items-center cursor-pointer group gap-2.5"
          id="brand-logo"
        >
          <PackScanLogo size="md" />
          <span className="hidden md:inline-block text-[10px] font-bold tracking-normal px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
            PCR 2011
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id as NavPage)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#F0FDF4] text-[#166534] font-semibold border border-[#BBF7D0]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#F7F8F5]'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Nav Action */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Lightbulb Dark Mode Toggle */}
          {onToggleDark && (
            <button
              id="theme-toggle-desktop"
              onClick={onToggleDark}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`relative p-2 rounded-lg border transition-all duration-300 flex items-center justify-center group ${
                darkMode
                  ? 'bg-amber-400/10 border-amber-400/30 text-amber-400 hover:bg-amber-400/20 hover:border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                  : 'bg-[#F7F8F5] border-[#D1D5DB] text-slate-600 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/60'
              }`}
            >
              <Lightbulb
                className={`w-4 h-4 transition-all duration-300 ${
                  darkMode
                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)] scale-105'
                    : 'text-slate-600 group-hover:text-amber-600 group-hover:scale-105'
                }`}
              />
              {/* Subtle pulsing beacon when lightbulb is illuminated */}
              {darkMode && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => handleNavClick('about')}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-[#F7F8F5] transition-colors"
          >
            Statutory Scope
          </button>
          <button
            id="nav-scan-cta"
            onClick={() => handleNavClick('scan')}
            className="btn-nav-cta text-xs"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Scan Package</span>
            <ArrowRight className="w-3 h-3 text-[#BBF7D0]" />
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center gap-2">
          {/* Mobile Lightbulb Toggle */}
          {onToggleDark && (
            <button
              id="theme-toggle-mobile"
              onClick={onToggleDark}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`p-2 rounded-lg border transition-all duration-300 flex items-center justify-center ${
                darkMode
                  ? 'bg-amber-400/10 border-amber-400/30 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                  : 'bg-[#F7F8F5] border-[#D1D5DB] text-slate-600 hover:text-amber-600 hover:bg-amber-50/60'
              }`}
            >
              <Lightbulb
                className={`w-4 h-4 transition-all duration-300 ${
                  darkMode
                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                    : 'text-slate-600'
                }`}
              />
            </button>
          )}

          <button
            onClick={() => handleNavClick('scan')}
            className="btn-nav-cta text-xs py-1.5 px-3 h-[36px]"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-700 hover:bg-[#F7F8F5] border border-[#D1D5DB]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#D1D5DB] bg-[#FFFFFF] px-4 pt-3 pb-5 space-y-1 shadow-sm">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as NavPage)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                  isActive
                    ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'
                    : 'text-slate-600 hover:bg-[#F7F8F5]'
                }`}
              >
                <span>{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#166534]" />}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
