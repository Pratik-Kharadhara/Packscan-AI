import React from 'react';
import { Scan } from 'lucide-react';
import { NavPage } from '../common/Navbar';
import { ClayHeroDiorama } from '../common/ClayHeroDiorama';
import { GlowCtaButton } from '../common/GlowCtaButton';

interface LandingPageProps {
  onNavigate: (page: NavPage) => void;
  onQuickPreset: (presetId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onQuickPreset }) => {
  return (
    <div className="space-y-16 sm:space-y-20 pb-16 select-none" id="landing-page-root">
      {/* 
        ========================================================================
        1. 3D HERO SECTION: Restrained Government-Grade Optical Inspection Engine
        ========================================================================
      */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#166534]/50 bg-[#07190F] shadow-xl">
        {/* Full-bleed Three.js 3D Metrology Scene Diorama */}
        <div className="w-full h-[540px] sm:h-[620px] lg:h-[680px] relative">
          <ClayHeroDiorama />

          {/* Left-side subtle contrast gradient scrim to ensure WCAG AA text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#06150D]/95 via-[#06150D]/75 to-transparent w-full sm:w-[70%] lg:w-[60%] pointer-events-none z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06150D]/90 via-transparent to-transparent h-40 bottom-0 pointer-events-none z-10" />

          {/* Hero Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-12 lg:p-16 z-20">
            <div className="max-w-2xl space-y-5 sm:space-y-6">
              {/* Top Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#166534]/60 backdrop-blur-md border border-[#86EFAC]/30 text-xs font-semibold text-[#BBF7D0]">
                <span className="w-2 h-2 rounded-full bg-[#86EFAC]" />
                <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
              </div>

              {/* Exact 3-Line Display Headline */}
              <h1 className="text-white text-3xl sm:text-5xl lg:text-[58px] font-extrabold tracking-tight leading-[1.06]">
                Automated Package <br />
                <span className="text-[#86EFAC]">Compliance</span> <br />
                <span className="text-[#86EFAC]">Screening</span>
              </h1>

              {/* Subtitle Paragraph */}
              <p className="text-[#D1D5DB] text-xs sm:text-base lg:text-[17px] max-w-xl leading-relaxed font-normal">
                Explainable, confidence-scored optical audit for consumer packaged goods. Assisting enforcement officers and quality teams in screening mandatory label declarations with spatial precision.
              </p>

              {/* Interactive Hero Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <GlowCtaButton
                  id="hero-scan-cta"
                  onClick={() => onNavigate('scan')}
                  iconLeft={<Scan className="w-4 h-4 text-white stroke-[2.5]" />}
                  variant="primary"
                  size="md"
                >
                  Start Package Inspection
                </GlowCtaButton>

                <GlowCtaButton
                  id="hero-demo-cta"
                  onClick={() => onQuickPreset('needs_review')}
                  variant="dark"
                  size="md"
                >
                  Try Sample Inspection
                </GlowCtaButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        2. STATUTORY COVERAGE PROOF STRIP: Clean White Card with Hairline Borders
        ========================================================================
      */}
      <div className="-mt-10 sm:-mt-14 relative z-20 max-w-6xl mx-auto px-4">
        <div className="gov-card p-6 sm:p-8">
          <div className="text-center space-y-1 mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Statutory Verification Coverage
            </span>
            <p className="text-sm font-semibold text-[#1F2937]">
              Built strictly against the 6 statutory mandates of Legal Metrology (PCR 2011)
            </p>
          </div>

          {/* Proof Strip Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
            <div className="card-mini-tile flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500">Mandatory Declarations</span>
              <div className="text-2xl font-bold tracking-tight text-[#1F2937] mt-1">6 of 6</div>
              <span className="text-[11px] text-slate-600 mt-1">Rules 6(1)(a) through (g)</span>
            </div>

            <div className="card-mini-tile flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500">Inspection Outcomes</span>
              <div className="text-2xl font-bold tracking-tight text-[#1F2937] mt-1">3-Way Triage</div>
              <span className="text-[11px] text-slate-600 mt-1">Pass / Review / Non-Compliant</span>
            </div>

            <div className="card-mini-tile flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500">Spatial OCR Precision</span>
              <div className="text-2xl font-bold tracking-tight text-[#1F2937] mt-1">Pixel Bound</div>
              <span className="text-[11px] text-slate-600 mt-1">Normalized [ymin, xmin, ...]</span>
            </div>

            <div className="card-mini-tile flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500">Human-in-the-Loop</span>
              <div className="text-2xl font-bold tracking-tight text-[#1F2937] mt-1">Zero Blind Fails</div>
              <span className="text-[11px] text-slate-600 mt-1">Low contrast flags review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
