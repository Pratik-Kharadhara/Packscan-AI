import React, { useState } from 'react';
import {
  Camera,
  Search,
  CheckCircle2,
  MessageSquare,
  FileText,
  Sliders,
  Cpu,
  ShieldCheck,
  UserCheck,
  Layers,
  Database,
  Terminal,
  Code2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { PipelineStepFlow } from '../common/PipelineStepFlow';

export const HowItWorksPage: React.FC = () => {
  const [selectedPipelineStep, setSelectedPipelineStep] = useState(0);

  const techStack = [
    { name: 'OpenCV', role: 'Computer Vision Preprocessing (Crop, Deskew, Contrast, Denoise)', tag: 'CV Pipeline' },
    { name: 'EasyOCR / Tesseract', role: 'Multi-lingual OCR & Bounding Box Spatial Coordinates', tag: 'Text Extraction' },
    { name: 'Python Rule Engine', role: 'Transparent Rule Parser (Packaged Commodities Rules 2011)', tag: 'Compliance Logic' },
    { name: 'Streamlit-Origin Backend', role: 'Fast Python prototype backend for edge & cloud deployment', tag: 'Architecture' },
    { name: 'SQLite', role: 'Local audit trail, searchable scan logs & historical persistence', tag: 'Data Storage' },
    { name: 'ReportLab', role: 'Statutory PDF inspection certificates with digital signatures', tag: 'Reporting' },
  ];

  const pipelineSteps = [
    {
      step: 1,
      name: 'Image Capture & Quality Check',
      tech: 'OpenCV (Python)',
      icon: Camera,
      badge: 'Level 0 Pre-Check',
      description:
        'The package label image is ingested via camera or upload. An automated OpenCV image quality gate checks for motion blur using Laplacian variance, specular glare spots on plastic foil, and boundary edge cropping before running extraction.',
      details: [
        'Calculates blur score via variance of the Laplacian (cv2.Laplacian)',
        'Flags over-exposed glare highlights on glossy pouch surfaces',
        'Ensures the principal display panel is sufficiently framed',
      ],
      sampleOutput: 'Blur Variance: 284.5 (Clear) • Glare Mask: 1.2% (Accepted)',
    },
    {
      step: 2,
      name: 'Computer Vision Preprocessing',
      tech: 'OpenCV Bilateral & CLAHE',
      icon: Sliders,
      badge: 'Contrast & Deskew',
      description:
        'Raw packaging photos suffer from perspective tilt, curved pouch angles, and shadows. OpenCV normalizes the image geometry and enhances legibility of low-contrast typography.',
      details: [
        'Perspective transform (homography) to deskew angled captures',
        'CLAHE (Contrast Limited Adaptive Histogram Equalization) for shadowy labels',
        'Bilateral filtering to preserve sharp character edges while eliminating noise',
        'Multi-scale Otsu adaptive thresholding for dot-matrix ink stamps',
      ],
      sampleOutput: 'Applied 4-point homography deskew + 2.5x contrast boost',
    },
    {
      step: 3,
      name: 'OCR & Bounding Box Extraction',
      tech: 'EasyOCR & Tesseract 5',
      icon: Search,
      badge: 'Spatial Localization',
      description:
        'Extracts localized text segments along with exact 2D bounding boxes (x, y, w, h) and word-level softmax confidence scores. Supports multi-font packaging and varied Indian font layouts.',
      details: [
        'Extracts text coordinates and word bounding polygons',
        'Calculates per-character and per-field confidence percentages',
        'Supports stylized decorative typography common on consumer goods',
      ],
      sampleOutput: 'Detected 42 text regions; Average token confidence: 91.4%',
    },
    {
      step: 4,
      name: 'Field Identification',
      tech: 'Regex & Named Entity Normalization',
      icon: Cpu,
      badge: 'Pattern Matching',
      description:
        'Normalizes and maps extracted text blobs into the 6 mandatory statutory declarations defined by India’s Legal Metrology Rules, 2011 using configurable regular expression dictionaries.',
      details: [
        'Manufacturer entity & PIN code syntax matching',
        'Metric SI mass/volume unit normalization (g, kg, ml, l, count)',
        'MRP currency token matching & mandatory tax inclusion clauses',
        'Date structures: MM/YYYY, Month YYYY, or dot-matrix MFD codes',
      ],
      sampleOutput: 'Mapped: MRP, Net Qty, Mfg Date, Commodity, Manufacturer Address',
    },
    {
      step: 5,
      name: 'Configurable Rule Engine',
      tech: 'Python Rule Engine',
      icon: ShieldCheck,
      badge: 'Rules 6, 7 & 8 (2011)',
      description:
        'The heart of PackScan AI: a transparent, deterministic rule engine that tests the extracted fields against statutory mandates. Because the rule engine is separate from OCR, new regulations or product categories plug in instantly.',
      details: [
        'Level 1: Presence Check — Is mandatory declaration detected?',
        'Level 2: Format / Pattern Check — Do units and tax clauses conform strictly?',
        'Level 3: Readability Assessment — Does confidence suggest legible printing?',
      ],
      sampleOutput: 'Engine Result: 5 Passed, 1 Low Confidence (MFD), 1 Missing (Care Cell)',
    },
    {
      step: 6,
      name: 'Explainable Outcome & Reporting',
      tech: 'ReportLab & SQLite',
      icon: FileText,
      badge: '3-Tier Outcome',
      description:
        'Returns one of 3 clear outcomes: COMPLIANT, NON_COMPLIANT, or NEEDS_REVIEW. Generates plain-language reasoning for every flagged item, renders visual bounding overlays, and creates downloadable inspection PDF certificates.',
      details: [
        'Never a blind pass/fail — ambiguous cases escalate to humans',
        'Full plain-language audit trail for inspectors and brand owners',
        'Generates statutory PDF certificate ready for inspection filing',
      ],
      sampleOutput: 'Final Status: NEEDS_REVIEW with human verification guidelines',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16" id="how-it-works-root">
      {/* Top Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SIH26034 Technical Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-4">
            How PackScan AI Works: From Label Photo to Explainable Audit
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            PackScan AI decouples computer vision extraction from statutory compliance logic. 
            It converts unstructured package packaging images into structured, auditable declarations 
            checked against India&apos;s Legal Metrology (Packaged Commodities) Rules, 2011 — in seconds instead of minutes.
          </p>
        </div>

        {/* The recurring visual motif step flow */}
        <div className="mt-8 pt-8 border-t border-slate-800">
          <PipelineStepFlow currentActiveStep={selectedPipelineStep + 1} variant="full" onStepClick={setSelectedPipelineStep} />
        </div>
      </div>

      {/* Human-in-the-Loop Callout Section (Mandatory from prompt & SIH PDF) */}
      <div
        id="human-in-the-loop-callout"
        className="bg-amber-50/90 border-2 border-amber-300/80 rounded-2xl p-6 sm:p-8 text-amber-950 shadow-sm"
      >
        <div className="flex flex-col md:flex-row items-start gap-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                Core Design Philosophy
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-amber-950">
                Human-in-the-Loop: Why PackScan AI Never Uses Blind Pass/Fail
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
              In real-world retail shelves, packages encounter curved pouch plastic, specular glare, and faint dot-matrix inkjet stamping for batch dates. A rigid binary pass/fail algorithm either causes false rejections of compliant goods or lets non-compliant labels slip through.
            </p>
            <p className="text-xs sm:text-sm text-amber-900 font-semibold leading-relaxed">
              PackScan AI returns one of three outcomes: <strong>COMPLIANT</strong>, <strong>NON_COMPLIANT</strong>, or <strong>NEEDS_REVIEW</strong>. 
              Low-confidence reads or ambiguous formats are automatically routed to human inspectors with exact bounding-box coordinates and plain-language guidance — <em>assisting human inspectors rather than attempting to replace their statutory judgement</em>.
            </p>
          </div>
        </div>
      </div>

      {/* Deep Dive into 6 Technical Pipeline Stages */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              The 6-Step Technical Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Interactive breakdown of each layer in the PackScan AI workflow
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
            OpenCV → OCR → Rule Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pipelineSteps.map((item, idx) => {
            const Icon = item.icon;
            const isCurrent = selectedPipelineStep === idx;
            return (
              <div
                key={item.step}
                onClick={() => setSelectedPipelineStep(idx)}
                className={`bg-white rounded-2xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isCurrent
                    ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md scale-[1.01]'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      Step 0{item.step}
                    </span>
                  </div>

                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block mb-1">
                    {item.badge}
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 mb-2">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    {item.details.map((d, dIdx) => (
                      <div key={dIdx} className="flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="bg-slate-900 text-slate-300 p-2 rounded-lg font-mono text-[10px] truncate">
                    &gt; {item.sampleOutput}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tech Stack Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h3 className="text-lg font-extrabold text-slate-900 mb-2 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-blue-600" />
          <span>Technology Stack Badges (Python / CV / OCR Engine)</span>
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          PackScan AI is built using lightweight, proven open-source computer vision &amp; OCR technologies requiring zero expensive custom model training for the MVP.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {techStack.map((tech) => (
            <div
              key={tech.name}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all"
            >
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-sm font-extrabold text-slate-900">{tech.name}</h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {tech.tag}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{tech.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Future-Ready Rule Engine Decoupling Callout */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col md:flex-row items-start gap-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
              Architecture Highlight • Appendix Slide 6 &amp; 7
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2">
              Future-Ready Design: Independent OCR &amp; Rule Engine
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
              Because the compliance rule engine is kept strictly decoupled from the OCR pipeline in a configurable Python schema, 
              statutory amendments to the Legal Metrology (Packaged Commodities) Rules, new commodity categories (such as e-commerce aggregators or QR code mandates), 
              and state-specific amendments plug in immediately without touching the extraction layer or retraining any computer vision models.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Rule 6(1)(a-g)
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Rule 7 Display Height Schedule
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Rule 8 Placement Guidelines
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
