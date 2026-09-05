"""Manufacture or pre-pack date declaration detector."""

from __future__ import annotations

import re

from src.detection._helpers import detected_field, first_match
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.patterns import compile_any, load_detection_patterns
from src.ocr.ocr_service import OCRResult


class DateDetector(BaseDetector):
    """Detect dates only when manufacture/pre-pack context is visible."""

    field_name = "manufacture_date"

    def __init__(self) -> None:
        patterns = load_detection_patterns()[self.field_name]
        self._context = compile_any(patterns["context_patterns"])
        self._value = re.compile(
            f"{patterns['value_pattern']}|{patterns['year_month_pattern']}",
            re.IGNORECASE,
        )

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        for detection in ocr_result.detections:
            if self._context.search(detection.text):
                value = first_match(self._value, detection.text)
                if value:
                    return detected_field(
                        self.field_name, detection, value, "Manufacture/pre-pack context and date detected."
                    )
        return DetectedField.not_found(
            self.field_name, "No reliable manufacture or pre-pack date declaration detected."
        )
