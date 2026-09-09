"""End-to-end orchestration for first-level packaged-commodity screening."""

from __future__ import annotations

from pathlib import Path
from typing import TypeAlias

import cv2
import numpy as np
from pydantic import BaseModel

from config import DEFAULT_AUTO_ORIENTATION, ENABLE_SECONDARY_OCR_PASS
from src.detection.base_detector import DetectedField
from src.detection.field_detector import FieldDetector
from src.ocr.ocr_service import OCRResult, OCRService, OCRServiceError, deduplicate_detections
from src.preprocessing.image_preprocessor import (
    ImagePreprocessor,
    PreprocessingResult,
    compute_orientation_score,
    is_180_significantly_better,
    should_evaluate_180,
)
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
    selected_rotation: int = 0

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
            selected_rotation=result.selected_rotation,
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
        auto_orientation: bool = DEFAULT_AUTO_ORIENTATION,
        enable_secondary_pass: bool = ENABLE_SECONDARY_OCR_PASS,
    ) -> None:
        self._quality_assessor = quality_assessor or ImageQualityAssessor()
        self._preprocessor = preprocessor or ImagePreprocessor()
        self._ocr_service = ocr_service or OCRService()
        self._field_detector = field_detector or FieldDetector()
        self._compliance_engine = compliance_engine or ComplianceEngine()
        self._auto_orientation = auto_orientation
        self._enable_secondary_pass = enable_secondary_pass

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

        # Automatic 180° orientation check: evaluate only when 0° OCR is poor to avoid doubling cost
        if self._auto_orientation and ocr_result.detections:
            if should_evaluate_180(ocr_result):
                try:
                    rotated_img = cv2.rotate(preprocessing_result.processed_image, cv2.ROTATE_180)
                    ocr_180 = self._ocr_service.extract(rotated_img)
                    score_0 = compute_orientation_score(ocr_result)
                    score_180 = compute_orientation_score(ocr_180)

                    if is_180_significantly_better(score_0, score_180):
                        ocr_result = ocr_180
                        ops = list(preprocessing_result.operations) + ["rotate_180"]
                        preprocessing_result = PreprocessingResult(
                            original_image=preprocessing_result.original_image,
                            processed_image=rotated_img,
                            operations=tuple(ops),
                            selected_rotation=180,
                        )
                except Exception as error:
                    processing_warnings.append(f"Orientation evaluation skipped: {error}")

        # Conditional secondary OCR pass: only evaluate if coverage/confidence is low and image was challenging
        if (
            self._enable_secondary_pass
            and ocr_result.detections
            and (len(ocr_result.detections) < 15 or sum(d.confidence for d in ocr_result.detections) / len(ocr_result.detections) < 0.45)
            and (quality.issues or quality.metrics.blur_score < 70.0)
        ):
            try:
                # Apply mild contrast enhancement (CLAHE on L-channel of LAB space)
                proc_img = preprocessing_result.processed_image
                if proc_img.ndim == 3 and proc_img.shape[2] == 3:
                    lab = cv2.cvtColor(proc_img, cv2.COLOR_RGB2LAB)
                    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                    lab[:, :, 0] = clahe.apply(lab[:, :, 0])
                    enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
                    secondary_res = self._ocr_service.extract(enhanced)
                    if secondary_res.detections:
                        merged_dets = deduplicate_detections(ocr_result.detections, secondary_res.detections)
                        if len(merged_dets) > len(ocr_result.detections):
                            ocr_result = OCRResult(detections=merged_dets)
                            ops = list(preprocessing_result.operations) + ["secondary_contrast_pass"]
                            preprocessing_result = PreprocessingResult(
                                original_image=preprocessing_result.original_image,
                                processed_image=preprocessing_result.processed_image,
                                operations=tuple(ops),
                                selected_rotation=preprocessing_result.selected_rotation,
                            )
            except Exception as error:
                processing_warnings.append(f"Secondary OCR pass skipped: {error}")

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

    def annotate_result(
        self,
        result: PackageAnalysisResult,
        original_image: ImageInput | None = None,
    ) -> np.ndarray:
        """Render highlighted visual evidence for a completed analysis result."""

        from src.annotation.image_annotator import ImageAnnotator

        return ImageAnnotator().annotate_package_result(result, original_image=original_image)


def analyze_package(image: ImageInput) -> PackageAnalysisResult:
    """Convenience function for scripts and the Streamlit application."""

    return AnalysisPipeline().analyze_package(image)


def annotate_result(
    result: PackageAnalysisResult,
    original_image: ImageInput | None = None,
) -> np.ndarray:
    """Convenience function to generate an annotated image for an analysis result."""

    return AnalysisPipeline().annotate_result(result, original_image=original_image)
