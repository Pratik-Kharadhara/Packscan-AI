"""Shared contracts for OCR declaration detectors."""

from __future__ import annotations

from abc import ABC, abstractmethod

from pydantic import BaseModel, Field

from src.ocr.ocr_service import OCRResult, Point


class DetectedField(BaseModel):
    """Evidence candidate found by a declaration detector, retaining full provenance."""

    field: str
    found: bool
    value: str | None = None
    matched_text: str | None = None
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    bounding_boxes: list[tuple[Point, Point, Point, Point]] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)

    # Full provenance and statutory metadata (Suggestion 9)
    raw_text: str | None = None
    normalized_text: str | None = None
    matched_pattern: str | None = None
    role: str | None = None  # e.g. "manufacturer", "marketer", "packer", "importer"
    sub_fields: dict[str, str] = Field(default_factory=dict)
    rule_reference: str | None = None  # e.g. "Rule 6(1)(e)", "Rule 10"

    @classmethod
    def not_found(cls, field: str, note: str, rule_reference: str | None = None) -> "DetectedField":
        return cls(field=field, found=False, notes=[note], rule_reference=rule_reference)


class BaseDetector(ABC):
    """A focused detector that derives one declaration from structured OCR output."""

    field_name: str

    @abstractmethod
    def detect(self, ocr_result: OCRResult) -> DetectedField:
        """Return the strongest evidence candidate, or an explainable absence."""
