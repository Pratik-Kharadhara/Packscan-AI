"""Comprehensive regression tests covering OCR normalization, field detectors, role separation, false positive rejection, and legal provenance."""

from __future__ import annotations

import numpy as np
import pytest

from src.detection.base_detector import DetectedField
from src.detection.contact_detector import ContactDetector
from src.detection.date_detector import DateDetector
from src.detection.field_detector import FieldDetector
from src.detection.manufacturer_detector import ManufacturerDetector
from src.detection.mrp_detector import MRPDetector
from src.detection.product_detector import ProductIdentityDetector
from src.detection.quantity_detector import QuantityDetector
from src.ocr.ocr_normalizer import normalize_text
from src.ocr.ocr_service import OCRDetection, OCRResult, deduplicate_detections
from src.ocr.spatial_grouping import GroupedLine, SpatialGrouper
from src.quality.image_quality import ImageQualityMetrics, ImageQualityResult
from src.rules.compliance_engine import CheckStatus, ComplianceEngine, OverallStatus
from src.rules.rule_loader import RuleLoader


def _box(x1: float, y1: float, x2: float, y2: float) -> tuple[tuple[float, float], tuple[float, float], tuple[float, float], tuple[float, float]]:
    return ((x1, y1), (x2, y1), (x2, y2), (x1, y2))


def _det(text: str, conf: float = 0.9, box: tuple | None = None) -> OCRDetection:
    return OCRDetection(
        text=text,
        confidence=conf,
        bounding_box=box or _box(10.0, 10.0, 100.0, 30.0),
    )


def _quality(usable: bool = True) -> ImageQualityResult:
    return ImageQualityResult(
        usable=usable,
        issues=[] if usable else ["Blurry image"],
        metrics=ImageQualityMetrics(width=1000, height=1000, blur_score=100.0, brightness_score=100.0),
    )


# =====================================================================
# 1. Normalization & Artifacts
# =====================================================================

def test_ocr_normalization_artifacts() -> None:
    """Normalizer cleans currency artifacts, merged packaging terms, unit spacing, and date spacing."""
    assert "₹ 32.00" in normalize_text("MRP ? 32.00")
    assert "₹ 45.00" in normalize_text("MRP < 45.00")
    assert "incl. of all taxes" in normalize_text("incl ofalltaxes")
    assert "incl. of all taxes" in normalize_text("incU of all taxes")
    assert "1 kg" in normalize_text("1KG")
    assert "100 g" in normalize_text("100g")
    assert "500 ml" in normalize_text("500ML")
    assert "AUG/26" in normalize_text("AUG / 26")
    assert "Aug/26" in normalize_text("Aug/2g")


# =====================================================================
# 2. MRP Detector Robustness
# =====================================================================

def test_mrp_handles_currency_artifacts_and_commas() -> None:
    """MRPDetector parses ?, <, Rs., and comma decimal values with statutory tax declaration."""
    ocr = OCRResult(
        detections=[
            _det("MRP ? 32,00 incl ofalltaxes", 0.88, _box(10, 10, 200, 35)),
        ]
    )
    res = MRPDetector().detect(ocr)
    assert res.found is True
    assert res.value == "Rs. 32.00"
    assert res.sub_fields.get("amount") == "32.00"
    assert res.sub_fields.get("tax_included") == "true"
    assert res.sub_fields.get("currency") == "INR"


def test_mrp_rejects_isolated_year_as_mrp() -> None:
    """Four-digit years (e.g. 2026) without decimal or currency are not mistaken for MRP."""
    ocr = OCRResult(
        detections=[
            _det("Batch Details: 2026", 0.90, _box(10, 10, 150, 30)),
        ]
    )
    res = MRPDetector().detect(ocr)
    assert res.found is False


# =====================================================================
# 3. Spatial Grouping & Multi-Line Address Blocks
# =====================================================================

def test_multiline_address_block_association() -> None:
    """Address lines directly beneath manufacturer header are grouped into an address block with PIN code."""
    ocr = OCRResult(
        detections=[
            _det("Mfg by: Tata Chemicals Limited", 0.92, _box(50, 100, 300, 125)),
            _det("Mithapur, 361 345", 0.89, _box(50, 130, 250, 155)),
            _det("District-Devbhumi Dwarka, Gujarat", 0.91, _box(50, 160, 350, 185)),
        ]
    )
    field = ManufacturerDetector().detect(ocr)
    assert field.found is True
    assert field.role == "manufacturer"
    assert field.sub_fields.get("has_pin") == "true"
    assert field.sub_fields.get("pin_code") == "361 345"
    assert "Tata Chemicals Limited" in field.value


def test_marketer_vs_manufacturer_role_distinction() -> None:
    """Marketer is distinguished from manufacturer when 'mkt by:' is present."""
    ocr = OCRResult(
        detections=[
            _det("Mkt by: Tata Consumer Products Limited", 0.90, _box(50, 50, 350, 75)),
            _det("1st Floor, 43, Jawaharlal Nehru Road, Kolkata 700 071", 0.88, _box(50, 80, 450, 105)),
        ]
    )
    field = ManufacturerDetector().detect(ocr)
    assert field.found is True
    assert field.role == "marketer"
    assert "Marketer:" in field.value
    assert field.sub_fields.get("pin_code") == "700 071"


# =====================================================================
# 4. Dates: Semantic Separation
# =====================================================================

def test_date_semantic_separation_use_by_vs_packaging_date() -> None:
    """Use By / Best Before date alone does not satisfy Rule 6(1)(d) mandatory pre-pack/mfg date."""
    ocr_expiry_only = OCRResult(
        detections=[
            _det("Best Before: 12/2027", 0.92, _box(10, 10, 150, 30)),
        ]
    )
    field_exp = DateDetector().detect(ocr_expiry_only)
    assert field_exp.found is True
    assert field_exp.sub_fields.get("date_type") == "expiry_only"

    # Rule engine flags expiry_only as REVIEW under Rule 6(1)(d)
    engine = ComplianceEngine()
    result = engine.evaluate(_quality(), {"manufacture_date": field_exp})
    chk = next(c for c in result.checks if c.field == "manufacture_date")
    assert chk.status is CheckStatus.REVIEW
    assert "Expiry date detected" in chk.reason

    # Packaging date properly satisfies Rule 6(1)(d)
    ocr_pkg = OCRResult(
        detections=[
            _det("Date of Packaging: AUG/26", 0.93, _box(10, 10, 200, 30)),
        ]
    )
    field_pkg = DateDetector().detect(ocr_pkg)
    assert field_pkg.found is True
    assert field_pkg.sub_fields.get("date_type") == "packaging_date"
    res_pkg = engine.evaluate(_quality(), {"manufacture_date": field_pkg})
    chk_pkg = next(c for c in res_pkg.checks if c.field == "manufacture_date")
    assert chk_pkg.status is CheckStatus.PASS


# =====================================================================
# 5. Quantity False Positive Prevention
# =====================================================================

def test_quantity_rejects_nutrition_table_values() -> None:
    """Nutrition table quantities (e.g. Sodium 38.7 g) are not mistaken for package net quantity."""
    ocr = OCRResult(
        detections=[
            _det("Nutrition Information per 100g", 0.90, _box(10, 10, 250, 30)),
            _det("Sodium: 38.7 g", 0.92, _box(10, 35, 120, 55)),
            _det("Iodine: 15 mg", 0.91, _box(10, 60, 110, 80)),
        ]
    )
    res = QuantityDetector().detect(ocr)
    assert res.found is False


def test_quantity_rejects_date_year_fragment() -> None:
    """Dot-matrix date year fragment like Aug/2g is not misidentified as 2 g quantity."""
    ocr = OCRResult(
        detections=[
            _det("NET QUANTITY: Mat Aug/2g", 0.85, _box(10, 10, 200, 30)),
        ]
    )
    res = QuantityDetector().detect(ocr)
    assert res.found is False


def test_quantity_accepts_valid_net_quantity_with_context() -> None:
    """Explicit Net Quantity declaration with SI unit is correctly identified."""
    ocr = OCRResult(
        detections=[
            _det("Net Quantity: 1 kg", 0.95, _box(10, 10, 150, 30)),
        ]
    )
    res = QuantityDetector().detect(ocr)
    assert res.found is True
    assert res.value == "1 kg"
    assert res.sub_fields.get("unit") == "kg"
    assert res.sub_fields.get("amount") == "1"


# =====================================================================
# 6. Consumer Contact & False Positive Prevention
# =====================================================================

def test_contact_rejects_standalone_barcodes_and_licenses() -> None:
    """FSSAI license numbers or barcodes without grievance context are rejected."""
    ocr = OCRResult(
        detections=[
            _det("FSSAI Lic No: 10014031001021", 0.94, _box(10, 10, 250, 30)),
            _det("8 904043 901015", 0.93, _box(10, 40, 150, 60)),
        ]
    )
    res = ContactDetector().detect(ocr)
    assert res.found is False


def test_contact_accepts_toll_free_with_care_context() -> None:
    """Consumer care toll-free helpline is recognized and structured."""
    ocr = OCRResult(
        detections=[
            _det("Consumer Care Toll Free: 1800-108-4488", 0.94, _box(10, 10, 300, 30)),
        ]
    )
    res = ContactDetector().detect(ocr)
    assert res.found is True
    assert "1800" in res.value
    assert res.sub_fields.get("toll_free") is not None


# =====================================================================
# 7. Product Identity & Header False Positive Prevention
# =====================================================================

def test_product_identity_rejects_recycling_and_advertising_sentences() -> None:
    """Recycling statements and advertising copy are rejected as commodity identity."""
    ocr = OCRResult(
        detections=[
            _det("Tata Salt's Recyclable pack - less waste", 0.85, _box(10, 10, 300, 30)),
            _det("Salt is made with vacuum technology that guarantees purity", 0.88, _box(10, 40, 450, 60)),
            _det("CONSUMER CARE DETAILS", 0.92, _box(10, 70, 200, 90)),
        ]
    )
    res = ProductIdentityDetector().detect(ocr)
    assert res.found is False


def test_product_identity_accepts_generic_commodity_name() -> None:
    """Short standard commodity declaration is identified under Rule 6(1)(b)."""
    ocr = OCRResult(
        detections=[
            _det("Vacuum Evaporated Edible Common Salt", 0.93, _box(10, 10, 350, 35)),
        ]
    )
    res = ProductIdentityDetector().detect(ocr)
    assert res.found is True
    assert "Salt" in res.value
    assert res.rule_reference == "Rule 6(1)(b)"


# =====================================================================
# 8. Full Provenance & Smart Multi-Pass Deduplication
# =====================================================================

def test_field_detector_preserves_full_provenance() -> None:
    """Field detectors preserve field, value, confidence, raw_text, normalized_text, bounding_boxes, and rule_reference."""
    ocr = OCRResult(
        detections=[
            _det("Product: Iodised Salt", 0.94, _box(10, 10, 150, 30)),
            _det("Mfg by: Tata Chemicals Ltd, Mithapur 361345", 0.92, _box(10, 40, 350, 60)),
            _det("Net Quantity: 1 kg", 0.95, _box(10, 70, 150, 90)),
            _det("Pkd Date: AUG/26", 0.90, _box(10, 100, 150, 120)),
            _det("MRP Rs. 28.00 incl. of all taxes", 0.93, _box(10, 130, 250, 150)),
            _det("Toll Free: 1800-108-4488", 0.91, _box(10, 160, 200, 180)),
        ]
    )
    fields = FieldDetector().detect_all(ocr)
    for name, f in fields.items():
        assert f.found is True
        assert f.value is not None
        assert f.confidence is not None and f.confidence >= 0.85
        assert f.raw_text is not None
        assert f.normalized_text is not None
        assert len(f.bounding_boxes) > 0
        assert f.rule_reference is not None


def test_deduplicate_detections_merges_spatial_overlaps() -> None:
    """Secondary OCR pass detections that spatially overlap are deduplicated in favor of higher confidence."""
    primary = [
        _det("TATA SALT", 0.80, _box(10, 10, 100, 40)),
        _det("NET QTY", 0.75, _box(10, 50, 80, 70)),
    ]
    secondary = [
        # Overlaps TATA SALT with higher confidence
        _det("TATA SALT", 0.95, _box(12, 10, 98, 40)),
        # New distinct token discovered in secondary pass
        _det("1 kg", 0.92, _box(90, 50, 130, 70)),
    ]
    merged = deduplicate_detections(primary, secondary, iou_threshold=0.40)
    assert len(merged) == 3  # TATA SALT (updated), NET QTY, 1 kg (added)
    tata_det = next(d for d in merged if "TATA" in d.text)
    assert tata_det.confidence == 0.95
    assert any(d.text == "1 kg" for d in merged)


def test_nutrition_value_kcal_rejected_as_commodity() -> None:
    """Verify '361.79 Kcal' and nutrition table headers are NOT classified as commodity."""
    ocr = OCRResult(
        detections=[
            _det("NUTRITIONAL INFORMATION / 100g", 0.95, _box(10, 10, 200, 30)),
            _det("Energy", 0.99, _box(10, 35, 80, 55)),
            _det("361.79 Kcal", 1.00, _box(100, 35, 180, 55)),
            _det("Total Fat", 0.98, _box(10, 60, 80, 80)),
            _det("17.67 gm", 0.90, _box(100, 60, 160, 80)),
        ]
    )
    res = ProductIdentityDetector().detect(ocr)
    assert res.found is False


def test_mrp_detection_from_bare_rupee_and_suffix() -> None:
    """Verify bare currency format like '{50/ -' on tax/packing line is detected as MRP."""
    from src.ocr.ocr_normalizer import normalize_detection
    raw_det = _det("{50/ - PKD JUL/26", 0.41, _box(10, 50, 200, 75))
    norm_det = normalize_detection(raw_det)
    gl = GroupedLine(
        text="incl. of all taxes ₹ 50/- pkd date: JUL/26",
        raw_text="Incl ; of all taxsl {50/ - PKD JUL/26",
        confidence=0.41,
        detections=[norm_det],
        bounding_box=_box(10, 50, 200, 75),
    )
    ocr = OCRResult(
        detections=[raw_det],
        grouped_lines=[gl],
    )
    res = MRPDetector().detect(ocr)
    assert res.found is True
    assert res.value == "Rs. 50"
    assert res.sub_fields["amount"] == "50"
    assert res.sub_fields["tax_included"] == "true"
    # Provenance matches raw token
    assert res.confidence == pytest.approx(0.41, abs=0.01)


def test_mrp_distinguishes_price_from_lot_number() -> None:
    """Verify detector picks price '{50/-' over nearby Lot No 'E51 - L.HOL/6/26'."""
    ocr = OCRResult(
        detections=[
            _det("{50/ - PKD JUL/26", 0.45, _box(10, 50, 200, 75)),
            _det("Not No: E51 - L.HOL/6/26", 0.60, _box(10, 80, 220, 105)),
        ]
    )
    res = MRPDetector().detect(ocr)
    assert res.found is True
    assert res.sub_fields["amount"] == "50"
    assert res.sub_fields["amount"] != "51"


def test_spices_detected_as_generic_commodity() -> None:
    """Verify generic commodity descriptor SPICES is detected under Rule 6(1)(b)."""
    ocr = OCRResult(
        detections=[
            _det("DVTA", 0.49, _box(50, 10, 150, 40)),
            _det("SUPER GOLD", 0.99, _box(30, 50, 200, 80)),
            _det("SPICES", 1.00, _box(40, 90, 180, 120)),
        ]
    )
    res = ProductIdentityDetector().detect(ocr)
    assert res.found is True
    assert res.value == "SPICES"
    assert res.matched_pattern == "commodity_descriptor"

