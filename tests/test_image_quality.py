"""Tests for image-quality assessment."""

import cv2
import numpy as np

from src.quality.image_quality import ImageQualityAssessor


def _sharp_image(width: int = 800, height: int = 600) -> np.ndarray:
    image = np.full((height, width, 3), 127, dtype=np.uint8)
    cv2.putText(image, "MRP Rs. 45", (80, 250), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 4)
    return image


def test_assess_accepts_sharp_well_lit_image() -> None:
    result = ImageQualityAssessor().assess(_sharp_image())

    assert result.usable is True
    assert result.issues == []
    assert result.metrics.width == 800
    assert result.metrics.blur_score > 80


def test_assess_identifies_low_resolution_and_darkness() -> None:
    result = ImageQualityAssessor().assess(np.zeros((100, 120, 3), dtype=np.uint8))

    assert result.usable is False
    assert any("resolution" in issue for issue in result.issues)
    assert any("dark" in issue for issue in result.issues)
