"""Net-quantity declaration detector."""

from __future__ import annotations

import re

from src.detection._helpers import detected_field, first_match
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.patterns import compile_any, load_detection_patterns
from src.ocr.ocr_service import OCRResult


class QuantityDetector(BaseDetector):
    """Detect quantity units, prioritising explicit net-quantity context."""

    field_name = "net_quantity"

    def __init__(self) -> None:
        patterns = load_detection_patterns()[self.field_name]
        self._context = compile_any(patterns["context_patterns"])
        self._value = re.compile(patterns["value_pattern"], re.IGNORECASE)

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        fallback = None
        for detection in ocr_result.detections:
            value = first_match(self._value, detection.text)
            if not value:
                continue
            if self._context.search(detection.text):
                return detected_field(self.field_name, detection, value, "Net-quantity context and value detected.")
            fallback = fallback or (detection, value)
        if fallback:
            return detected_field(
                self.field_name,
                fallback[0],
                fallback[1],
                "Quantity unit detected without explicit net-quantity context.",
            )
        return DetectedField.not_found(self.field_name, "No quantity with a supported unit detected.")
