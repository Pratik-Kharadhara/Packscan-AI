"""Product or commodity identity declaration detector compliant with Legal Metrology Rule 6(1)(b)."""

from __future__ import annotations

import re

from src.detection._helpers import detected_field
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.content_validator import is_plausible_commodity
from src.detection.patterns import compile_any, load_detection_patterns
from src.ocr.ocr_service import OCRResult


class ProductIdentityDetector(BaseDetector):
    """Detect product/commodity identity using explicit prefixes, commodity descriptors, and layout prominence."""

    field_name = "product_identity"

    def __init__(self) -> None:
        patterns = load_detection_patterns()[self.field_name]
        self._context = compile_any(patterns.get("context_patterns", []))
        self._generic_section = compile_any(patterns.get("generic_section_patterns", []))
        self._commodities = [c.lower() for c in patterns.get("common_commodities", [])]

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        candidates = list(ocr_result.grouped_lines) if ocr_result.grouped_lines else []
        candidates.extend(ocr_result.detections)

        # 1. Check for explicit prefix: e.g. "Product: Salt", "Commodity: ..."
        for item in candidates:
            text = getattr(item, "text", "")
            if self._context.search(text) and not self._generic_section.search(text):
                label_match = self._context.search(text)
                value = text[label_match.end() :].strip(" :;-\t") if label_match else text
                if not value or not is_plausible_commodity(value):
                    continue
                first_det = item.detections[0] if hasattr(item, "detections") else item
                box = item.bounding_box if hasattr(item, "bounding_box") else first_det.bounding_box
                return detected_field(
                    self.field_name,
                    first_det,
                    value,
                    "Explicit commodity/product label detected.",
                    source_line=item,
                    raw_text=getattr(item, "raw_text", first_det.text),
                    normalized_text=text,
                    matched_pattern="explicit_label",
                    sub_fields={"method": "explicit_label"},
                    rule_reference="Rule 6(1)(b)",
                    bounding_boxes=[box],
                )

        # Exclusions for section headers, recycling notes, company suffixes, and advertising sentences
        EXCLUDED_COMMODITY_PHRASES = re.compile(
            r"\b(?:recyclable|recycle|waste|cleaner|guarantee|technology|care|complaint|"
            r"consumer|customer|ingredients?|nutrition(?:al)?|serving|store in|directions?|"
            r"packaging|repacking|packing|packed|mfg|mkt|imported|licence|license|fssai|"
            r"barcode|batch|lot|ltd|limited|pvt|llp|chemicals|corporation|industries)\b",
            re.IGNORECASE,
        )

        # 2. Check for generic commodity descriptor (Rule 6(1)(b) standard generic name)
        for item in candidates:
            text = getattr(item, "text", "")
            text_lower = text.lower()

            if not is_plausible_commodity(text):
                continue

            # Skip if the line contains recycling, section headers, or marketing claims
            if EXCLUDED_COMMODITY_PHRASES.search(text_lower):
                continue

            # A valid product/commodity name declaration is concise (<= 7 words)
            word_count = len(text.split())
            if word_count > 7:
                continue

            first_det = item.detections[0] if hasattr(item, "detections") else item
            # Avoid low-confidence noisy OCR fragments
            if getattr(first_det, "confidence", 1.0) < 0.40:
                continue

            for comm in self._commodities:
                # Require word boundary
                if re.search(rf"\b{re.escape(comm)}\b", text_lower):
                    box = item.bounding_box if hasattr(item, "bounding_box") else first_det.bounding_box
                    val = text.strip(" :;-\t'\"$#@*")
                    return detected_field(
                        self.field_name,
                        first_det,
                        val,
                        f"Generic commodity descriptor '{comm}' identified under Rule 6(1)(b).",
                        source_line=item,
                        raw_text=getattr(item, "raw_text", first_det.text),
                        normalized_text=text,
                        matched_pattern="commodity_descriptor",
                        sub_fields={"method": "commodity_descriptor", "matched_commodity": comm},
                        rule_reference="Rule 6(1)(b)",
                        bounding_boxes=[box],
                    )

        # 3. Layout prominence: top 35% of package with prominent text (Brand / Product Name)
        EXCLUDED_WORDS = (
            "barcode", "batch", "b.no", "b no", "lic", "fssai", "mfg", "mfd",
            "pkd", "exp", "use by", "best before", "net qty", "net quantity",
            "mrp", "rs.", "inr", "recycle", "direction", "warning", "ingredient",
            "date", "amount", "serving", "value", "table", "total", "approx",
            "energy", "protein", "carbohydrate", "sodium", "iodine", "added",
            "natural", "fat", "sugar", "weight", "contents", "email", "mail",
            "call", "tel", "phone", "website", "web", "feedback", "right",
            "vacuum", "evaporation", "process", "quality", "standard", "pure",
            "purity", "hygienic", "clean", "care", "consumer", "customer",
            "printed", "packed", "below", "above", "panel", "here", "box", "code",
            "kcal", "cal", "kj", "gm", "mcg",
        )
        prominent_candidates = []
        if len(ocr_result.detections) > 1:
            all_ys = [p[1] for det in ocr_result.detections for p in det.bounding_box]
            min_y, max_y = min(all_ys), max(all_ys)
            layout_height = max(1.0, max_y - min_y)

            for det in ocr_result.detections:
                text_clean = det.text.strip()
                text_lower = text_clean.lower()
                if not is_plausible_commodity(text_clean):
                    continue
                if EXCLUDED_COMMODITY_PHRASES.search(text_lower):
                    continue
                if any(re.search(rf"\b{re.escape(w)}\b", text_lower) for w in EXCLUDED_WORDS):
                    continue
                if len(text_lower.split()) > 6:
                    continue
                # Key/label declarations end with a colon or semicolon; brand names do not
                if text_clean.endswith((":", ";")):
                    continue

                center_y = sum(p[1] for p in det.bounding_box) / 4.0
                height = max(p[1] for p in det.bounding_box) - min(p[1] for p in det.bounding_box)

                # Prominent title must be in top 35% of the detection bounding area
                is_top_layout = center_y <= (min_y + 0.35 * layout_height)
                # Prominent title must have substantial relative height
                is_prominent_size = height >= (0.05 * layout_height) or height >= 25.0

                if is_top_layout and is_prominent_size and det.confidence >= 0.70 and len(text_lower) >= 3:
                    # Must contain at least 3 alphabetic characters to avoid barcodes or number codes
                    alpha_chars = len(re.findall(r"[a-zA-Z]", text_lower))
                    if alpha_chars >= 3 and not re.match(r"^[\d\s\"'/.:,-]+$", text_lower):
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
