"""Tests for modular declaration detectors."""

from src.detection.field_detector import FieldDetector
from src.ocr.ocr_service import OCRDetection, OCRResult


def _detection(text: str, confidence: float = 0.9) -> OCRDetection:
    return OCRDetection(
        text=text,
        confidence=confidence,
        bounding_box=((0.0, 0.0), (10.0, 0.0), (10.0, 10.0), (0.0, 10.0)),
    )


def test_field_detector_returns_structured_evidence_for_each_declaration() -> None:
    ocr = OCRResult(
        detections=[
            _detection("Product: Fresh Apricot Scrub"),
            _detection("Manufactured by: Example Cosmetics Pvt Ltd"),
            _detection("Net Qty: 100 g"),
            _detection("Mfd: 08/2026"),
            _detection("MRP Rs. 145 inclusive of all taxes"),
            _detection("Customer Care: 9876543210"),
        ]
    )

    fields = FieldDetector().detect_all(ocr)

    assert fields["product_identity"].found is True
    assert fields["manufacturer_packer"].found is True
    assert fields["net_quantity"].value == "100 g"
    assert fields["manufacture_date"].value == "08/2026"
    assert fields["mrp"].value == "Rs. 145"
    assert fields["consumer_contact"].value == "9876543210"
    assert all(field.bounding_boxes for field in fields.values())


def test_field_detector_explains_absent_declarations() -> None:
    fields = FieldDetector().detect_all(OCRResult(detections=[_detection("Barcode 890123456789")]))

    assert all(field.found is False for field in fields.values())
    assert all(field.notes for field in fields.values())
