"""PDF compliance report generator using ReportLab.

Generates official Legal Metrology inspection notices and screening sheets.
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from config import PATHS


class PDFReportGenerator:
    """Generate professional PDF inspection reports for packaged commodities."""

    def __init__(self, output_dir: Path | None = None) -> None:
        self.output_dir = output_dir or PATHS.reports_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_report(self, scan_data: dict[str, Any], output_filename: str | None = None) -> bytes:
        """Generate an official compliance inspection report as PDF bytes."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "TitleStyle",
            parent=styles["Heading1"],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0f172a"),
            alignment=1,
            spaceAfter=4,
        )
        subtitle_style = ParagraphStyle(
            "SubtitleStyle",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#475569"),
            alignment=1,
            spaceAfter=12,
        )
        section_style = ParagraphStyle(
            "SectionStyle",
            parent=styles["Heading2"],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=10,
            spaceAfter=6,
        )
        body_style = ParagraphStyle(
            "BodyStyle",
            parent=styles["Normal"],
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#334155"),
        )
        bold_body = ParagraphStyle(
            "BoldBody",
            parent=body_style,
            fontName="Helvetica-Bold",
        )

        elements: list[Any] = []

        # 1. Header Banner
        elements.append(Paragraph("<b>PACKSCAN AI — LEGAL METROLOGY INSPECTION REPORT</b>", title_style))
        elements.append(
            Paragraph(
                "Automated First-Level Digital Compliance Screening &bull; The Legal Metrology (Packaged Commodities) Rules, 2011",
                subtitle_style,
            )
        )
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceAfter=10))

        # 2. Metadata Box
        scan_id = scan_data.get("id", "SCAN-2026-0000")
        timestamp = scan_data.get("timestamp", "N/A")
        prod_name = scan_data.get("productName", "Packaged Commodity")
        brand = scan_data.get("brandName", "N/A")
        category = scan_data.get("category", "General Commodities")
        status = scan_data.get("finalStatus", "NEEDS_REVIEW")
        conf = scan_data.get("overallConfidence", 0)

        status_color = "#16a34a" if status == "COMPLIANT" else ("#dc2626" if status == "NON_COMPLIANT" else "#d97706")

        meta_data = [
            [
                Paragraph(f"<b>Scan ID:</b> {scan_id}", body_style),
                Paragraph(f"<b>Date & Time:</b> {timestamp}", body_style),
            ],
            [
                Paragraph(f"<b>Product / Commodity:</b> {prod_name}", body_style),
                Paragraph(f"<b>Brand:</b> {brand}", body_style),
            ],
            [
                Paragraph(f"<b>Category:</b> {category}", body_style),
                Paragraph(
                    f"<b>Overall Status:</b> <font color='{status_color}'><b>{status}</b></font> ({conf:.1f}% conf)",
                    body_style,
                ),
            ],
        ]
        meta_table = Table(meta_data, colWidths=[3.6 * inch, 3.6 * inch])
        meta_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                    ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        elements.append(meta_table)
        elements.append(Spacer(1, 10))

        # 3. Field Verification Table
        elements.append(Paragraph("<b>Statutory Declaration Verification (Rule 6)</b>", section_style))

        table_rows: list[list[Any]] = [
            [
                Paragraph("<b>Mandatory Field</b>", bold_body),
                Paragraph("<b>Statutory Rule</b>", bold_body),
                Paragraph("<b>Extracted Evidence</b>", bold_body),
                Paragraph("<b>Status</b>", bold_body),
                Paragraph("<b>Statutory Finding</b>", bold_body),
            ]
        ]

        fields_dict = scan_data.get("fields", {})
        for _, f_data in fields_dict.items():
            f_title = f_data.get("title", "")
            f_rule = f_data.get("legalRule", "Rule 6")
            f_text = f_data.get("extractedText") or "Not Detected"
            f_status = f_data.get("status", "NOT_DETECTED")
            f_reason = f_data.get("explanation") or ""

            badge_color = "#16a34a" if f_status == "DETECTED" else ("#dc2626" if f_status == "NOT_DETECTED" else "#d97706")
            status_html = f"<font color='{badge_color}'><b>{f_status}</b></font>"

            table_rows.append(
                [
                    Paragraph(f"<b>{f_title}</b>", body_style),
                    Paragraph(f_rule, body_style),
                    Paragraph(f_text[:60] + ("..." if len(f_text) > 60 else ""), body_style),
                    Paragraph(status_html, body_style),
                    Paragraph(f_reason[:100] + ("..." if len(f_reason) > 100 else ""), body_style),
                ]
            )

        fields_table = Table(table_rows, colWidths=[1.5 * inch, 1.1 * inch, 1.8 * inch, 1.0 * inch, 1.8 * inch])
        fields_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        elements.append(fields_table)
        elements.append(Spacer(1, 12))

        # 4. Findings & Summary
        elements.append(Paragraph("<b>Compliance Summary & Recommendation</b>", section_style))
        summary = scan_data.get(
            "summaryNote",
            "This digital inspection sheet serves as preliminary decision support under the Legal Metrology Act, 2009.",
        )
        elements.append(Paragraph(summary, body_style))
        elements.append(Spacer(1, 14))

        # 5. Inspector Sign-off block (Seventh Schedule Form A Style)
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=10))
        sign_data = [
            [
                Paragraph("<b>Inspecting Authority:</b> PackScan AI Digital Inspector", body_style),
                Paragraph("<b>Signature of Authorized Officer:</b> ____________________", body_style),
            ],
            [
                Paragraph("<b>Verification Result:</b> " + status, body_style),
                Paragraph("<b>Date of Inspection:</b> " + timestamp, body_style),
            ],
        ]
        sign_table = Table(sign_data, colWidths=[3.6 * inch, 3.6 * inch])
        sign_table.setStyle(
            TableStyle(
                [
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        elements.append(sign_table)

        doc.build(elements)
        pdf_bytes = buffer.getvalue()

        if output_filename:
            out_path = self.output_dir / output_filename
            out_path.write_bytes(pdf_bytes)

        return pdf_bytes
