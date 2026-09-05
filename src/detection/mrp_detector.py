"""Retail-sale-price declaration detector."""

from __future__ import annotations

import re

from src.detection._helpers import detected_field, first_match
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.patterns import compile_any, load_detection_patterns
from src.ocr.ocr_service import OCRResult


class MRPDetector(BaseDetector):
    """Detect a price only when it appears beside an MRP/retail-price context."""

    field_name = "mrp"

    def __init__(self) -> None:
        patterns = load_detection_patterns()[self.field_name]
        self._context = compile_any(patterns["context_patterns"])
        self._value = re.compile(patterns["value_pattern"], re.IGNORECASE)

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        for detection in ocr_result.detections:
            if self._context.search(detection.text):
                value = first_match(self._value, detection.text)
                if value:
                    return detected_field(self.field_name, detection, value, "MRP context and price detected.")
        return DetectedField.not_found(self.field_name, "No reliable MRP declaration detected.")
