"""Product or commodity identity declaration detector compliant with Legal Metrology Rule 6(1)(b)."""

from __future__ import annotations

import re

from src.detection._helpers import detected_field
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.patterns import compile_any, load_detection_patterns
from src.ocr.ocr_service import OCRResult


class ProductIdentityDetector(BaseDetector):
    """Detect product/commodity identity using explicit prefixes, commodity descriptors, and layout prominence."""

    field_name = "product_identity"

    def __init__(self) -> None:
        patterns = load_detection_patterns()[self.field_name]
        self._context = compile_any(patterns.get("context_patterns", []))
        self._commodities = [c.lower() for c in patterns.get("common_commodities", [])]

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        candidates = list(ocr_result.grouped_lines) if ocr_result.grouped_lines else ocr_result.detections

        # 1. Check for explicit prefix: e.g. "Product: Salt", "Commodity: ..."
        for item in candidates:
            text = getattr(item, "text", "")
            if self._context.search(text):
                first_det = item.detections[0] if hasattr(item, "detections") else item
                box = item.bounding_box if hasattr(item, "bounding_box") else first_det.bounding_box
                return detected_field(
                    self.field_name,
                    first_det,
                    text,
                    "Explicit commodity/product label detected.",
                    raw_text=getattr(item, "raw_text", first_det.text),
                    normalized_text=text,
                    matched_pattern="explicit_label",
                    sub_fields={"method": "explicit_label"},
                    rule_reference="Rule 6(1)(b)",
                    bounding_boxes=[box],
                )

        # 2. Check for generic commodity descriptor (Rule 6(1)(b) standard generic name)
        for item in candidates:
            text = getattr(item, "text", "").lower()
            for comm in self._commodities:
                if comm in text:
                    first_det = item.detections[0] if hasattr(item, "detections") else item
                    box = item.bounding_box if hasattr(item, "bounding_box") else first_det.bounding_box
                    return detected_field(
                        self.field_name,
                        first_det,
                        getattr(item, "text", first_det.text),
                        f"Generic commodity descriptor '{comm}' identified under Rule 6(1)(b).",
                        raw_text=getattr(item, "raw_text", first_det.text),
                        normalized_text=getattr(item, "text", first_det.text),
                        matched_pattern="commodity_descriptor",
                        sub_fields={"method": "commodity_descriptor", "matched_commodity": comm},
                        rule_reference="Rule 6(1)(b)",
                        bounding_boxes=[box],
                    )

        # 3. Layout prominence: top 40% of package with prominent text (Brand / Product Name)
        EXCLUDED_WORDS = (
            "barcode", "batch", "b.no", "b no", "lic", "fssai", "mfg", "mfd",
            "pkd", "exp", "use by", "best before", "net qty", "net quantity",
            "mrp", "rs.", "inr", "recycle", "direction", "warning", "ingredient",
        )
        prominent_candidates = []
        if len(ocr_result.detections) > 1:
            for det in ocr_result.detections:
                text_lower = det.text.lower().strip()
                if any(text_lower.startswith(w) or w in text_lower for w in EXCLUDED_WORDS):
                    continue

                center_y = sum(p[1] for p in det.bounding_box) / 4.0
                height = max(p[1] for p in det.bounding_box) - min(p[1] for p in det.bounding_box)
                if det.confidence >= 0.70 and len(text_lower) >= 3:
                    if not re.match(r"^[\d\s/.:,-]+$", text_lower):
                        prominent_candidates.append((det, height, center_y))

        if prominent_candidates:
            prominent_candidates.sort(key=lambda x: (-x[1], x[2]))
            best_det, _, _ = prominent_candidates[0]
            return detected_field(
                self.field_name,
                best_det,
                best_det.text,
                "Prominent brand/product title detected on display panel.",
                raw_text=best_det.text,
                normalized_text=best_det.text,
                matched_pattern="prominent_title",
                sub_fields={"method": "prominent_title"},
                rule_reference="Rule 6(1)(b)",
            )

        return DetectedField.not_found(
            self.field_name,
            "No commodity identity or prominent product name detected.",
            rule_reference="Rule 6(1)(b)",
        )
