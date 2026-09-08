import React, { useState } from 'react';
import { ScanResult, FieldKey } from '../../types';
import { StatusBadge } from '../common/Badge';
import { AnnotatedImage } from './AnnotatedImage';
import { FieldChecklist } from './FieldChecklist';
import { downloadPdfReport } from '../../services/pdfGenerator';
import {
  Download,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  UserCheck,
  ShieldAlert,
  Clock,
  Info,
  Calendar,
  Layers,
  Sparkles,
  Share2,
  ListOrdered,
  Package,
} from 'lucide-react';

interface ResultsDashboardProps {
  scan: ScanResult;
  batchResults?: ScanResult[];
  onSelectBatchScan?: (scan: ScanResult) => void;
  onNewScan: () => void;
  onViewHistory: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  scan,
  batchResults = [],
  onSelectBatchScan,
  onNewScan,
  onViewHistory,
}) => {
  const [activeFieldKey, setActiveFieldKey] = useState<FieldKey | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [batchDownloadSuccess, setBatchDownloadSuccess] = useState(false);

  const handleDownloadPdf = () => {
    downloadPdfReport(scan);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  const handleDownloadAllBatch = () => {
    if (!batchResults.length) return;
    batchResults.forEach((bScan, index) => {
      setTimeout(() => {
        downloadPdfReport(bScan);
      }, index * 400);
    });
    setBatchDownloadSuccess(true);
    setTimeout(() => setBatchDownloadSuccess(false), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  const hasBatch = batchResults && batchResults.length > 1;
  const isMultiPanel = scan.images && scan.images.length > 1;

  // Compute batch statistics
  const compliantCount = batchResults.filter((r) => r.finalStatus === 'COMPLIANT').length;
  const reviewCount = batchResults.filter((r) => r.finalStatus === 'NEEDS_REVIEW').length;
  const nonCompliantCount = batchResults.filter((r) => r.finalStatus === 'NON_COMPLIANT').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12" id="results-dashboard-root">
      {/* Batch Results Session Navigation Strip (if batch scan was performed) */}
      {hasBatch && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xs text-white">
                <ListOrdered className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">
                    Batch Screening Session ({batchResults.length} Packages)
                  </h3>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                    {scan.batchId || 'BATCH-RUN'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Select an inspected specimen below to view full Legal Metrology audit details:
                </p>
              </div>
            </div>

            {/* Batch Status Pills & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-emerald-400">{compliantCount} Compliant</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400">{reviewCount} Review</span>
                <span className="text-slate-600">•</span>
                <span className="text-rose-400">{nonCompliantCount} Non-Compliant</span>
              </div>

              <button
                type="button"
                onClick={handleDownloadAllBatch}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{batchDownloadSuccess ? 'Downloading All...' : 'Download All PDFs'}</span>
              </button>
            </div>
          </div>

          {/* Package Selectors Carousel / Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {batchResults.map((bScan, index) => {
              const isSelected = bScan.id === scan.id;
              return (
                <button
                  type="button"
                  key={bScan.id}
                  onClick={() => onSelectBatchScan && onSelectBatchScan(bScan)}
                  className={`p-3 rounded-xl text-left border transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-white text-slate-900 border-white ring-2 ring-blue-500 shadow-md scale-[1.01]'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-950 overflow-hidden flex items-center justify-center shrink-0 border border-slate-700">
                    <img
                      src={bScan.imageUrl}
                      alt={bScan.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          isSelected ? 'text-blue-700' : 'text-slate-400'
                        }`}
                      >
                        Item #{index + 1}
                      </span>
                      <StatusBadge status={bScan.finalStatus} size="sm" />
                    </div>
                    <div
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {bScan.productName}
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {bScan.detectedCount}/6 detected ({bScan.overallConfidence.toFixed(0)}% conf.)
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Banner: Status + Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                {scan.id}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-600 font-semibold">{scan.category}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {scan.timestamp}
              </span>

              {/* Multi-Panel Badge */}
              {isMultiPanel && (
                <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Multi-Panel Scan ({scan.images?.length} Angles)</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {scan.productName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Screened by {scan.inspectorId} via {scan.deviceSource}
            </p>
          </div>

          {/* Prominent Final Status Callout & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">
                Screening Outcome:
              </span>
              <StatusBadge status={scan.finalStatus} size="lg" />
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                id="btn-download-pdf"
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{downloadSuccess ? 'Downloaded!' : 'Download PDF Report'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                title="Print Inspection Sheet"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={onNewScan}
                className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                title="Scan another package"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">New Scan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Outcome Summary Note */}
        <div
          className={`mt-5 p-4 rounded-xl border text-xs sm:text-[13px] leading-relaxed flex items-start gap-3 ${
            scan.finalStatus === 'COMPLIANT'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : scan.finalStatus === 'NEEDS_REVIEW'
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : 'bg-rose-50/80 border-rose-200 text-rose-950'
          }`}
        >
          {scan.finalStatus === 'COMPLIANT' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : scan.finalStatus === 'NEEDS_REVIEW' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}

          <div>
            <div className="font-extrabold uppercase tracking-wide text-xs mb-0.5">
              {scan.finalStatus === 'COMPLIANT'
                ? 'Statutory Compliance Verified'
                : scan.finalStatus === 'NEEDS_REVIEW'
                ? 'Human Inspector Review Required (Never a Blind Pass/Fail)'
                : 'Statutory Non-Compliance Detected'}
            </div>
            <p className="font-normal opacity-90">{scan.summaryNote}</p>
          </div>
        </div>

        {/* Inspection KPI Micro-Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">
              Overall OCR Confidence
            </span>
            <span className="text-base font-extrabold text-slate-900 font-mono">
              {scan.overallConfidence.toFixed(1)}%
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">
              Declarations Verified
            </span>
            <span className="text-base font-extrabold text-slate-900 font-mono">
              {scan.detectedCount} of 6 Fields
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">
              Image Quality Assessment
            </span>
            <span className="text-base font-extrabold text-slate-900 font-mono">
              {scan.imageQualityScore}% (Pass)
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">
              Processing Pipeline Time
            </span>
            <span className="text-base font-extrabold text-slate-900 font-mono">
              {(scan.processingTimeMs / 1000).toFixed(2)}s
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column View: Annotated Image on Left + Checklist on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Annotated Image with Bounding Boxes (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4 sticky lg:top-20">
          <AnnotatedImage
            imageUrl={scan.imageUrl}
            boundingBoxes={scan.boundingBoxes}
            images={scan.images}
            activeFieldKey={activeFieldKey}
            onSelectField={(key) => setActiveFieldKey(key)}
            productName={scan.productName}
            imageQualityScore={scan.imageQualityScore}
          />

          {/* Human in the loop guidance */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-blue-950 mb-0.5">
                Inspector Supervisory Role
              </span>
              <span>
                PackScan AI is an assistive first-level screener. For any low-confidence or missing
                field, verify the physical package label and click the statutory remedies before
                issuing a notice under Section 39 of the Standards of Weights and Measures Act.
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: 6-Field Legal Metrology Audit Checklist (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <FieldChecklist
            fields={scan.fields}
            activeFieldKey={activeFieldKey}
            onSelectField={(key) => setActiveFieldKey(key)}
          />
        </div>
      </div>
    </div>
  );
};
