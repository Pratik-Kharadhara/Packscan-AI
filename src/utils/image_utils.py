"""Common image processing, format conversion, and filesystem helpers."""

from __future__ import annotations

from pathlib import Path
from typing import TypeAlias

import cv2
import numpy as np

ImageInput: TypeAlias = str | Path | np.ndarray


def load_image(image: ImageInput) -> np.ndarray:
    """Load an image from a file path or validate an existing NumPy array as BGR."""

    if isinstance(image, Path):
        image = str(image)

    if isinstance(image, str):
        decoded = cv2.imread(image)
        if decoded is None:
            raise ValueError(f"Unable to read image file: {image}")
        return decoded

    if isinstance(image, np.ndarray) and image.size:
        if image.ndim == 2:
            return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        if image.ndim == 3:
            return image
        raise ValueError("Image array must have two or three dimensions.")

    raise ValueError("Image must be a non-empty file path or NumPy array.")


def bgr_to_rgb(image: np.ndarray) -> np.ndarray:
    """Convert an OpenCV BGR image array to RGB for Streamlit/PIL display."""

    if image.ndim == 2:
        return cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def rgb_to_bgr(image: np.ndarray) -> np.ndarray:
    """Convert an RGB image array to OpenCV BGR."""

    if image.ndim == 2:
        return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    return cv2.cvtColor(image, cv2.COLOR_RGB2BGR)


def save_image(image: np.ndarray, output_path: str | Path) -> Path:
    """Save a BGR or grayscale image array to disk, creating parent directories if needed."""

    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    success = cv2.imwrite(str(path), image)
    if not success:
        raise IOError(f"Failed to write image to {path}")
    return path
