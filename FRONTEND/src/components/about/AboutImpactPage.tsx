import React from 'react';
import {
  Users,
  Briefcase,
  ShoppingBag,
  Landmark,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Award,
  CheckCircle2,
  FileCheck,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { LEGAL_METROLOGY_RULES } from '../../data/regulatoryRules';

export const AboutImpactPage: React.FC = () => {
  const audienceBenefits = [
    {
      audience: 'INSPECTORS',
      tagline: 'Faster screening',
      icon: Users,
      color: 'border-orange-500 text-orange-600 bg-orange-50',
      bullets: [
        'Scan more packages in less time on retail shelves',
        'Standardised preliminary checks eliminating subjectivity',
        'Clear evidence & annotated photo proof to guide follow-up inspections',
      ],
    },
    {
      audience: 'BUSINESSES',
      tagline: 'Early compliance detection',
      icon: Briefcase,
      color: 'border-emerald-500 text-emerald-600 bg-emerald-50',
      bullets: [
        'Catch missing statutory declarations pre-distribution',
        'Reduce manual verification effort in QA / packaging lines',
        'Generate exportable digital compliance PDF audit certificates',
      ],
    },
    {
      audience: 'CONSUMERS',
      tagline: 'Greater transparency',
      icon: ShoppingBag,
      color: 'border-blue-500 text-blue-600 bg-blue-50',
      bullets: [
        'Easier verification of mandatory package declarations',
        'Improved visibility of declared price and net metric quantity',
        'Supports informed purchasing and prevents deceptive packaging',
      ],
    },
    {
      audience: 'GOVERNMENT',
      tagline: 'Digital inspection support',
      icon: Landmark,
      color: 'border-purple-500 text-purple-600 bg-purple-50',
      bullets: [
        'Searchable central scan history and audit trail',
        'Standardised digital compliance records across districts',
        'Foundation for macro compliance analytics and manufacturer trend monitoring',
      ],
    },
  ];

  const feasibilityTable = [
    {
      challenge: 'Blur, glare, and curved packaging surfaces',
      mitigation: 'Automated image-quality check (Laplacian blur score & glare mask) before scanning',
    },
    {
      challenge: 'Small, condensed, or stylised brand typography',
      mitigation: 'OpenCV preprocessing (deskew homography, CLAHE contrast boost, bilateral denoise)',
    },
    {
      challenge: 'Occasional OCR misreads on dot-matrix stamps',
      mitigation: 'Confidence thresholds; ambiguous readings routed as "Needs Review" rather than forced fail',
    },
    {
      challenge: 'Inconsistent declaration formatting across brands',
      mitigation: 'Configurable multi-regex pattern dictionary per declaration type',
    },
    {
      challenge: 'Category-specific legal exceptions',
      mitigation: 'Deterministic 3-tier outcome (NEEDS_REVIEW) with human inspector escalation',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16" id="about-impact-root">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold mb-4">
            <Award className="w-3.5 h-3.5" />
            <span>Smart India Hackathon 2026 • Problem Statement ID: SIH26034</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
            PackScan AI — Legal Metrology Compliance Scanner
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Developed by <strong>Team Vision Forge</strong> under the Theme: <em>Miscellaneous</em> (Category: <em>Software</em>). 
            PackScan AI turns a slow, subjective manual label inspection process into a fast, consistent, and explainable digital screen.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500 font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">TEAM NAME</span>
              <strong className="text-slate-800 text-sm">Vision Forge</strong>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div>
              <span className="text-slate-400 block text-[10px]">CORE MISSION</span>
              <strong className="text-slate-800 text-sm">From manual spot checks &rarr; digital explainable screening</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Statutory Positioning Disclaimer Callout (Verbatim from prompt & SIH PDF) */}
      <div
        id="about-mandatory-disclaimer"
        className="bg-amber-50/90 border-2 border-amber-400/90 rounded-2xl p-6 sm:p-8 text-amber-950 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-900">
              Important Presentation &amp; Statutory Positioning Notice
            </h3>
            <blockquote className="text-sm sm:text-base font-semibold text-amber-950 leading-relaxed italic border-l-4 border-amber-400 pl-4 my-2">
              &ldquo;PackScan AI is an AI-assisted, explainable digital compliance screening tool that supports inspectors and businesses. It does not replace statutory authorities, and does not claim to precisely measure legal physical font size from an arbitrary photo without a reliable physical scale in frame.&rdquo;
            </blockquote>
            <p className="text-xs text-amber-800 leading-relaxed">
              Statutory verification under the Legal Metrology Act, 2009 and Packaged Commodities Rules, 2011 remains within the purview of designated statutory officers. PackScan AI serves as an automated first-level triage system to identify probable non-compliance and preserve auditable photo records.
            </p>
          </div>
        </div>
      </div>

      {/* Four-Audience Impact Grid (Slide 5) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Impact &amp; Benefits: Who Benefits, and How
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Empowering the complete compliance ecosystem from enforcement officers to end consumers
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 hidden sm:inline">
            4-Audience Grid
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {audienceBenefits.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.audience}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    {item.audience}
                  </h3>
                  <div className="text-xs font-bold text-blue-600 mb-4">
                    {item.tagline}
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-600">
                    {item.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Regulatory Basis: Rules 6, 7, and 8 Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <Scale className="w-6 h-6 text-blue-600 shrink-0" />
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Regulatory Basis: Legal Metrology (Packaged Commodities) Rules, 2011
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Statutory foundation governing all pre-packaged commodity labels across India
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {LEGAL_METROLOGY_RULES.map((rule) => (
            <div
              key={rule.ruleNumber}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-2.5 py-1 rounded bg-blue-600 text-white">
                  {rule.ruleNumber}
                </span>
                <span className="text-[10px] font-mono text-slate-400">Rules 2011</span>
              </div>

              <h4 className="text-sm font-extrabold text-slate-900">
                {rule.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {rule.summary}
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Key Mandates:
                </span>
                {rule.keyClauses.map((clause, cIdx) => (
                  <div key={cIdx} className="text-[11px] text-slate-600 leading-relaxed flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{clause}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feasibility & Challenge Mitigation Matrix (Slide 4) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Real-World Feasibility &amp; Mitigation Strategy
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            How PackScan AI overcomes practical label distortion, faint dot-matrix inkjet codes, and brand variance
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-1/3">Real-World Packaging Challenge</th>
                <th className="py-3 px-4">PackScan AI Engineering Mitigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feasibilityTable.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                    <span>{row.challenge}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium leading-relaxed">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {row.mitigation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
