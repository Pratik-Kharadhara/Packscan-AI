"""End-to-end orchestration for first-level packaged-commodity screening."""

from __future__ import annotations

from pathlib import Path
from typing import TypeAlias

import numpy as np
from pydantic import BaseModel

from src.detection.base_detector import DetectedField
from src.detection.field_detector import FieldDetector
from src.ocr.ocr_service import OCRResult, OCRService, OCRServiceError
from src.preprocessing.image_preprocessor import ImagePreprocessor, PreprocessingResult
from src.quality.image_quality import ImageQualityAssessor, ImageQualityResult
from src.rules.compliance_engine import ComplianceEngine, ComplianceResult


ImageInput: TypeAlias = str | Path | np.ndarray


class PreprocessingSummary(BaseModel):
    """Serializable summary of preprocessing while image arrays remain in memory."""

    original_width: int
    original_height: int
    processed_width: int
    processed_height: int
    operations: list[str]

    @classmethod
    def from_result(cls, result: PreprocessingResult) -> "PreprocessingSummary":
        original_height, original_width = result.original_image.shape[:2]
        processed_height, processed_width = result.processed_image.shape[:2]
        return cls(
            original_width=original_width,
            original_height=original_height,
            processed_width=processed_width,
            processed_height=processed_height,
            operations=list(result.operations),
        )


class PackageAnalysisResult(BaseModel):
    """Complete, serializable evidence and screening result for one package image."""

    image_path: str | None
    quality: ImageQualityResult
    preprocessing: PreprocessingSummary
    ocr: OCRResult
    detected_fields: dict[str, DetectedField]
    compliance: ComplianceResult
    processing_warnings: list[str]


class AnalysisPipeline:
    """Orchestrate components without embedding OCR, detector, or rule logic."""

    def __init__(
        self,
        quality_assessor: ImageQualityAssessor | None = None,
        preprocessor: ImagePreprocessor | None = None,
        ocr_service: OCRService | None = None,
        field_detector: FieldDetector | None = None,
        compliance_engine: ComplianceEngine | None = None,
    ) -> None:
        self._quality_assessor = quality_assessor or ImageQualityAssessor()
        self._preprocessor = preprocessor or ImagePreprocessor()
        self._ocr_service = ocr_service or OCRService()
        self._field_detector = field_detector or FieldDetector()
        self._compliance_engine = compliance_engine or ComplianceEngine()

    def analyze_package(self, image: ImageInput) -> PackageAnalysisResult:
        """Run quality, preprocessing, OCR, detection, and configurable screening."""

        quality = self._quality_assessor.assess(image)
        preprocessing_result = self._preprocessor.preprocess(image)
        processing_warnings: list[str] = []

        try:
            ocr_result = self._ocr_service.extract(preprocessing_result.processed_image)
        except OCRServiceError as error:
            # No OCR result cannot establish package non-compliance.
            ocr_result = OCRResult(detections=[])
            processing_warnings.append(f"OCR could not be completed: {error}")

        detected_fields = self._field_detector.detect_all(ocr_result)
        compliance = self._compliance_engine.evaluate(quality, detected_fields)

        return PackageAnalysisResult(
            image_path=str(image) if isinstance(image, (str, Path)) else None,
            quality=quality,
            preprocessing=PreprocessingSummary.from_result(preprocessing_result),
            ocr=ocr_result,
            detected_fields=detected_fields,
            compliance=compliance,
            processing_warnings=processing_warnings,
        )


def analyze_package(image: ImageInput) -> PackageAnalysisResult:
    """Convenience function for scripts and the future Streamlit application."""

    return AnalysisPipeline().analyze_package(image)
