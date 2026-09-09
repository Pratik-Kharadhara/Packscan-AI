"""Manufacturer, packer, marketer, and importer declaration detector compliant with Legal Metrology Rule 6(1)(a) & Rule 10."""

from __future__ import annotations

import re

from src.detection._helpers import detected_field
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.patterns import compile_any, load_detection_patterns
from src.ocr.ocr_service import OCRResult


class ManufacturerDetector(BaseDetector):
    """Detect manufacturer, packer, marketer, or importer with role separation and PIN code extraction."""

    field_name = "manufacturer_packer"

    def __init__(self) -> None:
        patterns = load_detection_patterns()[self.field_name]
        self._mkt = compile_any(patterns["marketer_patterns"])
        self._mfg = compile_any(patterns["manufacturer_patterns"])
        self._packer = compile_any(patterns["packer_patterns"])
        self._importer = compile_any(patterns["importer_patterns"])
        self._pin_pattern = re.compile(patterns["pin_code_pattern"])

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        # 1. Search address_blocks first, then grouped/stacked lines
        candidates = list(ocr_result.address_blocks) + list(ocr_result.grouped_lines) + list(ocr_result.stacked_lines)
        if not candidates and ocr_result.detections:
            candidates = ocr_result.detections  # type: ignore

        detected_roles: list[str] = []
        matched_lines: list[object] = []
        extracted_pin: str | None = None
        primary_role: str | None = None

        # Search for supply chain roles across lines
        for line in candidates:
            text = getattr(line, "text", "")
            role_found = None
            if self._mfg.search(text):
                role_found = "manufacturer"
            elif self._packer.search(text):
                role_found = "packer"
            elif self._importer.search(text):
                role_found = "importer"
            elif self._mkt.search(text):
                role_found = "marketer"

            if role_found:
                if role_found not in detected_roles:
                    detected_roles.append(role_found)
                matched_lines.append(line)
                if primary_role is None:
                    primary_role = role_found

            # Check for PIN code anywhere in lines near supply chain declarations
            if extracted_pin is None:
                pin_match = self._pin_pattern.search(text)
                if pin_match:
                    extracted_pin = pin_match.group(0).strip()

        # If candidates yielded results
        if matched_lines:
            primary_line = matched_lines[0]
            first_det = primary_line.detections[0] if hasattr(primary_line, "detections") else primary_line
            all_boxes = [l.bounding_box for l in matched_lines if hasattr(l, "bounding_box")]
            if not all_boxes:
                all_boxes = [first_det.bounding_box]

            role_to_use = primary_role or detected_roles[0]
            line_text = getattr(primary_line, "text", first_det.text)
            display_value = f"{role_to_use.title()}: {line_text}"

            sub_fields = {
                "role": role_to_use,
                "roles_detected": ", ".join(detected_roles),
                "has_pin": str(extracted_pin is not None).lower(),
                "detection_method": "address_block" if primary_line in getattr(ocr_result, "address_blocks", []) else "grouped_line",
            }
            if extracted_pin:
                sub_fields["pin_code"] = extracted_pin

            note = f"{role_to_use.title()} declaration detected ({', '.join(detected_roles)})."
            if extracted_pin:
                note += f" Postal PIN code {extracted_pin} verified."

            return detected_field(
                self.field_name,
                first_det,
                display_value,
                note,
                source_line=primary_line,
                raw_text=getattr(primary_line, "raw_text", first_det.text),
                normalized_text=line_text,
                matched_pattern="role_context",
                role=role_to_use,
                sub_fields=sub_fields,
                rule_reference="Rule 6(1)(a) & Rule 10",
                bounding_boxes=all_boxes,
            )

        return DetectedField.not_found(
            self.field_name,
            "No manufacturer, packer, marketer, or importer declaration detected.",
            rule_reference="Rule 6(1)(a)",
        )
