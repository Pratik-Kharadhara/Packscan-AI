"""Internal helpers shared by focused declaration detectors."""

from __future__ import annotations

import re
from typing import Any

from src.detection.base_detector import DetectedField
from src.ocr.ocr_service import OCRDetection
from src.ocr.ocr_types import Point


def compute_evidence_confidence(
    detections: list[Any] | tuple[Any, ...] | None,
    value: str,
    default_confidence: float = 0.85,
) -> float:
    """Compute confidence from the specific token(s) that match the value declaration.

    Avoids blindly inheriting the confidence of prefix tokens (e.g. 'Date of' or 'Rs.')
    when the actual statutory value (e.g. 'AuG/26' or '28.00') has distinct confidence evidence.
    """
    if not detections:
        return float(default_confidence)

    # 1. Extract alphanumeric tokens of length >= 2 from the value
    val_words = [w.lower() for w in re.findall(r"[a-zA-Z0-9]+", value) if len(w) >= 2]

    # Find detections whose text matches or contains any value words
    matching_confs: list[float] = []
    if val_words:
        for d in detections:
            d_text = getattr(d, "text", "").lower()
            d_conf = float(getattr(d, "confidence", default_confidence))
            if any(w in d_text for w in val_words):
                matching_confs.append(d_conf)

    if matching_confs:
        return round(sum(matching_confs) / len(matching_confs), 4)

    # 2. Check numeric sequences (e.g. day, month, year, or amount digits)
    digits = re.findall(r"\d+", value)
    if digits:
        for d in detections:
            d_text = getattr(d, "text", "")
            d_conf = float(getattr(d, "confidence", default_confidence))
            if any(dig in d_text for dig in digits):
                matching_confs.append(d_conf)
        if matching_confs:
            return round(sum(matching_confs) / len(matching_confs), 4)

    # 3. Fallback: compute average across all detections in the line
    all_confs = [float(getattr(d, "confidence", default_confidence)) for d in detections]
    if all_confs:
        return round(sum(all_confs) / len(all_confs), 4)

    return float(default_confidence)


def detected_field(
    field: str,
    detection: Any,
    value: str,
    note: str,
    *,
    confidence: float | None = None,
    source_detections: list[Any] | None = None,
    source_line: Any | None = None,
    raw_text: str | None = None,
    normalized_text: str | None = None,
    matched_pattern: str | None = None,
    role: str | None = None,
    sub_fields: dict[str, str] | None = None,
    rule_reference: str | None = None,
    bounding_boxes: list[tuple[Point, Point, Point, Point]] | None = None,
) -> DetectedField:
    """Build a rich evidence candidate from OCR regions retaining provenance and accurate confidence."""

    if bounding_boxes is not None:
        boxes = bounding_boxes
    elif hasattr(detection, "bounding_box"):
        boxes = [detection.bounding_box]
    elif hasattr(detection, "bounding_boxes"):
        boxes = detection.bounding_boxes
    else:
        boxes = []

    # Calculate evidence-based confidence
    if confidence is not None:
        final_conf = float(confidence)
    else:
        token_list = (
            source_detections
            or getattr(source_line, "detections", None)
            or getattr(detection, "detections", None)
        )
        base_conf = float(getattr(detection, "confidence", 0.85))
        final_conf = compute_evidence_confidence(token_list, value, base_conf)

    det_text = getattr(detection, "text", "")
    return DetectedField(
        field=field,
        found=True,
        value=value,
        matched_text=det_text,
        confidence=final_conf,
        bounding_boxes=boxes,
        notes=[note],
        raw_text=raw_text or det_text,
        normalized_text=normalized_text or det_text,
        matched_pattern=matched_pattern,
        role=role,
        sub_fields=sub_fields or {},
        rule_reference=rule_reference,
    )


def first_match(pattern: re.Pattern[str], text: str) -> str | None:
    """Return trimmed matching text, if present."""

    match = pattern.search(text)
    return match.group(0).strip() if match else None
