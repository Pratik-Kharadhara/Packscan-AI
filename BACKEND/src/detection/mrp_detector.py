"""Retail-sale-price declaration detector compliant with Legal Metrology Rule 6(1)(e) & Rule 3(m)."""

from __future__ import annotations

import re
from typing import NamedTuple

from src.detection._helpers import detected_field
from src.detection.base_detector import BaseDetector, DetectedField
from src.detection.content_validator import is_plausible_mrp_amount
from src.detection.patterns import compile_any, load_detection_patterns
from src.detection.semantic_associator import SemanticAssociator
from src.ocr.ocr_service import OCRResult
from src.ocr.ocr_types import OCRDetection, Point


class MRPCandidate(NamedTuple):
    amount: str
    score: float
    source_item: object
    first_det: OCRDetection
    matched_text: str
    tax_included: bool
    pattern_name: str
    box: tuple[Point, Point, Point, Point]


class MRPDetector(BaseDetector):
    """Detect retail sale price / MRP requiring explicit context and format verification."""

    field_name = "mrp"

    def __init__(self) -> None:
        patterns = load_detection_patterns()[self.field_name]
        self._context = compile_any(patterns["context_patterns"])
        self._tax_pattern = re.compile(patterns["tax_pattern"], re.IGNORECASE)

        # Context-accompanied price (e.g. MRP ₹50, MRP 50.00, Retail Price: Rs 50)
        self._price_with_context = re.compile(
            r"(?:\b(?:m\.?r\.?p\.?|max(?:imum)?\s*retail\s*price|retail\s*price|r\.?p\.?)\b)[^0-9\n]{0,15}"
            r"(?:[₹\?<*{]|rs\.?|inr)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:/[-–—]|/ -|/-)?",
            re.IGNORECASE,
        )

        # Currency prefix price (e.g. ₹50, ₹ 50.00, Rs. 50, INR 50, {50/-)
        self._currency_prefix_price = re.compile(
            r"(?:[₹{]|rs\.?|inr)\s*(\d+(?:[.,]\d{1,2})?)\s*(?:/[-–—]|/ -|/-|\b)",
            re.IGNORECASE,
        )

        # Currency suffix price (e.g. "50/-" or "50 / -")
        self._currency_suffix_price = re.compile(
            r"(?<![a-zA-Z0-9])(\d+(?:[.,]\d{1,2})?)\s*(?:/[-–—]|/ -|/-)",
            re.IGNORECASE,
        )

        # Bare number extractor on lines with tax or packing date context
        self._bare_number_extractor = re.compile(
            r"(?<![a-zA-Z0-9])(\d{1,5}(?:[.,]\d{1,2})?)(?:\s*/[-–—]|\b)",
            re.IGNORECASE,
        )

        # Penalties: keywords that strongly suggest non-MRP numeric context
        self._batch_penalty = re.compile(r"\b(?:batch|b\.?\s*no|lot|not\s*no|l\.?\s*no|serial|s\.?\s*no|l\.hol|barcode|lic|fssai)\b", re.IGNORECASE)
        self._lic_penalty = re.compile(r"\b(?:lic|fssai|barcode|reg|std)\b", re.IGNORECASE)
        self._nutrition_penalty = re.compile(r"\b(?:energy|kcal|kj|fat|protein|carb|calcium|iron|vitamin|serving)\b", re.IGNORECASE)
        self._measurement_unit = re.compile(r"^\s*(?:g|gm|gms|kg|mg|mcg|ml|l|litre|%|percent)\b", re.IGNORECASE)
        self._date_context = re.compile(r"\b(?:pkd|mfg|mfd|packed|manufactured)\b", re.IGNORECASE)

    def _validate_amount(self, amt: str, text: str, match_end: int) -> bool:
        if not is_plausible_mrp_amount(amt):
            return False

        # Check trailing text for measurement units (e.g. "361.79 Kcal", "50 g")
        trailing = text[match_end : match_end + 10]
        if self._measurement_unit.search(trailing):
            return False

        # Exclude if preceded immediately by date format (e.g. "JUL/26" or "07/26")
        leading = text[max(0, match_end - len(amt) - 8) : match_end - len(amt)]
        if re.search(r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[/-]\s*$", leading, re.IGNORECASE):
            return False
        if re.search(r"\b\d{1,2}[/-]\s*$", leading):
            return False

        # Exclude if amount is immediately governed by a lot, batch, serial, or barcode label
        # e.g. "Lot No: 50", "Serial No: 12345", "Batch: DA-50", "L.NO: 51"
        match_start = match_end - len(amt)
        surrounding = text[max(0, match_start - 25) : min(len(text), match_end + 25)]
        if re.search(
            r"\b(?:lot|batch|b\.?\s*no|serial|s\.?\s*no|l\.?\s*no|l\.hol|barcode|lic|fssai)\b[^0-9\n]{0,10}"
            + re.escape(amt),
            surrounding,
            re.IGNORECASE,
        ):
            return False

        return True

    def _compute_score(
        self,
        text: str,
        amt: str,
        has_context: bool,
        has_tax: bool,
        has_currency: bool,
        has_date: bool,
    ) -> float:
        score = 0.0

        if has_context:
            score += 50.0
        if has_tax:
            score += 35.0
        if has_currency:
            score += 25.0
        if has_date:
            score += 15.0

        # Suffix check
        if re.search(rf"\b{re.escape(amt)}\s*(?:/[-–—]|/ -|/-)", text):
            score += 25.0

        # Penalties
        if self._batch_penalty.search(text):
            score -= 50.0
        if self._lic_penalty.search(text):
            score -= 50.0
        if self._nutrition_penalty.search(text):
            score -= 60.0

        return score

    def _extract_candidates(self, item: object) -> list[MRPCandidate]:
        text = getattr(item, "text", "")
        if not text:
            return []

        first_det = item.detections[0] if hasattr(item, "detections") else item
        box = item.bounding_box if hasattr(item, "bounding_box") else first_det.bounding_box
        has_tax = bool(self._tax_pattern.search(text))
        has_context = bool(self._context.search(text))
        has_date = bool(self._date_context.search(text))

        candidates: list[MRPCandidate] = []
        found_amounts: set[str] = set()

        # 1. Try context-guarded price first
        for m in self._price_with_context.finditer(text):
            amt = m.group(1)
            if amt and self._validate_amount(amt, text, m.end()):
                amt_clean = amt.replace(",", ".")
                if amt_clean not in found_amounts:
                    score = self._compute_score(text, amt_clean, has_context=True, has_tax=has_tax, has_currency=True, has_date=has_date)
                    candidates.append(MRPCandidate(amt_clean, score, item, first_det, text, has_tax, "context_price", box))
                    found_amounts.add(amt_clean)

        # 2. Try currency prefix price (e.g. ₹50, Rs. 50, {50/-)
        for m in self._currency_prefix_price.finditer(text):
            amt = m.group(1)
            if amt and self._validate_amount(amt, text, m.end()):
                amt_clean = amt.replace(",", ".")
                if amt_clean not in found_amounts:
                    score = self._compute_score(text, amt_clean, has_context=has_context, has_tax=has_tax, has_currency=True, has_date=has_date)
                    candidates.append(MRPCandidate(amt_clean, score, item, first_det, text, has_tax, "currency_prefix", box))
                    found_amounts.add(amt_clean)

        # 3. Try currency suffix price (e.g. 50/-)
        for m in self._currency_suffix_price.finditer(text):
            amt = m.group(1)
            if amt and self._validate_amount(amt, text, m.end()):
                amt_clean = amt.replace(",", ".")
                if amt_clean not in found_amounts:
                    score = self._compute_score(text, amt_clean, has_context=has_context, has_tax=has_tax, has_currency=True, has_date=has_date)
                    candidates.append(MRPCandidate(amt_clean, score, item, first_det, text, has_tax, "currency_suffix", box))
                    found_amounts.add(amt_clean)

        # 4. If line has tax clause or MRP context, extract bare numbers
        if has_tax or has_context:
            for m in self._bare_number_extractor.finditer(text):
                amt = m.group(1)
                if amt and self._validate_amount(amt, text, m.end()):
                    amt_clean = amt.replace(",", ".")
                    if amt_clean not in found_amounts:
                        score = self._compute_score(text, amt_clean, has_context=has_context, has_tax=has_tax, has_currency=False, has_date=has_date)
                        candidates.append(MRPCandidate(amt_clean, score, item, first_det, text, has_tax, "tax_context_bare_number", box))
                        found_amounts.add(amt_clean)

        return candidates

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        # 1. First run 2D semantic label-to-value association
        associations = SemanticAssociator().associate(ocr_result)
        mrp_assoc = associations.get("mrp")
        if mrp_assoc:
            amt = mrp_assoc.value_match.extra.get("amount", mrp_assoc.value.replace("₹", "").strip())
            amt_clean = str(amt).replace(",", ".")
            tax_included = bool(mrp_assoc.supporting_evidence)
            tax_evidence = ", ".join(e.matched_text for e in mrp_assoc.supporting_evidence) if tax_included else None

            display_value = f"Rs. {amt_clean}"
            note = (
                "MRP context, numeric price, and statutory tax declaration detected."
                if tax_included
                else "MRP context and numeric price detected."
            )
            sub_fields: dict[str, str] = {
                "amount": amt_clean,
                "currency": "INR",
                "tax_included": "true" if tax_included else "false",
                "detection_method": "semantic_association",
            }
            if tax_evidence:
                sub_fields["supporting_evidence"] = tax_evidence

            first_det = mrp_assoc.value_match.detection
            return detected_field(
                self.field_name,
                first_det,
                display_value,
                note,
                confidence=mrp_assoc.confidence,
                source_line=mrp_assoc.label_match.detection if mrp_assoc.label_match else first_det,
                raw_text=f"{mrp_assoc.label_text} {amt}",
                normalized_text=f"{mrp_assoc.label_text} {amt}",
                matched_pattern="mrp_semantic_association",
                sub_fields=sub_fields,
                rule_reference="Rule 6(1)(e)",
                bounding_boxes=mrp_assoc.bounding_boxes,
            )

        all_candidates: list[MRPCandidate] = []

        # 2. Search grouped lines and stacked lines first
        line_items = list(ocr_result.grouped_lines) + list(ocr_result.stacked_lines)
        for line in line_items:
            all_candidates.extend(self._extract_candidates(line))

        # 3. Search raw detections as well
        for det in ocr_result.detections:
            all_candidates.extend(self._extract_candidates(det))

        # Filter out candidates with score < 35
        viable = [c for c in all_candidates if c.score >= 35.0]
        if not viable:
            return DetectedField.not_found(
                self.field_name,
                "No reliable MRP declaration detected.",
                rule_reference="Rule 6(1)(e)",
            )

        # Sort by score descending
        viable.sort(key=lambda c: -c.score)
        best = viable[0]

        # Check for ambiguity: if another candidate with different amount has score within 15 points
        alternatives = [
            c.amount for c in viable[1:]
            if c.amount != best.amount and (best.score - c.score) <= 15.0 and c.score >= 50.0
        ]
        # De-duplicate alternatives while preserving order
        unique_alternatives = list(dict.fromkeys(alternatives))

        display_value = f"Rs. {best.amount}"
        note = (
            "MRP context, numeric price, and statutory tax declaration detected."
            if best.tax_included
            else "MRP context and numeric price detected."
        )
        if unique_alternatives:
            note += f" Alternative candidate(s) observed: {', '.join(unique_alternatives)}."

        sub_fields = {
            "amount": best.amount,
            "currency": "INR",
            "tax_included": str(best.tax_included).lower(),
            "detection_method": best.pattern_name,
            "context_score": str(best.score),
        }
        if unique_alternatives:
            sub_fields["alternative_candidates"] = str(unique_alternatives)

        return detected_field(
            self.field_name,
            best.first_det,
            display_value,
            note,
            source_line=best.source_item if hasattr(best.source_item, "text") else None,
            raw_text=getattr(best.source_item, "raw_text", best.first_det.text),
            normalized_text=best.matched_text,
            matched_pattern=f"mrp_{best.pattern_name}",
            sub_fields=sub_fields,
            rule_reference="Rule 6(1)(e)",
            bounding_boxes=[best.box],
        )

