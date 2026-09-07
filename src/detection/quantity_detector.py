"""Net-quantity declaration detector compliant with Legal Metrology Rule 6(1)(c) & Rule 13."""

from __future__ import annotations

import re

from src.detection._helpers import detected_field
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.patterns import compile_any, load_detection_patterns
from src.ocr.ocr_service import OCRResult


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
        fallback_match: tuple[object, str, str, str, str] | None = None

        for line in candidates:
            val_match = self._value.search(line.text)
            if not val_match:
                continue

            num, unit = val_match.group(1), val_match.group(2).lower()
            normalized_qty = f"{num} {unit}"
            has_context = bool(self._context.search(line.text))
            when_packed = bool(self._when_packed.search(line.text))

            if has_context:
                note = "Net-quantity context and valid unit detected."
                if when_packed:
                    note += " Qualified by 'when packed' (Rule 11(4))."

                return detected_field(
                    self.field_name,
                    line.detections[0],
                    normalized_qty,
                    note,
                    raw_text=line.raw_text,
                    normalized_text=line.text,
                    matched_pattern="context_and_value",
                    sub_fields={
                        "amount": num,
                        "unit": unit,
                        "when_packed": str(when_packed).lower(),
                    },
                    rule_reference="Rule 6(1)(c)",
                    bounding_boxes=[line.bounding_box],
                )

            if fallback_match is None:
                fallback_match = (line, normalized_qty, num, unit, str(when_packed).lower())

        # 2. Check individual detections for explicit context
        for detection in ocr_result.detections:
            val_match = self._value.search(detection.text)
            if val_match:
                num, unit = val_match.group(1), val_match.group(2).lower()
                normalized_qty = f"{num} {unit}"
                if self._context.search(detection.text):
                    return detected_field(
                        self.field_name,
                        detection,
                        normalized_qty,
                        "Net-quantity context and value detected in single box.",
                        raw_text=detection.text,
                        normalized_text=detection.text,
                        matched_pattern="single_box_context",
                        sub_fields={"amount": num, "unit": unit},
                        rule_reference="Rule 6(1)(c)",
                    )
                if fallback_match is None:
                    fallback_match = (detection, normalized_qty, num, unit, "false")

        # 3. Fallback to valid quantity unit without explicit context
        if fallback_match:
            source, normalized_qty, num, unit, when_packed = fallback_match
            first_det = source.detections[0] if hasattr(source, "detections") else source
            box = source.bounding_box if hasattr(source, "bounding_box") else [first_det.bounding_box]
            return detected_field(
                self.field_name,
                first_det,
                normalized_qty,
                "Quantity unit detected without explicit net-quantity context.",
                raw_text=getattr(source, "raw_text", first_det.text),
                normalized_text=getattr(source, "text", first_det.text),
                matched_pattern="unit_only_fallback",
                sub_fields={"amount": num, "unit": unit, "when_packed": when_packed},
                rule_reference="Rule 6(1)(c)",
                bounding_boxes=[box] if isinstance(box, tuple) else box,
            )

        return DetectedField.not_found(
            self.field_name,
            "No quantity with a supported standard unit detected.",
            rule_reference="Rule 6(1)(c)",
        )
