"""EasyOCR adapter that returns OCR observations without business decisions."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Protocol, TypeAlias

import numpy as np
from pydantic import BaseModel, Field, field_validator, model_validator

from config import (
    DEFAULT_LINK_THRESHOLD,
    DEFAULT_LOW_TEXT,
    DEFAULT_OCR_MAG_RATIO,
    DEFAULT_TEXT_THRESHOLD,
)
from src.ocr.ocr_normalizer import NormalizedDetection, normalize_detections
from src.ocr.ocr_types import OCRDetection, Point
from src.ocr.spatial_grouping import GroupedLine, SpatialGrouper

ImageInput: TypeAlias = str | Path | np.ndarray


def compute_box_iou(box_a: tuple[Point, Point, Point, Point], box_b: tuple[Point, Point, Point, Point]) -> float:
    """Compute axis-aligned Intersection over Union (IoU) of two bounding boxes."""
    xa1, ya1 = min(p[0] for p in box_a), min(p[1] for p in box_a)
    xa2, ya2 = max(p[0] for p in box_a), max(p[1] for p in box_a)
    xb1, yb1 = min(p[0] for p in box_b), min(p[1] for p in box_b)
    xb2, yb2 = max(p[0] for p in box_b), max(p[1] for p in box_b)

    inter_w = max(0.0, min(xa2, xb2) - max(xa1, xb1))
    inter_h = max(0.0, min(ya2, yb2) - max(ya1, yb1))
    inter_area = inter_w * inter_h
    if inter_area <= 0.0:
        return 0.0

    area_a = max(0.0, xa2 - xa1) * max(0.0, ya2 - ya1)
    area_b = max(0.0, xb2 - xb1) * max(0.0, yb2 - yb1)
    union_area = area_a + area_b - inter_area
    return inter_area / union_area if union_area > 0 else 0.0


def deduplicate_detections(
    primary: list[OCRDetection],
    secondary: list[OCRDetection],
    iou_threshold: float = 0.40,
) -> list[OCRDetection]:
    """Merge detections from multiple OCR passes, deduplicating spatial overlaps intelligently."""
    merged = list(primary)
    for sec in secondary:
        matched_idx = -1
        max_iou = 0.0
        for idx, pri in enumerate(merged):
            iou = compute_box_iou(sec.bounding_box, pri.bounding_box)
            if iou > max_iou:
                max_iou = iou
                matched_idx = idx

        if max_iou >= iou_threshold and matched_idx >= 0:
            # Overlap found: retain detection with higher confidence or longer clean text
            if sec.confidence > merged[matched_idx].confidence and len(sec.text.strip()) >= len(merged[matched_idx].text.strip()):
                merged[matched_idx] = sec
        else:
            # New distinct detection
            merged.append(sec)
    return merged


class OCRServiceError(RuntimeError):
    """Raised when OCR cannot be performed on the supplied image."""


class OCRResult(BaseModel):
    """Engine-neutral OCR result enriched with normalized and spatially grouped lines."""

    detections: list[OCRDetection]
    normalized_detections: list[NormalizedDetection] = Field(default_factory=list)
    grouped_lines: list[GroupedLine] = Field(default_factory=list)
    stacked_lines: list[GroupedLine] = Field(default_factory=list)
    address_blocks: list[GroupedLine] = Field(default_factory=list)

    @model_validator(mode="after")
    def populate_spatial_groups_if_needed(self) -> "OCRResult":
        if self.detections and not self.normalized_detections:
            self.normalized_detections = normalize_detections(self.detections)
        if self.normalized_detections and not self.grouped_lines:
            grouper = SpatialGrouper()
            self.grouped_lines = grouper.group_lines(self.normalized_detections)
            self.stacked_lines = grouper.generate_stacked_pairs(self.grouped_lines)
            self.address_blocks = grouper.generate_address_blocks(self.grouped_lines)
        elif self.grouped_lines and not self.address_blocks:
            grouper = SpatialGrouper()
            self.address_blocks = grouper.generate_address_blocks(self.grouped_lines)
        return self

    @property
    def full_text(self) -> str:
        """Return detected text in EasyOCR reading order."""
        return "\n".join(detection.text for detection in self.detections)

    @property
    def lines_text(self) -> list[str]:
        """Return text of spatially grouped lines."""
        return [line.text for line in self.grouped_lines]


class EasyOCRReader(Protocol):
    """Minimal EasyOCR reader contract, enabling lightweight unit tests."""

    def readtext(self, image: Any, *, detail: int, paragraph: bool, **kwargs: Any) -> list[Any]: ...


class OCRService:
    """Run EasyOCR and normalize its raw output.

    The reader is initialized lazily because EasyOCR model loading is expensive and can
    download model files on first use. No detector, rule, or legal-compliance logic
    belongs in this service.
    """

    def __init__(
        self,
        languages: tuple[str, ...] = ("en",),
        use_gpu: bool = False,
        reader: EasyOCRReader | None = None,
        model_storage_directory: Path | None = None,
        mag_ratio: float = DEFAULT_OCR_MAG_RATIO,
        text_threshold: float = DEFAULT_TEXT_THRESHOLD,
        low_text: float = DEFAULT_LOW_TEXT,
        link_threshold: float = DEFAULT_LINK_THRESHOLD,
    ) -> None:
        self._languages = languages
        self._use_gpu = use_gpu
        self._reader = reader
        self._model_storage_directory = (
            model_storage_directory
            if model_storage_directory is not None
            else Path(__file__).resolve().parents[2] / "storage" / "ocr_models"
        )
        self._mag_ratio = mag_ratio
        self._text_threshold = text_threshold
        self._low_text = low_text
        self._link_threshold = link_threshold

    @property
    def mag_ratio(self) -> float:
        return self._mag_ratio

    @property
    def text_threshold(self) -> float:
        return self._text_threshold

    @property
    def low_text(self) -> float:
        return self._low_text

    @property
    def link_threshold(self) -> float:
        return self._link_threshold

    def extract(self, image: ImageInput) -> OCRResult:
        """Extract text regions, confidence scores, and bounding boxes from an image."""

        source = self._validate_image_input(image)
        try:
            try:
                raw_detections = self._get_reader().readtext(
                    source,
                    detail=1,
                    paragraph=False,
                    mag_ratio=self._mag_ratio,
                    text_threshold=self._text_threshold,
                    low_text=self._low_text,
                    link_threshold=self._link_threshold,
                )
            except TypeError:
                # Reader implementation (e.g. unit test FakeReader) may not accept all kwargs
                try:
                    raw_detections = self._get_reader().readtext(
                        source,
                        detail=1,
                        paragraph=False,
                        mag_ratio=self._mag_ratio,
                    )
                except TypeError:
                    raw_detections = self._get_reader().readtext(
                        source,
                        detail=1,
                        paragraph=False,
                    )
        except Exception as error:  # EasyOCR exposes several backend-specific errors.
            raise OCRServiceError(f"OCR processing failed: {error}") from error

        detections = [
            self._normalize_detection(raw_detection)
            for raw_detection in raw_detections
            if len(raw_detection) >= 3 and str(raw_detection[1]).strip()
        ]
        return OCRResult(detections=detections)

    def _get_reader(self) -> EasyOCRReader:
        if self._reader is None:
            try:
                import easyocr

                self._reader = easyocr.Reader(
                    list(self._languages),
                    gpu=self._use_gpu,
                    model_storage_directory=str(self._model_storage_directory),
                    verbose=False,
                )
            except Exception as error:
                raise OCRServiceError(
                    "EasyOCR could not be initialized. Install project dependencies and "
                    "confirm the required OCR model files are available."
                ) from error
        return self._reader

    @staticmethod
    def _validate_image_input(image: ImageInput) -> str | np.ndarray:
        if isinstance(image, Path):
            image = str(image)
        if isinstance(image, str):
            if not Path(image).is_file():
                raise OCRServiceError(f"Image file does not exist: {image}")
            return image
        if isinstance(image, np.ndarray):
            if image.size == 0:
                raise OCRServiceError("Image array is empty.")
            return image
        raise OCRServiceError("Image must be a file path or a NumPy image array.")

    @staticmethod
    def _normalize_detection(raw_detection: Any) -> OCRDetection:
        try:
            raw_box, raw_text, raw_confidence = raw_detection[:3]
            box = tuple((float(point[0]), float(point[1])) for point in raw_box)
            if len(box) != 4:
                raise ValueError("expected four bounding-box points")
            return OCRDetection(
                text=str(raw_text).strip(),
                confidence=float(raw_confidence),
                bounding_box=box,
            )
        except (IndexError, TypeError, ValueError) as error:
            raise OCRServiceError(
                f"OCR engine returned an invalid detection: {raw_detection!r}"
            ) from error
