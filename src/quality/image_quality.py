"""Practical, explainable image-quality checks for OCR readiness."""

from __future__ import annotations

from pathlib import Path
from typing import TypeAlias

import cv2
import numpy as np
from pydantic import BaseModel, Field

from config import (
    MAX_BRIGHTNESS_SCORE,
    MIN_BLUR_SCORE,
    MIN_BRIGHTNESS_SCORE,
    MIN_IMAGE_HEIGHT,
    MIN_IMAGE_WIDTH,
)


ImageInput: TypeAlias = str | Path | np.ndarray


class ImageQualityError(ValueError):
    """Raised when an image cannot be decoded for quality analysis."""


class ImageQualityMetrics(BaseModel):
    """Measured properties used for an OCR-readiness screening decision."""

    width: int = Field(gt=0)
    height: int = Field(gt=0)
    blur_score: float = Field(ge=0.0)
    brightness_score: float = Field(ge=0.0, le=255.0)


class ImageQualityResult(BaseModel):
    """Explainable readiness result; it makes no compliance determination."""

    usable: bool
    issues: list[str]
    metrics: ImageQualityMetrics


class ImageQualityAssessor:
    """Assess baseline readability before expensive OCR work begins."""

    def __init__(
        self,
        min_width: int = MIN_IMAGE_WIDTH,
        min_height: int = MIN_IMAGE_HEIGHT,
        min_blur_score: float = MIN_BLUR_SCORE,
        min_brightness_score: float = MIN_BRIGHTNESS_SCORE,
        max_brightness_score: float = MAX_BRIGHTNESS_SCORE,
    ) -> None:
        self._min_width = min_width
        self._min_height = min_height
        self._min_blur_score = min_blur_score
        self._min_brightness_score = min_brightness_score
        self._max_brightness_score = max_brightness_score

    def assess(self, image: ImageInput) -> ImageQualityResult:
        """Measure resolution, focus, and average brightness for one image."""

        decoded = self._load_image(image)
        height, width = decoded.shape[:2]
        grayscale = cv2.cvtColor(decoded, cv2.COLOR_BGR2GRAY)
        blur_score = float(cv2.Laplacian(grayscale, cv2.CV_64F).var())
        brightness_score = float(grayscale.mean())

        issues: list[str] = []
        if width < self._min_width or height < self._min_height:
            issues.append(
                f"Image resolution is too low ({width}x{height}); "
                f"minimum is {self._min_width}x{self._min_height}."
            )
        if blur_score < self._min_blur_score:
            issues.append("Image is too blurry for reliable OCR.")
        if brightness_score < self._min_brightness_score:
            issues.append("Image is too dark for reliable OCR.")
        elif brightness_score > self._max_brightness_score:
            issues.append("Image is overexposed and may contain glare.")

        return ImageQualityResult(
            usable=not issues,
            issues=issues,
            metrics=ImageQualityMetrics(
                width=width,
                height=height,
                blur_score=blur_score,
                brightness_score=brightness_score,
            ),
        )

    @staticmethod
    def _load_image(image: ImageInput) -> np.ndarray:
        if isinstance(image, Path):
            image = str(image)
        if isinstance(image, str):
            decoded = cv2.imread(image)
            if decoded is None:
                raise ImageQualityError(f"Unable to read image file: {image}")
            return decoded
        if isinstance(image, np.ndarray) and image.size:
            if image.ndim not in (2, 3):
                raise ImageQualityError("Image array must have two or three dimensions.")
            if image.ndim == 2:
                return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
            return image
        raise ImageQualityError("Image must be a non-empty file path or NumPy array.")
