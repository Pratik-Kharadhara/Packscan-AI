export type ComplianceStatus = 'COMPLIANT' | 'NEEDS_REVIEW' | 'NON_COMPLIANT';

export type FieldStatus = 'DETECTED' | 'LOW_CONFIDENCE' | 'NOT_DETECTED' | 'NOT_CAPTURED';

export type FieldKey =
  | 'manufacturer'
  | 'commodity'
  | 'netQuantity'
  | 'mfgDate'
  | 'mrp'
  | 'consumerComplaint';

export interface BoundingBox {
  id: string;
  fieldKey: FieldKey;
  label: string;
  // Expressed in percentage (0-100) for responsive canvas/SVG overlays
  x: number;
  y: number;
  width: number;
  height: number;
  status: FieldStatus;
  confidence: number;
}

export interface RawOcrBox {
  id: string;
  text: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  bbox?: number[][];
}

export interface VerifiedField {
  key: FieldKey;
  title: string;
  legalRule: string; // e.g. "Rule 6(1)(a) & (b)"
  description: string;
  status: FieldStatus;
  confidence: number; // 0 to 100
  extractedText: string | null;
  detectedFormat?: string;
  explanation: string;
  level1Presence: boolean; // Level 1: Presence check
  level2FormatValid: boolean; // Level 2: Format / Pattern check
  level3ReadabilityGood: boolean; // Level 3: OCR confidence & clarity
  warning?: string;
  remedy?: string;
}

export type ScanMode = 'single' | 'multi_angle' | 'batch';

export interface PackagePanelImage {
  id: string;
  url: string;
  name: string;
  label: string; // e.g. 'Front Display Panel', 'Back Declarations', 'Side / MRP Stamp', etc.
  boundingBoxes?: BoundingBox[];
  rawOcrBoxes?: RawOcrBox[];
}

export interface ScanResult {
  id: string;
  productName: string;
  brandName: string;
  category: 'Food & Beverages' | 'Household Goods' | 'Personal Care' | 'General Commodities';
  timestamp: string;
  imageUrl: string;
  imageThumbnail?: string;
  images?: PackagePanelImage[];
  scanMode?: ScanMode;
  batchId?: string;
  finalStatus: ComplianceStatus;
  overallConfidence: number;
  detectedCount: number; // e.g. 5 of 6
  inspectorId: string;
  deviceSource: string;
  fields: Record<FieldKey, VerifiedField>;
  boundingBoxes: BoundingBox[];
  rawOcrBoxes?: RawOcrBox[];
  summaryNote: string;
  imageQualityScore: number; // 0-100 (blur/glare assessment)
  processingTimeMs: number;
}

export type PipelineStageId =
  | 'capture'
  | 'preprocess'
  | 'ocr'
  | 'field_id'
  | 'rule_engine'
  | 'result';

export interface PipelineStageInfo {
  id: PipelineStageId;
  name: string;
  shortDesc: string;
  detailedDesc: string;
  technology: string;
  status: 'pending' | 'active' | 'completed';
}
