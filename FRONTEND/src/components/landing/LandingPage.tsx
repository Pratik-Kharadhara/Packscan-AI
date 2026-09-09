import React, { useState } from 'react';
import {
  Scan,
  ArrowRight,
  CheckCircle2,
  Scale,
  Building2,
  Calendar,
  IndianRupee,
  MessageSquare,
  Package,
  Target,
  FileCheck2,
  ChevronRight,
  ShieldAlert,
  Users,
  Briefcase,
  ShoppingBag,
  Landmark,
  Sparkles,
  AlertTriangle,
  Layers,
  Eye,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { NavPage } from '../common/Navbar';
import { ThreeHeroScanner } from '../common/ThreeHeroScanner';
import { ThreePackageInspector } from '../common/ThreePackageInspector';
import { TiltedCard } from '../common/TiltedCard';
import { MagnificationDock, type DockItemData } from '../common/MagnificationDock';
import { GlowButton } from '../common/GlowButton';
import {
  SAMPLE_COMPLIANT,
  SAMPLE_NEEDS_REVIEW,
  SAMPLE_NON_COMPLIANT,
} from '../../data/mockScans';

interface LandingPageProps {
  onNavigate: (page: NavPage) => void;
  onQuickPreset: (presetId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onQuickPreset }) => {
  // Selected sample for the 3D Parallax TiltedCard inspection workbench
  const [selectedParallaxKey, setSelectedParallaxKey] = useState<
    'needs_review' | 'compliant' | 'non_compliant'
  >('needs_review');

  const parallaxSamples = {
    needs_review: {
      name: 'PureGlow Ayurvedic Face Care Moisturizer',
      brand: 'PureGlow Herbal Labs',
      category: 'Personal Care',
      ruleOutcome: 'NEEDS REVIEW',
      statusColor: 'text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]',
      statusDot: 'bg-[#F59E0B]',
      image: SAMPLE_NEEDS_REVIEW.imageUrl,
      presetId: 'needs_review',
      tooltip: 'Rule 6(1)(g) Consumer Care Clause Missing • Tilt 3D Parallax',
      declarations: [
        { label: 'Net Quantity', val: '500 g', status: 'pass' },
        { label: 'Retail Price', val: '₹349 (incl. taxes)', status: 'pass' },
        { label: 'Mfg Date', val: '08/2026 (Inkjet dot)', status: 'review' },
        { label: 'Consumer Care', val: 'Toll-free / email missing', status: 'fail' },
      ],
      finding:
        'Optical coordinate localization identified 5 of 6 fields. Consumer grievance cell lacks mandatory statutory address/email required under Rule 6(1)(g).',
    },
    compliant: {
      name: 'NatureHimalaya Organic Pink Rock Salt',
      brand: 'NatureHimalaya Pure Foods',
      category: 'Food & Beverages',
      ruleOutcome: 'COMPLIANT',
      statusColor: 'text-[#15803D] bg-[#F0FDF4] border-[#BBF7D0]',
      statusDot: 'bg-[#22C55E]',
      image: SAMPLE_COMPLIANT.imageUrl,
      presetId: 'compliant',
      tooltip: 'All 6 Declarations Rule 6 Compliant • Tilt 3D Parallax',
      declarations: [
        { label: 'Net Quantity', val: '1000 g (SI Unit)', status: 'pass' },
        { label: 'Retail Price', val: '₹145 (incl. of all taxes)', status: 'pass' },
        { label: 'Mfg Date', val: '07/2026', status: 'pass' },
        { label: 'Consumer Care', val: 'care@naturehimalaya.in', status: 'pass' },
      ],
      finding:
        'Perfect statutory alignment. All 6 mandatory declarations are conspicuously displayed with valid SI metric units and inclusive tax grouping.',
    },
    non_compliant: {
      name: 'CrunchyBites Roasted Protein Namkeen',
      brand: 'CrunchyBites Foodworks',
      category: 'Food & Beverages',
      ruleOutcome: 'NON-COMPLIANT',
      statusColor: 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]',
      statusDot: 'bg-[#EF4444]',
      image: SAMPLE_NON_COMPLIANT.imageUrl,
      presetId: 'non_compliant',
      tooltip: 'Rule 6(1)(f) Tax Clause Omitted • Tilt 3D Parallax',
      declarations: [
        { label: 'Net Quantity', val: '250 g', status: 'pass' },
        { label: 'Retail Price', val: 'Rs. 95 [NO TAX CLAUSE]', status: 'fail' },
        { label: 'Mfg Date', val: '06/2026', status: 'pass' },
        { label: 'Packer Address', val: 'Full premises + PIN', status: 'pass' },
      ],
      finding:
        'Statutory violation detected under Rule 6(1)(f). Retail sale price is stated without the compulsory "(inclusive of all taxes)" statement.',
    },
  };

  const currentParallaxData = parallaxSamples[selectedParallaxKey];

  const verifiedFields = [
    {
      title: 'Manufacturer / Packer Details',
      desc: 'Registered name and complete physical premises address with postal PIN code.',
      rule: 'Rule 6(1)(a) & (b)',
      icon: Building2,
      metric: 'PIN Format & Physical Geo-check',
    },
    {
      title: 'Commodity Identity',
      desc: 'Generic or common name of the packaged commodity displayed on the principal panel.',
      rule: 'Rule 6(1)(c)',
      icon: Package,
      metric: 'Conspicuous Placement',
    },
    {
      title: 'Net Quantity (SI Units)',
      desc: 'Accurate net content stated strictly in standard SI metric units (g, kg, ml, l).',
      rule: 'Rule 6(1)(d)',
      icon: Scale,
      metric: 'Metric Symbol Verification',
    },
    {
      title: 'Mfg. / Pre-pack Date',
      desc: 'Month and year of manufacture, pre-packing, or import formatted as MM/YYYY.',
      rule: 'Rule 6(1)(e)',
      icon: Calendar,
      metric: 'Month/Year Date Syntax',
    },
    {
      title: 'Retail Sale Price (MRP)',
      desc: 'Maximum Retail Price with compulsory "(inclusive of all taxes)" statement.',
      rule: 'Rule 6(1)(f)',
      icon: IndianRupee,
      metric: 'Tax Clause Mandatory Grouping',
    },
    {
      title: 'Consumer Complaint Redressal',
      desc: 'Designated contact officer, postal address, customer telephone, and email.',
      rule: 'Rule 6(1)(g)',
      icon: MessageSquare,
      metric: '4-Point Grievance Contact Check',
    },
  ];

  const impactCards = [
    {
      role: 'FIELD INSPECTORS',
      tagline: 'Accelerated On-Shelf Screening',
      metric: '92% Faster',
      metricLabel: 'First-Pass Audit Time',
      icon: Users,
      badgeColor: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
      bullets: [
        'Standardized on-shelf screening eliminating subjective officer variance',
        'Instant sub-second verification across all 6 mandatory declarations',
        'Annotated optical proof ready for follow-up statutory inquiry notices',
      ],
    },
    {
      role: 'BRANDS & PACKERS',
      tagline: 'Pre-Market Statutory Assurance',
      metric: '100% Pre-Check',
      metricLabel: 'Distribution Compliance',
      icon: Briefcase,
      badgeColor: 'bg-[#F7FEE7] text-[#4D7C0F] border-[#D9F99D]',
      bullets: [
        'Identifies missing declaration clauses prior to batch distribution',
        'Direct QA pipeline integration for automated packaging line verification',
        'Tamper-evident legal compliance certificates archived for regulatory review',
      ],
    },
    {
      role: 'CONSUMER PROTECTION',
      tagline: 'Transparent Pricing & Quantities',
      metric: 'Zero Hidden Taxes',
      metricLabel: 'Mandatory Tax Clause',
      icon: ShoppingBag,
      badgeColor: 'bg-[#F7F8F5] text-[#1F2937] border-[#D1D5DB]',
      bullets: [
        'Enforces strict "(inclusive of all taxes)" grouping with retail sale price',
        'Confirms metric SI unit standardization (g, kg, ml) preventing deceptive sizing',
        'Direct access to consumer grievance redressal phone, email, and postal address',
      ],
    },
    {
      role: 'REGULATORY AUTHORITIES',
      tagline: 'Centralized Digital Oversight',
      metric: 'Court-Ready',
      metricLabel: 'Deterministic Evidence',
      icon: Landmark,
      badgeColor: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
      bullets: [
        'Centralized audit history with immutable timestamps and inspection logs',
        'Transparent rule algorithms eliminating opaque black-box legal liabilities',
        'Macro analytics across product categories and geographical packaging batches',
      ],
    },
  ];

  // Soft spring transitions for smooth, professional entrance animations
  const softSpringTransition = {
    type: 'spring' as const,
    stiffness: 105,
    damping: 22,
    mass: 0.9,
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ...softSpringTransition,
        duration: 0.75,
      },
    },
  };

  const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.08,
      },
    },
  };

  const cardSpringVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: softSpringTransition,
    },
  };

  // Magnification Dock showcase items
  const landingDockItems: DockItemData[] = [
    {
      icon: <Scan className="w-5 h-5 text-[#166534]" />,
      label: 'Open Verification Portal',
      onClick: () => onNavigate('scan'),
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-[#15803D]" />,
      label: 'Sample: Compliant Package',
      onClick: () => onQuickPreset('compliant'),
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-[#B45309]" />,
      label: 'Sample: Needs Review',
      onClick: () => onQuickPreset('needs_review'),
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-[#B91C1C]" />,
      label: 'Sample: Non-Compliant',
      onClick: () => onQuickPreset('non_compliant'),
    },
    {
      icon: <FileCheck2 className="w-5 h-5 text-[#1F2937]" />,
      label: 'View Historical Logs',
      onClick: () => onNavigate('history'),
    },
    {
      icon: <Scale className="w-5 h-5 text-[#166534]" />,
      label: 'Rule 6 Regulations Guide',
      onClick: () => onNavigate('about'),
    },
  ];

  return (
    <div className="space-y-20 sm:space-y-28 pb-20" id="landing-page-root">
      {/* 1. Hero Section: Editorial Display with Three.js Clay Scanner & Glow CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        className="rounded-3xl bg-[#FFFFFF] border border-[#D1D5DB] p-6 sm:p-10 lg:p-14 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Oversized Tight-Tracked Typography */}
          <div className="lg:col-span-7 space-y-6">
            {/* Framework Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-bold tracking-tight">
              <span className="w-2 h-2 rounded-full bg-[#166534]"></span>
              <span>Legal Metrology Rules, 2011</span>
              <span className="text-[#BBF7D0]">•</span>
              <span className="font-mono text-[11px]">Rule 6, 7 &amp; 8 Standards</span>
            </div>

            {/* Display Headline with Two-Tone Clause & Tight Letter-Spacing (-0.035em) */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.035em] text-[#1F2937] leading-[1.04] font-['Inter'] no-underline">
              Automated Package Compliance{' '}
              <span className="text-[#166534]">Verification Screening</span>
            </h1>

            <p className="font-mono text-[16px] leading-[22.25px] font-bold text-[#4B5563] max-w-xl">
              PackScan.Ai provides explainable, first-level digital screening of packaged commodities. By pairing localized OCR bounding coordinates with a deterministic statutory rule engine, it empowers inspectors and brand auditors to verify all 6 mandatory declarations in seconds.
            </p>

            {/* Interactive Call-to-Action Button with Right-Arrow SVG & Cursor Glow Effect */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <GlowButton
                id="hero-scan-cta"
                onClick={() => onNavigate('scan')}
                icon={<Scan className="w-4 h-4" />}
                showArrow={true}
                variant="primary"
                glowColor="rgba(34, 197, 94, 0.45)"
              >
                Verify Package Label
              </GlowButton>

              <GlowButton
                id="hero-demo-cta"
                onClick={() => onQuickPreset('needs_review')}
                variant="secondary"
                showArrow={false}
                glowColor="rgba(22, 101, 52, 0.18)"
              >
                Load Sample Evaluation
              </GlowButton>
            </div>

            {/* Proof-line Strip */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#6B7280] pt-4 border-t border-[#D1D5DB]">
              <span className="flex items-center gap-2 font-medium text-[#1F2937]">
                <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                6 Rule 6 Declarations
              </span>
              <span className="flex items-center gap-2 font-medium text-[#1F2937]">
                <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                3-Tier Explainable Triage
              </span>
              <span className="flex items-center gap-2 font-medium text-[#1F2937]">
                <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                Court-Ready PDF Audits
              </span>
            </div>
          </div>

          {/* Right Column: Three.js Hero 3D Scanner (Scroll & Mouse Animated) */}
          <div className="lg:col-span-5">
            <ThreeHeroScanner />
          </div>
        </div>
      </motion.section>

      {/* 2. Interactive 3D Parallax Packaging Audit Inspector (Integrated TiltedCard Component) */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        className="rounded-3xl bg-[#FFFFFF] border border-[#D1D5DB] p-6 sm:p-10 lg:p-12 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]"
      >
        <div className="space-y-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D1D5DB] pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-bold font-mono">
                <Layers className="w-3.5 h-3.5" />
                <span>3D PARALLAX DEPTH INSPECTION</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.03em] text-[#1F2937] mt-2">
                Inspect Package Declarations in <span className="text-[#166534]">3D Parallax Space</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#4B5563] mt-1 max-w-2xl">
                Hover and tilt to explore packaging surface depth. Physics-based motion and cursor-following tooltips verify statutory declaration clarity and spatial legibility.
              </p>
            </div>

            {/* Preset Selector Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedParallaxKey('needs_review')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedParallaxKey === 'needs_review'
                    ? 'bg-[#B45309] text-white shadow-xs'
                    : 'bg-[#F7F8F5] text-[#4B5563] hover:text-[#1F2937] border border-[#D1D5DB]'
                }`}
              >
                Needs Review
              </button>
              <button
                type="button"
                onClick={() => setSelectedParallaxKey('compliant')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedParallaxKey === 'compliant'
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'bg-[#F7F8F5] text-[#4B5563] hover:text-[#1F2937] border border-[#D1D5DB]'
                }`}
              >
                100% Compliant
              </button>
              <button
                type="button"
                onClick={() => setSelectedParallaxKey('non_compliant')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedParallaxKey === 'non_compliant'
                    ? 'bg-[#B91C1C] text-white shadow-xs'
                    : 'bg-[#F7F8F5] text-[#4B5563] hover:text-[#1F2937] border border-[#D1D5DB]'
                }`}
              >
                Non-Compliant
              </button>
            </div>
          </div>

          {/* 3D Tilted Card + Real-time Statutory Analysis Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* TiltedCard Column */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[340px] flex justify-center">
                <TiltedCard
                  imageSrc={currentParallaxData.image}
                  altText={currentParallaxData.name}
                  captionText={currentParallaxData.tooltip}
                  containerHeight="440px"
                  containerWidth="100%"
                  imageHeight="380px"
                  imageWidth="280px"
                  scaleOnHover={1.12}
                  rotateAmplitude={16}
                  showTooltip={true}
                  displayOverlayContent={true}
                  overlayContent={
                    <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#D1D5DB] shadow-lg flex items-center gap-2 pointer-events-none">
                      <span className={`w-2 h-2 rounded-full ${currentParallaxData.statusDot} animate-pulse`} />
                      <span className="text-[11px] font-bold text-[#1F2937]">
                        {currentParallaxData.ruleOutcome} • Z: 30px Depth
                      </span>
                    </div>
                  }
                />
              </div>
            </div>

            {/* Statutory Details Column */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                    {currentParallaxData.category} • {currentParallaxData.brand}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-[#1F2937] tracking-tight mt-0.5">
                    {currentParallaxData.name}
                  </h3>
                </div>

                <span
                  className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border ${currentParallaxData.statusColor}`}
                >
                  {currentParallaxData.ruleOutcome}
                </span>
              </div>

              {/* Explanatory audit card */}
              <div className="p-4 rounded-2xl bg-[#F7F8F5] border border-[#D1D5DB] text-xs text-[#4B5563] leading-relaxed">
                <strong className="text-[#1F2937] block mb-1">Optical Evaluation Finding:</strong>
                {currentParallaxData.finding}
              </div>

              {/* Key Audited Declaration Points */}
              <div className="grid grid-cols-2 gap-3">
                {currentParallaxData.declarations.map((dec) => (
                  <div
                    key={dec.label}
                    className="p-3 bg-white rounded-xl border border-[#D1D5DB] flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] text-[#6B7280] font-semibold block">{dec.label}</span>
                      <span className="text-xs font-bold text-[#1F2937]">{dec.val}</span>
                    </div>
                    {dec.status === 'pass' && (
                      <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                    )}
                    {dec.status === 'review' && (
                      <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
                    )}
                    {dec.status === 'fail' && (
                      <ShieldAlert className="w-4 h-4 text-[#B91C1C] shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Interactive CTA to test this package */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <GlowButton
                  onClick={() => onQuickPreset(currentParallaxData.presetId)}
                  icon={<Zap className="w-4 h-4" />}
                  variant="primary"
                  showArrow={true}
                  glowColor="rgba(34, 197, 94, 0.4)"
                >
                  Verify {currentParallaxData.ruleOutcome} Sample in Engine
                </GlowButton>

                <button
                  type="button"
                  onClick={() => onNavigate('scan')}
                  className="text-xs font-bold text-[#166534] hover:text-[#14532D] px-4 py-3 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] transition-colors"
                >
                  Upload Custom Packaging
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. Three.js Interactive Multi-Commodity Showcase */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
      >
        <ThreePackageInspector />
      </motion.section>

      {/* 5. The 6 Statutory Declarations: Mini-Tile Grid (Features Grid with Staggered Spring Reveal) */}
      <section className="space-y-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="text-center max-w-3xl mx-auto space-y-2"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-xs font-bold font-mono uppercase">
            Statutory Scope
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[#1F2937]">
            The 6 Mandatory Declarations <span className="text-[#166534]">Audited</span>
          </h2>
          <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
            Directly mapped to Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011. Every declaration undergoes spatial localization, syntax parsing, and statutory compliance checks.
          </p>
        </motion.div>

        {/* 6-Item Grid with 18px Radius, Hairline Inset Style, Staggered Spring Reveal */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {verifiedFields.map((field) => {
            const Icon = field.icon;
            return (
              <motion.div
                key={field.title}
                variants={cardSpringVariants}
                whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
                className="bg-[#FFFFFF] rounded-2xl border border-[#D1D5DB] p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] hover:border-[#166534] hover:shadow-xs transition-colors flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#166534] bg-[#F0FDF4] px-2.5 py-1 rounded-full border border-[#BBF7D0]">
                      {field.rule}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#1F2937] tracking-tight">
                      {field.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#4B5563] mt-2 leading-relaxed">
                      {field.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#D1D5DB] flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span className="font-mono text-[#166534] font-medium">{field.metric}</span>
                  <span className="font-bold text-[#1F2937]">Verified</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* 5. Alternating Feature Band 1: Spatial OCR & Coordinate Localization (50/50 Split) */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        className="rounded-3xl bg-[#FFFFFF] border border-[#D1D5DB] p-6 sm:p-10 lg:p-12 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Media Column: Simulated OCR Spatial Grid */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={softSpringTransition}
            className="lg:col-span-6 bg-[#F7F8F5] rounded-2xl border border-[#D1D5DB] p-6 space-y-4 font-mono text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#D1D5DB]">
              <span className="font-bold text-[#1F2937] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#166534]" />
                Spatial OCR Bounding Box Stream
              </span>
              <span className="text-[10px] text-[#166534] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
                Optical Preprocessing
              </span>
            </div>

            {/* Coordinate Stream Simulation */}
            <div className="space-y-2.5">
              <div className="p-3 bg-white rounded-xl border border-[#BBF7D0] flex items-center justify-between">
                <div>
                  <span className="text-[#166534] font-bold block text-[11px]">DECLARATION_MRP</span>
                  <span className="text-[#4B5563] text-[10px]">Text: &quot;MRP Rs. 240.00 (incl. of all taxes)&quot;</span>
                </div>
                <span className="text-[10px] text-[#6B7280]">x:142 y:388 w:210 h:44</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#BBF7D0] flex items-center justify-between">
                <div>
                  <span className="text-[#166534] font-bold block text-[11px]">NET_QUANTITY</span>
                  <span className="text-[#4B5563] text-[10px]">Text: &quot;Net Wt: 500 g&quot; (Rule 6(1)(d))</span>
                </div>
                <span className="text-[10px] text-[#6B7280]">x:088 y:520 w:130 h:38</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#BBF7D0] flex items-center justify-between">
                <div>
                  <span className="text-[#166534] font-bold block text-[11px]">MANUFACTURE_DATE</span>
                  <span className="text-[#4B5563] text-[10px]">Text: &quot;Mfg: 08/2026&quot;</span>
                </div>
                <span className="text-[10px] text-[#6B7280]">x:320 y:518 w:115 h:36</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-[#4B5563]">
              <span>Confidence Threshold: &ge;85.0%</span>
              <span className="text-[#166534] font-bold">Extraction Latency: 420ms</span>
            </div>
          </motion.div>

          {/* Text Column: Headline-md Two-Tone */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={softSpringTransition}
            className="lg:col-span-6 space-y-4"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-xs font-bold font-mono">
              RULE 7 &amp; 8 GEOMETRY
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.03em] text-[#1F2937] leading-tight">
              Sub-Pixel Optical Localization{' '}
              <span className="text-[#166534]">With Normalized Coordinates</span>
            </h2>

            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
              Standard OCR engines simply dump unreferenced raw text. PackScan.Ai records explicit boundary boxes `[x, y, w, h]` for every identified declaration, enabling visual verification on physical packaging.
            </p>

            <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-[#1F2937]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                <span>Multi-angle orientation correction &amp; contrast normalization</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                <span>Dot-matrix inkjet date stamp recognition algorithms</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                <span>Zero black-box hallucination — raw OCR always preserved</span>
              </li>
            </ul>

            <div className="pt-2">
              <GlowButton
                onClick={() => onNavigate('scan')}
                variant="outline"
                size="sm"
                showArrow={true}
                glowColor="rgba(22, 101, 52, 0.2)"
              >
                Launch Scanner Engine
              </GlowButton>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* 6. Alternating Feature Band 2: Deterministic Rule Engine & Explainable Triage (50/50 Split) */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        className="rounded-3xl bg-[#FFFFFF] border border-[#D1D5DB] p-6 sm:p-10 lg:p-12 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Text Column */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={softSpringTransition}
            className="lg:col-span-6 space-y-4 order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-xs font-bold font-mono">
              DETERMINISTIC EVALUATION
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.03em] text-[#1F2937] leading-tight">
              Explainable 3-Tier Outcomes{' '}
              <span className="text-[#166534]">Never a Blind Pass/Fail</span>
            </h2>

            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
              Every verification decision is structured into an explainable audit trail. Ambiguous readings or damaged stampings are flagged for human review with actionable remedies rather than penalizing legitimate trade.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-center">
                <span className="text-xs font-bold text-[#15803D] block">COMPLIANT</span>
                <span className="text-[10px] text-[#4B5563]">All 6 Rules Passed</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-center">
                <span className="text-xs font-bold text-[#B45309] block">NEEDS REVIEW</span>
                <span className="text-[10px] text-[#4B5563]">Low Confidence / Ambiguous</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-center">
                <span className="text-xs font-bold text-[#B91C1C] block">NON-COMPLIANT</span>
                <span className="text-[10px] text-[#4B5563]">Statutory Omission</span>
              </div>
            </div>

            <div className="pt-2">
              <GlowButton
                onClick={() => onNavigate('history')}
                variant="outline"
                size="sm"
                showArrow={true}
                glowColor="rgba(22, 101, 52, 0.2)"
              >
                View Historical Audit Logs
              </GlowButton>
            </div>
          </motion.div>

          {/* Media Column: Statutory Decision Matrix Preview */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={softSpringTransition}
            className="lg:col-span-6 bg-[#F7F8F5] rounded-2xl border border-[#D1D5DB] p-6 space-y-4 order-1 lg:order-2"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#D1D5DB]">
              <span className="font-bold text-xs text-[#1F2937] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#166534]" />
                Rule 6 Deterministic Evaluation Hierarchy
              </span>
              <span className="text-[10px] font-mono text-[#6B7280]">v2026.1</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#D1D5DB] flex items-center justify-between">
                <div>
                  <strong className="text-[#1F2937] block">Level 1: Presence Verification</strong>
                  <span className="text-[11px] text-[#4B5563]">Detects if declaration keyword or equivalent synonym exists.</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#D1D5DB] flex items-center justify-between">
                <div>
                  <strong className="text-[#1F2937] block">Level 2: Format &amp; Clause Validation</strong>
                  <span className="text-[11px] text-[#4B5563]">Tests regex patterns (tax clause, valid SI metric units, postal PIN).</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#D1D5DB] flex items-center justify-between">
                <div>
                  <strong className="text-[#1F2937] block">Level 3: Confidence &amp; Ambiguity Gate</strong>
                  <span className="text-[11px] text-[#4B5563]">Routes low-clarity stamps to human inspector triage.</span>
                </div>
                <ShieldAlert className="w-4 h-4 text-[#B45309]" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* 7. Inspector Interactive Magnification Dock Showcase */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        className="rounded-3xl bg-[#F7F8F5] border border-[#D1D5DB] p-6 sm:p-10 text-center space-y-6"
      >
        <div className="max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-xs font-bold font-mono uppercase">
            Quick Navigation Dock
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
            Fluid Inspector Command Deck
          </h3>
          <p className="text-xs sm:text-sm text-[#4B5563]">
            Experience macOS-style spring physics, cursor magnification, and GSAP rising background animations to jump directly into scans and verified demo presets.
          </p>
        </div>

        {/* Embedded Magnification Dock */}
        <div className="pt-2 pb-4 flex justify-center">
          <MagnificationDock
            logo={<Sparkles className="w-4 h-4 text-white" />}
            logoAlt="PackScan Command Hub"
            onLogoClick={() => onNavigate('scan')}
            items={landingDockItems}
            panelHeight={64}
            baseItemSize={48}
            magnification={72}
            distance={190}
            baseColor="#166534"
          />
        </div>
      </motion.section>

      {/* 8. Ecosystem & Multi-Stakeholder Impact Cards (Staggered Spring Reveal) */}
      <section className="space-y-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="text-center max-w-3xl mx-auto space-y-2"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-xs font-bold font-mono uppercase">
            Ecosystem Value
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[#1F2937]">
            Empowering Every <span className="text-[#166534]">Stakeholder</span>
          </h2>
          <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
            From shelf-side field inspections to automated packaging quality assurance, PackScan.Ai delivers consistent, verifiable compliance outcomes across the entire supply chain.
          </p>
        </motion.div>

        {/* 4 Impact Cards Grid with Staggered Spring Reveal & Interactive Hover */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {impactCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.role}
                variants={cardSpringVariants}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
                className="bg-[#FFFFFF] rounded-2xl border border-[#D1D5DB] p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] hover:border-[#166534] hover:shadow-sm transition-colors flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${card.badgeColor}`}>
                      {card.role}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#1F2937] tracking-tight">
                      {card.tagline}
                    </h3>

                    {/* Metric Highlight */}
                    <div className="mt-3 p-2.5 rounded-xl bg-[#F7F8F5] border border-[#D1D5DB]">
                      <div className="text-lg font-black text-[#166534] tracking-tight">
                        {card.metric}
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        {card.metricLabel}
                      </div>
                    </div>
                  </div>

                  {/* Bullet Highlights */}
                  <ul className="space-y-2 pt-2 text-xs text-[#4B5563]">
                    {card.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#166534] shrink-0 mt-0.5" />
                        <span className="leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-3 border-t border-[#D1D5DB] flex items-center justify-between text-[11px] text-[#166534] font-semibold">
                  <span>Verified Impact</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* 9. Editorial Action Banner (Closing Frame with Spring Reveal & Glow CTA) */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        className="rounded-3xl bg-[#166534] text-white p-8 sm:p-12 lg:p-14 shadow-md flex flex-col sm:flex-row items-center justify-between gap-8"
      >
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#BBF7D0]">
            Ready For Packaging Label Audits
          </span>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.03em] leading-tight">
            Perform Instant Rule 6 Compliance Verification
          </h3>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
            Upload any front, back, or multi-panel packaging photograph to generate explainable statutory audit findings with exportable legal PDF reports.
          </p>
        </div>

        <GlowButton
          onClick={() => onNavigate('scan')}
          variant="secondary"
          size="lg"
          icon={<Scan className="w-5 h-5 text-[#166534]" />}
          showArrow={true}
          glowColor="rgba(22, 101, 52, 0.25)"
        >
          Launch Verification Engine
        </GlowButton>
      </motion.section>
    </div>
  );
};
