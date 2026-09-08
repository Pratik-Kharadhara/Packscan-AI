"""Precision, recall, and edge-case evaluation tests for PACKSCAN AI."""

from __future__ import annotations

from src.detection.contact_detector import ContactDetector
from src.detection.date_detector import DateDetector
from src.detection.field_detector import FieldDetector
from src.detection.manufacturer_detector import ManufacturerDetector
from src.detection.mrp_detector import MRPDetector
from src.detection.quantity_detector import QuantityDetector
from src.ocr.ocr_normalizer import normalize_text
from src.ocr.ocr_service import OCRDetection, OCRResult
from src.ocr.spatial_grouping import SpatialGrouper
from src.rules.compliance_engine import CheckStatus, ComplianceEngine, OverallStatus


def _box(x0: float, y0: float, x1: float, y1: float):
    return ((x0, y0), (x1, y0), (x1, y1), (x0, y1))


def _det(text: str, x0: float, y0: float, x1: float, y1: float, conf: float = 0.95) -> OCRDetection:
    return OCRDetection(text=text, confidence=conf, bounding_box=_box(x0, y0, x1, y1))


def test_rupee_symbol_artifact_handling() -> None:
    """Test that EasyOCR reading '?' in place of '₹' with MRP context correctly detects price (Suggestion 4)."""
    ocr = OCRResult(
        detections=[
            _det("MRP ? 32.00 incl; ofalltaxes", 10, 50, 200, 70),
        ]
    )
    result = MRPDetector().detect(ocr)
    assert result.found is True
    assert "32.00" in result.value
    assert result.sub_fields.get("tax_included") == "true"
    assert result.sub_fields.get("amount") == "32.00"


def test_question_mark_without_mrp_context_is_not_treated_as_price() -> None:
    """Ensure '?' is not globally treated as currency without explicit MRP context."""
    ocr = OCRResult(
        detections=[
            _det("Question ? 32.00 answers", 10, 50, 200, 70),
        ]
    )
    result = MRPDetector().detect(ocr)
    assert result.found is False


def test_spatial_line_grouping_multi_box_date() -> None:
    """Test grouping [Date of] [Packaging:] [AuG/26] on same horizontal band (Suggestion 2)."""
    ocr = OCRResult(
        detections=[
            _det("Date of", 10, 100, 70, 125),
            _det("Packaging:", 75, 100, 160, 125),
            _det("AuG/26", 170, 100, 240, 125),
        ]
    )
    result = DateDetector().detect(ocr)
    assert result.found is True
    assert result.value == "AuG/26"
    assert result.sub_fields.get("date_type") == "packaging_date"


def test_semantic_date_separation_expiry_vs_mfg() -> None:
    """Test that Use By date does not satisfy Rule 6(1)(d) mfg/pkg date requirement (Suggestion 5)."""
    # Only expiry date present
    ocr = OCRResult(
        detections=[
            _det("Use By: JUL/28", 10, 100, 150, 125),
        ]
    )
    result = DateDetector().detect(ocr)
    assert result.found is True
    assert result.sub_fields.get("date_type") == "expiry_only"

    # Verify rule engine flags it
    engine = ComplianceEngine()
    quality = engine._rules # load rules
    eval_result = engine.evaluate(
        image_quality=type("Q", (), {"usable": True, "issues": []})(), # type: ignore
        detected_fields={"manufacture_date": result},
    )
    check = next(c for c in eval_result.checks if c.field == "manufacture_date")
    assert check.status == CheckStatus.REVIEW
    assert "Expiry date detected" in check.reason


def test_stacked_net_quantity_declaration() -> None:
    """Test vertically stacked [NET QUANTITY:] above [1 kg] (Suggestion 2)."""
    ocr = OCRResult(
        detections=[
            _det("NET QUANTITY:", 100, 50, 250, 75),
            _det("1 kg", 120, 80, 180, 105),
        ]
    )
    result = QuantityDetector().detect(ocr)
    assert result.found is True
    assert result.value == "1 kg"
    assert result.sub_fields.get("unit") == "kg"


def test_manufacturer_role_distinction_and_pin() -> None:
    """Test distinguishing marketer vs manufacturer and extracting postal PIN codes (Suggestion 6)."""
    ocr = OCRResult(
        detections=[
            _det("Mkt by: Tata Consumer Products Limited, Kolkata - 700 071", 10, 50, 400, 75),
            _det("Mfg by: Tata Chemicals Limited, Mithapur, Gujarat - 361 345", 10, 80, 400, 105),
        ]
    )
    result = ManufacturerDetector().detect(ocr)
    assert result.found is True
    assert "manufacturer" in result.sub_fields.get("roles_detected", "")
    assert "marketer" in result.sub_fields.get("roles_detected", "")
    assert "700 071" in result.sub_fields.get("pin_code", "") or "361 345" in result.sub_fields.get("pin_code", "")


def test_consumer_contact_toll_free_and_email() -> None:
    """Test customer care helpline 1800 and email detection."""
    ocr = OCRResult(
        detections=[
            _det("Consumer Care: 1800-1200-3628, care@tataconsumer.com", 10, 50, 450, 75),
        ]
    )
    result = ContactDetector().detect(ocr)
    assert result.found is True
    assert "1800" in result.sub_fields.get("toll_free", "")
    assert "care@tataconsumer.com" in result.sub_fields.get("email", "")


def test_normalization_text_helpers() -> None:
    """Test OCR normalizer cleaning rules (Suggestion 3)."""
    assert "incl. of all taxes" in normalize_text("MRP Rs 45 incl; ofalltaxes")
    assert "100 g" in normalize_text("Net Qty 100g")
    assert "1 kg" in normalize_text("1kg")
    assert "date of packaging:" in normalize_text("Date of Packaging")
