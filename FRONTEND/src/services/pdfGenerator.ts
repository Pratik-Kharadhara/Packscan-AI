import { jsPDF } from 'jspdf';
import { ScanResult } from '../types';

export function downloadPdfReport(scan: ScanResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // Header Banner Background
  // Top Banner
  doc.setFillColor(22, 101, 52); // Forest Green (#166534)
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Top GovTech Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PACKSCAN AI — DIGITAL COMPLIANCE SCREENING REPORT', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(219, 234, 254); // light tint
  doc.text('PackScan AI Screening Engine • Legal Metrology Division Audit Record', 14, 17);
  doc.text('Legal Metrology (Packaged Commodities) Rules, 2011 Compliance Audit', 14, 22);

  y = 34;

  // Inspection Metadata Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`SCAN ID: ${scan.id}`, 18, y + 6);
  doc.text(`TIMESTAMP: ${scan.timestamp}`, 18, y + 12);
  doc.text(`INSPECTOR ID: ${scan.inspectorId}`, 18, y + 18);

  doc.text(`PRODUCT: ${scan.productName.substring(0, 32)}`, 110, y + 6);
  doc.text(`CATEGORY: ${scan.category}`, 110, y + 12);
  doc.text(`IMAGE QUALITY: ${scan.imageQualityScore}% (Confidence: ${scan.overallConfidence.toFixed(1)}%)`, 110, y + 18);

  y += 30;

  // Compliance Decision Callout Banner
  let statusColor: [number, number, number] = [16, 185, 129]; // green
  let statusText = 'FINAL VERIFICATION STATUS: COMPLIANT';
  let subStatus = 'All 6 mandatory statutory declarations detected and validated against Legal Metrology Rules, 2011.';

  if (scan.finalStatus === 'NEEDS_REVIEW') {
    statusColor = [217, 119, 6]; // amber
    statusText = 'FINAL VERIFICATION STATUS: NEEDS REVIEW';
    subStatus = 'Flags require human inspector visual review before statutory determination. Never a blind pass/fail.';
  } else if (scan.finalStatus === 'NON_COMPLIANT') {
    statusColor = [220, 38, 38]; // red
    statusText = 'FINAL VERIFICATION STATUS: NON-COMPLIANT';
    subStatus = 'Critical statutory declarations missing or formatted contrary to Legal Metrology Rules, 2011.';
  }

  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(statusText, 18, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(subStatus, 18, y + 12);

  y += 22;

  // Section: Verification Checklist (The 6 Mandatory Declarations)
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('AUDIT CHECKLIST: MANDATORY DECLARATIONS (RULES 6, 7 & 8)', 14, y);

  y += 5;

  // Table Headers
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('FIELD / CITATION', 16, y + 4.8);
  doc.text('STATUS', 78, y + 4.8);
  doc.text('CONF.', 108, y + 4.8);
  doc.text('EXTRACTED DECLARATION & FINDINGS', 124, y + 4.8);

  y += 7;

  // Rows for the 6 fields
  const fields = (Object.keys(scan.fields) as (keyof typeof scan.fields)[]).map(
    (k) => scan.fields[k]
  );
  doc.setFont('helvetica', 'normal');

  fields.forEach((field) => {
    // Row background border
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, pageWidth - 14, y);

    // Field & Rule
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(field.title.substring(0, 26), 16, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(field.legalRule, 16, y + 8.5);

    // Status Pill
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (field.status === 'DETECTED') {
      doc.setTextColor(5, 150, 105);
      doc.text('VERIFIED [✓]', 78, y + 6);
    } else if (field.status === 'LOW_CONFIDENCE') {
      doc.setTextColor(217, 119, 6);
      doc.text('LOW CONF [!]', 78, y + 6);
    } else {
      doc.setTextColor(220, 38, 38);
      doc.text('NOT DETECTED [X]', 78, y + 6);
    }

    // Confidence
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${field.confidence.toFixed(1)}%`, 108, y + 6);

    // Extracted text & explanation
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const textSnippet = field.extractedText
      ? `"${field.extractedText.substring(0, 48)}${field.extractedText.length > 48 ? '...' : ''}"`
      : '[None detected on package panel]';
    doc.text(textSnippet, 124, y + 4.5);

    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    const explanationSnippet = doc.splitTextToSize(field.explanation, pageWidth - 140);
    doc.text(explanationSnippet[0] || '', 124, y + 8.5);

    y += 12.5;
  });

  y += 3;

  // Inspector Findings & Summary Note
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 19, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('AUTOMATED AUDIT SUMMARY & NEXT ACTION:', 18, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const splitSummary = doc.splitTextToSize(scan.summaryNote, pageWidth - 36);
  doc.text(splitSummary, 18, y + 9.5);

  y += 24;

  // Regulatory Basis & Legal Positioning Disclaimer (Legal Metrology PCR 2011)
  doc.setDrawColor(245, 158, 11);
  doc.setFillColor(254, 252, 232); // amber-50
  doc.roundedRect(14, y, pageWidth - 28, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text('IMPORTANT POSITIONING & STATUTORY DISCLAIMER (RULE POSITIONING):', 18, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(120, 53, 15);
  const disclaimer =
    'PackScan AI is an AI-assisted, explainable digital compliance screening tool that supports inspectors and businesses. It does not replace statutory authorities, and does not claim to precisely measure legal physical font size from an arbitrary photo without a reliable physical scale in frame.';
  const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 36);
  doc.text(splitDisclaimer, 18, y + 9.5);

  y += 26;

  // Sign-off section
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, pageWidth - 14, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('VERIFICATION OFFICER:', 16, y);
  doc.text('DIGITAL SIGNATURE & SEAL:', 110, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Designated Legal Metrology Inspector / QA Auditor', 16, y);
  doc.text('Digitally Verified via PackScan AI Screening Engine v2.4 (PCR 2011)', 110, y);

  // Footer page marker
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Page 1 of 1 • PackScan AI • Statutory Compliance Inspection Record', 14, 287);

  // Trigger download
  doc.save(`PackScan_Compliance_Report_${scan.id}.pdf`);
}
