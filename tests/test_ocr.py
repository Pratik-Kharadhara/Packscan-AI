"""Unit tests for the OCR adapter without loading EasyOCR models."""

from __future__ import annotations

import numpy as np
import pytest

from src.ocr.ocr_service import OCRService, OCRServiceError


class FakeReader:
    def readtext(self, image: object, *, detail: int, paragraph: bool) -> list[object]:
        assert detail == 1
        assert paragraph is False
        return [
            (
                [[10, 20], [110, 20], [110, 50], [10, 50]],
                "MRP Rs. 45",
                0.96,
            ),
            (
                [[5, 60], [90, 60], [90, 82], [5, 82]],
                "Net Qty 500 g",
                0.88,
            ),
        ]


def test_extract_normalizes_easyocr_output() -> None:
    result = OCRService(reader=FakeReader()).extract(np.ones((20, 20, 3), dtype=np.uint8))

    assert result.full_text == "MRP Rs. 45\nNet Qty 500 g"
    assert result.detections[0].confidence == 0.96
    assert result.detections[0].bounding_box == (
        (10.0, 20.0),
        (110.0, 20.0),
        (110.0, 50.0),
        (10.0, 50.0),
    )


def test_extract_rejects_missing_image_path() -> None:
    with pytest.raises(OCRServiceError, match="does not exist"):
        OCRService(reader=FakeReader()).extract("missing-package-image.png")


def test_extract_rejects_empty_image_array() -> None:
    with pytest.raises(OCRServiceError, match="empty"):
        OCRService(reader=FakeReader()).extract(np.array([]))
