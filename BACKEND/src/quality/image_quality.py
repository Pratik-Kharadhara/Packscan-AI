"""Practical, explainable image-quality checks for OCR readiness."""

from __future__ import annotations

from pathlib import Path
from typing import TypeAlias

import cv2
import numpy as np
from pydantic import BaseModel, Field

from config import (
    HARD_MAX_BRIGHTNESS_SCORE,
    HARD_MIN_BLUR_SCORE,
    HARD_MIN_BRIGHTNESS_SCORE,
    MAX_BRIGHTNESS_SCORE,
    MIN_BRIGHTNESS_SCORE,
    MIN_IMAGE_HEIGHT,
    MIN_IMAGE_WIDTH,
    SOFT_BLUR_WARNING_THRESHOLD,
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
        hard_min_blur: float = HARD_MIN_BLUR_SCORE,
        soft_min_blur: float = SOFT_BLUR_WARNING_THRESHOLD,
        hard_min_brightness: float = HARD_MIN_BRIGHTNESS_SCORE,
        hard_max_brightness: float = HARD_MAX_BRIGHTNESS_SCORE,
        soft_min_brightness: float = MIN_BRIGHTNESS_SCORE,
        soft_max_brightness: float = MAX_BRIGHTNESS_SCORE,
    ) -> None:
        self._min_width = min_width
        self._min_height = min_height
        self._hard_min_blur = hard_min_blur
        self._soft_min_blur = soft_min_blur
        self._hard_min_brightness = hard_min_brightness
        self._hard_max_brightness = hard_max_brightness
        self._soft_min_brightness = soft_min_brightness
        self._soft_max_brightness = soft_max_brightness

    def assess(self, image: ImageInput) -> ImageQualityResult:
        """Measure resolution, focus, and average brightness for one image."""

        decoded = self._load_image(image)
        height, width = decoded.shape[:2]
        grayscale = cv2.cvtColor(decoded, cv2.COLOR_BGR2GRAY)
        blur_score = float(cv2.Laplacian(grayscale, cv2.CV_64F).var())
        brightness_score = float(grayscale.mean())

        hard_issues: list[str] = []
        soft_warnings: list[str] = []

        if width < self._min_width or height < self._min_height:
            hard_issues.append(
                f"Image resolution is too low ({width}x{height}); "
                f"minimum required is {self._min_width}x{self._min_height}."
            )

        if blur_score < self._hard_min_blur:
            hard_issues.append(
                f"Image is severely blurry (blur score: {blur_score:.1f} < {self._hard_min_blur}); text cannot be reliably resolved."
            )
        elif blur_score < self._soft_min_blur:
            soft_warnings.append(
                f"Minor blur detected (blur score: {blur_score:.1f}); OCR will proceed with caution."
            )

        if brightness_score < self._hard_min_brightness:
            hard_issues.append("Image is severely underexposed/dark; text is unreadable.")
        elif brightness_score < self._soft_min_brightness:
            soft_warnings.append("Low ambient lighting detected; contrast enhancement recommended.")
        elif brightness_score > self._hard_max_brightness:
            hard_issues.append("Image is severely overexposed/washed out by extreme glare.")
        elif brightness_score > self._soft_max_brightness:
            soft_warnings.append("High brightness or surface glare detected.")

        usable = len(hard_issues) == 0
        all_issues = hard_issues + soft_warnings

        return ImageQualityResult(
            usable=usable,
            issues=all_issues,
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
