import React from 'react';
import { ShieldCheck, Scale, FileText, AlertTriangle, ExternalLink, Heart } from 'lucide-react';
import { NavPage } from './Navbar';

interface FooterProps {
  onNavigate: (page: NavPage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Statutory Positioning Notice (Mandated in prompt & SIH PDF) */}
        <div
          id="regulatory-disclaimer-callout"
          className="mb-10 p-4 sm:p-5 rounded-xl bg-slate-800/80 border border-amber-500/30 text-slate-300"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
                Statutory Positioning &amp; Legal Metrology Notice
              </h4>
              <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed font-normal">
                &ldquo;PackScan AI is an AI-assisted, explainable digital compliance screening tool that supports inspectors and businesses. It does not replace statutory authorities, and does not claim to precisely measure legal physical font size from an arbitrary photo without a reliable physical scale in frame.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 pb-8 border-b border-slate-800">
          {/* Col 1: About */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-base">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs">
                PS
              </div>
              <span>PackScan AI</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Automated package label screening against India&apos;s Legal Metrology (Packaged Commodities) Rules, 2011. Assists human inspectors with explainable, confidence-scored audits.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Team Vision Forge • SIH26034
            </div>
          </div>

          {/* Col 2: The 6 Declarations */}
          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Mandatory Declarations
            </h5>
            <ul className="space-y-1.5 text-slate-400">
              <li>1. Manufacturer / Packer Details</li>
              <li>2. Commodity Identity (Generic)</li>
              <li>3. Net Quantity (SI Metric Units)</li>
              <li>4. Mfg. / Pre-pack Date (MM/YYYY)</li>
              <li>5. Retail Sale Price (MRP + Taxes)</li>
              <li>6. Consumer Complaint Redressal</li>
            </ul>
          </div>

          {/* Col 3: Navigation */}
          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              System Modules
            </h5>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('scan')}
                  className="hover:text-white transition-colors"
                >
                  Scanner &amp; OCR Engine
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('history')}
                  className="hover:text-white transition-colors"
                >
                  Inspection History Logs
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('howItWorks')}
                  className="hover:text-white transition-colors"
                >
                  6-Stage Technical Pipeline
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors"
                >
                  Impact Matrix &amp; Legal Rules
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Statutory Legal Metrology Basis */}
          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Regulatory Basis
            </h5>
            <div className="space-y-2 text-slate-400">
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="font-semibold text-slate-200 block text-[11px]">
                  Rule 6 — Mandatory Declarations
                </span>
                <span className="text-[10px] text-slate-400">
                  Definite, plain &amp; conspicuous declarations on every package.
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="font-semibold text-slate-200 block text-[11px]">
                  Rule 7 &amp; 8 — Display Panel &amp; Manner
                </span>
                <span className="text-[10px] text-slate-400">
                  Principal display panel requirements and declaration groupings.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-slate-500 gap-3 text-[11px]">
          <div>
            Smart India Hackathon 2026 • Problem Statement ID: SIH26034 (Software / Miscellaneous)
          </div>
          <div className="flex items-center gap-4">
            <span>Built by <strong className="text-slate-300">Team Vision Forge</strong></span>
            <span>•</span>
            <span>Never a blind pass/fail</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
