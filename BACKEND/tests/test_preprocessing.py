"""Tests for conservative OCR preprocessing."""

import numpy as np

from src.preprocessing.image_preprocessor import ImagePreprocessor, PreprocessingOptions


def test_preprocess_retains_original_and_resizes_large_images() -> None:
    original = np.full((2000, 1000, 3), 150, dtype=np.uint8)
    result = ImagePreprocessor(
        PreprocessingOptions(max_dimension=1000)
    ).preprocess(original)

    assert result.original_image.shape == (2000, 1000, 3)
    assert result.processed_image.shape == (1000, 500)
    assert result.operations == ("resize", "grayscale", "clahe_contrast")


def test_preprocess_can_skip_optional_contrast_transform() -> None:
    image = np.full((100, 100, 3), 150, dtype=np.uint8)
    result = ImagePreprocessor(
        PreprocessingOptions(apply_contrast_enhancement=False)
    ).preprocess(image)

    assert result.processed_image.ndim == 2
    assert result.operations == ("grayscale",)
