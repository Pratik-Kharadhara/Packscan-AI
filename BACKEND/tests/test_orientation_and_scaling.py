"""Regression tests for orientation handling, coordinate mapping, and pipeline fixes."""

from __future__ import annotations

from typing import Any
import numpy as np
import pytest
from fastapi import HTTPException

from config import DEFAULT_OCR_MAG_RATIO
from server import extract_percent_boxes
from src.detection._helpers import compute_evidence_confidence, detected_field
from src.detection.base_detector import DetectedField
from src.ocr.ocr_service import OCRDetection, OCRResult, OCRService
from src.pipeline.analysis_pipeline import AnalysisPipeline
from src.preprocessing.image_preprocessor import (
    ImagePreprocessor,
    PreprocessingOptions,
    compute_orientation_score,
    is_180_significantly_better,
    map_box_from_processed_to_original,
    map_point_from_processed_to_original,
    should_evaluate_180,
)


def _make_detection(text: str, confidence: float = 0.9, box: tuple | None = None) -> OCRDetection:
    return OCRDetection(
        text=text,
        confidence=confidence,
        bounding_box=box or ((10.0, 10.0), (100.0, 10.0), (100.0, 40.0), (10.0, 40.0)),
    )


# =====================================================================
# 1. Orientation Tests
# =====================================================================

def test_0_degree_strong_image_remains_0_degrees() -> None:
    """Upright image with strong text should not trigger or select 180° rotation."""
    detections = [
        _make_detection("Tata Salt Vacuum Evaporated", 0.95),
        _make_detection("Net Quantity: 1 kg", 0.92),
        _make_detection("Pkd Date: Aug/2026", 0.88),
        _make_detection("MRP Rs. 28.00 incl of all taxes", 0.94),
        _make_detection("Manufactured by: Tata Consumer Products", 0.89),
        _make_detection("Customer Care: 1800-108-4488", 0.87),
        _make_detection("Batch No: B12345", 0.85),
        _make_detection("Store in cool and dry place", 0.82),
        _make_detection("Ingredients: Edible common salt", 0.91),
        _make_detection("FSSAI Lic No: 10014022002759", 0.86),
    ]
    ocr_result = OCRResult(detections=detections)

    # Strong 0° OCR does not need 180° evaluation
    assert should_evaluate_180(ocr_result) is False

    score_0 = compute_orientation_score(ocr_result)
    assert score_0 > 20.0


def test_180_degree_image_triggers_evaluation_and_selects_180() -> None:
    """Poor 0° OCR triggers 180° evaluation and decisively selects 180° when score improves."""
    # 0° upside-down noise: very few tokens, mostly low-confidence fragments
    poor_detections_0 = [
        _make_detection(".~", 0.18),
        _make_detection("6Z/W", 0.22),
        _make_detection("...", 0.12),
    ]
    ocr_0 = OCRResult(detections=poor_detections_0)

    assert should_evaluate_180(ocr_0) is True
    score_0 = compute_orientation_score(ocr_0)

    # 180° upright text: rich, legible, high confidence
    good_detections_180 = [
        _make_detection("TATA SALT", 0.96),
        _make_detection("VACUUM EVAPORATED IODIZED SALT", 0.91),
        _make_detection("NET QUANTITY 1 kg", 0.93),
        _make_detection("MRP Rs. 28.00 INCL OF ALL TAXES", 0.95),
        _make_detection("DATE OF PACKAGING: AUG/26", 0.88),
        _make_detection("MANUFACTURED BY TATA CONSUMER PRODUCTS LTD", 0.92),
        _make_detection("CUSTOMER CARE: 1800 108 4488", 0.85),
    ]
    ocr_180 = OCRResult(detections=good_detections_180)
    score_180 = compute_orientation_score(ocr_180)

    assert is_180_significantly_better(score_0, score_180) is True


class DualOrientationReader:
    """Mock reader simulating an upside-down image that is legible only at 180°."""

    def readtext(self, image: Any, *, detail: int, paragraph: bool, **kwargs: Any) -> list[Any]:
        # Check if the image has been rotated 180° by checking top-left vs bottom-right pixel marker
        # In our test setup, pixel (0, 0) == 200 at 0°, but pixel (0, 0) == 50 after 180° rotation
        if image[0, 0, 0] == 50:
            # 180° oriented: clean text
            return [
                ([[10, 10], [200, 10], [200, 40], [10, 40]], "Product: Table Salt", 0.92),
                ([[10, 50], [200, 50], [200, 80], [10, 80]], "Net Qty: 1 kg", 0.89),
                ([[10, 90], [200, 90], [200, 120], [10, 120]], "MRP Rs. 25", 0.94),
                ([[10, 130], [200, 130], [200, 160], [10, 160]], "Mfd: 08/2026", 0.87),
                ([[10, 170], [200, 170], [200, 200], [10, 200]], "Manufactured by: Salt Co", 0.90),
                ([[10, 210], [200, 210], [200, 240], [10, 240]], "Customer Care: 1800123456", 0.88),
            ]
        # 0° un-rotated: garbled noise
        return [
            ([[10, 10], [50, 10], [50, 30], [10, 30]], "...^", 0.15),
        ]


def test_pipeline_selects_180_degrees_when_initial_ocr_is_poor() -> None:
    """Pipeline autonomously selects 180° rotation when 0° is illegible."""
    img = np.full((600, 800, 3), 100, dtype=np.uint8)
    img[0, 0] = [200, 200, 200]  # top-left marker
    img[-1, -1] = [50, 50, 50]   # bottom-right marker (becomes top-left at 180°)

    ocr_service = OCRService(reader=DualOrientationReader())
    pipeline = AnalysisPipeline(ocr_service=ocr_service, auto_orientation=True)

    result = pipeline.analyze_package(img)

    assert result.preprocessing.selected_rotation == 180
    assert "rotate_180" in result.preprocessing.operations
    assert result.detected_fields["product_identity"].found is True
    assert result.detected_fields["mrp"].found is True


# =====================================================================
# 2. Coordinate Mapping Tests
# =====================================================================

def test_coordinate_mapping_after_resize() -> None:
    """Box in downscaled (1000x500) space maps accurately back to original (2000x1000) space."""
    orig_dims = (2000, 1000)  # width, height
    proc_dims = (1000, 500)

    # Point at (200, 100) in processed space
    orig_pt = map_point_from_processed_to_original((200.0, 100.0), orig_dims, proc_dims, rotation=0)
    assert orig_pt == (400.0, 200.0)

    # Bounding box mapping
    box = ((100.0, 50.0), (300.0, 50.0), (300.0, 150.0), (100.0, 150.0))
    mapped_box = map_box_from_processed_to_original(box, orig_dims, proc_dims, rotation=0)
    assert mapped_box == ((200.0, 100.0), (600.0, 100.0), (600.0, 300.0), (200.0, 300.0))


def test_coordinate_mapping_after_180_rotation() -> None:
    """Box in 180°-rotated space correctly inverts coordinates back to original unrotated space."""
    dims = (1000, 1000)  # square image for simplicity
    # Point at top-left (10, 20) in 180° rotated image was near bottom-right in original 0° image
    orig_pt = map_point_from_processed_to_original((10.0, 20.0), dims, dims, rotation=180)
    assert orig_pt == (989.0, 979.0)


def test_percentage_box_extraction_uses_processed_dimensions() -> None:
    """extract_percent_boxes must divide by processed dimensions, not original, to prevent squashing."""
    field_data = {
        "mrp": DetectedField(
            field="mrp",
            found=True,
            value="Rs. 28.00",
            confidence=0.95,
            bounding_boxes=[((400.0, 200.0), (800.0, 200.0), (800.0, 300.0), (400.0, 300.0))],
        )
    }
    proc_w = 1600
    proc_h = 1200

    boxes = extract_percent_boxes(field_data, proc_w, proc_h)
    assert len(boxes) == 1
    box = boxes[0]

    # 400 / 1600 = 25.0%
    assert box["x"] == 25.0
    # 200 / 1200 = 16.67%
    assert box["y"] == 16.67
    # 400 / 1600 = 25.0%
    assert box["width"] == 25.0
    # 100 / 1200 = 8.33%
    assert box["height"] == 8.33


# =====================================================================
# 3. Grouped-Line Confidence Tests
# =====================================================================

def test_grouped_line_confidence_uses_matched_value_token() -> None:
    """Field confidence should reflect the evidence token ('AuG/26') rather than prefix ('Date of')."""
    tokens = [
        _make_detection("Date of", 0.35),
        _make_detection("Packaging:", 0.40),
        _make_detection("AuG/26", 0.95),
    ]

    # Compute evidence confidence for value "AuG/26"
    conf = compute_evidence_confidence(tokens, "AuG/26", default_confidence=0.35)
    assert conf == 0.95

    # Build detected field using detected_field()
    field = detected_field(
        "manufacture_date",
        detection=tokens[0],  # first token was passed as detection
        value="AuG/26",
        note="Packaging date detected.",
        source_detections=tokens,
    )
    assert field.confidence == 0.95


def test_grouped_line_confidence_for_mrp() -> None:
    """MRP confidence uses the numeric price token confidence rather than statutory tax text."""
    tokens = [
        _make_detection("MRP", 0.91),
        _make_detection("Rs. 28.00", 0.96),
        _make_detection("(incl. of all taxes)", 0.62),
    ]

    conf = compute_evidence_confidence(tokens, "Rs. 28.00", default_confidence=0.91)
    assert conf == 0.96


# =====================================================================
# 4. Preprocessing & RGB Preservation Tests
# =====================================================================

def test_preprocessing_delivers_3_channel_rgb_by_default() -> None:
    """EasyOCR receives clean 3-channel RGB image by default without universal grayscale/CLAHE."""
    bgr_image = np.full((300, 400, 3), 120, dtype=np.uint8)
    bgr_image[:, :, 0] = 50   # Blue
    bgr_image[:, :, 2] = 200  # Red

    res = ImagePreprocessor().preprocess(bgr_image)

    # 3 channels preserved
    assert res.processed_image.ndim == 3
    assert res.processed_image.shape == (300, 400, 3)
    assert "rgb_conversion" in res.operations
    assert "grayscale" not in res.operations
    assert "clahe_contrast" not in res.operations

    # Color check: Blue and Red swapped to RGB
    assert res.processed_image[0, 0, 0] == 200  # Red is first in RGB
    assert res.processed_image[0, 0, 2] == 50   # Blue is third in RGB


def test_configurable_mag_ratio_on_ocr_service() -> None:
    """mag_ratio is exposed, defaults to DEFAULT_OCR_MAG_RATIO (1.3), and configurable."""
    service_default = OCRService()
    assert service_default.mag_ratio == DEFAULT_OCR_MAG_RATIO

    service_custom = OCRService(mag_ratio=1.4)
    assert service_custom.mag_ratio == 1.4


# =====================================================================
# 5. Decode Failure & Robustness Tests
# =====================================================================

import asyncio
import io
from fastapi import UploadFile
from server import scan_package


def test_server_rejects_undecodable_image_with_http_400() -> None:
    """Invalid image file returns HTTP 400 client error instead of analyzing a dummy black image."""
    corrupt_bytes = b"This is not a real image file."
    up_file = UploadFile(filename="corrupt.jpg", file=io.BytesIO(corrupt_bytes))

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(scan_package(file=up_file))

    assert exc_info.value.status_code == 400
    assert "Unable to decode image file" in exc_info.value.detail or "valid" in exc_info.value.detail


def test_server_rejects_empty_upload() -> None:
    """Empty file upload returns HTTP 400 without falling back to black image."""
    up_file = UploadFile(filename="empty.jpg", file=io.BytesIO(b""))

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(scan_package(file=up_file))

    assert exc_info.value.status_code == 400


def test_raw_ocr_detections_and_preprocessing_preserved_in_result() -> None:
    """Diagnostic audit metadata (raw OCR, rotation, processed dimensions) are available."""
    import cv2
    img = np.full((100, 100, 3), 200, dtype=np.uint8)
    _, encoded = cv2.imencode(".jpg", img)

    up_file = UploadFile(filename="test_package.jpg", file=io.BytesIO(encoded.tobytes()))
    data = asyncio.run(scan_package(file=up_file))

    assert "preprocessing" in data
    assert "processedWidth" in data["preprocessing"]
    assert "processedHeight" in data["preprocessing"]
    assert "selectedRotation" in data["preprocessing"]
    assert "rawOcrDetections" in data
