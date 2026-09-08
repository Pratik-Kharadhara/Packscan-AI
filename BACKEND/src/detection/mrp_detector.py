"""Retail-sale-price declaration detector compliant with Legal Metrology Rule 6(1)(e) & Rule 3(m)."""

from __future__ import annotations

import re

from src.detection._helpers import detected_field, first_match
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.patterns import compile_any, load_detection_patterns
from src.ocr.ocr_service import OCRResult


class MRPDetector(BaseDetector):
    """Detect retail sale price / MRP requiring explicit context and format verification."""

    field_name = "mrp"

    def __init__(self) -> None:
        patterns = load_detection_patterns()[self.field_name]
        self._context = compile_any(patterns["context_patterns"])
        self._tax_pattern = re.compile(patterns["tax_pattern"], re.IGNORECASE)

        # Explicit context-guarded price pattern (handles ₹, ?, Rs., INR before numeric amount)
        self._price_with_context = re.compile(
            r"(?:\bmrp\b|max(?:imum)?\s*retail\s*price|retail\s*price)[^0-9\n]{0,12}(?:[₹\?]|rs\.?|inr)?\s*(\d+(?:[.,]\d{1,2})?)",
            re.IGNORECASE,
        )
        self._standalone_price = re.compile(
            r"(?:₹|rs\.?|inr)\s*(\d+(?:[.,]\d{1,2})?)",
            re.IGNORECASE,
        )

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        # 1. Search spatially grouped lines first (handles line-level label + value)
        candidates = list(ocr_result.grouped_lines) + list(ocr_result.stacked_lines)
        for line in candidates:
            if not self._context.search(line.text):
                continue

            match = self._price_with_context.search(line.text)
            amount = match.group(1) if match else None
            if not amount:
                # Context is present on line, check for isolated numeric price
                num_match = re.search(r"\b(\d{1,5}(?:\.\d{1,2}))\b", line.text)
                if num_match:
                    amount = num_match.group(1)

            if amount:
                # Standardize format
                display_value = f"Rs. {amount}" if not line.text.startswith("₹") else f"₹ {amount}"
                tax_included = bool(self._tax_pattern.search(line.text))
                note = (
                    "MRP context, numeric price, and statutory tax declaration detected."
                    if tax_included
                    else "MRP context and numeric price detected."
                )
                return detected_field(
                    self.field_name,
                    line.detections[0],
                    display_value,
                    note,
                    raw_text=line.raw_text,
                    normalized_text=line.text,
                    matched_pattern="mrp_with_taxes" if tax_included else "mrp_price",
                    sub_fields={
                        "amount": amount,
                        "tax_included": str(tax_included).lower(),
                    },
                    rule_reference="Rule 6(1)(e)",
                    bounding_boxes=[line.bounding_box],
                )

        # 2. Fallback to raw individual detections
        for detection in ocr_result.detections:
            if self._context.search(detection.text):
                match = self._price_with_context.search(detection.text)
                amount = match.group(1) if match else first_match(self._standalone_price, detection.text)
                if amount:
                    return detected_field(
                        self.field_name,
                        detection,
                        f"Rs. {amount}",
                        "MRP context and price detected in single box.",
                        raw_text=detection.text,
                        normalized_text=detection.text,
                        matched_pattern="mrp_single_box",
                        sub_fields={"amount": amount},
                        rule_reference="Rule 6(1)(e)",
                    )

        return DetectedField.not_found(
            self.field_name,
            "No reliable MRP declaration detected.",
            rule_reference="Rule 6(1)(e)",
        )
