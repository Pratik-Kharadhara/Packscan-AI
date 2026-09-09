"""Tests for raw OCR vs compliance isolation, uncaptured panels, and multi-panel evidence."""

from __future__ import annotations

from pathlib import Path
import cv2
import numpy as np
import pytest

from server import extract_percent_boxes, extract_raw_ocr_percent_boxes
from src.detection.base_detector import DetectedField
from src.ocr.ocr_service import OCRDetection, OCRResult, OCRService
from src.pipeline.analysis_pipeline import AnalysisPipeline
from src.rules.compliance_engine import CheckStatus, ComplianceEngine, OverallStatus


def _make_detection(text: str, confidence: float = 0.9, box: tuple | None = None) -> OCRDetection:
    return OCRDetection(
        text=text,
        confidence=confidence,
        bounding_box=box or ((10.0, 10.0), (100.0, 10.0), (100.0, 40.0), (10.0, 40.0)),
    )


def test_extract_raw_ocr_percent_boxes_structure() -> None:
    """rawOcrBoxes must convert pixel coordinates into percentage 0-100 coordinates with text & conf."""
    detections = [
        _make_detection("Energy", 1.0, ((50.0, 100.0), (250.0, 100.0), (250.0, 150.0), (50.0, 150.0))),
        _make_detection("361.79 Kcal", 0.62, ((300.0, 100.0), (500.0, 100.0), (500.0, 150.0), (300.0, 150.0))),
    ]
    boxes = extract_raw_ocr_percent_boxes(detections, img_w=1000, img_h=1000)
    assert len(boxes) == 2
    assert boxes[0]["text"] == "Energy"
    assert boxes[0]["confidence"] == 100.0
    assert boxes[0]["x"] == 5.0
    assert boxes[0]["y"] == 10.0
    assert boxes[0]["width"] == 20.0
    assert boxes[0]["height"] == 5.0

    assert boxes[1]["text"] == "361.79 Kcal"
    assert boxes[1]["confidence"] == 62.0
    assert boxes[1]["x"] == 30.0
    assert boxes[1]["y"] == 10.0
    assert boxes[1]["width"] == 20.0
    assert boxes[1]["height"] == 5.0


def test_panel_zero_compliance_boxes_renders_empty_list() -> None:
    """If a panel contains no statutory declarations, compliance boxes must be strictly empty."""
    detected_fields = {
        "product_identity": DetectedField(field="product_identity", found=False),
        "manufacturer_packer": DetectedField(field="manufacturer_packer", found=False),
        "net_quantity": DetectedField(field="net_quantity", found=False),
        "manufacture_date": DetectedField(field="manufacture_date", found=False),
        "mrp": DetectedField(field="mrp", found=False),
        "consumer_contact": DetectedField(field="consumer_contact", found=False),
    }
    boxes = extract_percent_boxes(detected_fields, img_w=1000, img_h=1000)
    assert boxes == []


def test_product2_4_nutrition_raw_ocr_and_no_commodity_false_positive() -> None:
    """If product2_4.jpg is present on disk, verify it has raw OCR including 361.79 Kcal and not Commodity."""
    img_path = Path(r"d:\SIH 2026\product2\product2_4.jpg")
    if not img_path.exists():
        pytest.skip("product2_4.jpg not found in environment")

    img = cv2.imread(str(img_path))
    assert img is not None

    ocr = OCRService()
    ocr_result = ocr.extract(img)
    assert len(ocr_result.detections) >= 15, "Expected significant raw OCR detections on nutrition panel"

    all_texts = [d.text for d in ocr_result.detections]
    has_361 = any("361.79" in t or "kcal" in t.lower() for t in all_texts)
    assert has_361, "Expected 361.79 Kcal to be captured in raw OCR detections"

    raw_boxes = extract_raw_ocr_percent_boxes(ocr_result.detections, img.shape[1], img.shape[0])
    has_raw_361 = any("361.79" in b["text"] or "kcal" in b["text"].lower() for b in raw_boxes)
    assert has_raw_361, "Expected 361.79 Kcal in rawOcrBoxes"

    pipeline = AnalysisPipeline()
    result = pipeline.analyze_package(img)
    prod_id = result.detected_fields.get("product_identity")
    if prod_id and prod_id.found:
        assert "361.79" not in str(prod_id.value)
        assert "kcal" not in str(prod_id.value).lower()


def test_mrp_regression_and_jul_26_confidence() -> None:
    """Verify regression protection: MRP ₹50 recovered, JUL/26 is ~41% and REVIEW, lot number not MRP."""
    pipeline = AnalysisPipeline()
    detections = [
        _make_detection("Incl. of all taxes", 0.9),
        _make_detection("{50/ - PKD JUL/26", 0.4088),
        _make_detection("Lot No: L/G/26", 0.85),
        _make_detection("Serial No: 12345", 0.80),
        _make_detection("{51 - L.NOL/6/26", 0.35),
    ]
    ocr_result = OCRResult(detections=detections)
    detected_fields = pipeline._field_detector.detect_all(ocr_result)

    mrp = detected_fields.get("mrp")
    assert mrp is not None and mrp.found
    assert mrp.value in ["50", "50.0", "50.00", "Rs. 50", "Rs. 50/-", "50/-"]
    assert "51" not in mrp.value

    mfg = detected_fields.get("manufacture_date")
    assert mfg is not None and mfg.found
    assert "JUL" in mfg.value.upper()
    assert (mfg.confidence or 0.0) < 0.65

    # Rule engine evaluation should mark low-confidence JUL/26 as REVIEW
    compliance_engine = ComplianceEngine()
    quality = pipeline._quality_assessor.assess(np.full((800, 800, 3), 128, dtype=np.uint8))
    compliance = compliance_engine.evaluate(quality, detected_fields)
    date_check = next((c for c in compliance.checks if c.field == "manufacture_date"), None)
    assert date_check is not None
    assert date_check.status == CheckStatus.REVIEW


def test_uncaptured_manufacturer_status_in_rule_engine() -> None:
    """Missing declaration with missing_status=REVIEW must not cause package-level NON_COMPLIANT."""
    compliance_engine = ComplianceEngine()
    quality = AnalysisPipeline()._quality_assessor.assess(np.full((800, 800, 3), 128, dtype=np.uint8))
    detected_fields = {
        "product_identity": DetectedField(field="product_identity", found=True, value="SPICES", confidence=0.99),
        "mrp": DetectedField(field="mrp", found=True, value="50", confidence=0.90),
        "manufacture_date": DetectedField(field="manufacture_date", found=True, value="JUL/2026", confidence=0.85),
        "manufacturer_packer": DetectedField(field="manufacturer_packer", found=False),
        "net_quantity": DetectedField(field="net_quantity", found=False),
        "consumer_contact": DetectedField(field="consumer_contact", found=False),
    }
    result = compliance_engine.evaluate(quality, detected_fields)
    assert result.overall_status == OverallStatus.NEEDS_REVIEW
    assert result.overall_status != OverallStatus.NON_COMPLIANT
