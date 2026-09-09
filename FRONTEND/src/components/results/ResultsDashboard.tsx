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
      {/* Batch Results Session Navigation Strip */}
      {hasBatch && (
        <div className="bg-[#1F2937] text-white rounded-2xl p-4 sm:p-5 shadow-xs border border-stone-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#166534] flex items-center justify-center font-black text-xs text-white">
                <ListOrdered className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">
                    Batch Screening Session ({batchResults.length} Packages)
                  </h3>
                  <span className="text-[10px] bg-stone-800 text-stone-300 font-mono px-2 py-0.5 rounded">
                    {scan.batchId || 'BATCH-RUN'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Select an inspected specimen below to examine complete Legal Metrology findings:
                </p>
              </div>
            </div>

            {/* Batch Status Pills & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800">
                <span className="text-[#86EFAC]">{compliantCount} Compliant</span>
                <span className="text-stone-600">•</span>
                <span className="text-[#FDE68A]">{reviewCount} Review</span>
                <span className="text-stone-600">•</span>
                <span className="text-[#FECACA]">{nonCompliantCount} Non-Compliant</span>
              </div>

              <button
                type="button"
                onClick={handleDownloadAllBatch}
                className="bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{batchDownloadSuccess ? 'Downloading All...' : 'Download All PDFs'}</span>
              </button>
            </div>
          </div>

          {/* Package Selectors Carousel */}
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
                      ? 'bg-white text-[#1F2937] border-white ring-2 ring-[#166534] shadow-xs'
                      : 'bg-stone-800/90 hover:bg-stone-800 text-stone-200 border-stone-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-stone-950 overflow-hidden flex items-center justify-center shrink-0 border border-stone-700">
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
                          isSelected ? 'text-[#166534]' : 'text-stone-400'
                        }`}
                      >
                        Item #{index + 1}
                      </span>
                      <StatusBadge status={bScan.finalStatus} size="sm" />
                    </div>
                    <div
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-[#1F2937]' : 'text-white'
                      }`}
                    >
                      {bScan.productName}
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-[#4B5563]' : 'text-stone-400'
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
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#D1D5DB] shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <span className="text-xs font-mono font-bold text-[#4B5563] bg-[#F7F8F5] px-2.5 py-1 rounded-md border border-[#D1D5DB]">
                {scan.id}
              </span>
              <span className="text-xs text-[#9CA3AF]">•</span>
              <span className="text-xs text-[#1F2937] font-semibold">{scan.category}</span>
              <span className="text-xs text-[#9CA3AF]">•</span>
              <span className="text-xs text-[#4B5563] flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {scan.timestamp}
              </span>

              {/* Multi-Panel Badge */}
              {isMultiPanel && (
                <span className="bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#166534]" />
                  <span>Multi-Panel Audit ({scan.images?.length} Angles)</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">
              {scan.productName}
            </h1>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-0.5">
              Screened by {scan.inspectorId} via {scan.deviceSource}
            </p>
          </div>

          {/* Prominent Final Status Callout & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold text-[#4B5563] tracking-wider">
                Screening Outcome:
              </span>
              <StatusBadge status={scan.finalStatus} size="lg" />
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                id="btn-download-pdf"
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{downloadSuccess ? 'Downloaded!' : 'Download PDF Report'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="p-2.5 rounded-xl border border-[#D1D5DB] hover:bg-[#F7F8F5] text-[#1F2937] text-xs font-semibold"
                title="Print Inspection Sheet"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={onNewScan}
                className="p-2.5 rounded-xl border border-[#D1D5DB] hover:bg-[#F7F8F5] text-[#1F2937] text-xs font-semibold flex items-center gap-1.5"
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
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
              : scan.finalStatus === 'NEEDS_REVIEW'
              ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
          }`}
        >
          {scan.finalStatus === 'COMPLIANT' ? (
            <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
          ) : scan.finalStatus === 'NEEDS_REVIEW' ? (
            <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#D1D5DB] text-xs">
          <div className="bg-[#F7F8F5] p-2.5 rounded-lg border border-[#D1D5DB]">
            <span className="text-[10px] text-[#4B5563] font-bold uppercase block">
              Overall OCR Confidence
            </span>
            <span className="text-base font-extrabold text-[#1F2937] font-mono">
              {scan.overallConfidence.toFixed(1)}%
            </span>
          </div>

          <div className="bg-[#F7F8F5] p-2.5 rounded-lg border border-[#D1D5DB]">
            <span className="text-[10px] text-[#4B5563] font-bold uppercase block">
              Declarations Verified
            </span>
            <span className="text-base font-extrabold text-[#1F2937] font-mono">
              {scan.detectedCount} of 6 Fields
            </span>
          </div>

          <div className="bg-[#F7F8F5] p-2.5 rounded-lg border border-[#D1D5DB]">
            <span className="text-[10px] text-[#4B5563] font-bold uppercase block">
              Image Quality Assessment
            </span>
            <span className="text-base font-extrabold text-[#1F2937] font-mono">
              {scan.imageQualityScore}% (Pass)
            </span>
          </div>

          <div className="bg-[#F7F8F5] p-2.5 rounded-lg border border-[#D1D5DB]">
            <span className="text-[10px] text-[#4B5563] font-bold uppercase block">
              Processing Pipeline Time
            </span>
            <span className="text-base font-extrabold text-[#1F2937] font-mono">
              {(scan.processingTimeMs / 1000).toFixed(2)}s
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column View: Annotated Image on Left + Checklist on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Annotated Image with Bounding Boxes */}
        <div className="lg:col-span-5 space-y-4 sticky lg:top-20">
          <AnnotatedImage
            imageUrl={scan.imageUrl}
            boundingBoxes={scan.boundingBoxes}
            rawOcrBoxes={scan.rawOcrBoxes}
            images={scan.images}
            activeFieldKey={activeFieldKey}
            onSelectField={(key) => setActiveFieldKey(key)}
            productName={scan.productName}
            imageQualityScore={scan.imageQualityScore}
          />

          {/* Human in the loop guidance */}
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3.5 text-xs text-[#166534] flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-[#1F2937] mb-0.5">
                Inspector Supervisory Role
              </span>
              <span className="text-[#4B5563]">
                PackScan.Ai is an assistive first-level screener. For any low-confidence or missing
                field, verify the physical package label and click the statutory remedies before
                issuing a notice under Section 39 of the Standards of Weights and Measures Act.
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: 6-Field Legal Metrology Audit Checklist */}
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
