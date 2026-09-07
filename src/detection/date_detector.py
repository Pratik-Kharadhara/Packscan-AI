"""Manufacture or pre-pack date declaration detector compliant with Legal Metrology Rule 6(1)(d)."""

from __future__ import annotations

import re

from src.detection._helpers import detected_field, first_match
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.patterns import compile_any, load_detection_patterns
from src.ocr.ocr_service import OCRResult


class DateDetector(BaseDetector):
    """Detect manufacture/packaging dates, cleanly separating them from expiry/use-by dates."""

    field_name = "manufacture_date"

    def __init__(self) -> None:
        patterns = load_detection_patterns()[self.field_name]
        self._mfg_context = compile_any(patterns["mfg_context_patterns"])
        self._expiry_context = compile_any(patterns["expiry_context_patterns"])
        self._date_value = re.compile(patterns["value_pattern"], re.IGNORECASE)

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        candidates = list(ocr_result.grouped_lines) + list(ocr_result.stacked_lines)

        mfg_candidate: tuple[object, str, str] | None = None
        expiry_candidate: tuple[object, str] | None = None

        # 1. Search spatially grouped lines and stacked lines
        for line in candidates:
            # Check for manufacturing / packaging date
            if self._mfg_context.search(line.text):
                val = first_match(self._date_value, line.text)
                if val:
                    date_type = "packaging_date" if "pack" in line.text.lower() else "manufacturing_date"
                    mfg_candidate = (line, val, date_type)

            # Check for expiry / use by date
            if self._expiry_context.search(line.text):
                exp_val = first_match(self._date_value, line.text)
                if exp_val and expiry_candidate is None:
                    expiry_candidate = (line, exp_val)

        # 2. Check individual raw detections if not yet found
        if mfg_candidate is None:
            for det in ocr_result.detections:
                if self._mfg_context.search(det.text):
                    val = first_match(self._date_value, det.text)
                    if val:
                        date_type = "packaging_date" if "pack" in det.text.lower() else "manufacturing_date"
                        mfg_candidate = (det, val, date_type)
                        break

        # 3. If a valid manufacturing/packaging date was found:
        if mfg_candidate:
            source, val, date_type = mfg_candidate
            first_det = source.detections[0] if hasattr(source, "detections") else source
            box = source.bounding_box if hasattr(source, "bounding_box") else [first_det.bounding_box]

            sub_fields = {"date_type": date_type, "raw_date": val}
            if expiry_candidate:
                sub_fields["expiry_date"] = expiry_candidate[1]

            return detected_field(
                self.field_name,
                first_det,
                val,
                f"{date_type.replace('_', ' ').title()} declaration detected.",
                raw_text=getattr(source, "raw_text", first_det.text),
                normalized_text=getattr(source, "text", first_det.text),
                matched_pattern=date_type,
                sub_fields=sub_fields,
                rule_reference="Rule 6(1)(d)",
                bounding_boxes=[box] if isinstance(box, tuple) else box,
            )

        # 4. If ONLY expiry date was found (Rule 6(1)(d) strictly requires mfg or packaging date):
        if expiry_candidate:
            source, exp_val = expiry_candidate
            first_det = source.detections[0] if hasattr(source, "detections") else source
            box = source.bounding_box if hasattr(source, "bounding_box") else [first_det.bounding_box]
            return detected_field(
                self.field_name,
                first_det,
                f"Expiry only: {exp_val}",
                "Expiry/use-by date detected, but mandatory pre-pack/mfg date was not found.",
                raw_text=getattr(source, "raw_text", first_det.text),
                normalized_text=getattr(source, "text", first_det.text),
                matched_pattern="expiry_only",
                sub_fields={"date_type": "expiry_only", "expiry_date": exp_val},
                rule_reference="Rule 6(1)(d)",
                bounding_boxes=[box] if isinstance(box, tuple) else box,
            )

        return DetectedField.not_found(
            self.field_name,
            "No reliable manufacture or pre-pack date declaration detected.",
            rule_reference="Rule 6(1)(d)",
        )
