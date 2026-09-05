"""Product or commodity identity declaration detector."""

from __future__ import annotations

from src.detection._helpers import detected_field
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.patterns import compile_any, load_detection_patterns
from src.ocr.ocr_service import OCRResult


class ProductIdentityDetector(BaseDetector):
    """Detect explicitly labelled product/commodity identity lines."""

    field_name = "product_identity"

    def __init__(self) -> None:
        self._context = compile_any(
            load_detection_patterns()[self.field_name]["context_patterns"]
        )

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        for detection in ocr_result.detections:
            if self._context.search(detection.text):
                return detected_field(
                    self.field_name,
                    detection,
                    detection.text,
                    "Product or commodity identity context detected.",
                )
        return DetectedField.not_found(
            self.field_name, "No explicitly labelled product or commodity identity detected."
        )
