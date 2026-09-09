"""Regression tests for 2D semantic label-to-value association on Product 3."""

from __future__ import annotations

from pathlib import Path
import cv2
import pytest

from src.detection.date_detector import DateDetector
from src.detection.field_detector import FieldDetector
from src.detection.mrp_detector import MRPDetector
from src.detection.quantity_detector import QuantityDetector
from src.detection.semantic_associator import SemanticAssociator
from src.ocr.ocr_service import OCRDetection, OCRResult, OCRService
from src.rules.compliance_engine import CheckStatus, ComplianceEngine, OverallStatus


def _det(text: str, conf: float, left: float, top: float, right: float, bottom: float) -> OCRDetection:
    return OCRDetection(
        text=text,
        confidence=conf,
        bounding_box=((left, top), (right, top), (right, bottom), (left, bottom)),
    )


class DummyQuality:
    usable = True
    is_usable = True
    overall_score = 0.95
    blur_score = 0.95
    glare_score = 0.95
    lighting_score = 0.95
    dpi_estimate = 300.0


def test_product3_semantic_label_value_association_synthetic() -> None:
    """Product 3 declaration panel exact OCR geometry scenario:

    NET QUANTITY:  100 g
    Date of Packaging      Use By
    27/07/26               28/07/27
    MRP ₹     50.00
    Incl. of all taxes

    Expected associations:
    - Date of Packaging -> 27/07/26
    - Use By -> 28/07/27
    - MRP -> 50.00 with supporting 'Incl. of all taxes'
    - Net Quantity -> 100 g
    - Date of Packaging must NOT be called manufacture_date or expiry_only.
    """
    ocr_result = OCRResult(
        detections=[
            _det("NET QUANTITY:", 0.98, 1118.0, 34.0, 1355.0, 107.0),
            _det("100 g", 0.96, 1418.0, 21.0, 1528.0, 96.0),
            _det("Date of Packaging", 0.97, 391.0, 110.0, 681.0, 178.0),
            _det("Use By", 0.95, 938.0, 90.0, 1061.0, 152.0),
            _det("BN", 0.90, 96.0, 140.0, 153.0, 193.0),
            _det("27028", 0.88, 338.0, 213.0, 508.0, 280.0),
            _det("27/07/26", 0.96, 566.0, 193.0, 856.0, 271.0),
            _det("28/07/27", 0.95, 939.0, 173.0, 1244.0, 257.0),
            _det("MRP ₹", 0.96, 94.0, 280.0, 205.0, 336.0),
            _det("50.00", 0.94, 453.0, 280.0, 648.0, 352.0),
            _det("Incl. of all taxes", 0.97, 102.0, 322.0, 334.0, 374.0),
            _det("82228233282", 0.85, 464.0, 358.0, 975.0, 426.0),
        ]
    )

    # 1. Test SemanticAssociator directly
    associator = SemanticAssociator()
    associations = associator.associate(ocr_result)

    assert "packaging_date" in associations
    assert associations["packaging_date"].value == "27/07/26"
    assert associations["packaging_date"].label_text == "Date of Packaging"

    assert "use_by_date" in associations
    assert associations["use_by_date"].value == "28/07/27"
    assert associations["use_by_date"].label_text == "Use By"

    assert "net_quantity" in associations
    assert associations["net_quantity"].value == "100 g"
    assert "NET QUANTITY" in associations["net_quantity"].label_text

    assert "mrp" in associations
    assert "50.00" in associations["mrp"].value
    assert len(associations["mrp"].supporting_evidence) >= 1
    assert "taxes" in associations["mrp"].supporting_evidence[0].matched_text.lower()

    # 2. Test DateDetector
    date_detector = DateDetector()
    date_field = date_detector.detect(ocr_result)

    assert date_field.found is True
    assert date_field.value == "27/07/26"
    assert date_field.sub_fields.get("date_type") == "packaging_date"
    assert date_field.sub_fields.get("packaging_date") == "27/07/26"
    assert date_field.sub_fields.get("use_by_date") == "28/07/27"
    assert date_field.sub_fields.get("is_packaging_date") == "true"
    # Never classify as expiry only
    assert date_field.sub_fields.get("date_type") != "expiry_only"
    assert "Expiry only" not in str(date_field.value)

    # 3. Test MRPDetector
    mrp_detector = MRPDetector()
    mrp_field = mrp_detector.detect(ocr_result)

    assert mrp_field.found is True
    assert "50" in mrp_field.value
    assert mrp_field.sub_fields.get("tax_included") == "true"
    assert "taxes" in mrp_field.sub_fields.get("supporting_evidence", "").lower()

    # 4. Test QuantityDetector
    qty_detector = QuantityDetector()
    qty_field = qty_detector.detect(ocr_result)

    assert qty_field.found is True
    assert qty_field.value == "100 g"
    assert qty_field.sub_fields.get("unit") == "g"
    assert qty_field.sub_fields.get("amount") == "100"

    # 5. Test FieldDetector keeps separate fields
    field_detector = FieldDetector()
    all_fields = field_detector.detect_all(ocr_result)

    assert "packaging_date" in all_fields and all_fields["packaging_date"].found is True
    assert all_fields["packaging_date"].value == "27/07/26"
    assert all_fields["packaging_date"].field == "packaging_date"

    assert "use_by_date" in all_fields and all_fields["use_by_date"].found is True
    assert all_fields["use_by_date"].value == "28/07/27"
    assert all_fields["use_by_date"].field == "use_by_date"

    assert "net_quantity" in all_fields and all_fields["net_quantity"].found is True
    assert all_fields["net_quantity"].value == "100 g"

    assert "mrp" in all_fields and all_fields["mrp"].found is True
    assert "50" in all_fields["mrp"].value

    # 6. Test ComplianceEngine evaluation
    engine = ComplianceEngine()
    result = engine.evaluate(DummyQuality(), all_fields)

    date_check = next(c for c in result.checks if c.field == "manufacture_date")
    assert date_check.status == CheckStatus.PASS
    assert date_check.validation_result == "VALID"
    assert "Rule 6(1)(d)" in date_check.applicable_rule
    assert "27/07/26" in date_check.detected_value
    assert date_check.validation_result != "EXPIRY_ONLY"

    mrp_check = next(c for c in result.checks if c.field == "mrp")
    assert mrp_check.status == CheckStatus.PASS
    assert mrp_check.validation_result == "VALID"

    qty_check = next(c for c in result.checks if c.field == "net_quantity")
    assert qty_check.status == CheckStatus.PASS
    assert qty_check.validation_result == "VALID"


def test_product3_actual_image_if_present() -> None:
    """If Product 3 image 3 is available, verify pipeline associations on real EasyOCR output."""
    img_path = Path(r"D:\SIH 2026\Product 3\product3_3.jpeg")
    if not img_path.exists():
        pytest.skip("Product 3 image 3 not present in local test environment.")

    img = cv2.imread(str(img_path))
    assert img is not None

    ocr_service = OCRService()
    ocr_result = ocr_service.extract(img)

    field_detector = FieldDetector()
    detected_fields = field_detector.detect_all(ocr_result)

    # Net quantity must be 100 g
    assert detected_fields["net_quantity"].found is True
    assert "100" in detected_fields["net_quantity"].value
    assert "g" in detected_fields["net_quantity"].value

    # Packaging date must be detected and not confused with expiry only
    assert detected_fields["packaging_date"].found is True
    assert "27/07/26" in detected_fields["packaging_date"].value

    # Manufacture date check must not be marked expiry_only
    date_field = detected_fields["manufacture_date"]
    assert date_field.found is True
    assert date_field.sub_fields.get("date_type") != "expiry_only"
    assert "27/07/26" in str(date_field.value)

    # Use by date must be detected
    assert detected_fields["use_by_date"].found is True
    assert "26/07/27" in detected_fields["use_by_date"].value or "27/07/27" in detected_fields["use_by_date"].value or "28/07/27" in detected_fields["use_by_date"].value
