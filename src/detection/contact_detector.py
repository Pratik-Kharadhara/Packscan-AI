"""Consumer-contact declaration detector."""

from __future__ import annotations

import re

from src.detection._helpers import detected_field, first_match
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.patterns import compile_any, load_detection_patterns
from src.ocr.ocr_service import OCRResult


class ContactDetector(BaseDetector):
    """Find contact evidence, prioritising explicit consumer-care language."""

    field_name = "consumer_contact"

    def __init__(self) -> None:
        patterns = load_detection_patterns()[self.field_name]
        self._context = compile_any(patterns["context_patterns"])
        self._phone = re.compile(patterns["phone_pattern"])
        self._email = re.compile(patterns["email_pattern"], re.IGNORECASE)

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        fallback = None
        for detection in ocr_result.detections:
            value = first_match(self._email, detection.text) or first_match(self._phone, detection.text)
            if not value:
                continue
            if self._context.search(detection.text):
                return detected_field(
                    self.field_name, detection, value, "Consumer-contact context and contact value detected."
                )
            fallback = fallback or (detection, value)
        if fallback:
            return detected_field(
                self.field_name,
                fallback[0],
                fallback[1],
                "Contact value detected without explicit consumer-care context.",
            )
        return DetectedField.not_found(self.field_name, "No phone number or email address detected.")
