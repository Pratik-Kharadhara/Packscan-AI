"""Coordinator for independently testable declaration detectors."""

from __future__ import annotations

from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.contact_detector import ContactDetector
from src.detection.date_detector import DateDetector
from src.detection.manufacturer_detector import ManufacturerDetector
from src.detection.mrp_detector import MRPDetector
from src.detection.product_detector import ProductIdentityDetector
from src.detection.quantity_detector import QuantityDetector
from src.ocr.ocr_service import OCRResult


class FieldDetector:
    """Run all declaration detectors; no rule or compliance decisions are made here."""

    def __init__(self, detectors: list[BaseDetector] | None = None) -> None:
        self._detectors = detectors or [
            ProductIdentityDetector(),
            ManufacturerDetector(),
            QuantityDetector(),
            DateDetector(),
            MRPDetector(),
            ContactDetector(),
        ]

    def detect_all(self, ocr_result: OCRResult) -> dict[str, DetectedField]:
        """Return a field-name keyed collection of OCR-derived evidence candidates."""

        return {detector.field_name: detector.detect(ocr_result) for detector in self._detectors}
