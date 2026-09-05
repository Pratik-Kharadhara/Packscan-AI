"""Internal helpers shared by focused declaration detectors."""

from __future__ import annotations

import re

from src.detection.base_detector import DetectedField
from src.ocr.ocr_service import OCRDetection


def detected_field(
    field: str,
    detection: OCRDetection,
    value: str,
    note: str,
) -> DetectedField:
    """Build a single-line evidence candidate from one OCR region."""

    return DetectedField(
        field=field,
        found=True,
        value=value,
        matched_text=detection.text,
        confidence=detection.confidence,
        bounding_boxes=[detection.bounding_box],
        notes=[note],
    )


def first_match(pattern: re.Pattern[str], text: str) -> str | None:
    """Return trimmed matching text, if present."""

    match = pattern.search(text)
    return match.group(0).strip() if match else None
