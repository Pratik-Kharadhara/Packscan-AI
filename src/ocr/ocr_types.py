"""Core data types for OCR detections and coordinates."""

from __future__ import annotations

from typing import TypeAlias
from pydantic import BaseModel, Field, field_validator

Point: TypeAlias = tuple[float, float]


class OCRDetection(BaseModel):
    """One text region reported by the OCR engine."""

    text: str = Field(min_length=1)
    confidence: float = Field(ge=0.0, le=1.0)
    bounding_box: tuple[Point, Point, Point, Point]

    @field_validator("bounding_box")
    @classmethod
    def validate_box_has_area(cls, box: tuple[Point, Point, Point, Point]) -> tuple[Point, Point, Point, Point]:
        if len(box) != 4:
            raise ValueError("An OCR bounding box must contain exactly four points.")
        return box
