import React from 'react';
import {
  Users,
  Briefcase,
  ShoppingBag,
  Landmark,
  Scale,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { LEGAL_METROLOGY_RULES } from '../../data/regulatoryRules';

export const AboutImpactPage: React.FC = () => {
  const audienceBenefits = [
    {
      audience: 'INSPECTORS',
      tagline: 'Faster field screening',
      icon: Users,
      badgeColor: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
      bullets: [
        'Scan more packages in less time on retail shelves',
        'Standardised preliminary checks eliminating subjectivity',
        'Clear evidence & annotated photo proof to guide follow-up statutory notices',
      ],
    },
    {
      audience: 'BUSINESSES',
      tagline: 'Early compliance assurance',
      icon: Briefcase,
      badgeColor: 'bg-[#F7FEE7] text-[#4D7C0F] border-[#D9F99D]',
      bullets: [
        'Catch missing statutory declarations pre-distribution',
        'Reduce manual verification effort in QA / packaging lines',
        'Generate exportable digital compliance PDF audit certificates',
      ],
    },
    {
      audience: 'CONSUMERS',
      tagline: 'Greater label transparency',
      icon: ShoppingBag,
      badgeColor: 'bg-[#F7F8F5] text-[#1F2937] border-[#D1D5DB]',
      bullets: [
        'Easier verification of mandatory package declarations',
        'Improved visibility of declared price and net metric quantity',
        'Supports informed purchasing and prevents deceptive packaging',
      ],
    },
    {
      audience: 'REGULATORY BODIES',
      tagline: 'Standardized digital oversight',
      icon: Landmark,
      badgeColor: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
      bullets: [
        'Searchable central scan history and tamper-evident audit trail',
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
      <div className="bg-white rounded-3xl border border-[#D1D5DB] shadow-2xs p-8 sm:p-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-xs font-bold mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
            <span>Legal Metrology (Packaged Commodities) Rules, 2011 — Compliance Verification Platform</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1F2937] tracking-tight mb-4">
            PackScan.Ai — Statutory Compliance Screener
          </h1>

          <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
            PackScan.Ai is designed to transform manual packaging inspection into a rapid, consistent, and explainable digital process. 
            By uniting computer vision preprocessing, localized optical character extraction, and a deterministic statutory rule engine, 
            it empowers field enforcement teams and commercial packaging auditors with immediate statutory verification.
          </p>

          <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-[#D1D5DB] text-xs text-[#6B7280]">
            <div>
              <span className="text-[#6B7280] block text-[10px] uppercase font-bold tracking-wider">PLATFORM INITIATIVE</span>
              <strong className="text-[#1F2937] text-sm">PackScan Systems</strong>
            </div>
            <div className="w-px h-8 bg-[#D1D5DB]"></div>
            <div>
              <span className="text-[#6B7280] block text-[10px] uppercase font-bold tracking-wider">OPERATIONAL OBJECTIVE</span>
              <strong className="text-[#1F2937] text-sm">Manual spot-checks &rarr; digital explainable screening</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Statutory Positioning Disclaimer Callout */}
      <div
        id="about-mandatory-disclaimer"
        className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-6 sm:p-8 text-[#1F2937] shadow-2xs"
      >
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-[#B45309] shrink-0 mt-1" />
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#B45309]">
              Statutory Positioning &amp; Scope Notice
            </h3>
            <blockquote className="text-sm sm:text-base font-semibold text-[#1F2937] leading-relaxed italic border-l-4 border-[#F59E0B] pl-4 my-2">
              &ldquo;PackScan.Ai is an AI-assisted, explainable digital compliance screening tool that supports inspectors and businesses. It does not replace statutory authorities, and does not claim to precisely measure legal physical font size from an arbitrary photo without a reliable physical scale in frame.&rdquo;
            </blockquote>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Statutory verification under the Legal Metrology Act, 2009 and Packaged Commodities Rules, 2011 remains within the purview of designated statutory officers. PackScan.Ai serves as an automated first-level triage system to identify probable non-compliance and preserve auditable photo records.
            </p>
          </div>
        </div>
      </div>

      {/* Four-Audience Impact Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">
              Impact &amp; Operational Benefits
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563]">
              Empowering the complete compliance ecosystem from enforcement officers to commercial enterprises
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#166534] bg-[#F0FDF4] px-3 py-1 rounded-full border border-[#BBF7D0] hidden sm:inline">
            Ecosystem Impact
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {audienceBenefits.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.audience}
                className="bg-white rounded-2xl border border-[#D1D5DB] p-6 shadow-2xs flex flex-col justify-between hover:border-stone-400 transition-all"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${item.badgeColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-base font-extrabold text-[#1F2937] tracking-tight">
                    {item.audience}
                  </h3>
                  <div className="text-xs font-bold text-[#166534] mb-4">
                    {item.tagline}
                  </div>

                  <ul className="space-y-2.5 text-xs text-[#4B5563]">
                    {item.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#166534] mt-1.5 shrink-0"></span>
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
      <div className="bg-white rounded-3xl border border-[#D1D5DB] shadow-2xs p-6 sm:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <Scale className="w-6 h-6 text-[#166534] shrink-0" />
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">
              Regulatory Basis: Legal Metrology (Packaged Commodities) Rules, 2011
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563]">
              Statutory foundation governing pre-packaged commodity labels across India
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {LEGAL_METROLOGY_RULES.map((rule) => (
            <div
              key={rule.ruleNumber}
              className="p-5 rounded-2xl bg-[#F7F8F5] border border-[#D1D5DB] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-[#166534] text-white">
                  {rule.ruleNumber}
                </span>
                <span className="text-[10px] font-mono text-[#6B7280]">Rules 2011</span>
              </div>

              <h4 className="text-sm font-extrabold text-[#1F2937]">
                {rule.title}
              </h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                {rule.summary}
              </p>

              <div className="space-y-2 pt-2 border-t border-[#D1D5DB] text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                  Key Mandates:
                </span>
                {rule.keyClauses.map((clause, cIdx) => (
                  <div key={cIdx} className="text-[11px] text-[#4B5563] leading-relaxed flex items-start gap-1.5">
                    <span className="text-[#166534] font-bold">•</span>
                    <span>{clause}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feasibility & Challenge Mitigation Matrix */}
      <div className="bg-white rounded-3xl border border-[#D1D5DB] shadow-2xs p-6 sm:p-10 space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">
            Real-World Feasibility &amp; Mitigation Strategy
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563]">
            How PackScan.Ai addresses practical packaging conditions, curved pouches, and brand variances
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1F2937]">
            <thead className="bg-[#F7F8F5] text-[11px] font-extrabold uppercase tracking-wider text-[#4B5563] border-b border-[#D1D5DB]">
              <tr>
                <th className="py-3 px-4 w-1/3">Packaging Challenge</th>
                <th className="py-3 px-4">Technical Mitigation Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1D5DB]">
              {feasibilityTable.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#F7F8F5] transition-colors">
                  <td className="py-3 px-4 font-bold text-[#1F2937] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] shrink-0"></span>
                    <span>{row.challenge}</span>
                  </td>
                  <td className="py-3 px-4 text-[#4B5563] font-medium leading-relaxed">
                    <span className="inline-flex items-center gap-1.5 text-[#15803D] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
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
