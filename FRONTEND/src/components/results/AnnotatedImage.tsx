import React, { useState } from 'react';
import { BoundingBox, FieldKey, PackagePanelImage, RawOcrBox } from '../../types';
import { Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, Crosshair, Layers } from 'lucide-react';

interface AnnotatedImageProps {
  imageUrl: string;
  boundingBoxes: BoundingBox[];
  rawOcrBoxes?: RawOcrBox[];
  images?: PackagePanelImage[];
  activeFieldKey?: FieldKey | null;
  onSelectField?: (key: FieldKey) => void;
  productName: string;
  imageQualityScore: number;
}

export const AnnotatedImage: React.FC<AnnotatedImageProps> = ({
  imageUrl,
  boundingBoxes,
  rawOcrBoxes,
  images,
  activeFieldKey,
  onSelectField,
  productName,
  imageQualityScore,
}) => {
  const [showBoxes, setShowBoxes] = useState(true);
  const [displayMode, setDisplayMode] = useState<'compliance' | 'all_ocr'>('compliance');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const hasMultiplePanels = Boolean(images && images.length > 1);
  const currentPanel = hasMultiplePanels && images ? images[activeImageIndex] : null;
  const activeImageUrl = currentPanel?.url || imageUrl;

  // STRICT PANEL ISOLATION: Never borrow Panel 1 boxes for another panel
  const panelComplianceBoxes: BoundingBox[] = hasMultiplePanels
    ? (currentPanel?.boundingBoxes || [])
    : (boundingBoxes || []);

  const panelRawOcrBoxes: RawOcrBox[] = hasMultiplePanels
    ? (currentPanel?.rawOcrBoxes || [])
    : (rawOcrBoxes || []);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg flex flex-col h-full">
      {/* Top Toolbar */}
      <div className="bg-slate-950/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-[#86EFAC]" />
          <span className="font-extrabold text-white text-[11px] tracking-wider uppercase">
            OCR Bounding Box Localization
          </span>
          {hasMultiplePanels && images && (
            <span className="bg-[#166534]/50 text-[#BBF7D0] px-2 py-0.5 rounded text-[10px] font-bold border border-[#166534]">
              Panel {activeImageIndex + 1} of {images.length}
            </span>
          )}
        </div>

        {/* Display Mode Toggle */}
        <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
          <button
            type="button"
            id="btn-mode-compliance"
            onClick={() => setDisplayMode('compliance')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
              displayMode === 'compliance'
                ? 'bg-[#166534] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Compliance Declarations ({panelComplianceBoxes.length})
          </button>
          <button
            type="button"
            id="btn-mode-all-ocr"
            onClick={() => setDisplayMode('all_ocr')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
              displayMode === 'all_ocr'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All OCR Detections ({panelRawOcrBoxes.length})
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
              showBoxes
                ? 'bg-[#166534] text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showBoxes ? 'Boxes ON' : 'Boxes OFF'}</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1"></div>

          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-slate-400 w-9 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Multi-Panel Surface Switcher Bar (if multi-angle scan) */}
      {hasMultiplePanels && images && (
        <div className="bg-slate-950 px-3 py-2 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            <Layers className="w-3 h-3 text-[#86EFAC]" />
            <span>Panels:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-nowrap">
            {images.map((panel, idx) => {
              const isSelected = activeImageIndex === idx;
              const compCount = panel.boundingBoxes ? panel.boundingBoxes.length : 0;
              const rawCount = panel.rawOcrBoxes ? panel.rawOcrBoxes.length : 0;
              return (
                <button
                  type="button"
                  key={panel.id}
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setZoomLevel(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#166534] text-white shadow-2xs ring-1 ring-[#86EFAC]'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                      isSelected ? 'bg-white text-[#166534] font-black' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span>{panel.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-[#14532D] text-[#BBF7D0]' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {displayMode === 'compliance' ? `${compCount} compliance` : `${rawCount} OCR`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Image Stage Container */}
      <div className="relative flex-1 min-h-[440px] max-h-[580px] bg-slate-950 flex items-center justify-center p-4 overflow-auto">
        <div
          className="relative transition-transform duration-200 ease-out origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Base Product Label Image */}
          <img
            src={activeImageUrl}
            alt={productName}
            className="max-h-[500px] w-auto rounded-lg shadow-2xl select-none block border border-slate-800"
          />

          {/* SVG Overlay for Bounding Boxes */}
          {showBoxes && (
            <div className="absolute inset-0 pointer-events-none">
              {displayMode === 'compliance' ? (
                panelComplianceBoxes.map((box) => {
                  const isFieldActive = activeFieldKey === box.fieldKey;
                  const isHovered = hoveredBoxId === box.id;

                  let borderClass = 'border-emerald-400 bg-emerald-500/15 text-emerald-300';
                  let tagColor = 'bg-emerald-600 text-white';

                  if (box.status === 'LOW_CONFIDENCE') {
                    borderClass = 'border-amber-400 bg-amber-500/20 text-amber-300';
                    tagColor = 'bg-amber-600 text-white';
                  } else if (box.status === 'NOT_DETECTED') {
                    borderClass = 'border-rose-400 bg-rose-500/20 text-rose-300';
                    tagColor = 'bg-rose-600 text-white';
                  }

                  return (
                    <div
                      key={box.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectField) onSelectField(box.fieldKey);
                      }}
                      onMouseEnter={() => setHoveredBoxId(box.id)}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      style={{
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`,
                      }}
                      className={`absolute border-2 rounded pointer-events-auto cursor-pointer transition-all duration-150 ${borderClass} ${
                        isFieldActive || isHovered
                          ? 'ring-2 ring-white scale-[1.02] shadow-lg z-20'
                          : 'z-10 opacity-90 hover:opacity-100'
                      }`}
                    >
                      {/* Bounding Label Badge */}
                      <div
                        className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight whitespace-nowrap shadow-xs flex items-center gap-1 ${tagColor}`}
                      >
                        <span>{box.label}</span>
                        <span className="opacity-75">[{box.confidence.toFixed(0)}%]</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                panelRawOcrBoxes.map((box) => {
                  const isHovered = hoveredBoxId === box.id;

                  return (
                    <div
                      key={box.id}
                      onMouseEnter={() => setHoveredBoxId(box.id)}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      style={{
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`,
                      }}
                      className={`absolute border rounded pointer-events-auto transition-all duration-150 border-cyan-400/80 bg-cyan-500/10 text-cyan-200 ${
                        isHovered
                          ? 'ring-2 ring-cyan-200 scale-[1.02] shadow-lg z-20 bg-cyan-500/25'
                          : 'z-10 opacity-85 hover:opacity-100'
                      }`}
                    >
                      <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight whitespace-nowrap shadow-xs flex items-center gap-1 bg-cyan-800 text-cyan-100">
                        <span>&ldquo;{box.text}&rdquo;</span>
                        <span className="opacity-75 font-normal">[{box.confidence.toFixed(0)}%]</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info Bar */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Quality Score: <strong className="text-emerald-400 font-mono">{imageQualityScore}%</strong>
          </span>
          <span>•</span>
          <span>
            Detected Regions:{' '}
            <strong className="text-white font-mono">
              {displayMode === 'compliance' ? panelComplianceBoxes.length : panelRawOcrBoxes.length}
            </strong>
            <span className="text-slate-500 ml-1">
              ({displayMode === 'compliance' ? 'Statutory Declarations' : 'Raw OCR Detections'})
            </span>
          </span>
          {hasMultiplePanels && images && (
            <>
              <span>•</span>
              <span className="text-blue-400 font-semibold">
                Inspecting: {images[activeImageIndex].label}
              </span>
            </>
          )}
        </div>
        <span className="text-[10px] text-slate-500">
          {displayMode === 'compliance'
            ? 'Click any statutory box to inspect rule verification'
            : 'Hover any raw OCR token to inspect bounding text & confidence'}
        </span>
      </div>
    </div>
  );
};
