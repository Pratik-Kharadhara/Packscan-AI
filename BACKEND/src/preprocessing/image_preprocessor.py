"""Conservative and configurable image transformations for OCR."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re
from typing import Any, TypeAlias

import cv2
import numpy as np

from config import (
    DEFAULT_APPLY_CLAHE,
    DEFAULT_PRESERVE_RGB,
    MAX_PREPROCESS_DIMENSION,
)

ImageInput: TypeAlias = str | Path | np.ndarray
Point: TypeAlias = tuple[float, float]
BoundingBox: TypeAlias = tuple[Point, Point, Point, Point]


class ImagePreprocessingError(ValueError):
    """Raised when preprocessing receives an unreadable image."""


@dataclass(frozen=True)
class PreprocessingOptions:
    """Tunable transformations; clean RGB is preserved by default."""

    max_dimension: int = MAX_PREPROCESS_DIMENSION
    preserve_rgb: bool = DEFAULT_PRESERVE_RGB
    apply_contrast_enhancement: bool = DEFAULT_APPLY_CLAHE
    apply_denoising: bool = False
    apply_thresholding: bool = False
    grayscale: bool = False


@dataclass(frozen=True)
class PreprocessingResult:
    """Original and transformed image arrays plus the applied operations."""

    original_image: np.ndarray
    processed_image: np.ndarray
    operations: tuple[str, ...]
    selected_rotation: int = 0


class ImagePreprocessor:
    """Prepare an image for OCR without applying destructive transformations blindly."""

    def __init__(self, options: PreprocessingOptions | None = None) -> None:
        self._options = options or PreprocessingOptions()

    def preprocess(self, image: ImageInput) -> PreprocessingResult:
        """Resize when needed, then deliver clean RGB or requested transformations."""

        original = self._load_image(image)
        processed = original.copy()
        operations: list[str] = []

        processed, did_resize = self._resize_to_limit(processed)
        if did_resize:
            operations.append("resize")

        # Color-space handling: EasyOCR CRAFT detector performs best with clean 3-channel RGB.
        # Grayscale is only applied when explicitly requested or required for thresholding.
        if self._options.grayscale or (not self._options.preserve_rgb and not self._options.apply_thresholding):
            if processed.ndim == 3:
                processed = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)
            operations.append("grayscale")
        elif self._options.preserve_rgb:
            if processed.ndim == 3:
                processed = cv2.cvtColor(processed, cv2.COLOR_BGR2RGB)
            operations.append("rgb_conversion")

        # Selective, non-destructive CLAHE contrast enhancement
        if self._options.apply_contrast_enhancement:
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            if processed.ndim == 3:
                # Apply CLAHE to the Luminance channel in LAB color space to preserve chromatic fidelity
                lab = cv2.cvtColor(processed, cv2.COLOR_RGB2LAB if self._options.preserve_rgb else cv2.COLOR_BGR2LAB)
                lab[:, :, 0] = clahe.apply(lab[:, :, 0])
                processed = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB if self._options.preserve_rgb else cv2.COLOR_LAB2BGR)
            else:
                processed = clahe.apply(processed)
            operations.append("clahe_contrast")

        if self._options.apply_denoising:
            if processed.ndim == 3:
                processed = cv2.fastNlMeansDenoisingColored(processed, None, 6, 6, 7, 21)
            else:
                processed = cv2.fastNlMeansDenoising(processed, None, h=8)
            operations.append("denoise")

        if self._options.apply_thresholding:
            if processed.ndim == 3:
                gray = cv2.cvtColor(processed, cv2.COLOR_RGB2GRAY if self._options.preserve_rgb else cv2.COLOR_BGR2GRAY)
            else:
                gray = processed
            processed = cv2.adaptiveThreshold(
                gray,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                31,
                8,
            )
            operations.append("adaptive_threshold")

        return PreprocessingResult(
            original_image=original,
            processed_image=processed,
            operations=tuple(operations),
            selected_rotation=0,
        )

    def _resize_to_limit(self, image: np.ndarray) -> tuple[np.ndarray, bool]:
        height, width = image.shape[:2]
        largest_dimension = max(width, height)
        if largest_dimension <= self._options.max_dimension:
            return image, False

        scale = self._options.max_dimension / largest_dimension
        resized = cv2.resize(
            image,
            (round(width * scale), round(height * scale)),
            interpolation=cv2.INTER_AREA,
        )
        return resized, True

    @staticmethod
    def _load_image(image: ImageInput) -> np.ndarray:
        if isinstance(image, Path):
            image = str(image)
        if isinstance(image, str):
            decoded = cv2.imread(image)
            if decoded is None:
                raise ImagePreprocessingError(f"Unable to read image file: {image}")
            return decoded
        if isinstance(image, np.ndarray) and image.size:
            if image.ndim == 2:
                return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
            if image.ndim == 3:
                return image
        raise ImagePreprocessingError("Image must be a non-empty file path or NumPy array")


# =====================================================================
# Orientation Scoring and Evaluation Utilities
# =====================================================================

def compute_orientation_score(ocr_result: Any) -> float:
    """Compute a robust quality score reflecting text plausibility and reading confidence.

    Considers:
    - Number of meaningful detections (length >= 2)
    - Plausible alphanumeric tokens (words/codes matching [a-zA-Z0-9]{2,})
    - High-confidence detections (confidence >= 0.55)
    - Average confidence across meaningful tokens
    - Total character volume (upside-down noise typically yields short, isolated fragments)
    """
    detections = getattr(ocr_result, "detections", [])
    if not detections:
        return 0.0

    meaningful = [d for d in detections if len(d.text.strip()) >= 2]
    if not meaningful:
        return 0.0

    alpha_count = sum(1 for d in meaningful if re.search(r"[a-zA-Z0-9]{2,}", d.text))
    high_conf_count = sum(1 for d in meaningful if getattr(d, "confidence", 0.0) >= 0.55)
    avg_conf = sum(getattr(d, "confidence", 0.0) for d in meaningful) / len(meaningful)
    char_count = sum(len(d.text.strip()) for d in meaningful)

    score = (
        alpha_count * 2.0
        + high_conf_count * 3.0
        + min(50.0, char_count / 10.0)
    ) * (avg_conf ** 1.1)

    return float(score)


def should_evaluate_180(ocr_result: Any) -> bool:
    """Determine whether 0° orientation is weak enough to justify evaluating 180°.

    Avoids unnecessarily doubling OCR cost when 0° already produces strong,
    high-confidence packaging text.
    """
    detections = getattr(ocr_result, "detections", [])
    if not detections:
        return True

    meaningful = [d for d in detections if len(d.text.strip()) >= 2]
    if len(meaningful) < 10:
        return True

    avg_conf = sum(getattr(d, "confidence", 0.0) for d in meaningful) / len(meaningful)
    if avg_conf < 0.45:
        return True

    high_conf_count = sum(1 for d in meaningful if getattr(d, "confidence", 0.0) >= 0.60)
    if high_conf_count < 6:
        return True

    return False


def is_180_significantly_better(score_0: float, score_180: float) -> bool:
    """Decide whether 180° rotation is decisively superior to 0°.

    Requires:
    - 180° score must be reasonably high (at least 8.0)
    - 180° score must exceed 0° score by at least 35%
    - 180° score must exceed 0° score by an absolute margin of at least 4.0
    """
    if score_180 < 8.0:
        return False
    return score_180 > (score_0 * 1.35) and (score_180 - score_0) >= 4.0


# =====================================================================
# Coordinate Mapping Helpers (Processed <-> Original Space)
# =====================================================================

def map_point_from_processed_to_original(
    point: Point,
    original_dims: tuple[int, int],  # (width, height)
    processed_dims: tuple[int, int],  # (width, height)
    rotation: int = 0,
) -> Point:
    """Map a point from processed image space back to original image coordinates."""
    x, y = float(point[0]), float(point[1])
    proc_w, proc_h = processed_dims
    orig_w, orig_h = original_dims

    if proc_w <= 0 or proc_h <= 0 or orig_w <= 0 or orig_h <= 0:
        return (x, y)

    # 1. Reverse rotation if applied
    if rotation == 180:
        x = proc_w - 1.0 - x
        y = proc_h - 1.0 - y

    # 2. Reverse scaling
    scale_x = orig_w / proc_w
    scale_y = orig_h / proc_h

    orig_x = max(0.0, min(float(orig_w), x * scale_x))
    orig_y = max(0.0, min(float(orig_h), y * scale_y))

    return (round(orig_x, 2), round(orig_y, 2))


def map_box_from_processed_to_original(
    box: BoundingBox,
    original_dims: tuple[int, int],
    processed_dims: tuple[int, int],
    rotation: int = 0,
) -> BoundingBox:
    """Map a four-point bounding box from processed coordinates back to original coordinates."""
    mapped = tuple(
        map_point_from_processed_to_original(pt, original_dims, processed_dims, rotation)
        for pt in box
    )
    if len(mapped) == 4:
        return (mapped[0], mapped[1], mapped[2], mapped[3])
    return box
