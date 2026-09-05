"""Shared contracts for OCR declaration detectors."""

from __future__ import annotations

from abc import ABC, abstractmethod

from pydantic import BaseModel, Field

from src.ocr.ocr_service import OCRResult, Point


class DetectedField(BaseModel):
    """Evidence candidate found by a declaration detector, not a legal conclusion."""

    field: str
    found: bool
    value: str | None = None
    matched_text: str | None = None
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    bounding_boxes: list[tuple[Point, Point, Point, Point]] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)

    @classmethod
    def not_found(cls, field: str, note: str) -> "DetectedField":
        return cls(field=field, found=False, notes=[note])


class BaseDetector(ABC):
    """A focused detector that derives one declaration from structured OCR output."""

    field_name: str

    @abstractmethod
    def detect(self, ocr_result: OCRResult) -> DetectedField:
        """Return the strongest evidence candidate, or an explainable absence."""
