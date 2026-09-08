"""Tests for visual evidence annotation on package images."""

from pathlib import Path
import numpy as np
import pytest

from src.annotation.image_annotator import ImageAnnotator, annotate_image
from src.detection.base_detector import DetectedField
from src.rules.compliance_engine import CheckStatus, ComplianceCheck


@pytest.fixture
def synthetic_image() -> np.ndarray:
    """Create an 800x600 solid-color image canvas for testing."""
    return np.full((600, 800, 3), 240, dtype=np.uint8)


@pytest.fixture
def sample_detected_fields() -> dict[str, DetectedField]:
    """Create sample detected fields with bounding boxes."""
    return {
        "mrp": DetectedField(
            field="mrp",
            found=True,
            value="₹45",
            matched_text="MRP ₹45",
            confidence=0.95,
            bounding_boxes=[((50.0, 50.0), (200.0, 50.0), (200.0, 100.0), (50.0, 100.0))],
        ),
        "net_quantity": DetectedField(
            field="net_quantity",
            found=True,
            value="500 g",
            matched_text="Net Wt 500 g",
            confidence=0.92,
            bounding_boxes=[((50.0, 150.0), (220.0, 150.0), (220.0, 190.0), (50.0, 190.0))],
        ),
        "consumer_contact": DetectedField(
            field="consumer_contact",
            found=False,
            notes=["No contact details found"],
        ),
    }


def test_annotator_empty_detections(synthetic_image: np.ndarray) -> None:
    annotator = ImageAnnotator()
    result = annotator.annotate(synthetic_image, {})
    assert isinstance(result, np.ndarray)
    assert result.shape == synthetic_image.shape
    # When no fields found, output matches input canvas
    np.testing.assert_array_equal(result, synthetic_image)


def test_annotator_with_fields(
    synthetic_image: np.ndarray,
    sample_detected_fields: dict[str, DetectedField],
) -> None:
    annotator = ImageAnnotator()
    checks = [
        ComplianceCheck(field="mrp", status=CheckStatus.PASS, reason="Valid MRP"),
        ComplianceCheck(field="net_quantity", status=CheckStatus.PASS, reason="Valid net quantity"),
    ]
    result = annotator.annotate(
        image=synthetic_image,
        detected_fields=sample_detected_fields,
        compliance_checks=checks,
    )
    assert isinstance(result, np.ndarray)
    assert result.shape == synthetic_image.shape
    # The canvas must have been drawn upon
    assert not np.array_equal(result, synthetic_image)


def test_standalone_annotate_image(
    synthetic_image: np.ndarray,
    sample_detected_fields: dict[str, DetectedField],
) -> None:
    result = annotate_image(synthetic_image, sample_detected_fields)
    assert isinstance(result, np.ndarray)
    assert result.shape == synthetic_image.shape


def test_annotator_save(
    synthetic_image: np.ndarray,
    sample_detected_fields: dict[str, DetectedField],
    tmp_path: Path,
) -> None:
    annotator = ImageAnnotator()
    annotated = annotator.annotate(synthetic_image, sample_detected_fields)
    saved_path = annotator.save_annotated(annotated, output_path=tmp_path / "test_out.jpg")
    assert saved_path.is_file()
    assert saved_path.stat().st_size > 0
