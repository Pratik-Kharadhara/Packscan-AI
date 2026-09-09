import React, { useState } from 'react';
import { BoundingBox, RawOcrBox, FieldKey, PackagePanelImage } from '../../types';
import { Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, Crosshair, Layers, FileText } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'compliance' | 'all_ocr'>('compliance');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const hasMultiplePanels = Boolean(images && images.length > 1);
  const currentPanel = hasMultiplePanels && images ? images[activeImageIndex] : null;
  const activeImageUrl = currentPanel?.url || imageUrl;

  // STRICT PANEL SEPARATION:
  // If inspecting a specific panel, use that panel's boxes only (or empty array).
  // Never borrow Panel 1 or global boxes for other panels.
  const currentBoxes: BoundingBox[] = hasMultiplePanels
    ? (currentPanel?.boundingBoxes ?? [])
    : (boundingBoxes ?? []);

  const currentRawOcrBoxes: RawOcrBox[] = hasMultiplePanels
    ? (currentPanel?.rawOcrBoxes ?? [])
    : (rawOcrBoxes ?? []);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full w-full min-h-0 select-none">
      {/* ================= LEFT BOX: REST OF THE BUTTONS ================= */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0 bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between overflow-y-auto shadow-lg space-y-4">
        {/* 1. Angles Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Package Angles
              </h3>
            </div>
            {hasMultiplePanels && (
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                {images?.length} Panels
              </span>
            )}
          </div>

          {/* Big Clickable Angle Buttons Stack */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {hasMultiplePanels && images ? (
              images.map((panel, idx) => {
                const isSelected = activeImageIndex === idx;
                const boxCount = panel.boundingBoxes?.length || 0;
                const rawCount = panel.rawOcrBoxes?.length || 0;
                return (
                  <button
                    type="button"
                    key={panel.id}
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setZoomLevel(1);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-400 ring-2 ring-emerald-400/50 shadow-md scale-[1.01]'
                        : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-mono font-black shrink-0 ${
                          isSelected
                            ? 'bg-white text-emerald-900 font-bold'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold truncate">
                        {panel.label}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        isSelected
                          ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/50'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {viewMode === 'compliance' ? `${boxCount} boxes` : `${rawCount} OCR`}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-900/80 text-emerald-300 flex items-center justify-center font-mono font-bold text-xs">
                  1
                </span>
                <span className="font-bold">Principal Display Surface</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Overlay Layer Mode */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
            Overlay Layer Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setViewMode('compliance')}
              className={`px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'compliance'
                  ? 'bg-emerald-700 text-white ring-1 ring-emerald-400 shadow-xs'
                  : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Declarations</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('all_ocr')}
              className={`px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'all_ocr'
                  ? 'bg-cyan-700 text-white ring-1 ring-cyan-400 shadow-xs'
                  : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>All OCR</span>
            </button>
          </div>
        </div>

        {/* 3. View & Zoom Controls */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
            Inspection Controls
          </label>

          {/* Toggle Boxes ON / OFF */}
          <button
            type="button"
            onClick={() => setShowBoxes(!showBoxes)}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              showBoxes
                ? 'bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600 shadow-xs'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {showBoxes ? <Eye className="w-4 h-4 text-emerald-300" /> : <EyeOff className="w-4 h-4" />}
            <span>{showBoxes ? 'Overlay Boxes: ON' : 'Overlay Boxes: OFF'}</span>
          </button>

          {/* Zoom controls row */}
          <div className="flex items-center justify-between gap-1.5 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={handleZoomOut}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="text-xs font-mono font-black text-slate-300 px-2 min-w-[52px] text-center select-none">
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4. Quality & Summary Info */}
        <div className="pt-2 border-t border-slate-800/80 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Image Quality:</span>
            <span className="text-emerald-400 font-mono font-black">{imageQualityScore}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">
              {viewMode === 'compliance' ? 'Statutory Boxes:' : 'OCR Detections:'}
            </span>
            <span className="text-white font-mono font-black">
              {viewMode === 'compliance' ? currentBoxes.length : currentRawOcrBoxes.length}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 pt-1 leading-relaxed border-t border-slate-800/60">
            {viewMode === 'compliance'
              ? 'Click any box on the image to inspect statutory declaration rules.'
              : 'Hover any detection token to view raw OCR extracted string.'}
          </p>
        </div>
      </div>

      {/* ================= RIGHT BOX: IMAGE ================= */}
      <div className="flex-1 min-w-0 h-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col relative shadow-lg">
        {/* Top Header Bar of Image Box */}
        <div className="bg-slate-950/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2 min-w-0">
            <Crosshair className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-white text-xs truncate">
              {currentPanel ? currentPanel.label : productName}
            </span>
            {hasMultiplePanels && (
              <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-800 shrink-0">
                Angle {activeImageIndex + 1} of {images?.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-400">
            <span>Scale: {Math.round(zoomLevel * 100)}%</span>
          </div>
        </div>

        {/* Main Image Stage Container */}
        <div className="relative flex-1 min-h-[440px] bg-slate-950 flex items-center justify-center p-4 overflow-auto">
          <div
            className="relative transition-transform duration-200 ease-out origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Base Product Label Image */}
            <img
              src={activeImageUrl}
              alt={productName}
              className="max-h-[calc(88vh-140px)] max-w-full w-auto rounded-lg shadow-2xl select-none block border border-slate-800"
            />

            {/* SVG/HTML Overlay for Bounding Boxes */}
            {showBoxes && viewMode === 'compliance' && (
              <div className="absolute inset-0 pointer-events-none">
                {currentBoxes.map((box) => {
                  const isFieldActive = activeFieldKey === box.fieldKey;
                  const isHovered = hoveredBoxId === box.id;

                  let borderClass = 'border-emerald-400 bg-emerald-500/15 text-emerald-300';
                  let tagColor = 'bg-emerald-600 text-white';

                  if (box.status === 'LOW_CONFIDENCE') {
                    borderClass = 'border-amber-400 bg-amber-500/20 text-amber-300';
                    tagColor = 'bg-amber-600 text-white';
                  } else if (box.status === 'NOT_DETECTED' || box.status === 'NOT_CAPTURED') {
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
                })}
              </div>
            )}

            {/* All OCR Raw Detections Overlay */}
            {showBoxes && viewMode === 'all_ocr' && (
              <div className="absolute inset-0 pointer-events-none">
                {currentRawOcrBoxes.map((box) => {
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
                      className={`absolute border rounded pointer-events-auto cursor-pointer transition-all duration-100 border-cyan-400/80 bg-cyan-500/10 text-cyan-200 ${
                        isHovered
                          ? 'ring-2 ring-cyan-200 bg-cyan-500/30 scale-[1.02] shadow-lg z-30'
                          : 'z-10 opacity-80 hover:opacity-100'
                      }`}
                      title={`"${box.text}" (${box.confidence.toFixed(0)}% conf)`}
                    >
                      {isHovered && (
                        <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight whitespace-nowrap shadow-xs flex items-center gap-1 bg-cyan-700 text-white z-40">
                          <span>{box.text}</span>
                          <span className="opacity-80">[{box.confidence.toFixed(0)}%]</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
