"""Regression tests for Legal Metrology Rule 6(2) consumer care multi-line detection and compliance."""

from __future__ import annotations

import numpy as np
import pytest

from src.detection.base_detector import DetectedField
from src.detection.contact_detector import ContactDetector
from src.ocr.ocr_service import OCRDetection, OCRResult
from src.rules.compliance_engine import CheckStatus, ComplianceEngine, OverallStatus
from src.rules.rule_loader import RuleLoader


def _make_det(text: str, confidence: float = 0.95, top_y: float = 100.0) -> OCRDetection:
    return OCRDetection(
        text=text,
        confidence=confidence,
        bounding_box=((50.0, top_y), (450.0, top_y), (450.0, top_y + 25.0), (50.0, top_y + 25.0)),
    )


class DummyQuality:
    usable = True
    is_usable = True
    overall_score = 0.95
    blur_score = 0.95
    glare_score = 0.95
    lighting_score = 0.95
    dpi_estimate = 300.0


def test_tata_tea_consumer_care_multi_line_scenario() -> None:
    """Exact scenario from user scan:

    'CONSUMER CARE DETAILS'
    'CUSTOMER CARE EXECUTIVE'
    'TATA CONSUMER PRODUCTS LTD'
    full address: 'KIRLOSKAR BUSINESS PARK, HEBBAL, BENGALURU - 560 024, KARNATAKA'
    telephone: '1800 108 4488'
    email: 'care@tatconsumer.com'

    Must collectively associate into consumer_contact and PASS under Rule 6(2).
    """
    ocr_result = OCRResult(
        detections=[
            _make_det("CONSUMER CARE DETAILS", 0.98, top_y=100.0),
            _make_det("CUSTOMER CARE EXECUTIVE", 0.96, top_y=130.0),
            _make_det("TATA CONSUMER PRODUCTS LTD", 0.97, top_y=160.0),
            _make_det("KIRLOSKAR BUSINESS PARK, HEBBAL, BENGALURU - 560 024, KARNATAKA", 0.94, top_y=190.0),
            _make_det("TELEPHONE: 1800 108 4488", 0.95, top_y=220.0),
            _make_det("EMAIL: care@tatconsumer.com", 0.96, top_y=250.0),
        ]
    )

    detector = ContactDetector()
    field = detector.detect(ocr_result)

    # 1. Verification of field detection
    assert field.found is True, f"Expected consumer_contact to be detected, notes: {field.notes}"
    assert "1800 108 4488" in field.value
    assert "care@tatconsumer.com" in field.value
    assert field.confidence is not None and field.confidence >= 0.90
    assert len(field.bounding_boxes) >= 4, "Expected bounding boxes from associated multi-line block"

    # Verify structured sub_fields
    assert field.sub_fields.get("toll_free") == "1800 108 4488"
    assert field.sub_fields.get("email") == "care@tatconsumer.com"
    assert field.sub_fields.get("office") == "CUSTOMER CARE EXECUTIVE"
    assert field.sub_fields.get("company") == "TATA CONSUMER PRODUCTS LTD"
    assert "560 024" in str(field.sub_fields.get("postal_code", "")) or "560 024" in str(field.sub_fields.get("address", ""))

    # 2. Verification of Compliance Engine evaluation
    engine = ComplianceEngine()
    detected_fields = {
        "product_identity": DetectedField(field="product_identity", found=True, value="TEA", confidence=0.98),
        "manufacturer_packer": DetectedField(field="manufacturer_packer", found=True, value="Tata Consumer Products Ltd", confidence=0.95),
        "net_quantity": DetectedField(field="net_quantity", found=True, value="250 g", confidence=0.98),
        "manufacture_date": DetectedField(field="manufacture_date", found=True, value="08/2026", confidence=0.92),
        "mrp": DetectedField(field="mrp", found=True, value="Rs. 150", confidence=0.96),
        "consumer_contact": field,
    }

    result = engine.evaluate(DummyQuality(), detected_fields)
    contact_check = next(c for c in result.checks if c.field == "consumer_contact")

    assert contact_check.status == CheckStatus.PASS
    assert contact_check.validation_result == "VALID"
    assert "Rule 6(2)" in contact_check.applicable_rule
    assert "1800 108 4488" in contact_check.detected_value
    assert "care@tatconsumer.com" in contact_check.detected_value
    assert result.overall_status == OverallStatus.COMPLIANT


def test_consumer_care_conservative_policy_insufficient_evidence_never_non_compliant() -> None:
    """When consumer care is not visible or unphotographed, it must yield REVIEW / INSUFFICIENT_EVIDENCE, never NON_COMPLIANT."""
    engine = ComplianceEngine()
    detected_fields = {
        "product_identity": DetectedField(field="product_identity", found=True, value="TEA", confidence=0.98),
        "manufacturer_packer": DetectedField(field="manufacturer_packer", found=True, value="Tata Consumer Products Ltd", confidence=0.95),
        "net_quantity": DetectedField(field="net_quantity", found=True, value="250 g", confidence=0.98),
        "manufacture_date": DetectedField(field="manufacture_date", found=True, value="08/2026", confidence=0.92),
        "mrp": DetectedField(field="mrp", found=True, value="Rs. 150", confidence=0.96),
        "consumer_contact": DetectedField.not_found("consumer_contact", "Not detected on surface"),
    }

    result = engine.evaluate(DummyQuality(), detected_fields)
    contact_check = next(c for c in result.checks if c.field == "consumer_contact")

    assert contact_check.status == CheckStatus.REVIEW
    assert contact_check.validation_result == "INSUFFICIENT_EVIDENCE"
    assert contact_check.status != CheckStatus.FAIL
    assert result.overall_status == OverallStatus.NEEDS_REVIEW
    assert result.overall_status != OverallStatus.NON_COMPLIANT


def test_single_line_customer_care_backward_compatibility() -> None:
    """Single-line declarations like 'Customer Care: 9876543210' must continue to pass cleanly."""
    ocr_result = OCRResult(
        detections=[
            _make_det("Customer Care: 9876543210", 0.95),
        ]
    )
    detector = ContactDetector()
    field = detector.detect(ocr_result)

    assert field.found is True
    assert field.value == "9876543210"
    assert field.sub_fields.get("phone") == "9876543210"

    engine = ComplianceEngine()
    check = engine._evaluate_field(
        "consumer_contact",
        RuleLoader().load().fields["consumer_contact"],
        field,
        image_usable=True,
    )
    assert check.status == CheckStatus.PASS
    assert check.validation_result == "VALID"


def test_random_digits_or_barcode_without_context_never_passes() -> None:
    """Numbers from barcodes or arbitrary tokens without consumer care context must never pass as consumer_contact."""
    ocr_result = OCRResult(
        detections=[
            _make_det("Barcode: 890123456789", 0.99),
            _make_det("FSSAI Lic No: 10014011000123", 0.95),
        ]
    )
    detector = ContactDetector()
    field = detector.detect(ocr_result)
    assert field.found is False
