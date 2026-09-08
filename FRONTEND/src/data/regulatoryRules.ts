export interface RegulatoryRule {
  ruleNumber: string;
  title: string;
  summary: string;
  keyClauses: string[];
  mandatoryDeclarations: {
    name: string;
    subRule: string;
    requirement: string;
    levelCheck: string;
  }[];
}

export const LEGAL_METROLOGY_RULES: RegulatoryRule[] = [
  {
    ruleNumber: 'Rule 6',
    title: 'Declarations to be Made on Every Package',
    summary:
      'Every package shall bear thereon or on label securely affixed thereto, definite, plain and conspicuous declarations.',
    keyClauses: [
      'Sub-rule (1)(a): Name and complete address of the manufacturer, or where manufacturer is not the packer, name and address of manufacturer and packer.',
      'Sub-rule (1)(b): For imported packages, name and address of the importer and country of origin.',
      'Sub-rule (1)(c): Common or generic names of the commodity contained in the package.',
      'Sub-rule (1)(d): Net quantity in terms of standard unit of weight, measure or number.',
      'Sub-rule (1)(e): Month and year in which commodity is manufactured or pre-packed or imported.',
      'Sub-rule (1)(f): Maximum Retail Price (MRP) inclusive of all taxes.',
      'Sub-rule (1)(g): Name, address, telephone number, and e-mail address of person/office for consumer complaints.',
    ],
    mandatoryDeclarations: [
      {
        name: 'Manufacturer / Packer',
        subRule: 'Rule 6(1)(a) & (b)',
        requirement: 'Full name, registered office address, industrial area/plot, city, state, and 6-digit postal PIN code.',
        levelCheck: 'Presence + Full postal address syntax validation (PIN code match)',
      },
      {
        name: 'Commodity Identity',
        subRule: 'Rule 6(1)(c)',
        requirement: 'Generic or common name prominent on the principal display panel.',
        levelCheck: 'Presence + Brand vs generic terminology recognition',
      },
      {
        name: 'Net Quantity',
        subRule: 'Rule 6(1)(d)',
        requirement: 'Standard metric SI units: g, kg, ml, l, or numerical count (N / U). Units like gms, kgs, ltr are invalid.',
        levelCheck: 'Format check against SI units + numeric value extraction',
      },
      {
        name: 'Mfg. / Pre-pack Date',
        subRule: 'Rule 6(1)(e)',
        requirement: 'Month and year (MM/YYYY or Month YYYY) of manufacture or pre-packing.',
        levelCheck: 'Date format parsing + OCR dot-matrix confidence evaluation',
      },
      {
        name: 'Retail Sale Price (MRP)',
        subRule: 'Rule 6(1)(f)',
        requirement: 'MRP in Indian Rupees (₹) with explicit clause "inclusive of all taxes" or "incl. of all taxes".',
        levelCheck: 'Regex check for currency, value, and mandatory tax inclusive phrase',
      },
      {
        name: 'Consumer Complaint Contact',
        subRule: 'Rule 6(1)(g)',
        requirement: 'Name/designation of grievance officer, postal address, valid telephone/toll-free number, and email address.',
        levelCheck: 'Presence check for grievance keywords, telephone format, and email syntax',
      },
    ],
  },
  {
    ruleNumber: 'Rule 7',
    title: 'Principal Display Panel & Letter/Numeral Dimensions',
    summary:
      'Specifies the mandatory area of the principal display panel and standard minimum height of letters and numerals based on net quantity.',
    keyClauses: [
      'Declarations shall be legible, prominent, and distinct from the background.',
      'Minimum numeral height schedule: Up to 50g/ml: 1.0mm; 50g-200g/ml: 2.0mm; 200g-1kg/l: 4.0mm; Above 1kg/l: 6.0mm.',
      'All declarations must maintain adequate visual contrast against package artwork.',
    ],
    mandatoryDeclarations: [],
  },
  {
    ruleNumber: 'Rule 8',
    title: 'Location & Manner of Declarations',
    summary:
      'Governs grouping and conspicuous placement of mandatory declarations on the principal display panel or information panel.',
    keyClauses: [
      'Declarations must appear together on the same panel or clearly refer to the panel where declarations are located.',
      'No declaration shall be obscured or covered by wrapping, sealing, or stickers.',
      'Net quantity and retail sale price must appear in close proximity on the display panel.',
    ],
    mandatoryDeclarations: [],
  },
];

export const TECHNICAL_PIPELINE_STAGES = [
  {
    step: 1,
    id: 'capture',
    name: 'Image Capture & Quality Check',
    tech: 'OpenCV / WebRTC',
    icon: 'Camera',
    description:
      'High-resolution capture via mobile or web. Performs automated pre-checks for motion blur (Laplacian variance), excessive glare, specular reflections, and boundary cropping.',
  },
  {
    step: 2,
    id: 'preprocess',
    name: 'Image Preprocessing',
    tech: 'OpenCV (Python)',
    icon: 'Sliders',
    description:
      'Applies adaptive perspective transform (homography deskew), bilateral filtering for noise reduction, CLAHE contrast enhancement, and multi-scale Otsu binarization.',
  },
  {
    step: 3,
    id: 'ocr',
    name: 'OCR & Bounding Box Localization',
    tech: 'EasyOCR / Tesseract 5',
    icon: 'Search',
    description:
      'Extracts localized text segments with 2D coordinate bounding boxes and word-level softmax confidence scores. Supports multi-lingual packaging and stylized label fonts.',
  },
  {
    step: 4,
    id: 'field_id',
    name: 'Field Identification',
    tech: 'Regex & Named Entity Normalization',
    icon: 'Cpu',
    description:
      'Categorizes extracted text blobs into the 6 statutory declaration categories using robust regex dictionaries (MRP formats, metric mass, date structures, contact patterns).',
  },
  {
    step: 5,
    id: 'rule_engine',
    name: 'Rule Engine Evaluation',
    tech: 'Configurable Python Rules',
    icon: 'ShieldCheck',
    description:
      'Compares extracted declaration attributes against the Legal Metrology (Packaged Commodities) Rules, 2011. Checks presence (Level 1), syntax/format (Level 2), and OCR confidence (Level 3).',
  },
  {
    step: 6,
    id: 'result',
    name: 'Explainable Outcome & Reporting',
    tech: 'ReportLab / PDF Engine',
    icon: 'FileText',
    description:
      'Synthesizes findings into COMPLIANT, NON_COMPLIANT, or NEEDS_REVIEW. Generates plain-language reasoning for every flag, visual bounding box overlays, and downloadable inspection PDF reports.',
  },
];
