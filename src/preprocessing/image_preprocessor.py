"""Conservative and configurable image transformations for OCR."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import TypeAlias

import cv2
import numpy as np

from config import MAX_PREPROCESS_DIMENSION


ImageInput: TypeAlias = str | Path | np.ndarray


class ImagePreprocessingError(ValueError):
    """Raised when preprocessing receives an unreadable image."""


@dataclass(frozen=True)
class PreprocessingOptions:
    """Tunable transformations; advanced operations remain opt-in."""

    max_dimension: int = MAX_PREPROCESS_DIMENSION
    apply_contrast_enhancement: bool = True
    apply_denoising: bool = False
    apply_thresholding: bool = False


@dataclass(frozen=True)
class PreprocessingResult:
    """Original and transformed image arrays plus the applied operations."""

    original_image: np.ndarray
    processed_image: np.ndarray
    operations: tuple[str, ...]


class ImagePreprocessor:
    """Prepare an image for OCR without applying every transformation blindly."""

    def __init__(self, options: PreprocessingOptions | None = None) -> None:
        self._options = options or PreprocessingOptions()

    def preprocess(self, image: ImageInput) -> PreprocessingResult:
        """Resize when needed, then apply selected grayscale/contrast operations."""

        original = self._load_image(image)
        processed = original.copy()
        operations: list[str] = []

        processed, did_resize = self._resize_to_limit(processed)
        if did_resize:
            operations.append("resize")

        processed = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)
        operations.append("grayscale")

        if self._options.apply_contrast_enhancement:
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            processed = clahe.apply(processed)
            operations.append("clahe_contrast")

        if self._options.apply_denoising:
            processed = cv2.fastNlMeansDenoising(processed, None, h=8)
            operations.append("denoise")

        if self._options.apply_thresholding:
            processed = cv2.adaptiveThreshold(
                processed,
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
