import React from 'react';
import {
  Scan,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Zap,
  Layers,
  Scale,
  Building2,
  Calendar,
  IndianRupee,
  MessageSquare,
  Package,
} from 'lucide-react';
import { PipelineStepFlow } from '../common/PipelineStepFlow';
import { NavPage } from '../common/Navbar';
import { StatusBadge } from '../common/Badge';

interface LandingPageProps {
  onNavigate: (page: NavPage) => void;
  onQuickPreset: (presetId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onQuickPreset }) => {
  const verifiedFields = [
    {
      title: 'Manufacturer / Packer',
      desc: 'Name & complete physical address with PIN code',
      rule: 'Rule 6(1)(a) & (b)',
      icon: Building2,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Commodity Identity',
      desc: 'Common or generic name of the product',
      rule: 'Rule 6(1)(c)',
      icon: Package,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      title: 'Net Quantity',
      desc: 'Standard metric SI weight, volume, or count',
      rule: 'Rule 6(1)(d)',
      icon: Scale,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Mfg. / Pre-pack Date',
      desc: 'Month & year of manufacturing or packaging',
      rule: 'Rule 6(1)(e)',
      icon: Calendar,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Retail Sale Price (MRP)',
      desc: 'Maximum Retail Price inclusive of all taxes',
      rule: 'Rule 6(1)(f)',
      icon: IndianRupee,
      color: 'text-teal-600 bg-teal-50',
    },
    {
      title: 'Consumer Complaint Details',
      desc: 'Grievance officer, postal address, phone & email',
      rule: 'Rule 6(1)(g)',
      icon: MessageSquare,
      color: 'text-rose-600 bg-rose-50',
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 pb-16" id="landing-page-root">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 text-white p-8 sm:p-14 lg:p-16 border border-slate-800 shadow-2xl">
        {/* Ambient background glow accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* SIH 2026 Team Vision Forge Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/60 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Smart India Hackathon 2026</span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-300 font-mono font-bold">PS ID: SIH26034</span>
            <span className="text-slate-400">•</span>
            <span className="text-white font-bold">Team Vision Forge</span>
          </div>

          {/* Main Title & Tagline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            PackScan <span className="text-blue-400">AI</span>
          </h1>

          <p className="text-lg sm:text-2xl font-extrabold text-blue-200/95 tracking-wide">
            Automated Package Compliance Verification System
          </p>

          {/* One-line Problem Statement */}
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Manual label inspection is slow and cannot scale across retail shelves. PackScan AI performs an AI-assisted, explainable digital compliance screen against India&apos;s Legal Metrology (Packaged Commodities) Rules, 2011 — in seconds instead of minutes.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              id="hero-scan-cta"
              onClick={() => onNavigate('scan')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-extrabold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all flex items-center gap-2 group"
            >
              <Scan className="w-5 h-5 text-blue-200 group-hover:rotate-12 transition-transform" />
              <span>Scan a Package Now</span>
              <ArrowRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              id="hero-demo-cta"
              onClick={() => onQuickPreset('needs_review')}
              className="bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-sm font-bold px-6 py-3.5 rounded-xl transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Try Live Demo (Preset 1)</span>
            </button>
          </div>

          {/* Micro Assurance */}
          <p className="text-xs text-slate-400 font-medium pt-1">
            ✓ 6 Mandatory Declarations Checked • ✓ Never a Blind Pass/Fail • ✓ 100% Explainable
          </p>
        </div>

        {/* Visual: IMAGE → EXTRACT → VERIFY → EXPLAIN → REPORT horizontal step flow */}
        <div className="mt-12 pt-10 border-t border-slate-800/80">
          <PipelineStepFlow variant="full" onStepClick={() => onNavigate('howItWorks')} />
        </div>
      </div>

      {/* What the System Verifies (The 6 Declarations from Slide 2) */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
            Statutory Scope
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            What the System Verifies (6 Mandatory Declarations)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Strict verification modeled directly after Rule 6 of India&apos;s Legal Metrology (Packaged Commodities) Rules, 2011
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {verifiedFields.map((field) => {
            const Icon = field.icon;
            return (
              <div
                key={field.title}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex items-start gap-4"
              >
                <div className={`w-12 h-12 rounded-xl ${field.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {field.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {field.desc}
                  </p>
                  <span className="inline-block text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    {field.rule}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Interactive Demo Cards for Instant Showcase */}
      <div className="bg-slate-100/80 rounded-3xl p-6 sm:p-10 border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Test Instant Packaging Presets
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Click any sample below to see the complete 6-stage pipeline execute with realistic outcomes
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            3-Tier Outcome Showcase
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Preset 1: NEEDS REVIEW */}
          <div
            onClick={() => onQuickPreset('needs_review')}
            className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status="NEEDS_REVIEW" size="sm" />
                <span className="text-[11px] font-mono text-slate-400">Personal Care</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                PureGlow Ayurvedic Face Cream 500g
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Faint dot-matrix inkjet stamping on manufacturing date gives 61% OCR score; consumer complaint contact missing.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>Launch Inspection &rarr;</span>
              <span className="text-[10px] font-mono text-slate-400">Sample from SIH slide 2</span>
            </div>
          </div>

          {/* Preset 2: COMPLIANT */}
          <div
            onClick={() => onQuickPreset('compliant')}
            className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status="COMPLIANT" size="sm" />
                <span className="text-[11px] font-mono text-slate-400">Food &amp; Beverages</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                Sharbati Whole Wheat Atta 5kg
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                All 6 mandatory declarations strictly compliant: legal postal address with PIN, metric SI units, inclusive taxes clause.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Launch Inspection &rarr;</span>
              <span className="text-[10px] font-mono text-slate-400">100% Pass</span>
            </div>
          </div>

          {/* Preset 3: NON_COMPLIANT */}
          <div
            onClick={() => onQuickPreset('non_compliant')}
            className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status="NON_COMPLIANT" size="sm" />
                <span className="text-[11px] font-mono text-slate-400">Snacks &amp; FMCG</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                Spiced Potato Wafers 80g
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                MRP omits mandatory &ldquo;(inclusive of all taxes)&rdquo; clause; manufacturer address is truncated without PIN code.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-700">
              <span>Launch Inspection &rarr;</span>
              <span className="text-[10px] font-mono text-slate-400">Statutory Violation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop Callout Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Assisting Human Inspectors, Not Replacing Them
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-2xl">
              PackScan AI serves as an explainable first-level screening tool. Low-confidence reads or ambiguous formats are automatically routed to human inspectors with exact spatial bounding boxes, avoiding false penalties and protecting consumer rights.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('howItWorks')}
          className="shrink-0 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors"
        >
          Explore Technical Engine &rarr;
        </button>
      </div>
    </div>
  );
};
