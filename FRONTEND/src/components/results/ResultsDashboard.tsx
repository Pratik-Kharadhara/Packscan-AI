import React, { useState, useEffect } from 'react';
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
  Clock,
  Layers,
  Sparkles,
  ListOrdered,
  UserCheck,
  Maximize2,
  X,
  Crosshair,
  Camera,
  Tag,
} from 'lucide-react';

interface ResultsDashboardProps {
  scan: ScanResult;
  batchResults?: ScanResult[];
  onSelectBatchScan?: (scan: ScanResult) => void;
  onNewScan: () => void;
  onViewHistory: () => void;
  onInspectorOpenChange?: (isOpen: boolean) => void;
}

/**
 * Cleanly extracts a human-readable commodity/product name.
 * Never surfaces raw camera/upload filenames (e.g. WhatsApp Image..., IMG_..., etc.) as a main heading.
 */
function getDisplayTitle(scan: ScanResult): { title: string; filenameMetadata?: string } {
  const rawName = scan.productName?.trim() || '';
  const commodityText = scan.fields?.commodity?.extractedText?.trim();

  // Detection for typical camera, mobile share, or raw upload filenames
  const isFilename =
    /^(WhatsApp Image|IMG[-_]|PXL[-_]|DSC[-_]|Screenshot|Scan[-_]|\d{8}[-_]\d{6})/i.test(rawName) ||
    /\.(jpe?g|png|webp|heic|bmp|tiff|pdf)$/i.test(rawName) ||
    /^[\w-]+\.(jpg|jpeg|png)$/i.test(rawName) ||
    /^\d+$/.test(rawName);

  if (isFilename) {
    // If commodity extracted text is valid and not a generic placeholder
    if (
      commodityText &&
      commodityText !== '[NO MATCHING TEXT REGION DETECTED]' &&
      !commodityText.toLowerCase().includes('packaged commodity')
    ) {
      return {
        title: commodityText,
        filenameMetadata: rawName,
      };
    }

    // High-trust fallback heading: Commodity Category + Scan ID
    const categoryLabel = scan.category ? scan.category.replace(/&/g, '•') : 'Commodity Item';
    return {
      title: `${categoryLabel} Package (${scan.id})`,
      filenameMetadata: rawName,
    };
  }

  return { title: rawName };
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  scan,
  batchResults = [],
  onSelectBatchScan,
  onNewScan,
  onViewHistory,
  onInspectorOpenChange,
}) => {
  const [activeFieldKey, setActiveFieldKey] = useState<FieldKey | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [batchDownloadSuccess, setBatchDownloadSuccess] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Close modal on Escape key, lock scroll, and notify parent to hide bottom nav dock
  useEffect(() => {
    onInspectorOpenChange?.(isImageModalOpen);
    if (isImageModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageModalOpen(false);
      }
    };
    if (isImageModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isImageModalOpen, onInspectorOpenChange]);

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
  const { title: displayTitle, filenameMetadata } = getDisplayTitle(scan);

  // Compute batch statistics
  const compliantCount = batchResults.filter((r) => r.finalStatus === 'COMPLIANT').length;
  const reviewCount = batchResults.filter((r) => r.finalStatus === 'NEEDS_REVIEW').length;
  const nonCompliantCount = batchResults.filter((r) => r.finalStatus === 'NON_COMPLIANT').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-36" id="results-dashboard-root">
      {/* 1. Batch Results Session Navigation Strip (if batch scan was performed) */}
      {hasBatch && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center font-black text-xs text-white">
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
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
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
                  className={`p-3 rounded-xl text-left border transition-all flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 border-white ring-2 ring-emerald-600 shadow-sm scale-[1.01]'
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
                          isSelected ? 'text-emerald-700' : 'text-slate-400'
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

      {/* 2. Primary Header Zone: Single Verdict + Product Info + Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          {/* Product & Verdict Overview */}
          <div className="space-y-3 flex-1 min-w-0">
            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                {scan.id}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-semibold">{scan.category}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {scan.timestamp}
              </span>

              {isMultiPanel && (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-700" />
                  <span>{scan.images?.length} Angles Captured</span>
                </span>
              )}
            </div>

            {/* Clean Product Heading (Never raw filename) */}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {displayTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                <span>Inspector: <strong className="text-slate-700">{scan.inspectorId}</strong></span>
                <span>•</span>
                <span>Source: {scan.deviceSource}</span>
                {filenameMetadata && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-slate-400 truncate max-w-xs" title={filenameMetadata}>
                      File: {filenameMetadata}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Singular Verdict Treatment — Replaces both pill and duplicate banner */}
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                scan.finalStatus === 'COMPLIANT'
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : scan.finalStatus === 'NEEDS_REVIEW'
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-rose-50/70 border-rose-300 text-rose-950'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {scan.finalStatus === 'COMPLIANT' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                )}
                {scan.finalStatus === 'NEEDS_REVIEW' && (
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                )}
                {scan.finalStatus === 'NON_COMPLIANT' && (
                  <XCircle className="w-5 h-5 text-rose-700" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider">
                    {scan.finalStatus === 'COMPLIANT'
                      ? 'Compliance Verified'
                      : scan.finalStatus === 'NEEDS_REVIEW'
                      ? 'Human Inspector Review Required'
                      : 'Statutory Non-Compliance Detected'}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full uppercase tracking-wider ${
                      scan.finalStatus === 'COMPLIANT'
                        ? 'bg-emerald-200/80 text-emerald-900'
                        : scan.finalStatus === 'NEEDS_REVIEW'
                        ? 'bg-amber-200/80 text-amber-900'
                        : 'bg-rose-200/80 text-rose-900'
                    }`}
                  >
                    {scan.finalStatus.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {scan.summaryNote}
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex sm:flex-row md:flex-col lg:flex-row items-center gap-2 shrink-0 self-start">
            <button
              id="btn-download-pdf"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloadSuccess ? 'Downloaded!' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              title="Print Inspection Sheet"
              aria-label="Print Inspection Sheet"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onNewScan}
              className="px-3 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Scan another package"
            >
              <RotateCcw className="w-4 h-4" />
              <span>New Scan</span>
            </button>
          </div>
        </div>

        {/* Compact Inline Micro-Stats Strip (Small chips, not 4 heavy boxes) */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-500 font-medium">OCR Confidence:</span>
            <span className="font-mono font-extrabold text-slate-800">
              {scan.overallConfidence.toFixed(1)}%
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-500 font-medium">Declarations:</span>
            <span className="font-mono font-extrabold text-slate-800">
              {scan.detectedCount} of 6 Fields
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-500 font-medium">Image Quality:</span>
            <span className="font-mono font-extrabold text-slate-800">
              {scan.imageQualityScore}% (Pass)
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-500 font-medium">Processing Time:</span>
            <span className="font-mono font-extrabold text-slate-800">
              {(scan.processingTimeMs / 1000).toFixed(2)}s
            </span>
          </div>
        </div>
      </div>

      {/* 3. Supporting Visual Evidence Card (Decoupled Image Inspector) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Clickable Image Thumbnail */}
          <button
            type="button"
            onClick={() => setIsImageModalOpen(true)}
            className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-300 shrink-0 group cursor-pointer shadow-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            title="Click to expand full OCR Bounding Box Inspector"
          >
            <img
              src={scan.imageUrl}
              alt={displayTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
              <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
            </div>
          </button>

          {/* Evidence Meta */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Packaging Visual Evidence
              </span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                {scan.boundingBoxes?.length || 0} Bounding Boxes
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
              Interactive 2D spatial text polygons, confidence overlays &amp; multi-angle inspection.
            </p>
          </div>
        </div>

        {/* Open Inspector Trigger */}
        <button
          type="button"
          onClick={() => setIsImageModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Crosshair className="w-4 h-4 text-emerald-400" />
          <span>Inspect OCR Bounding Boxes</span>
        </button>
      </div>

      {/* 4. Full-Width 6-Field Legal Metrology Accordion Checklist */}
      <FieldChecklist
        fields={scan.fields}
        activeFieldKey={activeFieldKey}
        onSelectField={(key) => setActiveFieldKey(key)}
        onOpenImageInspector={(key) => {
          if (key) setActiveFieldKey(key);
          setIsImageModalOpen(true);
        }}
      />

      {/* 5. Inspector Supervisory Role Statutory Disclaimer (Single Placement at Bottom) */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 text-xs text-slate-700 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5">
          <UserCheck className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <span className="font-extrabold block text-slate-900 text-xs tracking-tight">
            Inspector Supervisory Role &amp; Statutory Disclaimer
          </span>
          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-normal">
            PackScan AI is an assistive first-level screening system under India&apos;s Legal Metrology (Packaged Commodities) Rules, 2011. For any flagged, low-confidence, or missing declaration, inspectors must physically inspect the package and verify statutory remedies under Rule 32 before issuing a notice under Section 39 of the Legal Metrology Act, 2009.
          </p>
        </div>
      </div>

      {/* Full-Screen Image Inspector Modal (On Demand) */}
      {isImageModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative w-full max-w-6xl xl:max-w-7xl h-[92vh] max-h-[94vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Bar */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Crosshair className="w-4 h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm font-extrabold tracking-tight">
                  Package OCR Inspector — {displayTitle}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono hidden sm:inline">
                  {scan.id}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close Inspector (Esc)"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Annotated Image Component */}
            <div className="flex-1 overflow-hidden p-2 sm:p-4 bg-slate-950 flex flex-col">
              <AnnotatedImage
                imageUrl={scan.imageUrl}
                boundingBoxes={scan.boundingBoxes}
                rawOcrBoxes={scan.rawOcrBoxes}
                images={scan.images}
                activeFieldKey={activeFieldKey}
                onSelectField={(key) => {
                  setActiveFieldKey(key);
                }}
                productName={displayTitle}
                imageQualityScore={scan.imageQualityScore}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
