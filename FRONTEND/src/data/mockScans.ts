import { ScanResult } from '../types';

// High-fidelity SVG label data generator for realistic package visualization
export function generatePackageLabelSvg(config: {
  productName: string;
  brand: string;
  category: string;
  netQty: string;
  mrp: string;
  mfgDate: string;
  mfgBy: string;
  careContact: string;
  bgColor: string;
  accentColor: string;
  statusVariant: 'compliant' | 'needs_review' | 'non_compliant';
}): string {
  const isBlurredDate = config.statusVariant === 'needs_review';
  const isMissingCare = config.statusVariant === 'needs_review';
  const isNonCompliant = config.statusVariant === 'non_compliant';

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%" style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif;">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${config.bgColor}" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <filter id="slightBlur">
        <feGaussianBlur stdDeviation="3.5" />
      </filter>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.15" />
      </filter>
    </defs>

    <!-- Pack Body & Border -->
    <rect x="15" y="15" width="570" height="770" rx="24" fill="url(#bgGrad)" stroke="#334155" stroke-width="3"/>

    <!-- Subtle Packaging Gloss / Highlights -->
    <path d="M 30 30 Q 300 90 570 30" stroke="rgba(255,255,255,0.15)" stroke-width="12" fill="none" />
    <path d="M 30 770 Q 300 710 570 770" stroke="rgba(0,0,0,0.4)" stroke-width="10" fill="none" />

    <!-- Top Brand Header Banner -->
    <rect x="35" y="35" width="530" height="110" rx="16" fill="${config.accentColor}" opacity="0.92" filter="url(#shadow)"/>
    <text x="300" y="75" text-anchor="middle" fill="#ffffff" font-size="28" font-weight="800" letter-spacing="1.5">${config.brand.toUpperCase()}</text>
    <text x="300" y="112" text-anchor="middle" fill="#f8fafc" font-size="16" font-weight="600" opacity="0.95">${config.category} | PREMIUM SELECTION</text>

    <!-- Center Product Illustration Area -->
    <rect x="35" y="160" width="530" height="175" rx="14" fill="#ffffff" filter="url(#shadow)"/>
    <circle cx="110" cy="245" r="50" fill="${config.accentColor}" opacity="0.12"/>
    <text x="110" y="258" text-anchor="middle" font-size="44">📦</text>
    
    <!-- Commodity Identity Name (Rule 6(1)(c)) -->
    <g id="svg-commodity">
      <text x="180" y="225" fill="#0f172a" font-size="24" font-weight="800">${config.productName}</text>
      <text x="180" y="255" fill="#64748b" font-size="14" font-weight="500">Traditional Quality Assurance • 100% Pure Sourced</text>
      <rect x="180" y="275" width="125" height="24" rx="4" fill="#ecfdf5" stroke="#10b981" stroke-width="1"/>
      <text x="242" y="291" text-anchor="middle" fill="#065f46" font-size="11" font-weight="700">FSSAI Lic. 1001902200987</text>
    </g>

    <!-- Compliance Data Declarations Panel (Mandatory Panel as per Rules 6, 7 & 8) -->
    <rect x="35" y="350" width="530" height="395" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" filter="url(#shadow)"/>

    <!-- Section Title: Mandatory Declarations -->
    <rect x="35" y="350" width="530" height="42" rx="16" fill="#f8fafc" />
    <path d="M 35 392 L 565 392" stroke="#e2e8f0" stroke-width="1.5"/>
    <text x="55" y="377" fill="#1e293b" font-size="13" font-weight="800" letter-spacing="0.5">LEGAL METROLOGY MANDATORY DECLARATIONS (PACKAGED COMMODITIES RULES, 2011)</text>

    <!-- Field 1: Commodity Identity (Rule 6(1)(c)) -->
    <g id="svg-field-commodity">
      <text x="55" y="420" fill="#64748b" font-size="11" font-weight="700">GENERIC COMMODITY IDENTITY:</text>
      <text x="55" y="440" fill="#0f172a" font-size="15" font-weight="700">${config.productName}</text>
    </g>

    <!-- Divider -->
    <line x1="55" y1="455" x2="545" y2="455" stroke="#f1f5f9" stroke-width="1.5" />

    <!-- Field 2: Net Quantity (Rule 6(1)(d)) -->
    <g id="svg-field-net-qty">
      <text x="55" y="480" fill="#64748b" font-size="11" font-weight="700">NET QUANTITY (WHEN PACKED):</text>
      <text x="55" y="504" fill="#0f172a" font-size="18" font-weight="800" letter-spacing="0.5">${config.netQty}</text>
    </g>

    <!-- Field 3: Retail Sale Price (Rule 6(1)(f)) -->
    <g id="svg-field-mrp" transform="translate(300, 0)">
      <text x="0" y="480" fill="#64748b" font-size="11" font-weight="700">MAXIMUM RETAIL PRICE (MRP):</text>
      ${
        isNonCompliant
          ? `<text x="0" y="504" fill="#dc2626" font-size="16" font-weight="800">PRICE: ${config.mrp} (TAXES NOT SPECIFIED)</text>`
          : `<text x="0" y="504" fill="#0f172a" font-size="17" font-weight="800">₹ ${config.mrp} <tspan font-size="11" font-weight="600" fill="#64748b">(Incl. of all taxes)</tspan></text>`
      }
    </g>

    <!-- Divider -->
    <line x1="55" y1="525" x2="545" y2="525" stroke="#f1f5f9" stroke-width="1.5" />

    <!-- Field 4: Manufacturing / Pre-pack Date (Rule 6(1)(e)) -->
    <g id="svg-field-mfg-date">
      <text x="55" y="550" fill="#64748b" font-size="11" font-weight="700">MONTH &amp; YEAR OF MANUFACTURE / PKGD:</text>
      ${
        isBlurredDate
          ? `<g filter="url(#slightBlur)"><text x="55" y="572" fill="#0f172a" font-size="15" font-weight="700" letter-spacing="1">MFD: ${config.mfgDate}</text></g>
             <text x="215" y="572" fill="#d97706" font-size="11" font-weight="700">⚠ [Faint Dot-Matrix Stamp]</text>`
          : `<text x="55" y="572" fill="#0f172a" font-size="15" font-weight="700">MFD: ${config.mfgDate} | BATCH NO: BT-${Math.floor(1000 + Math.random() * 9000)}</text>`
      }
    </g>

    <!-- Divider -->
    <line x1="55" y1="590" x2="545" y2="590" stroke="#f1f5f9" stroke-width="1.5" />

    <!-- Field 5: Manufacturer / Packer Details (Rule 6(1)(a) & (b)) -->
    <g id="svg-field-mfg-by">
      <text x="55" y="612" fill="#64748b" font-size="11" font-weight="700">MANUFACTURED &amp; PACKED BY:</text>
      ${
        isNonCompliant
          ? `<text x="55" y="632" fill="#dc2626" font-size="13" font-weight="700">${config.mfgBy.split(',')[0]} (Incomplete address: PIN missing)</text>`
          : `<text x="55" y="632" fill="#0f172a" font-size="13" font-weight="600">${config.mfgBy}</text>`
      }
    </g>

    <!-- Divider -->
    <line x1="55" y1="655" x2="545" y2="655" stroke="#f1f5f9" stroke-width="1.5" />

    <!-- Field 6: Consumer Complaint Details (Rule 6(1)(g)) -->
    <g id="svg-field-care">
      <text x="55" y="675" fill="#64748b" font-size="11" font-weight="700">CONSUMER CARE &amp; COMPLAINT CELL:</text>
      ${
        isMissingCare
          ? `<rect x="55" y="688" width="480" height="35" rx="6" fill="#fef2f2" stroke="#fca5a5" stroke-dasharray="4 3"/>
             <text x="295" y="710" text-anchor="middle" fill="#ef4444" font-size="12" font-weight="700">❌ [NO MANDATORY CONSUMER COMPLAINT CONTACT SPECIFIED]</text>`
          : `<text x="55" y="698" fill="#0f172a" font-size="13" font-weight="600">${config.careContact}</text>
             <text x="55" y="718" fill="#475569" font-size="12" font-weight="500">Toll-Free: 1800-425-9988 | Email: customercare@${config.brand.toLowerCase().replace(/[^a-z]/g, '')}.co.in</text>`
      }
    </g>

    <!-- Bottom Verification Watermark -->
    <rect x="35" y="750" width="530" height="24" rx="6" fill="#0f172a" opacity="0.85"/>
    <text x="300" y="766" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="600" letter-spacing="1">PACKSCAN AI • DIGITAL COMPLIANCE SCREENING • LEGAL METROLOGY PCR 2011</text>
  </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Preset 1: NEEDS_REVIEW (The showcase sample for packaged commodities)
// Net quantity detected: 500g ✅
// Manufacturer details detected ✅
// Manufacturing date — low OCR confidence ⚠️
// Retail sale price detected ✅
// Consumer complaint contact — not detected ❌
// FINAL STATUS: NEEDS_REVIEW
export const SAMPLE_NEEDS_REVIEW: ScanResult = {
  id: 'SCAN-2026-0042',
  productName: 'PureGlow Ayurvedic Face Care Moisturizer',
  brandName: 'PureGlow Herbal Labs',
  category: 'Personal Care',
  timestamp: '07 Sep 2026, 11:15 AM IST',
  imageUrl: generatePackageLabelSvg({
    productName: 'PureGlow Ayurvedic Moisturizer',
    brand: 'PureGlow',
    category: 'Personal Care',
    netQty: '500 g',
    mrp: '349.00',
    mfgDate: '05/2026',
    mfgBy: 'PureGlow Herbals Pvt Ltd, Plot 42, Sector 8, IMT Manesar, Gurugram, Haryana - 122050',
    careContact: '',
    bgColor: '#1e293b',
    accentColor: '#0369a1',
    statusVariant: 'needs_review',
  }),
  finalStatus: 'NEEDS_REVIEW',
  overallConfidence: 78.4,
  detectedCount: 4, // 4 detected cleanly, 1 low confidence, 1 missing
  inspectorId: 'VF-INSP-902',
  deviceSource: 'VisionForge Field Mobile Scanner v2.4',
  summaryNote:
    'Consumer complaint contact was completely omitted from the package label (Rule 6(1)(g)). Manufacturing date stamp has faint dot-matrix printing resulting in 61% OCR confidence. Inspector review required.',
  imageQualityScore: 84,
  processingTimeMs: 1420,
  fields: {
    manufacturer: {
      key: 'manufacturer',
      title: 'Manufacturer / Packer Details',
      legalRule: 'Rule 6(1)(a) & (b)',
      description: 'Name and complete physical address of the manufacturer, packer, or importer.',
      status: 'DETECTED',
      confidence: 96.2,
      extractedText:
        'PureGlow Herbals Pvt Ltd, Plot 42, Sector 8, IMT Manesar, Gurugram, Haryana - 122050',
      detectedFormat: 'Legal Entity + Plot/Sector + City + State + 6-digit PIN',
      explanation:
        'Full registered legal entity name and complete physical address with valid PIN code verified.',
      level1Presence: true,
      level2FormatValid: true,
      level3ReadabilityGood: true,
    },
    commodity: {
      key: 'commodity',
      title: 'Commodity Identity',
      legalRule: 'Rule 6(1)(c)',
      description: 'Generic name or common identity of the commodity contained within the package.',
      status: 'DETECTED',
      confidence: 94.8,
      extractedText: 'PureGlow Ayurvedic Moisturizer',
      detectedFormat: 'Generic Nomenclature',
      explanation: 'Clear commodity identification visible on the principal display panel.',
      level1Presence: true,
      level2FormatValid: true,
      level3ReadabilityGood: true,
    },
    netQuantity: {
      key: 'netQuantity',
      title: 'Net Quantity',
      legalRule: 'Rule 6(1)(d)',
      description: 'Standard unit of weight, measure, or numerical count as per Legal Metrology norms.',
      status: 'DETECTED',
      confidence: 98.5,
      extractedText: '500 g',
      detectedFormat: 'Standard Metric Mass (g)',
      explanation: 'Net quantity conforms to standard metric mass unit (Rule 6(1)(d)). Found: 500 g.',
      level1Presence: true,
      level2FormatValid: true,
      level3ReadabilityGood: true,
    },
    mfgDate: {
      key: 'mfgDate',
      title: 'Mfg. / Pre-pack Date',
      legalRule: 'Rule 6(1)(e)',
      description: 'Month and year of manufacture or pre-packing as declared on the container.',
      status: 'LOW_CONFIDENCE',
      confidence: 61.2,
      extractedText: '05/2026',
      detectedFormat: 'MM/YYYY Pattern',
      explanation:
        'Low OCR confidence (61.2%) detected due to faint dot-matrix inkjet stamping. Format appears to be 05/2026, but requires human inspector visual verification.',
      level1Presence: true,
      level2FormatValid: true,
      level3ReadabilityGood: false,
      warning: 'Faint inkjet or dot-matrix imprint on curved border.',
      remedy: 'Confirm month/year directly on physical container.',
    },
    mrp: {
      key: 'mrp',
      title: 'Retail Sale Price (MRP)',
      legalRule: 'Rule 6(1)(f)',
      description: 'Maximum Retail Price in Indian Rupees inclusive of all taxes.',
      status: 'DETECTED',
      confidence: 97.1,
      extractedText: '₹ 349.00 (Incl. of all taxes)',
      detectedFormat: 'INR Symbol + Numeric + Mandatory Tax Clause',
      explanation: 'Valid MRP declared with mandatory "inclusive of all taxes" clause in compliance.',
      level1Presence: true,
      level2FormatValid: true,
      level3ReadabilityGood: true,
    },
    consumerComplaint: {
      key: 'consumerComplaint',
      title: 'Consumer Complaint Details',
      legalRule: 'Rule 6(1)(g)',
      description: 'Name, address, telephone number, or email of the person/office to contact in case of consumer complaints.',
      status: 'NOT_DETECTED',
      confidence: 0,
      extractedText: null,
      explanation:
        'No consumer grievance redressal phone number, email, or contact officer address was detected anywhere on the scanned panel.',
      level1Presence: false,
      level2FormatValid: false,
      level3ReadabilityGood: false,
      warning: 'Violation of Rule 6(1)(g) — mandatory consumer care declaration missing.',
      remedy: 'Flag for secondary physical inspection or issue statutory screening notice.',
    },
  },
  boundingBoxes: [
    {
      id: 'box-commodity',
      fieldKey: 'commodity',
      label: 'Commodity Identity: PureGlow Moisturizer',
      x: 30,
      y: 26,
      width: 62,
      height: 10,
      status: 'DETECTED',
      confidence: 94.8,
    },
    {
      id: 'box-qty',
      fieldKey: 'netQuantity',
      label: 'Net Quantity: 500 g',
      x: 8,
      y: 57,
      width: 38,
      height: 8,
      status: 'DETECTED',
      confidence: 98.5,
    },
    {
      id: 'box-mrp',
      fieldKey: 'mrp',
      label: 'MRP: ₹ 349.00 (Incl. of all taxes)',
      x: 50,
      y: 57,
      width: 42,
      height: 8,
      status: 'DETECTED',
      confidence: 97.1,
    },
    {
      id: 'box-mfg-date',
      fieldKey: 'mfgDate',
      label: 'Mfg Date: 05/2026 (Low Confidence 61%)',
      x: 8,
      y: 67,
      width: 44,
      height: 8,
      status: 'LOW_CONFIDENCE',
      confidence: 61.2,
    },
    {
      id: 'box-mfg-by',
      fieldKey: 'manufacturer',
      label: 'Manufacturer Details (Rule 6(1)(a))',
      x: 8,
      y: 75,
      width: 84,
      height: 7,
      status: 'DETECTED',
      confidence: 96.2,
    },
  ],
};

// Preset 2: COMPLIANT (All 6 declarations verified, 90%+ confidence)
export const SAMPLE_COMPLIANT: ScanResult = {
  id: 'SCAN-2026-0038',
  productName: 'Sharbati Whole Wheat Atta 5kg',
  brandName: 'GoldenHarvest Agro Foods',
  category: 'Food & Beverages',
  timestamp: '07 Sep 2026, 09:40 AM IST',
  imageUrl: generatePackageLabelSvg({
    productName: 'Sharbati Whole Wheat Atta',
    brand: 'GoldenHarvest',
    category: 'Food & Beverages',
    netQty: '5 kg',
    mrp: '285.00',
    mfgDate: '08/2026',
    mfgBy: 'GoldenHarvest Agro Industries, Survey 144, National Highway 48, Kheda, Gujarat - 387540',
    careContact: 'Customer Grievance Officer, GoldenHarvest Agro, NH-48, Kheda - 387540',
    bgColor: '#1e3a5f',
    accentColor: '#059669',
    statusVariant: 'compliant',
  }),
  finalStatus: 'COMPLIANT',
  overallConfidence: 96.8,
  detectedCount: 6,
  inspectorId: 'VF-INSP-811',
  deviceSource: 'VisionForge Benchtop Industrial Scanner',
  summaryNote:
    'All 6 mandatory declarations strictly conform to Legal Metrology (Packaged Commodities) Rules, 2011. Level 1, 2, and 3 verification checks passed.',
  imageQualityScore: 95,
  processingTimeMs: 1180,
  fields: {
    manufacturer: {
      key: 'manufacturer',
      title: 'Manufacturer / Packer Details',
      legalRule: 'Rule 6(1)(a) & (b)',
      description: 'Name and complete physical address of the manufacturer or packer.',
      status: 'DETECTED',
      confidence: 97.4,
      extractedText:
        'GoldenHarvest Agro Industries, Survey 144, National Highway 48, Kheda, Gujarat - 387540',
      detectedFormat: 'Complete Postal Address with State and PIN',
      explanation: 'Comprehensive manufacturer name and registered address with valid PIN code.',
      level1Presence: true,
      level2FormatValid: true,
      level3ReadabilityGood: true,
    },
    commodity: {
      key: 'commodity',
      title: 'Commodity Identity',
      legalRule: 'Rule 6(1)(c)',
      description: 'Generic name or common identity of the commodity.',
      status: 'DETECTED',
      confidence: 98.2,
      extractedText: 'Sharbati Whole Wheat Atta',
      detectedFormat: 'Standard Commodity Name',
      explanation: 'Generic common name prominent on main display panel.',
      level1Presence: true,
      level2FormatValid: true,
      level3ReadabilityGood: true,
    },
    netQuantity: {
      key: 'netQuantity',
      title: 'Net Quantity',
      legalRule: 'Rule 6(1)(d)',
      description: 'Standard unit of weight, volume, or measure.',
      status: 'DETECTED',
      confidence: 99.1,
      extractedText: '5 kg',
      detectedFormat: 'Standard SI Metric (kg)',
      explanation: 'Valid metric weight standard declaration (5 kg). Meets Rule 7 display guidelines.',
      level1Presence: true,
      level2FormatValid: true,
      level3ReadabilityGood: true,
    },
    mfgDate: {
      key: 'mfgDate',
      title: 'Mfg. / Pre-pack Date',
      legalRule: 'Rule 6(1)(e)',
      description: 'Month and year of manufacture/pre-packing.',
      status: 'DETECTED',
      confidence: 94.6,
      extractedText: '08/2026',
      detectedFormat: 'MM/YYYY',
      explanation: 'High confidence OCR reading for manufacturing date (08/2026).',
      level1Presence: true,
      level2FormatValid: true,
      level3ReadabilityGood: true,
    },
    mrp: {
      key: 'mrp',
      title: 'Retail Sale Price (MRP)',
      legalRule: 'Rule 6(1)(f)',
      description: 'Maximum Retail Price with tax breakdown.',
      status: 'DETECTED',
      confidence: 97.8,
      extractedText: '₹ 285.00 (Incl. of all taxes)',
      detectedFormat: 'INR + All Taxes Included',
      explanation: 'Compliant MRP declaration with explicit tax inclusive disclaimer.',
      level1Presence: true,
      level2FormatValid: true,
      level3ReadabilityGood: true,
    },
    consumerComplaint: {
      key: 'consumerComplaint',
      title: 'Consumer Complaint Details',
      legalRule: 'Rule 6(1)(g)',
      description: 'Officer name, telephone, email, and postal address.',
      status: 'DETECTED',
      confidence: 93.9,
      extractedText:
        'Customer Grievance Officer, NH-48 Kheda, Gujarat. Toll-Free: 1800-425-9988, customercare@goldenharvest.co.in',
      detectedFormat: 'Officer Designation + Address + Toll-Free + Email',
      explanation: 'Full consumer contact redressal cell specified with toll-free phone and email.',
      level1Presence: true,
      level2FormatValid: true,
      level3ReadabilityGood: true,
    },
  },
  boundingBoxes: [
    {
      id: 'box-c1',
      fieldKey: 'commodity',
      label: 'Commodity: Sharbati Whole Wheat Atta',
      x: 30,
      y: 26,
      width: 62,
      height: 10,
      status: 'DETECTED',
      confidence: 98.2,
    },
    {
      id: 'box-c2',
      fieldKey: 'netQuantity',
      label: 'Net Quantity: 5 kg',
      x: 8,
      y: 57,
      width: 38,
      height: 8,
      status: 'DETECTED',
      confidence: 99.1,
    },
    {
      id: 'box-c3',
      fieldKey: 'mrp',
      label: 'MRP: ₹ 285.00 (Incl. of all taxes)',
      x: 50,
      y: 57,
      width: 42,
      height: 8,
      status: 'DETECTED',
      confidence: 97.8,
    },
    {
      id: 'box-c4',
      fieldKey: 'mfgDate',
      label: 'Mfg Date: 08/2026',
      x: 8,
      y: 67,
      width: 44,
      height: 8,
      status: 'DETECTED',
      confidence: 94.6,
    },
    {
      id: 'box-c5',
      fieldKey: 'manufacturer',
      label: 'Manufacturer: GoldenHarvest Agro Industries',
      x: 8,
      y: 75,
      width: 84,
      height: 7,
      status: 'DETECTED',
      confidence: 97.4,
    },
    {
      id: 'box-c6',
      fieldKey: 'consumerComplaint',
      label: 'Consumer Care: 1800-425-9988 & Email',
      x: 8,
      y: 83,
      width: 84,
      height: 8,
      status: 'DETECTED',
      confidence: 93.9,
    },
  ],
};

// Preset 3: NON_COMPLIANT (Violations in MRP tax clause, incomplete manufacturer PIN, missing grievance cell)
export const SAMPLE_NON_COMPLIANT: ScanResult = {
  id: 'SCAN-2026-0019',
  productName: 'CrunchTime Spiced Potato Wafers 80g',
  brandName: 'CrunchTime Snackworks',
  category: 'Food & Beverages',
  timestamp: '06 Sep 2026, 04:22 PM IST',
  imageUrl: generatePackageLabelSvg({
    productName: 'CrunchTime Spiced Potato Wafers',
    brand: 'CrunchTime',
    category: 'Food & Beverages',
    netQty: '80 g',
    mrp: '40.00',
    mfgDate: '07/2026',
    mfgBy: 'Snackworks Foods, GIDC Estate',
    careContact: '',
    bgColor: '#3f1d1d',
    accentColor: '#dc2626',
    statusVariant: 'non_compliant',
  }),
  finalStatus: 'NON_COMPLIANT',
  overallConfidence: 71.5,
  detectedCount: 3,
  inspectorId: 'VF-INSP-504',
  deviceSource: 'VisionForge Field Mobile Scanner v2.4',
  summaryNote:
    'Multiple statutory violations detected under Rules 6(1)(a), 6(1)(f), and 6(1)(g). Retail price lacks mandatory tax inclusive wording, manufacturer postal address is truncated without PIN/State, and consumer grievance contact is absent.',
  imageQualityScore: 88,
  processingTimeMs: 1350,
  fields: {
    manufacturer: {
      key: 'manufacturer',
      title: 'Manufacturer / Packer Details',
      legalRule: 'Rule 6(1)(a) & (b)',
      description: 'Complete physical address including state and PIN code.',
      status: 'NOT_DETECTED',
      confidence: 45.0,
      extractedText: 'Snackworks Foods, GIDC Estate',
      detectedFormat: 'Truncated Address (Missing City, State, PIN)',
      explanation:
        'Address is legally insufficient under Rule 6(1)(a). State and mandatory 6-digit postal code are omitted.',
      level1Presence: true,
      level2FormatValid: false,
      level3ReadabilityGood: true,
      warning: 'Statutory non-compliance: Incomplete manufacturer address.',
      remedy: 'Requires full legal postal address as per Rule 6(1)(a).',
    },
    commodity: {
      key: 'commodity',
      title: 'Commodity Identity',
      legalRule: 'Rule 6(1)(c)',
      description: 'Generic name or common identity.',
      status: 'DETECTED',
      confidence: 93.0,
      extractedText: 'CrunchTime Spiced Potato Wafers',
      detectedFormat: 'Standard Commodity Name',
      explanation: 'Generic commodity identity declared clearly.',
      level1Presence: true,
      level2FormatValid: true,
      level3ReadabilityGood: true,
    },
    netQuantity: {
      key: 'netQuantity',
      title: 'Net Quantity',
      legalRule: 'Rule 6(1)(d)',
      description: 'Metric net quantity declaration.',
      status: 'DETECTED',
      confidence: 96.0,
      extractedText: '80 g',
      detectedFormat: 'Standard Metric Mass (g)',
      explanation: 'Metric quantity declared (80 g).',
      level1Presence: true,
      level2FormatValid: true,
      level3ReadabilityGood: true,
    },
    mfgDate: {
      key: 'mfgDate',
      title: 'Mfg. / Pre-pack Date',
      legalRule: 'Rule 6(1)(e)',
      description: 'Month and year of manufacture.',
      status: 'DETECTED',
      confidence: 89.5,
      extractedText: '07/2026',
      detectedFormat: 'MM/YYYY',
      explanation: 'Manufacturing date validly declared (07/2026).',
      level1Presence: true,
      level2FormatValid: true,
      level3ReadabilityGood: true,
    },
    mrp: {
      key: 'mrp',
      title: 'Retail Sale Price (MRP)',
      legalRule: 'Rule 6(1)(f)',
      description: 'Maximum Retail Price with tax clause.',
      status: 'NOT_DETECTED',
      confidence: 52.0,
      extractedText: 'PRICE: 40.00 (TAXES NOT SPECIFIED)',
      detectedFormat: 'Non-standard declaration lacking tax clause',
      explanation:
        'Violates Rule 6(1)(f). Price declaration does not mention "(Inclusive of all taxes)" or "Incl. of all taxes".',
      level1Presence: true,
      level2FormatValid: false,
      level3ReadabilityGood: true,
      warning: 'Missing mandatory tax clause in MRP declaration.',
      remedy: 'Re-label with "MRP ₹ xx.xx (incl. of all taxes)".',
    },
    consumerComplaint: {
      key: 'consumerComplaint',
      title: 'Consumer Complaint Details',
      legalRule: 'Rule 6(1)(g)',
      description: 'Mandatory consumer contact helpline or email.',
      status: 'NOT_DETECTED',
      confidence: 0,
      extractedText: null,
      explanation: 'Consumer complaint redressal details are completely missing.',
      level1Presence: false,
      level2FormatValid: false,
      level3ReadabilityGood: false,
      warning: 'Violation of Rule 6(1)(g).',
      remedy: 'Consumer grievance phone/email mandatory on all packaged commodities.',
    },
  },
  boundingBoxes: [
    {
      id: 'box-nc1',
      fieldKey: 'commodity',
      label: 'Commodity: Spiced Potato Wafers',
      x: 30,
      y: 26,
      width: 62,
      height: 10,
      status: 'DETECTED',
      confidence: 93.0,
    },
    {
      id: 'box-nc2',
      fieldKey: 'netQuantity',
      label: 'Net Quantity: 80 g',
      x: 8,
      y: 57,
      width: 38,
      height: 8,
      status: 'DETECTED',
      confidence: 96.0,
    },
    {
      id: 'box-nc3',
      fieldKey: 'mrp',
      label: 'MRP Non-compliant (Missing tax clause)',
      x: 50,
      y: 57,
      width: 42,
      height: 8,
      status: 'NOT_DETECTED',
      confidence: 52.0,
    },
    {
      id: 'box-nc4',
      fieldKey: 'mfgDate',
      label: 'Mfg Date: 07/2026',
      x: 8,
      y: 67,
      width: 44,
      height: 8,
      status: 'DETECTED',
      confidence: 89.5,
    },
    {
      id: 'box-nc5',
      fieldKey: 'manufacturer',
      label: 'Manufacturer Address Incomplete (Missing PIN)',
      x: 8,
      y: 75,
      width: 84,
      height: 7,
      status: 'NOT_DETECTED',
      confidence: 45.0,
    },
  ],
};

// Default seed dataset for Scan History
export const INITIAL_MOCK_SCANS: ScanResult[] = [
  SAMPLE_NEEDS_REVIEW,
  SAMPLE_COMPLIANT,
  SAMPLE_NON_COMPLIANT,
  {
    ...SAMPLE_COMPLIANT,
    id: 'SCAN-2026-0011',
    productName: 'ActiveShield Antibacterial Handwash 250ml',
    brandName: 'ActiveShield Healthcare',
    category: 'Personal Care',
    timestamp: '05 Sep 2026, 02:15 PM IST',
    overallConfidence: 95.2,
    finalStatus: 'COMPLIANT',
  },
  {
    ...SAMPLE_NEEDS_REVIEW,
    id: 'SCAN-2026-0008',
    productName: 'FreshSpark Detergent Bar 200g',
    brandName: 'CleanHome FMCG',
    category: 'Household Goods',
    timestamp: '04 Sep 2026, 11:30 AM IST',
    overallConfidence: 74.0,
    finalStatus: 'NEEDS_REVIEW',
  },
];
