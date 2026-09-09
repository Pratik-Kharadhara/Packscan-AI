"""Manufacture or pre-pack date declaration detector compliant with Legal Metrology Rule 6(1)(d)."""

from __future__ import annotations

import re

from src.detection._helpers import detected_field, first_match
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.patterns import compile_any, load_detection_patterns
from src.detection.semantic_associator import SemanticAssociator
from src.ocr.ocr_service import OCRResult


class DateDetector(BaseDetector):
    """Detect manufacture/packaging dates, cleanly separating them from expiry/use-by dates."""

    field_name = "manufacture_date"

    def __init__(self) -> None:
        patterns = load_detection_patterns()[self.field_name]
        self._mfg_context = compile_any(patterns["mfg_context_patterns"])
        self._expiry_context = compile_any(patterns["expiry_context_patterns"])
        self._date_value = re.compile(patterns["value_pattern"], re.IGNORECASE)
        self._associator = SemanticAssociator()

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        # 1. First run 2D semantic label-to-value association
        associations = self._associator.associate(ocr_result)

        pkg_assoc = associations.get("packaging_date")
        mfg_assoc = associations.get("manufacture_date")
        use_by_assoc = associations.get("use_by_date")
        exp_assoc = associations.get("expiry_date")
        bb_assoc = associations.get("best_before_date")

        # If a valid packaging date or manufacture date is semantically associated:
        if pkg_assoc or mfg_assoc:
            primary_assoc = pkg_assoc or mfg_assoc
            date_type = "packaging_date" if pkg_assoc else "manufacturing_date"
            val = primary_assoc.value

            sub_fields: dict[str, str] = {
                "date_type": date_type,
                "raw_date": val,
                "label": primary_assoc.label_text,
            }
            if pkg_assoc:
                sub_fields["packaging_date"] = pkg_assoc.value
                sub_fields["is_packaging_date"] = "true"
                sub_fields["statutory_role"] = "pre_packing_date_rule_6_1_d"
            if mfg_assoc:
                sub_fields["manufacture_date"] = mfg_assoc.value
            if use_by_assoc:
                sub_fields["use_by_date"] = use_by_assoc.value
            if exp_assoc:
                sub_fields["expiry_date"] = exp_assoc.value
            if bb_assoc:
                sub_fields["best_before_date"] = bb_assoc.value

            note = (
                f"Date of packaging declaration detected: {val} (Statutory pre-packing date under Rule 6(1)(d))."
                if pkg_assoc
                else f"Manufacturing date declaration detected: {val}."
            )
            first_det = primary_assoc.value_match.detection

            return detected_field(
                self.field_name,
                first_det,
                val,
                note,
                confidence=primary_assoc.confidence,
                source_line=primary_assoc.label_match.detection if primary_assoc.label_match else first_det,
                raw_text=f"{primary_assoc.label_text} {val}",
                normalized_text=f"{primary_assoc.label_text}: {val}",
                matched_pattern=date_type,
                sub_fields=sub_fields,
                rule_reference="Rule 6(1)(d)",
                bounding_boxes=primary_assoc.bounding_boxes,
            )

        # If ONLY expiry/use-by date was associated without mfg or packaging date:
        if use_by_assoc or exp_assoc or bb_assoc:
            sec_assoc = use_by_assoc or exp_assoc or bb_assoc
            sec_type = sec_assoc.category
            exp_val = sec_assoc.value
            first_det = sec_assoc.value_match.detection

            sub_fields = {
                "date_type": "expiry_only",
                "expiry_date": exp_val,
                sec_type: exp_val,
                "label": sec_assoc.label_text,
            }
            return detected_field(
                self.field_name,
                first_det,
                f"Expiry only: {exp_val}",
                "Expiry/use-by date detected, but mandatory pre-pack/mfg date was not found.",
                confidence=sec_assoc.confidence,
                source_line=sec_assoc.label_match.detection if sec_assoc.label_match else first_det,
                raw_text=f"{sec_assoc.label_text} {exp_val}",
                normalized_text=f"{sec_assoc.label_text}: {exp_val}",
                matched_pattern="expiry_only",
                sub_fields=sub_fields,
                rule_reference="Rule 6(1)(d)",
                bounding_boxes=sec_assoc.bounding_boxes,
            )

        # 2. Fallback to candidate sequence search if 2D associator had no label matches
        candidates = list(ocr_result.grouped_lines) + list(ocr_result.stacked_lines)

        mfg_candidate: tuple[object, str, str] | None = None
        expiry_candidate: tuple[object, str] | None = None

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

        # Check individual raw detections if not yet found
        if mfg_candidate is None:
            for det in ocr_result.detections:
                if self._mfg_context.search(det.text):
                    val = first_match(self._date_value, det.text)
                    if val:
                        date_type = "packaging_date" if "pack" in det.text.lower() else "manufacturing_date"
                        mfg_candidate = (det, val, date_type)
                        break

        if mfg_candidate:
            source, val, date_type = mfg_candidate
            first_det = source.detections[0] if hasattr(source, "detections") else source
            box = source.bounding_box if hasattr(source, "bounding_box") else [first_det.bounding_box]

            sub_fields = {"date_type": date_type, "raw_date": val}
            if date_type == "packaging_date":
                sub_fields["packaging_date"] = val
                sub_fields["is_packaging_date"] = "true"
            if expiry_candidate:
                sub_fields["expiry_date"] = expiry_candidate[1]

            return detected_field(
                self.field_name,
                first_det,
                val,
                f"{date_type.replace('_', ' ').title()} declaration detected.",
                source_line=source,
                raw_text=getattr(source, "raw_text", first_det.text),
                normalized_text=getattr(source, "text", first_det.text),
                matched_pattern=date_type,
                sub_fields=sub_fields,
                rule_reference="Rule 6(1)(d)",
                bounding_boxes=[box] if isinstance(box, tuple) else box,
            )

        if expiry_candidate:
            source, exp_val = expiry_candidate
            first_det = source.detections[0] if hasattr(source, "detections") else source
            box = source.bounding_box if hasattr(source, "bounding_box") else [first_det.bounding_box]
            return detected_field(
                self.field_name,
                first_det,
                f"Expiry only: {exp_val}",
                "Expiry/use-by date detected, but mandatory pre-pack/mfg date was not found.",
                source_line=source,
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
