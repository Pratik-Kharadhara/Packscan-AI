"""EasyOCR adapter that returns OCR observations without business decisions."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Protocol, TypeAlias

import numpy as np
from pydantic import BaseModel, Field, field_validator, model_validator

from src.ocr.ocr_normalizer import NormalizedDetection, normalize_detections
from src.ocr.ocr_types import OCRDetection, Point
from src.ocr.spatial_grouping import GroupedLine, SpatialGrouper

ImageInput: TypeAlias = str | Path | np.ndarray


class OCRServiceError(RuntimeError):
    """Raised when OCR cannot be performed on the supplied image."""


class OCRResult(BaseModel):
    """Engine-neutral OCR result enriched with normalized and spatially grouped lines."""

    detections: list[OCRDetection]
    normalized_detections: list[NormalizedDetection] = Field(default_factory=list)
    grouped_lines: list[GroupedLine] = Field(default_factory=list)
    stacked_lines: list[GroupedLine] = Field(default_factory=list)

    @model_validator(mode="after")
    def populate_spatial_groups_if_needed(self) -> "OCRResult":
        if self.detections and not self.normalized_detections:
            self.normalized_detections = normalize_detections(self.detections)
        if self.normalized_detections and not self.grouped_lines:
            grouper = SpatialGrouper()
            self.grouped_lines = grouper.group_lines(self.normalized_detections)
            self.stacked_lines = grouper.generate_stacked_pairs(self.grouped_lines)
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

    def readtext(self, image: Any, *, detail: int, paragraph: bool) -> list[Any]: ...


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
    ) -> None:
        self._languages = languages
        self._use_gpu = use_gpu
        self._reader = reader
        self._model_storage_directory = (
            model_storage_directory
            if model_storage_directory is not None
            else Path(__file__).resolve().parents[2] / "storage" / "ocr_models"
        )

    def extract(self, image: ImageInput) -> OCRResult:
        """Extract text regions, confidence scores, and bounding boxes from an image."""

        source = self._validate_image_input(image)
        try:
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
