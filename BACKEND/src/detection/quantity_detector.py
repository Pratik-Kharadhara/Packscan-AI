"""Net-quantity declaration detector compliant with Legal Metrology Rule 6(1)(c) & Rule 13."""

from __future__ import annotations

import re

from src.detection._helpers import detected_field
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.content_validator import (
    is_lot_or_serial_number,
    is_nutrition_value,
    is_plausible_net_quantity,
)
from src.detection.patterns import compile_any, load_detection_patterns
from src.ocr.ocr_service import OCRResult


NUTRITION_EXCLUSION = re.compile(
    r"\b(?:nutrition|nutritional|energy|carbohydrate|sugar|fat|protein|sodium|potassium|iodine|calcium|iron|cholesterol|per\s*100\s*g|per\s*serving|kcal|cal|kj)\b",
    re.IGNORECASE,
)

DATE_FALSE_POSITIVE = re.compile(
    r"(?:/|[a-zA-Z]{3}/|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[/-])\d+\s*g\b",
    re.IGNORECASE,
)


class QuantityDetector(BaseDetector):
    """Detect net quantity declarations prioritizing explicit net-quantity context and standard SI units."""

    field_name = "net_quantity"

    def __init__(self) -> None:
        patterns = load_detection_patterns()[self.field_name]
        self._context = compile_any(patterns["context_patterns"])
        self._value = re.compile(patterns["value_pattern"], re.IGNORECASE)
        self._when_packed = re.compile(patterns.get("when_packed_pattern", r"\bwhen\s+packed\b"), re.IGNORECASE)

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        # 1. Search grouped lines and stacked key-value pairs first
        candidates = list(ocr_result.grouped_lines) + list(ocr_result.stacked_lines)

        for line in candidates:
            # Exclude nutrition facts tables, lot/batch numbers, and barcodes
            if NUTRITION_EXCLUSION.search(line.text) or is_nutrition_value(line.text):
                continue
            if is_lot_or_serial_number(line.text):
                continue

            has_context = bool(self._context.search(line.text))
            if not has_context:
                continue

            # Look for values on this line, ignoring date patterns like Aug/2g
            for val_match in self._value.finditer(line.text):
                # Verify not preceded by slash or month name
                prefix_text = line.text[max(0, val_match.start() - 10) : val_match.start()]
                if re.search(r"[/a-zA-Z]$", prefix_text):
                    continue

                num, unit = val_match.group(1), val_match.group(2).lower()
                num_clean = num.replace(",", ".")
                if not is_plausible_net_quantity(num_clean, unit, line.text):
                    continue

                normalized_qty = f"{num} {unit}"
                when_packed = bool(self._when_packed.search(line.text))

                note = "Net-quantity context and valid unit detected."
                if when_packed:
                    note += " Qualified by 'when packed' (Rule 11(4))."

                return detected_field(
                    self.field_name,
                    line.detections[0],
                    normalized_qty,
                    note,
                    source_line=line,
                    raw_text=line.raw_text,
                    normalized_text=line.text,
                    matched_pattern="context_and_value",
                    sub_fields={
                        "amount": num,
                        "unit": unit,
                        "when_packed": str(when_packed).lower(),
                        "detection_method": "context_grouped",
                    },
                    rule_reference="Rule 6(1)(c)",
                    bounding_boxes=[line.bounding_box],
                )

        # 2. Check individual detections for explicit context
        for detection in ocr_result.detections:
            if NUTRITION_EXCLUSION.search(detection.text) or is_nutrition_value(detection.text):
                continue
            if is_lot_or_serial_number(detection.text):
                continue
            if not self._context.search(detection.text):
                continue

            for val_match in self._value.finditer(detection.text):
                prefix_text = detection.text[max(0, val_match.start() - 10) : val_match.start()]
                if re.search(r"[/a-zA-Z]$", prefix_text):
                    continue

                num, unit = val_match.group(1), val_match.group(2).lower()
                num_clean = num.replace(",", ".")
                if not is_plausible_net_quantity(num_clean, unit, detection.text):
                    continue

                normalized_qty = f"{num} {unit}"
                return detected_field(
                    self.field_name,
                    detection,
                    normalized_qty,
                    "Net-quantity context and value detected in single box.",
                    raw_text=detection.text,
                    normalized_text=detection.text,
                    matched_pattern="single_box_context",
                    sub_fields={
                        "amount": num,
                        "unit": unit,
                        "detection_method": "context_single",
                    },
                    rule_reference="Rule 6(1)(c)",
                )
        return DetectedField.not_found(
            self.field_name,
            "No quantity with a supported unit and explicit net-quantity context detected.",
            rule_reference="Rule 6(1)(c)",
        )
