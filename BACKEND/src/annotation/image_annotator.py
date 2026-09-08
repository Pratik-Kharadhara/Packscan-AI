"""Visual evidence generator that highlights detected declarations on package images."""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any, TypeAlias
import uuid

import cv2
import numpy as np

from config import PATHS
from src.detection.base_detector import DetectedField
from src.ocr.ocr_service import Point
from src.utils.image_utils import load_image, save_image

if TYPE_CHECKING:
    from src.pipeline.analysis_pipeline import PackageAnalysisResult
    from src.rules.compliance_engine import ComplianceCheck, ComplianceResult

ImageInput: TypeAlias = str | Path | np.ndarray

FIELD_DISPLAY_NAMES: dict[str, str] = {
    "mrp": "MRP",
    "net_quantity": "Net Qty",
    "manufacture_date": "Mfg/Pkd Date",
    "manufacturer_packer": "Manufacturer/Packer",
    "consumer_contact": "Customer Care",
    "product_identity": "Product Identity",
}

# Distinct field palette in BGR format
FIELD_COLORS: dict[str, tuple[int, int, int]] = {
    "mrp": (0, 165, 255),               # Orange
    "net_quantity": (220, 180, 0),       # Cyan-Teal
    "manufacture_date": (190, 60, 190),  # Magenta-Purple
    "manufacturer_packer": (230, 120, 30), # Blue
    "consumer_contact": (40, 190, 90),   # Emerald Green
    "product_identity": (50, 130, 245),  # Coral-Red
}

DEFAULT_FIELD_COLOR: tuple[int, int, int] = (200, 200, 200)

STATUS_COLORS: dict[str, tuple[int, int, int]] = {
    "PASS": (46, 180, 50),     # Emerald Green
    "FAIL": (40, 40, 225),     # Crimson Red
    "REVIEW": (20, 140, 245),  # Amber
    "NOT_APPLICABLE": (130, 130, 130), # Slate Gray
}


class ImageAnnotator:
    """Renders high-visibility visual evidence onto original package images.

    Adheres strictly to the requirement of consuming structured detection data
    without performing OCR or executing legal business logic.
    """

    def __init__(
        self,
        alpha_fill: float = 0.18,
        border_thickness: int = 2,
    ) -> None:
        self.alpha_fill = alpha_fill
        self.border_thickness = border_thickness

    def annotate(
        self,
        image: ImageInput,
        detected_fields: dict[str, DetectedField],
        compliance_checks: list[ComplianceCheck] | dict[str, str] | None = None,
        reference_dimensions: tuple[int, int] | None = None,
    ) -> np.ndarray:
        """Annotate the package image with bounding polygons, field labels, and status badges."""

        canvas = load_image(image).copy()
        img_h, img_w = canvas.shape[:2]

        # Calculate scale factor if bounding boxes were extracted at a different resolution
        scale_x, scale_y = 1.0, 1.0
        if reference_dimensions is not None:
            ref_w, ref_h = reference_dimensions
            if ref_w > 0 and ref_h > 0 and (ref_w != img_w or ref_h != img_h):
                scale_x = img_w / ref_w
                scale_y = img_h / ref_h

        # Extract field-to-status mapping
        status_map = self._resolve_status_map(compliance_checks)

        # Create overlay for semi-transparent fills
        overlay = canvas.copy()

        # Dynamic sizing based on image dimensions
        diagonal = np.sqrt(img_w**2 + img_h**2)
        font_scale = max(0.40, min(0.95, diagonal / 1600.0))
        thickness = max(1, int(round(font_scale * 2.0)))
        box_thickness = max(2, int(round(diagonal / 750.0)))

        # 1. Draw polygon fills on overlay
        for field_key, detected in detected_fields.items():
            if not detected.found or not detected.bounding_boxes:
                continue

            color = FIELD_COLORS.get(field_key, DEFAULT_FIELD_COLOR)
            for box in detected.bounding_boxes:
                pts = self._scale_and_format_box(box, scale_x, scale_y, img_w, img_h)
                if pts is not None:
                    cv2.fillPoly(overlay, [pts], color)

        # Blend semi-transparent fills with base canvas
        cv2.addWeighted(overlay, self.alpha_fill, canvas, 1.0 - self.alpha_fill, 0, canvas)

        # 2. Draw crisp bounding boundaries and floating label pills
        for field_key, detected in detected_fields.items():
            if not detected.found or not detected.bounding_boxes:
                continue

            color = FIELD_COLORS.get(field_key, DEFAULT_FIELD_COLOR)
            status = status_map.get(field_key, "FOUND")
            display_name = FIELD_DISPLAY_NAMES.get(field_key, field_key.replace("_", " ").title())

            # Text label preview
            val_preview = detected.value if detected.value else (detected.matched_text or "")
            if len(val_preview) > 28:
                val_preview = val_preview[:25] + "..."
            label_text = f"{display_name}: {val_preview}" if val_preview else display_name

            for i, box in enumerate(detected.bounding_boxes):
                pts = self._scale_and_format_box(box, scale_x, scale_y, img_w, img_h)
                if pts is None:
                    continue

                # Draw polygon perimeter
                cv2.polylines(canvas, [pts], isClosed=True, color=color, thickness=box_thickness)

                # Only draw the label badge on the first box for this field to prevent clutter
                if i == 0:
                    top_left = pts[0]
                    self._draw_label_badge(
                        canvas=canvas,
                        origin=(top_left[0], top_left[1]),
                        text=label_text,
                        status=status,
                        field_color=color,
                        font_scale=font_scale,
                        thickness=thickness,
                        img_w=img_w,
                        img_h=img_h,
                    )

        return canvas

    def annotate_package_result(
        self,
        analysis_result: PackageAnalysisResult,
        original_image: ImageInput | None = None,
    ) -> np.ndarray:
        """Convenience method to annotate directly from a completed PackageAnalysisResult."""

        target_image = original_image if original_image is not None else analysis_result.image_path
        if target_image is None:
            raise ValueError("Original image must be provided either directly or via analysis_result.image_path.")

        ref_dims = (
            analysis_result.preprocessing.processed_width,
            analysis_result.preprocessing.processed_height,
        )

        return self.annotate(
            image=target_image,
            detected_fields=analysis_result.detected_fields,
            compliance_checks=analysis_result.compliance.checks,
            reference_dimensions=ref_dims,
        )

    def save_annotated(
        self,
        annotated_image: np.ndarray,
        output_path: str | Path | None = None,
        prefix: str = "annotated_",
    ) -> Path:
        """Persist annotated image to the configured annotated directory or custom path."""

        if output_path is None:
            filename = f"{prefix}{uuid.uuid4().hex[:8]}.jpg"
            output_path = PATHS.annotated_data_dir / filename

        return save_image(annotated_image, output_path)

    @staticmethod
    def _scale_and_format_box(
        box: tuple[Point, Point, Point, Point],
        scale_x: float,
        scale_y: float,
        img_w: int,
        img_h: int,
    ) -> np.ndarray | None:
        """Convert float points to integer polygon vertices within image bounds."""

        try:
            points = []
            for pt in box:
                x = int(round(pt[0] * scale_x))
                y = int(round(pt[1] * scale_y))
                # Clamp within boundaries
                x = max(0, min(img_w - 1, x))
                y = max(0, min(img_h - 1, y))
                points.append([x, y])
            return np.array(points, dtype=np.int32)
        except Exception:
            return None

    @staticmethod
    def _resolve_status_map(
        compliance_checks: Any,
    ) -> dict[str, str]:
        """Normalize various compliance check containers to field -> status string mapping."""

        status_map: dict[str, str] = {}
        if not compliance_checks:
            return status_map

        # If it's a ComplianceResult object
        if hasattr(compliance_checks, "checks"):
            compliance_checks = compliance_checks.checks

        if isinstance(compliance_checks, dict):
            return {k: str(v) for k, v in compliance_checks.items()}

        if isinstance(compliance_checks, (list, tuple)):
            for check in compliance_checks:
                if hasattr(check, "field") and hasattr(check, "status"):
                    status_val = check.status.value if hasattr(check.status, "value") else str(check.status)
                    status_map[str(check.field)] = status_val

        return status_map

    @staticmethod
    def _draw_label_badge(
        canvas: np.ndarray,
        origin: tuple[int, int],
        text: str,
        status: str,
        field_color: tuple[int, int, int],
        font_scale: float,
        thickness: int,
        img_w: int,
        img_h: int,
    ) -> None:
        """Draw a pill badge with high contrast background above or beside the bounding box."""

        font = cv2.FONT_HERSHEY_SIMPLEX
        (t_w, t_h), baseline = cv2.getTextSize(text, font, font_scale, thickness)

        # Status text & color
        status_color = STATUS_COLORS.get(status, field_color)
        status_badge = f" [{status}]" if status in ("PASS", "FAIL", "REVIEW") else ""
        (s_w, s_h), _ = cv2.getTextSize(status_badge, font, font_scale, thickness)

        total_w = t_w + s_w + 16
        total_h = max(t_h, s_h) + 10

        ox, oy = origin
        # Place pill above box if possible, otherwise below
        pill_y2 = oy - 4 if oy - total_h - 4 >= 0 else oy + total_h + 12
        pill_y1 = pill_y2 - total_h
        pill_x1 = max(2, min(img_w - total_w - 4, ox))
        pill_x2 = pill_x1 + total_w

        # Draw dark slate background pill with thin status border
        cv2.rectangle(canvas, (pill_x1, pill_y1), (pill_x2, pill_y2), (22, 22, 26), cv2.FILLED)
        cv2.rectangle(canvas, (pill_x1, pill_y1), (pill_x2, pill_y2), status_color, 1)

        # Left color accent bar
        cv2.rectangle(canvas, (pill_x1, pill_y1), (pill_x1 + 4, pill_y2), field_color, cv2.FILLED)

        # Draw text
        text_y = pill_y2 - 6
        cv2.putText(canvas, text, (pill_x1 + 8, text_y), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)
        if status_badge:
            cv2.putText(canvas, status_badge, (pill_x1 + 8 + t_w, text_y), font, font_scale, status_color, thickness, cv2.LINE_AA)


def annotate_image(
    image: ImageInput,
    detected_fields: dict[str, DetectedField],
    compliance_checks: list[ComplianceCheck] | dict[str, str] | None = None,
) -> np.ndarray:
    """Direct standalone function matching Section 11 specifications."""

    return ImageAnnotator().annotate(
        image=image,
        detected_fields=detected_fields,
        compliance_checks=compliance_checks,
    )
