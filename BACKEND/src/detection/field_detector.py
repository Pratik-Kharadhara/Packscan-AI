"""Coordinator for independently testable declaration detectors with semantic field separation."""

from __future__ import annotations

from src.detection._helpers import detected_field
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.contact_detector import ContactDetector
from src.detection.date_detector import DateDetector
from src.detection.manufacturer_detector import ManufacturerDetector
from src.detection.mrp_detector import MRPDetector
from src.detection.product_detector import ProductIdentityDetector
from src.detection.quantity_detector import QuantityDetector
from src.detection.semantic_associator import SemanticAssociator
from src.ocr.ocr_service import OCRResult


class FieldDetector:
    """Run all declaration detectors; retains semantic field separation across dates and prices."""

    def __init__(self, detectors: list[BaseDetector] | None = None) -> None:
        self._detectors = detectors or [
            ProductIdentityDetector(),
            ManufacturerDetector(),
            QuantityDetector(),
            DateDetector(),
            MRPDetector(),
            ContactDetector(),
        ]
        self._associator = SemanticAssociator()

    def detect_all(self, ocr_result: OCRResult) -> dict[str, DetectedField]:
        """Return a field-name keyed collection of OCR-derived evidence candidates with separate semantic fields."""
        results = {detector.field_name: detector.detect(ocr_result) for detector in self._detectors}

        # Run 2D semantic associator to ensure distinct date fields are preserved separately
        associations = self._associator.associate(ocr_result)

        # 1. Packaging Date
        pkg_assoc = associations.get("packaging_date")
        if pkg_assoc:
            first_det = pkg_assoc.value_match.detection
            results["packaging_date"] = detected_field(
                "packaging_date",
                first_det,
                pkg_assoc.value,
                f"Date of packaging declaration detected: {pkg_assoc.value} (Pre-packing date under Rule 6(1)(d)).",
                confidence=pkg_assoc.confidence,
                source_line=pkg_assoc.label_match.detection if pkg_assoc.label_match else first_det,
                raw_text=f"{pkg_assoc.label_text} {pkg_assoc.value}",
                normalized_text=f"{pkg_assoc.label_text}: {pkg_assoc.value}",
                matched_pattern="packaging_date",
                sub_fields={
                    "date_type": "packaging_date",
                    "packaging_date": pkg_assoc.value,
                    "label": pkg_assoc.label_text,
                    "statutory_role": "pre_packing_date_rule_6_1_d",
                },
                rule_reference="Rule 6(1)(d)",
                bounding_boxes=pkg_assoc.bounding_boxes,
            )

        # 2. Use By Date
        use_by_assoc = associations.get("use_by_date")
        if use_by_assoc:
            first_det = use_by_assoc.value_match.detection
            results["use_by_date"] = detected_field(
                "use_by_date",
                first_det,
                use_by_assoc.value,
                f"Use-by date declaration detected: {use_by_assoc.value}.",
                confidence=use_by_assoc.confidence,
                source_line=use_by_assoc.label_match.detection if use_by_assoc.label_match else first_det,
                raw_text=f"{use_by_assoc.label_text} {use_by_assoc.value}",
                normalized_text=f"{use_by_assoc.label_text}: {use_by_assoc.value}",
                matched_pattern="use_by_date",
                sub_fields={
                    "date_type": "use_by_date",
                    "use_by_date": use_by_assoc.value,
                    "label": use_by_assoc.label_text,
                },
                bounding_boxes=use_by_assoc.bounding_boxes,
            )

        # 3. Expiry Date
        exp_assoc = associations.get("expiry_date")
        if exp_assoc:
            first_det = exp_assoc.value_match.detection
            results["expiry_date"] = detected_field(
                "expiry_date",
                first_det,
                exp_assoc.value,
                f"Expiry date declaration detected: {exp_assoc.value}.",
                confidence=exp_assoc.confidence,
                source_line=exp_assoc.label_match.detection if exp_assoc.label_match else first_det,
                raw_text=f"{exp_assoc.label_text} {exp_assoc.value}",
                normalized_text=f"{exp_assoc.label_text}: {exp_assoc.value}",
                matched_pattern="expiry_date",
                sub_fields={
                    "date_type": "expiry_date",
                    "expiry_date": exp_assoc.value,
                    "label": exp_assoc.label_text,
                },
                bounding_boxes=exp_assoc.bounding_boxes,
            )

        # 4. Best Before Date
        bb_assoc = associations.get("best_before_date")
        if bb_assoc:
            first_det = bb_assoc.value_match.detection
            results["best_before_date"] = detected_field(
                "best_before_date",
                first_det,
                bb_assoc.value,
                f"Best-before date declaration detected: {bb_assoc.value}.",
                confidence=bb_assoc.confidence,
                source_line=bb_assoc.label_match.detection if bb_assoc.label_match else first_det,
                raw_text=f"{bb_assoc.label_text} {bb_assoc.value}",
                normalized_text=f"{bb_assoc.label_text}: {bb_assoc.value}",
                matched_pattern="best_before_date",
                sub_fields={
                    "date_type": "best_before_date",
                    "best_before_date": bb_assoc.value,
                    "label": bb_assoc.label_text,
                },
                bounding_boxes=bb_assoc.bounding_boxes,
            )

        return results
