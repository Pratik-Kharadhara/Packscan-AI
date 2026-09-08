import React from 'react';
import { PipelineStageId } from '../../types';
import { Camera, Sliders, Search, Cpu, ShieldCheck, FileCheck, CheckCircle, Loader2 } from 'lucide-react';

interface PipelineStepperProps {
  currentStageId: PipelineStageId;
  progressPercent: number;
  currentMessage: string;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  currentStageId,
  progressPercent,
  currentMessage,
}) => {
  const stages: { id: PipelineStageId; name: string; tech: string; icon: any }[] = [
    { id: 'capture', name: 'Capture & Quality', tech: 'OpenCV Blur Check', icon: Camera },
    { id: 'preprocess', name: 'Preprocessing', tech: 'CLAHE & Deskew', icon: Sliders },
    { id: 'ocr', name: 'OCR Extraction', tech: 'EasyOCR / Tesseract', icon: Search },
    { id: 'field_id', name: 'Field Identification', tech: 'Regex Pattern Dict', icon: Cpu },
    { id: 'rule_engine', name: 'Rule Engine', tech: 'Rules 6, 7 & 8 (2011)', icon: ShieldCheck },
    { id: 'result', name: 'Result Synthesis', tech: 'ReportLab & Overlay', icon: FileCheck },
  ];

  const currentIdx = stages.findIndex((s) => s.id === currentStageId);

  return (
    <div
      id="pipeline-stepper-container"
      className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 max-w-4xl mx-auto my-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <h3 className="text-base font-extrabold text-slate-900">
              Executing Compliance Verification Pipeline
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Streaming package through OpenCV preprocessing, OCR spatial extraction, and rule evaluation...
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            {progressPercent}% Complete
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* 6 Stages Horizontal Stepper */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isCurrent = stage.id === currentStageId;
          const isDone = idx < currentIdx;

          return (
            <div
              key={stage.id}
              className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                isCurrent
                  ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-100 shadow-xs scale-102'
                  : isDone
                  ? 'bg-emerald-50/50 border-emerald-300'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex justify-center mb-1.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isCurrent
                      ? 'bg-blue-600 text-white animate-pulse'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
              </div>

              <div className="text-[11px] font-bold text-slate-800 line-clamp-1">
                {stage.name}
              </div>
              <div className="text-[9px] font-mono text-slate-500 truncate mt-0.5">
                {stage.tech}
              </div>

              <div className="mt-1.5">
                {isDone ? (
                  <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                    Done ✓
                  </span>
                ) : isCurrent ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                    Running
                  </span>
                ) : (
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                    Pending
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time live log telemetry box */}
      <div className="mt-6 bg-slate-950 rounded-xl p-3.5 border border-slate-800 font-mono text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            PIPELINE TELEMETRY LOG
          </span>
          <span className="text-slate-500">SIH26034 / v2.4</span>
        </div>
        <p className="text-emerald-400 text-xs truncate">
          &gt; {currentMessage || 'Initializing PackScan AI inspection engine...'}
        </p>
      </div>
    </div>
  );
};
