import React from 'react';
import { Camera, Search, CheckSquare, MessageSquare, FileText, ArrowRight } from 'lucide-react';

interface PipelineStepFlowProps {
  currentActiveStep?: number; // 1 to 5
  variant?: 'compact' | 'full' | 'hero';
  className?: string;
  onStepClick?: (stepIndex: number) => void;
}

export const PipelineStepFlow: React.FC<PipelineStepFlowProps> = ({
  currentActiveStep,
  variant = 'full',
  className = '',
  onStepClick,
}) => {
  const steps = [
    {
      name: 'IMAGE',
      sub: 'Capture & Preprocess',
      icon: Camera,
      color: 'blue',
      detail: 'Smartphone or flatbed package capture with OpenCV blur & glare detection',
    },
    {
      name: 'EXTRACT',
      sub: 'OCR & Bounding Boxes',
      icon: Search,
      color: 'indigo',
      detail: 'EasyOCR & Tesseract text recognition with spatial coordinates',
    },
    {
      name: 'VERIFY',
      sub: 'Rule Engine 2011',
      icon: CheckSquare,
      color: 'teal',
      detail: 'Legal Metrology Rules 6, 7 & 8 pattern validation across 6 fields',
    },
    {
      name: 'EXPLAIN',
      sub: 'Human-in-the-Loop',
      icon: MessageSquare,
      color: 'amber',
      detail: 'Plain-language rationale for flags: Compliant, Needs Review, or Non-Compliant',
    },
    {
      name: 'REPORT',
      sub: 'Audit PDF & History',
      icon: FileText,
      color: 'slate',
      detail: 'Exportable statutory inspection certificate with inspector sign-off',
    },
  ];

  if (variant === 'compact') {
    return (
      <div
        id="pipeline-flow-compact"
        className={`flex items-center justify-between gap-1 sm:gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl border border-slate-800 text-xs ${className}`}
      >
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentActiveStep === idx + 1;
          return (
            <React.Fragment key={step.name}>
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="font-semibold tracking-wider text-[11px]">{step.name}</span>
              </div>
              {idx < steps.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div
      id="pipeline-flow-full"
      className={`w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold">
            ✦
          </span>
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            PackScan AI Digital Verification Pipeline
          </h3>
        </div>
        <span className="text-[11px] font-medium text-slate-500 hidden sm:inline-block">
          Rules 6, 7 &amp; 8 • Legal Metrology (Packaged Commodities) Rules, 2011
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentActiveStep === idx + 1;
          const isPassed = currentActiveStep ? idx + 1 < currentActiveStep : false;

          return (
            <div
              key={step.name}
              onClick={() => onStepClick && onStepClick(idx)}
              className={`relative rounded-xl p-3.5 transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-blue-50 border-2 border-blue-600 shadow-sm ring-2 ring-blue-100'
                  : isPassed
                  ? 'bg-emerald-50/70 border border-emerald-300'
                  : 'bg-slate-50 hover:bg-slate-100/80 border border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  0{idx + 1}
                </span>
              </div>

              <div className="text-xs font-black tracking-wider text-slate-900">
                {step.name}
              </div>
              <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                {step.sub}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight mt-1 line-clamp-2">
                {step.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
