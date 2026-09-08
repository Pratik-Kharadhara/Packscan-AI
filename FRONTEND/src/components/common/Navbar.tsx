import React, { useState } from 'react';
import {
  Scan,
  History,
  Info,
  Layers,
  HelpCircle,
  FileCheck2,
  Menu,
  X,
  Shield,
  ArrowRight,
} from 'lucide-react';

export type NavPage = 'home' | 'scan' | 'results' | 'history' | 'howItWorks' | 'about';

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

  const navItems = [
    { id: 'home', label: 'Overview', icon: Shield },
    { id: 'scan', label: 'Scan Package', icon: Scan },
    ...(hasActiveResult ? [{ id: 'results', label: 'Live Results', icon: FileCheck2 }] : []),
    { id: 'history', label: 'Scan History', icon: History },
    { id: 'howItWorks', label: 'How It Works', icon: Layers },
    { id: 'about', label: 'About & Impact', icon: Info },
  ];

  const handleNavClick = (page: NavPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top GovTech / SIH Bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 sm:px-8 flex items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>
            <strong className="text-white">Smart India Hackathon 2026</strong> • Problem ID:{' '}
            <span className="text-amber-300 font-mono font-bold">SIH26034</span>
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-300">
            Legal Metrology Compliance Scanner
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-blue-900/70 text-blue-200 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
            TEAM VISION FORGE
          </span>
          <span className="hidden sm:inline text-slate-400 text-[10px]">
            Rules 6, 7 &amp; 8 (2011)
          </span>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 cursor-pointer group"
          id="brand-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 flex items-center justify-center text-white shadow-md shadow-blue-900/20 group-hover:scale-105 transition-transform">
            <Scan className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                PackScan<span className="text-blue-600">.AI</span>
              </span>
              <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                SIH26
              </span>
            </div>
            <p className="text-[10px] font-semibold text-slate-500 leading-none">
              Legal Metrology Compliance Screening
            </p>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id as NavPage)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            id="nav-scan-cta"
            onClick={() => handleNavClick('scan')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all group"
          >
            <Scan className="w-4 h-4 text-blue-200 group-hover:rotate-12 transition-transform" />
            <span>Scan a Package</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => handleNavClick('scan')}
            className="p-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
          >
            <Scan className="w-4 h-4" />
            <span className="sm:hidden">Scan</span>
          </button>
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as NavPage)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-left ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
