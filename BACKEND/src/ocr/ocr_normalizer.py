"""Dedicated OCR text normalization layer.

Cleans and standardizes raw OCR observations before spatial grouping and field detection.
Preserves raw text for auditability and evidence provenance.
"""

from __future__ import annotations

import re
import unicodedata
from pydantic import BaseModel, Field

from src.ocr.ocr_types import OCRDetection, Point


class NormalizedDetection(BaseModel):
    """An OCR detection enriched with standardized text and preserved raw provenance."""

    text: str = Field(min_length=1)  # Normalized text
    raw_text: str  # Original raw OCR text
    confidence: float = Field(ge=0.0, le=1.0)
    bounding_box: tuple[Point, Point, Point, Point]

    @property
    def box_height(self) -> float:
        """Approximate bounding box height."""
        ys = [p[1] for p in self.bounding_box]
        return max(ys) - min(ys)

    @property
    def box_width(self) -> float:
        """Approximate bounding box width."""
        xs = [p[0] for p in self.bounding_box]
        return max(xs) - min(xs)

    @property
    def center_y(self) -> float:
        """Vertical center coordinate."""
        ys = [p[1] for p in self.bounding_box]
        return sum(ys) / len(ys)

    @property
    def center_x(self) -> float:
        """Horizontal center coordinate."""
        xs = [p[0] for p in self.bounding_box]
        return sum(xs) / len(xs)

    @property
    def left(self) -> float:
        return min(p[0] for p in self.bounding_box)

    @property
    def right(self) -> float:
        return max(p[0] for p in self.bounding_box)

    @property
    def top(self) -> float:
        return min(p[1] for p in self.bounding_box)

    @property
    def bottom(self) -> float:
        return max(p[1] for p in self.bounding_box)


# Common OCR merged or misspelled packaging phrases
PACKAGING_FIXES: list[tuple[re.Pattern[str], str]] = [
    # Tax declarations (Rule 3(m))
    (re.compile(r"\bincl[;:,.]*\s*of\s*all\s*taxes\b", re.IGNORECASE), "incl. of all taxes"),
    (re.compile(r"\bincl[;:,.]*\s*ofalltaxes\b", re.IGNORECASE), "incl. of all taxes"),
    (re.compile(r"\binclusive\s*ofalltaxes\b", re.IGNORECASE), "inclusive of all taxes"),
    (re.compile(r"\bincl[;:,.]*\s*taxes\b", re.IGNORECASE), "incl. of all taxes"),

    # Manufacturer / Supply chain roles
    (re.compile(r"\bmkt\s*[.;:,]*\s*by\b", re.IGNORECASE), "mkt by:"),
    (re.compile(r"\bmfg\s*[.;:,]*\s*by\b", re.IGNORECASE), "mfg by:"),
    (re.compile(r"\bmarketed\s*by\b", re.IGNORECASE), "marketed by:"),
    (re.compile(r"\bmanufactured\s*by\b", re.IGNORECASE), "manufactured by:"),
    (re.compile(r"\bpacked\s*by\b", re.IGNORECASE), "packed by:"),
    (re.compile(r"\bpkd\s*[.;:,]*\s*by\b", re.IGNORECASE), "pkd by:"),
    (re.compile(r"\bimported\s*by\b", re.IGNORECASE), "imported by:"),

    # Dates and batch
    (re.compile(r"\bdate\s*of\s*packaging\b", re.IGNORECASE), "date of packaging:"),
    (re.compile(r"\bdate\s*of\s*mfg\b", re.IGNORECASE), "date of mfg:"),
    (re.compile(r"\buse\s*before\b", re.IGNORECASE), "use before:"),
    (re.compile(r"\buse\s*by\b", re.IGNORECASE), "use by:"),
    (re.compile(r"\bbest\s*before\b", re.IGNORECASE), "best before:"),
    (re.compile(r"\bb\.?\s*no\b", re.IGNORECASE), "b.no:"),

    # Net quantity
    (re.compile(r"\bnet\s*qty\b", re.IGNORECASE), "net qty:"),
    (re.compile(r"\bnet\s*quantity\b", re.IGNORECASE), "net quantity:"),
    (re.compile(r"\bnet\s*wt\b", re.IGNORECASE), "net wt:"),
    (re.compile(r"\bnet\s*weight\b", re.IGNORECASE), "net weight:"),
]

# Ensure space between numeric quantities and standard units: 100g -> 100 g, 1kg -> 1 kg
UNIT_SPACING_REGEX = re.compile(
    r"\b(\d+(?:[.,]\d+)?)\s*(mg|g|gm|gms|kg|ml|l|litre|litres|pcs|units?)\b",
    re.IGNORECASE,
)


def normalize_text(text: str) -> str:
    """Standardize unicode characters, whitespace, and common packaging phrases."""
    if not text:
        return ""

    # 1. Unicode normalization (NFKC)
    normalized = unicodedata.normalize("NFKC", text)

    # 2. Standardize quotation marks and dashes
    normalized = re.sub(r'[\u201c\u201d\u201e\u201f"]', '"', normalized)
    normalized = re.sub(r"[\u2018\u2019\u201a\u201b']", "'", normalized)
    normalized = re.sub(r"[\u2013\u2014\u2015\u2212]", "-", normalized)

    # 3. Currency symbol normalization: preserve ₹, normalize INR / Rs / Rs.
    normalized = re.sub(r"\bRs\b[.:]?", "Rs.", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"\bINR\b[.:]?", "INR", normalized, flags=re.IGNORECASE)

    # 4. Standard packaging phrase normalization
    for pattern, replacement in PACKAGING_FIXES:
        normalized = pattern.sub(replacement, normalized)

    # 5. Unit spacing: e.g. "100g" -> "100 g", "1kg" -> "1 kg"
    normalized = UNIT_SPACING_REGEX.sub(r"\1 \2", normalized)

    # 6. Normalize multiple spaces
    normalized = re.sub(r"\s+", " ", normalized).strip()

    return normalized


def normalize_detection(detection: OCRDetection) -> NormalizedDetection:
    """Transform a raw OCRDetection into a NormalizedDetection."""
    cleaned = normalize_text(detection.text)
    return NormalizedDetection(
        text=cleaned if cleaned else detection.text,
        raw_text=detection.text,
        confidence=detection.confidence,
        bounding_box=detection.bounding_box,
    )


def normalize_detections(detections: list[OCRDetection]) -> list[NormalizedDetection]:
    """Batch normalize raw OCR detections."""
    return [normalize_detection(d) for d in detections if d.text.strip()]
