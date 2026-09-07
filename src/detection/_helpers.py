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
    *,
    raw_text: str | None = None,
    normalized_text: str | None = None,
    matched_pattern: str | None = None,
    role: str | None = None,
    sub_fields: dict[str, str] | None = None,
    rule_reference: str | None = None,
    bounding_boxes: list[tuple[Point, Point, Point, Point]] | None = None,
) -> DetectedField:
    """Build a rich evidence candidate from OCR regions retaining provenance."""

    boxes = bounding_boxes if bounding_boxes is not None else [detection.bounding_box]
    return DetectedField(
        field=field,
        found=True,
        value=value,
        matched_text=detection.text,
        confidence=detection.confidence,
        bounding_boxes=boxes,
        notes=[note],
        raw_text=raw_text or detection.text,
        normalized_text=normalized_text or detection.text,
        matched_pattern=matched_pattern,
        role=role,
        sub_fields=sub_fields or {},
        rule_reference=rule_reference,
    )


def first_match(pattern: re.Pattern[str], text: str) -> str | None:
    """Return trimmed matching text, if present."""

    match = pattern.search(text)
    return match.group(0).strip() if match else None
