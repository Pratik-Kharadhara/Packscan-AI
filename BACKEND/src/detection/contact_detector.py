"""Consumer-contact declaration detector compliant with Legal Metrology Rule 6(2)."""

from __future__ import annotations

import re

from src.detection._helpers import detected_field, first_match
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.patterns import compile_any, load_detection_patterns
from src.ocr.ocr_service import OCRResult


class ContactDetector(BaseDetector):
    """Find consumer care evidence including toll-free numbers, phone numbers, and emails."""

    field_name = "consumer_contact"

    def __init__(self) -> None:
        patterns = load_detection_patterns()[self.field_name]
        self._context = compile_any(patterns["context_patterns"])
        self._toll_free = re.compile(patterns.get("toll_free_pattern", r"\b1800[- ]?\d{3,4}[- ]?\d{3,4}\b"))
        self._phone = re.compile(patterns["phone_pattern"])
        self._email = re.compile(patterns["email_pattern"], re.IGNORECASE)

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        candidates = list(ocr_result.grouped_lines) + list(ocr_result.stacked_lines)
        if not candidates and ocr_result.detections:
            candidates = ocr_result.detections  # type: ignore

        context_match = None

        for item in candidates:
            text = getattr(item, "text", "")
            has_context = bool(self._context.search(text))

            toll_free_val = first_match(self._toll_free, text)
            phone_val = first_match(self._phone, text)
            email_val = first_match(self._email, text)

            extracted_val = toll_free_val or phone_val or email_val
            if not extracted_val:
                continue

            sub_fields = {}
            if toll_free_val:
                sub_fields["toll_free"] = toll_free_val
            if phone_val:
                sub_fields["phone"] = phone_val
            if email_val:
                sub_fields["email"] = email_val

            if has_context:
                context_match = (item, extracted_val, sub_fields)
                break

        # Also scan individual detections if grouping did not preserve the label/value pair.
        if not context_match:
            for det in ocr_result.detections:
                toll_free_val = first_match(self._toll_free, det.text)
                phone_val = first_match(self._phone, det.text)
                email_val = first_match(self._email, det.text)
                extracted_val = toll_free_val or phone_val or email_val
                if extracted_val:
                    sub = {}
                    if toll_free_val:
                        sub["toll_free"] = toll_free_val
                    if phone_val:
                        sub["phone"] = phone_val
                    if email_val:
                        sub["email"] = email_val

                    if self._context.search(det.text):
                        context_match = (det, extracted_val, sub)
                        break

        selected = context_match
        if selected:
            source, val, sub_fields = selected
            first_det = source.detections[0] if hasattr(source, "detections") else source
            box = source.bounding_box if hasattr(source, "bounding_box") else [first_det.bounding_box]
            note = "Consumer care context and contact details detected."
            return detected_field(
                self.field_name,
                first_det,
                val,
                note,
                source_line=source,
                raw_text=getattr(source, "raw_text", first_det.text),
                normalized_text=getattr(source, "text", first_det.text),
                matched_pattern="context_contact",
                sub_fields=sub_fields,
                rule_reference="Rule 6(2)",
                bounding_boxes=[box] if isinstance(box, tuple) else box,
            )

        return DetectedField.not_found(
            self.field_name,
            "No contact detail tied to an explicit consumer-care or grievance context detected.",
            rule_reference="Rule 6(2)",
        )
