"""Tests for confidence-aware, explainable rule evaluation."""

from src.detection.base_detector import DetectedField
from src.quality.image_quality import ImageQualityMetrics, ImageQualityResult
from src.rules.compliance_engine import ComplianceEngine, OverallStatus


def _quality(usable: bool = True) -> ImageQualityResult:
    return ImageQualityResult(
        usable=usable,
        issues=[] if usable else ["Image is too blurry for reliable OCR."],
        metrics=ImageQualityMetrics(
            width=1000, height=1000, blur_score=120.0, brightness_score=120.0
        ),
    )


def _field(name: str, value: str, confidence: float = 0.9) -> DetectedField:
    return DetectedField(
        field=name,
        found=True,
        value=value,
        matched_text=value,
        confidence=confidence,
        bounding_boxes=[((0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0))],
    )


def _complete_fields() -> dict[str, DetectedField]:
    return {
        "product_identity": _field("product_identity", "Fresh Apricot Scrub"),
        "manufacturer_packer": _field("manufacturer_packer", "Manufactured by Example Ltd"),
        "net_quantity": _field("net_quantity", "100 g"),
        "manufacture_date": _field("manufacture_date", "08/2026"),
        "mrp": _field("mrp", "Rs. 145"),
        "consumer_contact": _field("consumer_contact", "9876543210"),
    }


def test_engine_returns_compliant_for_complete_high_confidence_evidence() -> None:
    result = ComplianceEngine().evaluate(_quality(), _complete_fields())

    assert result.overall_status is OverallStatus.COMPLIANT
    assert {check.status.value for check in result.checks} == {"PASS"}


def test_engine_routes_missing_declarations_to_review_by_default() -> None:
    result = ComplianceEngine().evaluate(_quality(), {})

    assert result.overall_status is OverallStatus.NEEDS_REVIEW
    assert all(check.status.value == "REVIEW" for check in result.checks)


def test_engine_routes_low_confidence_evidence_to_review() -> None:
    fields = _complete_fields()
    fields["mrp"] = _field("mrp", "Rs. 145", confidence=0.4)

    result = ComplianceEngine().evaluate(_quality(), fields)

    assert result.overall_status is OverallStatus.NEEDS_REVIEW
    assert next(check for check in result.checks if check.field == "mrp").status.value == "REVIEW"


def test_engine_fails_clear_format_mismatch() -> None:
    fields = _complete_fields()
    fields["mrp"] = _field("mrp", "price unavailable")

    result = ComplianceEngine().evaluate(_quality(), fields)

    assert result.overall_status is OverallStatus.NON_COMPLIANT
    assert next(check for check in result.checks if check.field == "mrp").status.value == "FAIL"


def test_engine_requires_review_when_image_is_unusable() -> None:
    result = ComplianceEngine().evaluate(_quality(usable=False), _complete_fields())

    assert result.overall_status is OverallStatus.NEEDS_REVIEW
    assert all(check.status.value == "REVIEW" for check in result.checks)
