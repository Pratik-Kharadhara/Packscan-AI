import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Zap,
  Package,
  ShieldCheck,
  ChevronRight,
  Plus,
  Trash2,
  Layers,
  ListOrdered,
  Eye,
  Check,
  HelpCircle,
} from 'lucide-react';
import { SAMPLE_COMPLIANT, SAMPLE_NEEDS_REVIEW, SAMPLE_NON_COMPLIANT } from '../../data/mockScans';
import { ScanMode } from '../../types';

export interface UploadedImageItem {
  id: string;
  file?: File;
  previewUrl: string;
  name: string;
  sizeStr?: string;
  panelLabel: string;
}

interface UploadZoneProps {
  onStartAnalysis: (options: {
    file?: File;
    imageUrl?: string;
    images?: { file?: File; url?: string; name: string; panelLabel?: string }[];
    scanMode?: ScanMode;
    presetId?: string;
    productName?: string;
    category: 'Food & Beverages' | 'Household Goods' | 'Personal Care' | 'General Commodities';
  }) => void;
  isAnalyzing: boolean;
}

const PANEL_PRESETS = [
  'Front Display Panel',
  'Back Declarations',
  'Side / MRP & Date Stamp',
  'Top / Lid Surface',
  'Secondary Panel',
];

export const UploadZone: React.FC<UploadZoneProps> = ({ onStartAnalysis, isAnalyzing }) => {
  const [imageList, setImageList] = useState<UploadedImageItem[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<
    'Food & Beverages' | 'Household Goods' | 'Personal Care' | 'General Commodities'
  >('Food & Beverages');
  const [scanMode, setScanMode] = useState<ScanMode>('multi_angle');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPhotoCount, setCameraPhotoCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const singlePresets = [
    {
      id: 'needs_review',
      label: 'Sample 1: Ayurvedic Face Moisturizer 500g',
      sub: 'Shows: Low OCR confidence date + Missing complaint contact',
      badge: 'NEEDS_REVIEW',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      category: 'Personal Care' as const,
      data: SAMPLE_NEEDS_REVIEW,
    },
    {
      id: 'compliant',
      label: 'Sample 2: Sharbati Whole Wheat Atta 5kg',
      sub: 'Shows: All 6 mandatory declarations strictly compliant',
      badge: 'COMPLIANT',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      category: 'Food & Beverages' as const,
      data: SAMPLE_COMPLIANT,
    },
    {
      id: 'non_compliant',
      label: 'Sample 3: Spiced Potato Wafers 80g',
      sub: 'Shows: Price missing tax clause + Incomplete manufacturer PIN',
      badge: 'NON_COMPLIANT',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      category: 'Food & Beverages' as const,
      data: SAMPLE_NON_COMPLIANT,
    },
  ];

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const addFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validImages = fileArray.filter((f) => f.type.startsWith('image/'));

    if (validImages.length === 0) {
      alert('Please upload image files (JPEG, PNG, WEBP).');
      return;
    }

    const newItems: UploadedImageItem[] = validImages.map((file, idx) => {
      const totalIndex = imageList.length + idx;
      const defaultLabel =
        totalIndex === 0
          ? 'Front Display Panel'
          : totalIndex === 1
          ? 'Back Declarations'
          : totalIndex === 2
          ? 'Side / MRP & Date Stamp'
          : `Panel ${totalIndex + 1}`;

      return {
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        sizeStr: formatFileSize(file.size),
        panelLabel: defaultLabel,
      };
    });

    setImageList((prev) => [...prev, ...newItems]);
    setSelectedPresetId(null);

    // If product name is empty, auto-populate from first file
    if (!productName && validImages[0]) {
      setProductName(validImages[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (id: string) => {
    setImageList((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      if (filtered.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return filtered;
    });
  };

  const updatePanelLabel = (id: string, newLabel: string) => {
    setImageList((prev) =>
      prev.map((img) => (img.id === id ? { ...img, panelLabel: newLabel } : img))
    );
  };

  const clearAllImages = () => {
    setImageList([]);
    setSelectedPresetId(null);
    setProductName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    stopCamera();
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = singlePresets.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setImageList([]);
    setProductName(preset.data.productName);
    setCategory(preset.category);
    setScanMode('single');
  };

  const handleMultiAngleDemoPreset = () => {
    setSelectedPresetId(null);
    setCategory('Food & Beverages');
    setProductName('Sharbati Whole Wheat Atta 5kg (Multi-Angle)');
    setScanMode('multi_angle');

    setImageList([
      {
        id: 'demo-p1',
        previewUrl: SAMPLE_COMPLIANT.imageUrl,
        name: 'atta_principal_front_panel.jpg',
        sizeStr: '1.2 MB',
        panelLabel: 'Front Display Panel',
      },
      {
        id: 'demo-p2',
        previewUrl: SAMPLE_NEEDS_REVIEW.imageUrl,
        name: 'atta_statutory_back_declarations.jpg',
        sizeStr: '1.4 MB',
        panelLabel: 'Back Declarations',
      },
      {
        id: 'demo-p3',
        previewUrl: SAMPLE_NON_COMPLIANT.imageUrl,
        name: 'atta_side_mrp_stamp.jpg',
        sizeStr: '980 KB',
        panelLabel: 'Side / MRP & Date Stamp',
      },
    ]);
  };

  const handleBatchDemoPreset = () => {
    setSelectedPresetId(null);
    setCategory('Food & Beverages');
    setProductName('Retail Shelf Audit Batch');
    setScanMode('batch');

    setImageList([
      {
        id: 'batch-p1',
        previewUrl: SAMPLE_COMPLIANT.imageUrl,
        name: 'Sharbati Whole Wheat Atta 5kg.jpg',
        sizeStr: '1.2 MB',
        panelLabel: 'Package 1',
      },
      {
        id: 'batch-p2',
        previewUrl: SAMPLE_NEEDS_REVIEW.imageUrl,
        name: 'Ayurvedic Face Moisturizer 500g.jpg',
        sizeStr: '1.5 MB',
        panelLabel: 'Package 2',
      },
      {
        id: 'batch-p3',
        previewUrl: SAMPLE_NON_COMPLIANT.imageUrl,
        name: 'Spiced Potato Wafers 80g.jpg',
        sizeStr: '880 KB',
        panelLabel: 'Package 3',
      },
    ]);
  };

  // Camera capture handlers
  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Unable to access camera. Please check browser permissions or upload an image file.');
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      const count = cameraPhotoCount + 1;
      setCameraPhotoCount(count);

      const defaultLabel =
        count === 1
          ? 'Front Display Panel'
          : count === 2
          ? 'Back Declarations'
          : count === 3
          ? 'Side / MRP & Date Stamp'
          : `Angle ${count}`;

      const newPhoto: UploadedImageItem = {
        id: `cam-${Date.now()}`,
        previewUrl: dataUrl,
        name: `Camera_Capture_Angle_${count}.jpg`,
        sizeStr: 'Photo Capture',
        panelLabel: defaultLabel,
      };

      setImageList((prev) => [...prev, newPhoto]);
      setSelectedPresetId(null);
      if (!productName) {
        setProductName('Inspected Package Specimen');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageList.length === 0 && !selectedPresetId) return;

    if (selectedPresetId) {
      const preset = singlePresets.find((p) => p.id === selectedPresetId);
      onStartAnalysis({
        presetId: selectedPresetId,
        imageUrl: preset?.data.imageUrl,
        productName: productName.trim() || preset?.data.productName,
        category,
        scanMode: 'single',
      });
      return;
    }

    if (imageList.length === 1) {
      onStartAnalysis({
        file: imageList[0].file,
        imageUrl: imageList[0].previewUrl,
        images: [
          {
            file: imageList[0].file,
            url: imageList[0].previewUrl,
            name: imageList[0].name,
            panelLabel: imageList[0].panelLabel,
          },
        ],
        productName: productName.trim() || imageList[0].name.replace(/\.[^/.]+$/, ''),
        category,
        scanMode: 'single',
      });
    } else {
      // Multiple images
      onStartAnalysis({
        images: imageList.map((img) => ({
          file: img.file,
          url: img.previewUrl,
          name: img.name,
          panelLabel: img.panelLabel,
        })),
        productName: productName.trim() || (scanMode === 'batch' ? 'Batch Inspection' : imageList[0].name.replace(/\.[^/.]+$/, '')),
        category,
        scanMode,
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto" id="upload-zone-root">
      {/* Verified Reference Test Presets Banner */}
      <div className="mb-6 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#166534]" />
            <span className="text-xs sm:text-sm font-extrabold text-[#166534] uppercase tracking-wide">
              Reference Evaluation Test Cases (1-Click Test)
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#166534]/80">
            Legal Metrology (Packaged Commodities) Rules, 2011
          </span>
        </div>

        {/* Preset Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-2.5">
          {singlePresets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                type="button"
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`text-left p-3 rounded-xl border transition-all duration-150 ${
                  isSelected
                    ? 'bg-white border-[#166534] shadow-xs ring-1 ring-[#166534]'
                    : 'bg-white/90 hover:bg-white border-[#D1D5DB] hover:border-[#166534]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}
                  >
                    {preset.badge.replace('_', ' ')}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
                </div>
                <div className="text-xs font-bold text-[#1F2937] line-clamp-1">
                  {preset.label}
                </div>
                <div className="text-[10px] text-[#4B5563] line-clamp-2 mt-0.5">
                  {preset.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* Multi-Image Quick Presets */}
        <div className="pt-2 border-t border-[#BBF7D0] flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-[#166534] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#166534]" />
            Multi-Image Evaluation Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleMultiAngleDemoPreset}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#166534] hover:bg-[#14532D] text-white shadow-2xs transition-all flex items-center gap-1.5"
            >
              <Layers className="w-3 h-3" />
              <span>Multi-Angle Specimen (Front + Back + Side)</span>
            </button>
            <button
              type="button"
              onClick={handleBatchDemoPreset}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#65A30D] hover:bg-[#4D7C0F] text-white shadow-2xs transition-all flex items-center gap-1.5"
            >
              <ListOrdered className="w-3 h-3" />
              <span>Batch Queue Specimen (3 Packages)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Upload / Multi-Image Management Card */}
      <div className="bg-white rounded-2xl border border-[#D1D5DB] shadow-2xs p-6 sm:p-8">
        {/* If Camera is active */}
        {cameraActive ? (
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-80 object-cover"
            />
            {/* Overlay target reticle for package alignment */}
            <div className="absolute inset-0 border-2 border-dashed border-white/50 m-6 rounded-xl pointer-events-none flex items-center justify-center">
              <div className="text-center text-white/90 bg-slate-950/75 px-4 py-2 rounded-lg text-xs backdrop-blur-sm shadow-md">
                Align package surface (Front, Back, or Side Stamp) inside frame
                {cameraPhotoCount > 0 && (
                  <div className="text-emerald-400 font-bold mt-1">
                    ✓ {cameraPhotoCount} {cameraPhotoCount === 1 ? 'angle' : 'angles'} captured so far
                  </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-3">
              <button
                type="button"
                onClick={capturePhoto}
                className="bg-[#166534] hover:bg-[#14532D] text-white font-bold px-5 py-2.5 rounded-full shadow-md flex items-center gap-2 text-xs transition-transform active:scale-95"
              >
                <Camera className="w-4 h-4" />
                Capture Photo {cameraPhotoCount + 1}
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="bg-[#1F2937] hover:bg-stone-800 text-white font-bold px-4 py-2.5 rounded-full text-xs"
              >
                {cameraPhotoCount > 0 ? 'Done Adding' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Multi-Image Selected Gallery State */}
        {imageList.length > 0 ? (
          <div className="mb-6 space-y-4">
            {/* Gallery Top Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F8F5] p-3.5 rounded-xl border border-[#D1D5DB]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] flex items-center justify-center font-bold text-xs">
                  {imageList.length}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#1F2937]">
                    {imageList.length === 1 ? '1 Image Attached' : `${imageList.length} Images Attached`}
                  </h4>
                  <p className="text-[11px] text-[#4B5563]">
                    {imageList.length === 1
                      ? 'You can add more angles to scan front, back, and MRP stamp together.'
                      : 'Multiple angles detected. Select workflow below.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white hover:bg-stone-50 text-[#1F2937] border border-[#D1D5DB] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#166534]" />
                  <span>Add More Images</span>
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-white hover:bg-stone-50 text-[#1F2937] border border-[#D1D5DB] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <Camera className="w-3.5 h-3.5 text-[#4B5563]" />
                  <span>Camera</span>
                </button>

                <button
                  type="button"
                  onClick={clearAllImages}
                  className="text-xs text-[#B91C1C] hover:text-red-800 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Grid of uploaded images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {imageList.map((img, index) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl border border-[#D1D5DB] bg-white overflow-hidden shadow-2xs hover:border-[#166534] transition-all flex flex-col"
                >
                  {/* Image Preview */}
                  <div className="relative h-44 bg-[#F7F8F5] flex items-center justify-center overflow-hidden p-2">
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="h-full w-auto object-contain rounded-md group-hover:scale-[1.02] transition-transform duration-200"
                    />

                    {/* Badge index */}
                    <div className="absolute top-2 left-2 bg-[#1F2937]/90 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                      #{index + 1}
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      title="Remove image"
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-[#1F2937]/70 hover:bg-[#B91C1C] text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card Details & Surface Selector */}
                  <div className="p-3 bg-white flex-1 flex flex-col justify-between border-t border-[#D1D5DB]">
                    <div className="mb-2">
                      <div className="text-xs font-bold text-[#1F2937] truncate" title={img.name}>
                        {img.name}
                      </div>
                      <div className="text-[10px] text-[#6B7280]">{img.sizeStr}</div>
                    </div>

                    {/* Surface / Panel Tag */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#4B5563] uppercase tracking-wide mb-1">
                        Package Surface / Angle:
                      </label>
                      <select
                        value={img.panelLabel}
                        onChange={(e) => updatePanelLabel(img.id, e.target.value)}
                        className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-[#D1D5DB] bg-[#F7F8F5] focus:bg-white text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#166534] focus:border-[#166534]"
                      >
                        {PANEL_PRESETS.map((preset) => (
                          <option key={preset} value={preset}>
                            {preset}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mode Selector Card (when 2 or more images are selected) */}
            {imageList.length > 1 && (
              <div className="mt-4 p-4 rounded-xl border border-[#D1D5DB] bg-[#F7F8F5]">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#166534]" />
                    <span>Choose Multi-Image Scanning Workflow:</span>
                  </div>
                  <span className="text-[11px] text-[#166534] font-semibold">
                    {imageList.length} files selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mode 1: Multi-Angle Scan */}
                  <div
                    onClick={() => setScanMode('multi_angle')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      scanMode === 'multi_angle'
                        ? 'bg-white border-[#166534] shadow-xs ring-1 ring-[#166534]'
                        : 'bg-white/90 hover:bg-white border-[#D1D5DB]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-extrabold text-xs text-[#1F2937] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#166534]" />
                        Multi-Angle Package Scan
                      </div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-[#F0FDF4] text-[#166534] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-[#4B5563] leading-relaxed">
                      For <strong>1 product</strong> with multiple sides (Front, Back, Side).
                      Consolidates declarations from all panels into a unified audit.
                    </p>
                  </div>

                  {/* Mode 2: Batch Screening */}
                  <div
                    onClick={() => setScanMode('batch')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      scanMode === 'batch'
                        ? 'bg-white border-[#166534] shadow-xs ring-1 ring-[#166534]'
                        : 'bg-white/90 hover:bg-white border-[#D1D5DB]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-extrabold text-xs text-[#1F2937] flex items-center gap-1.5">
                        <ListOrdered className="w-3.5 h-3.5 text-[#65A30D]" />
                        Batch Package Screening
                      </div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-[#F7F8F5] text-[#1F2937] px-2 py-0.5 rounded-full border border-[#D1D5DB]">
                        Queue Mode
                      </span>
                    </div>
                    <p className="text-[11px] text-[#4B5563] leading-relaxed">
                      For <strong>{imageList.length} different products</strong>. Runs sequential
                      screenings and generates individual audit records for each.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : selectedPresetId ? (
          /* Single Preset Selection Preview */
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1F2937]">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <span>Standard Test Specimen Loaded</span>
              </div>
              <button
                type="button"
                onClick={clearAllImages}
                className="text-xs text-[#4B5563] hover:text-[#B91C1C] flex items-center gap-1 font-semibold"
              >
                <X className="w-3.5 h-3.5" />
                Change Specimen
              </button>
            </div>

            <div className="relative rounded-xl border border-[#D1D5DB] bg-[#F7F8F5] overflow-hidden max-h-96 flex items-center justify-center p-3">
              <img
                src={
                  singlePresets.find((p) => p.id === selectedPresetId)?.data.imageUrl
                }
                alt="Selected preset"
                className="max-h-80 w-auto rounded-lg object-contain shadow-2xs"
              />
              <div className="absolute top-4 left-4 bg-[#1F2937]/90 text-white px-3 py-1 rounded-md text-[11px] font-bold">
                Specimen: {selectedPresetId.toUpperCase().replace('_', ' ')}
              </div>
            </div>
          </div>
        ) : (
          /* Drag & Drop Upload Zone (Empty State) */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-150 mb-6 ${
              isDragging
                ? 'border-[#166534] bg-[#F0FDF4] scale-[1.01]'
                : 'border-[#D1D5DB] hover:border-[#166534] hover:bg-[#F7F8F5]'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] text-[#166534] mx-auto flex items-center justify-center mb-4 border border-[#BBF7D0] shadow-2xs">
              <Upload className="w-7 h-7" />
            </div>

            <h4 className="text-base sm:text-lg font-extrabold text-[#1F2937] mb-1">
              Upload Package Commodity Label(s)
            </h4>
            <p className="text-xs sm:text-sm text-[#4B5563] max-w-md mx-auto mb-4">
              <strong>Upload single or multiple images at once</strong> (e.g. Front, Back &amp; Side
              panels, or multiple packaged products). Drag and drop or browse from device.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="bg-[#166534] hover:bg-[#14532D] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Select Image(s)</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startCamera();
                }}
                className="bg-white hover:bg-stone-50 text-[#1F2937] border border-[#D1D5DB] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-[#4B5563]" />
                Use Camera
              </button>
            </div>

            <p className="text-[11px] text-[#6B7280] mt-4">
              Tip: You can select multiple files at once in the file picker dialog.
            </p>
          </div>
        )}

        {/* Hidden Multi-File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              addFiles(e.target.files);
            }
          }}
          className="hidden"
        />

        {/* Metadata Inputs (Category & Name) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1.5">
                {scanMode === 'batch' && imageList.length > 1
                  ? 'Batch Inspection Name'
                  : 'Product Generic Name / Title'}
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Whole Wheat Flour / Face Cream"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#166534] focus:border-[#166534]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1.5">
                Commodity Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#166534] focus:border-[#166534] bg-white"
              >
                <option value="Food & Beverages">Food &amp; Beverages (Packaged Foods, Spices, Grains)</option>
                <option value="Personal Care">Personal Care (Cosmetics, Creams, Soaps)</option>
                <option value="Household Goods">Household Goods (Detergents, Cleaners, Utensils)</option>
                <option value="General Commodities">General Commodities (Pre-packaged items)</option>
              </select>
            </div>
          </div>

          {/* Verification Scope Checklist notice */}
          <div className="bg-[#F7F8F5] rounded-xl p-3 border border-[#D1D5DB] text-[#4B5563] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#166534] shrink-0" />
              <span>
                Engine verifies: <strong>Manufacturer</strong>, <strong>Commodity</strong>,{' '}
                <strong>Net Qty</strong>, <strong>Mfg Date</strong>, <strong>MRP</strong>, and{' '}
                <strong>Consumer Grievance</strong>.
              </span>
            </div>
            <span className="text-[10px] text-[#6B7280] font-mono hidden md:inline">
              Rule 6(1) PCR 2011
            </span>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              id="analyze-package-btn"
              type="submit"
              disabled={(imageList.length === 0 && !selectedPresetId) || isAnalyzing}
              className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xs transition-all ${
                (imageList.length === 0 && !selectedPresetId) || isAnalyzing
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-[#166534] hover:bg-[#14532D] text-white shadow-xs active:scale-[0.99]'
              }`}
            >
              <Zap className="w-4 h-4 text-[#BBF7D0]" />
              <span>
                {isAnalyzing
                  ? 'Running Verification Pipeline...'
                  : imageList.length > 1
                  ? scanMode === 'batch'
                    ? `Batch Screen ${imageList.length} Packages (Sequential Pipeline)`
                    : `Analyze Complete Package (${imageList.length} Panels Consolidated)`
                  : imageList.length === 1 || selectedPresetId
                  ? 'Analyze Package for Legal Metrology Compliance'
                  : 'Add Image(s) or Select a Preset to Start'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
