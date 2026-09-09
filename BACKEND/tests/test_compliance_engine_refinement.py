"""Regression tests for Legal Metrology compliance engine refinement and false-positive prevention."""

from __future__ import annotations

import pytest
import numpy as np

from src.detection._helpers import detected_field
from src.detection.base_detector import DetectedField
from src.detection.content_validator import (
    is_lot_or_serial_number,
    is_nutrition_value,
    is_plausible_commodity,
    is_plausible_mrp_amount,
    is_plausible_net_quantity,
)
from src.detection.mrp_detector import MRPDetector
from src.detection.product_detector import ProductIdentityDetector
from src.detection.quantity_detector import QuantityDetector
from src.ocr.ocr_service import OCRDetection, OCRResult
from src.quality.image_quality import ImageQualityMetrics, ImageQualityResult
from src.rules.compliance_engine import CheckStatus, ComplianceEngine, OverallStatus


def _make_det(text: str, confidence: float = 0.95, box: tuple | None = None) -> OCRDetection:
    return OCRDetection(
        text=text,
        confidence=confidence,
        bounding_box=box or ((10.0, 10.0), (100.0, 10.0), (100.0, 40.0), (10.0, 40.0)),
    )


def _make_quality_result(usable: bool = True) -> ImageQualityResult:
    metrics = ImageQualityMetrics(
        width=800,
        height=800,
        blur_score=100.0 if usable else 20.0,
        brightness_score=128.0,
    )
    return ImageQualityResult(
        usable=usable,
        issues=[] if usable else ["Image is too blurry for screening"],
        metrics=metrics,
    )


# ==============================================================================
# 1. Compliance Result Contract Tests
# ==============================================================================

def test_compliance_check_attributes_complete() -> None:
    """Every compliance check must contain all required statutory and explainability attributes."""
    engine = ComplianceEngine()
    detected = {
        "mrp": DetectedField(
            field="mrp",
            found=True,
            value="Rs. 50.00",
            confidence=0.92,
            matched_text="MRP Rs. 50.00 incl. of all taxes",
            bounding_boxes=[((10.0, 10.0), (100.0, 10.0), (100.0, 30.0), (10.0, 30.0))],
            rule_reference="Rule 6(1)(e)",
        )
    }
    result = engine.evaluate(_make_quality_result(True), detected)
    mrp_check = next(c for c in result.checks if c.field == "mrp")

    assert mrp_check.field == "mrp"
    assert mrp_check.detected_value == "Rs. 50.00"
    assert mrp_check.confidence == 0.92
    assert mrp_check.evidence == "MRP Rs. 50.00 incl. of all taxes"
    assert len(mrp_check.bounding_boxes) == 1
    assert mrp_check.applicable_rule == "Rule 6(1)(e) & Rule 3(m)"
    assert mrp_check.rule_reference == "Rule 6(1)(e) & Rule 3(m)"
    assert mrp_check.rule_id == "LMR-2011-R6-1-E"
    assert mrp_check.legal_name == "Maximum Retail Price (MRP) inclusive of all taxes"
    assert mrp_check.validation_result == "VALID"
    assert mrp_check.status == CheckStatus.PASS
    assert "Compliant declaration detected" in mrp_check.reason


def test_missing_field_is_review_never_non_compliant() -> None:
    """Unphotographed surfaces or missing fields must yield REVIEW / INSUFFICIENT_EVIDENCE, never FAIL."""
    engine = ComplianceEngine()
    empty_fields = {
        "product_identity": DetectedField.not_found("product_identity", "Not found"),
        "manufacturer_packer": DetectedField.not_found("manufacturer_packer", "Not found"),
        "net_quantity": DetectedField.not_found("net_quantity", "Not found"),
        "manufacture_date": DetectedField.not_found("manufacture_date", "Not found"),
        "mrp": DetectedField.not_found("mrp", "Not found"),
        "consumer_contact": DetectedField.not_found("consumer_contact", "Not found"),
    }
    result = engine.evaluate(_make_quality_result(True), empty_fields)

    assert result.overall_status == OverallStatus.NEEDS_REVIEW
    for check in result.checks:
        assert check.status == CheckStatus.REVIEW
        assert check.validation_result == "INSUFFICIENT_EVIDENCE"
        assert check.detected_value is None
        assert check.bounding_boxes == []
        assert "Manual verification recommended" in check.reason


def test_unusable_image_quality_is_review() -> None:
    """If image quality is unusable, all checks must be REVIEW with LOW_IMAGE_QUALITY."""
    engine = ComplianceEngine()
    result = engine.evaluate(_make_quality_result(False), {})
    assert result.overall_status == OverallStatus.NEEDS_REVIEW
    mrp_check = next(c for c in result.checks if c.field == "mrp")
    assert mrp_check.status == CheckStatus.REVIEW
    assert mrp_check.validation_result == "LOW_IMAGE_QUALITY"


# ==============================================================================
# 2. Nutrition False Positive Hardening
# ==============================================================================

def test_nutrition_energy_cannot_become_commodity() -> None:
    """Nutrition tokens (361.79 Kcal, Energy, Total Fat) must NEVER become commodity identity."""
    assert not is_plausible_commodity("361.79 Kcal")
    assert not is_plausible_commodity("Energy 361.79 Kcal")
    assert not is_plausible_commodity("Energy")
    assert not is_plausible_commodity("Total Fat 17.67 gm")
    assert not is_plausible_commodity("Protein 8.5 g")

    detector = ProductIdentityDetector()
    ocr = OCRResult(
        detections=[
            _make_det("Nutritional Information"),
            _make_det("Energy"),
            _make_det("361.79 Kcal"),
            _make_det("Total Fat 17.67 gm"),
        ]
    )
    res = detector.detect(ocr)
    assert not res.found, f"Expected no commodity detected, got: {res.value}"


def test_nutrition_cannot_become_net_quantity() -> None:
    """Nutritional table lines (17.67 gm fat, 8.5 g protein) must NEVER become net quantity."""
    assert not is_plausible_net_quantity("17.67", "gm", "Total Fat 17.67 gm")
    assert not is_plausible_net_quantity("8.5", "g", "Protein 8.5 g")
    assert not is_plausible_net_quantity("361.79", "kcal", "Energy 361.79 Kcal")

    detector = QuantityDetector()
    ocr = OCRResult(
        detections=[
            _make_det("Nutritional Information"),
            _make_det("Energy 361.79 Kcal"),
            _make_det("Total Fat 17.67 gm"),
            _make_det("Protein 8.5 g"),
            _make_det("Carbohydrates 70.0 g"),
        ]
    )
    res = detector.detect(ocr)
    assert not res.found, f"Expected no net quantity detected from nutrition table, got: {res.value}"


# ==============================================================================
# 3. Lot / Serial / Barcode False Positive Hardening
# ==============================================================================

def test_lot_serial_barcode_cannot_become_mrp() -> None:
    """Lot numbers, batch numbers, serial numbers, and barcodes must NEVER become MRP."""
    assert is_lot_or_serial_number("Lot No: L/G/26")
    assert is_lot_or_serial_number("Serial No: 12345")
    assert is_lot_or_serial_number("Batch No: 501")
    assert is_lot_or_serial_number("BN: DA-50")

    detector = MRPDetector()
    ocr = OCRResult(
        detections=[
            _make_det("Lot No: 50"),
            _make_det("Serial No: 12345"),
            _make_det("Batch No: 501"),
            _make_det("Lic. No: 10012021000351"),
        ]
    )
    res = detector.detect(ocr)
    assert not res.found, f"Expected no MRP detected from lot/serial tokens, got: {res.value}"


def test_lot_serial_cannot_become_net_quantity() -> None:
    """Quantities governed by lot/serial numbers must NEVER become Net Quantity."""
    detector = QuantityDetector()
    ocr = OCRResult(
        detections=[
            _make_det("Lot No: 500g"),
            _make_det("Serial No: 200pcs"),
            _make_det("Batch: 100g"),
        ]
    )
    res = detector.detect(ocr)
    assert not res.found, f"Expected no Net Quantity detected from lot/serial numbers, got: {res.value}"


# ==============================================================================
# 4. Legitimate Declarations & Explainability
# ==============================================================================

def test_valid_mrp_passes_with_provenance() -> None:
    """Statutory MRP with inclusive of all taxes must PASS and preserve provenance."""
    detector = MRPDetector()
    ocr = OCRResult(
        detections=[
            _make_det("MRP Rs. 50.00 incl. of all taxes", 0.95),
        ]
    )
    field = detector.detect(ocr)
    assert field.found
    assert "50" in str(field.value)

    engine = ComplianceEngine()
    res = engine.evaluate(_make_quality_result(True), {"mrp": field})
    chk = next(c for c in res.checks if c.field == "mrp")
    assert chk.status == CheckStatus.PASS
    assert chk.validation_result == "VALID"
    assert chk.applicable_rule == "Rule 6(1)(e) & Rule 3(m)"


def test_valid_net_quantity_passes_with_provenance() -> None:
    """Statutory Net Quantity with explicit net context and standard SI unit must PASS."""
    detector = QuantityDetector()
    ocr = OCRResult(
        detections=[
            _make_det("Net Quantity: 1 kg", 0.96),
        ]
    )
    field = detector.detect(ocr)
    assert field.found
    assert field.value == "1 kg"

    engine = ComplianceEngine()
    res = engine.evaluate(_make_quality_result(True), {"net_quantity": field})
    chk = next(c for c in res.checks if c.field == "net_quantity")
    assert chk.status == CheckStatus.PASS
    assert chk.validation_result == "VALID"
    assert chk.applicable_rule == "Rule 6(1)(c) & Rule 13"


def test_low_confidence_declaration_yields_needs_review() -> None:
    """A declaration detected below minimum confidence threshold must yield REVIEW / LOW_CONFIDENCE."""
    engine = ComplianceEngine()
    low_conf_det = {
        "mrp": DetectedField(
            field="mrp",
            found=True,
            value="Rs. 50.00",
            confidence=0.42,  # below 0.65 threshold
            matched_text="{50/ - PKD JUL/26",
            bounding_boxes=[((0, 0), (10, 0), (10, 10), (0, 10))],
            rule_reference="Rule 6(1)(e)",
        )
    }
    res = engine.evaluate(_make_quality_result(True), low_conf_det)
    chk = next(c for c in res.checks if c.field == "mrp")
    assert chk.status == CheckStatus.REVIEW
    assert chk.validation_result == "LOW_CONFIDENCE"
    assert chk.confidence == 0.42
    assert chk.evidence == "{50/ - PKD JUL/26"
    assert "below configured threshold" in chk.reason


def test_invalid_format_yields_fail_and_non_compliant() -> None:
    """A declaration detected with non-conforming statutory format yields FAIL and NON_COMPLIANT."""
    engine = ComplianceEngine()
    invalid_det = {
        "mrp": DetectedField(
            field="mrp",
            found=True,
            value="INVALID_PRICE_ABC",
            confidence=0.95,
            matched_text="MRP INVALID_PRICE_ABC",
            rule_reference="Rule 6(1)(e)",
        )
    }
    res = engine.evaluate(_make_quality_result(True), invalid_det)
    chk = next(c for c in res.checks if c.field == "mrp")
    assert chk.status == CheckStatus.FAIL
    assert chk.validation_result == "INVALID_FORMAT"
    assert res.overall_status == OverallStatus.NON_COMPLIANT


def test_dashboard_summary_counts_only_statutory_pass() -> None:
    """Dashboard detected_count must count only checks that PASS statutory verification."""
    from server import FIELD_MAP

    engine = ComplianceEngine()
    # 2 PASS, 1 LOW_CONFIDENCE, 3 MISSING
    mixed_fields = {
        "mrp": DetectedField(
            field="mrp",
            found=True,
            value="Rs. 50.00",
            confidence=0.95,
            matched_text="MRP Rs. 50.00 incl. of all taxes",
            rule_reference="Rule 6(1)(e)",
        ),
        "net_quantity": DetectedField(
            field="net_quantity",
            found=True,
            value="1 kg",
            confidence=0.90,
            matched_text="Net Qty: 1 kg",
            rule_reference="Rule 6(1)(c)",
        ),
        "manufacture_date": DetectedField(
            field="manufacture_date",
            found=True,
            value="AUG/26",
            confidence=0.40,  # low confidence -> REVIEW
            matched_text="PKD AUG/26",
            rule_reference="Rule 6(1)(d)",
        ),
    }
    eval_res = engine.evaluate(_make_quality_result(True), mixed_fields)
    
    # Calculate detected_count using server logic
    detected_count = sum(1 for c in eval_res.checks if c.status == CheckStatus.PASS and c.field in FIELD_MAP)
    assert detected_count == 2
    assert eval_res.overall_status == OverallStatus.NEEDS_REVIEW

