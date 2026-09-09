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
      detail: 'Label capture with blur, glare, and rotation validation',
    },
    {
      name: 'EXTRACT',
      sub: 'OCR & Bounding Boxes',
      icon: Search,
      detail: 'Multi-lingual OCR text extraction with spatial coordinates',
    },
    {
      name: 'VERIFY',
      sub: 'Rule Engine 2011',
      icon: CheckSquare,
      detail: 'Legal Metrology Rules 6, 7 & 8 validation across 6 declarations',
    },
    {
      name: 'EXPLAIN',
      sub: 'Transparent Reasoning',
      icon: MessageSquare,
      detail: 'Confidence scoring & explainable evidence for human inspectors',
    },
    {
      name: 'REPORT',
      sub: 'Statutory PDF Export',
      icon: FileText,
      detail: 'Formal compliance report with timestamp and bounding annotations',
    },
  ];

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between gap-1 overflow-x-auto py-2 ${className}`}>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentActiveStep === idx + 1;
          const isPassed = currentActiveStep !== undefined && currentActiveStep > idx + 1;

          return (
            <React.Fragment key={step.name}>
              <div
                onClick={() => onStepClick && onStepClick(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#166534] text-white shadow-2xs font-bold'
                    : isPassed
                    ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]'
                    : 'bg-white text-slate-600 border border-[#D1D5DB]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{step.name}</span>
              </div>
              {idx < steps.length - 1 && (
                <ArrowRight className="w-3 h-3 text-[#D1D5DB] shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentActiveStep === idx + 1;
          const isPassed = currentActiveStep !== undefined && currentActiveStep > idx + 1;

          return (
            <div
              key={step.name}
              onClick={() => onStepClick && onStepClick(idx)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isActive
                  ? 'bg-white border-[#166534] shadow-sm ring-1 ring-[#166534]'
                  : isPassed
                  ? 'bg-[#F0FDF4]/60 border-[#BBF7D0]'
                  : 'bg-white border-[#D1D5DB] hover:border-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? 'bg-[#166534] text-white'
                        : isPassed
                        ? 'bg-[#15803D] text-white'
                        : 'bg-[#F7F8F5] text-slate-600 border border-[#D1D5DB]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600">
                    STAGE 0{idx + 1}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#1F2937] tracking-tight">
                  {step.name}
                </h4>
                <p className="text-[11px] font-medium text-[#166534] mt-0.5">
                  {step.sub}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                  {step.detail}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                  <span className="w-4 h-4 rounded-full bg-white border border-[#D1D5DB] flex items-center justify-center shadow-2xs text-[10px] text-slate-400">
                    &rarr;
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
