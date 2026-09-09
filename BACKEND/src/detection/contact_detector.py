"""Consumer-contact declaration detector compliant with Legal Metrology Rule 6(2)."""

from __future__ import annotations

import re
from typing import Any

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
        self._office = compile_any(patterns.get("office_patterns", [
            r"\b(?:customer|consumer)\s+care\s+executive\b",
            r"\b(?:nodal|grievance)\s+officer\b",
            r"\bconsumer\s+care\s+cell\b",
            r"\bcare\s+executive\b",
        ]))
        self._entity = compile_any(patterns.get("entity_patterns", [
            r"\b[A-Z0-9 &.,'-]+(?:ltd|limited|pvt|private|corporation|industries|products)\b",
        ]))
        self._pin_code = re.compile(r"\b[1-9]\d{2}\s?\d{3}\b")
        self._address_cues = re.compile(
            r"\b(?:park|road|street|nagar|marg|lane|floor|block|sector|dist|district|state|"
            r"p\.?o\.?|post\s*office|gujarat|mumbai|kolkata|delhi|bengaluru|bangalore|chennai|hyderabad|"
            r"karnataka|india)\b",
            re.IGNORECASE,
        )
        self._non_contact_triggers = re.compile(
            r"\b(?:mrp|max(?:imum)?\s*retail\s*price|net\s*(?:qty|quantity|wt|weight)|"
            r"mfd|mfg\s*date|date\s*of\s*(?:mfg|pkd|packaging)|best\s*before|use\s*by|"
            r"nutritional?\s*information|nutrition\s*facts|energy\s*\d|barcode)\b",
            re.IGNORECASE,
        )

    def detect(self, ocr_result: OCRResult) -> DetectedField:
        # Check grouped lines first, then individual detections
        candidates_list = []
        if ocr_result.grouped_lines:
            candidates_list.append(list(ocr_result.grouped_lines))
        if ocr_result.detections:
            candidates_list.append(list(ocr_result.detections))
        if ocr_result.stacked_lines:
            candidates_list.append(list(ocr_result.stacked_lines))

        best_block = None
        best_score = -1.0

        for candidate_seq in candidates_list:
            block = self._extract_consumer_care_block(candidate_seq)
            if block:
                score = block["score"]
                if score > best_score:
                    best_score = score
                    best_block = block

        if best_block:
            cluster_lines = best_block["lines"]
            val = best_block["value"]
            sub_fields = best_block["sub_fields"]
            first_item = cluster_lines[0]
            first_det = (
                first_item.detections[0]
                if hasattr(first_item, "detections") and first_item.detections
                else first_item
            )

            # Aggregate all bounding boxes from lines and detections in the block
            all_boxes: list[Any] = []
            for item in cluster_lines:
                if hasattr(item, "bounding_box") and item.bounding_box:
                    box = item.bounding_box
                    if isinstance(box, list):
                        all_boxes.extend(box)
                    elif box not in all_boxes:
                        all_boxes.append(box)
                if hasattr(item, "detections"):
                    for d in item.detections:
                        if hasattr(d, "bounding_box") and d.bounding_box and d.bounding_box not in all_boxes:
                            all_boxes.append(d.bounding_box)

            if not all_boxes and hasattr(first_det, "bounding_box"):
                all_boxes = [first_det.bounding_box]

            combined_raw = "\n".join(
                getattr(line, "raw_text", getattr(line, "text", "")) for line in cluster_lines
            )
            combined_norm = "\n".join(getattr(line, "text", "") for line in cluster_lines)

            # Average confidence across all detections in the block
            all_confs: list[float] = []
            for item in cluster_lines:
                if hasattr(item, "confidence") and item.confidence is not None:
                    all_confs.append(float(item.confidence))
                if hasattr(item, "detections"):
                    for d in item.detections:
                        if hasattr(d, "confidence") and d.confidence is not None:
                            all_confs.append(float(d.confidence))
            avg_conf = (sum(all_confs) / len(all_confs)) if all_confs else 0.90

            note = "Consumer care context and contact details detected under Rule 6(2)."
            return detected_field(
                self.field_name,
                first_det,
                val,
                note,
                confidence=avg_conf,
                source_line=first_item,
                raw_text=combined_raw,
                normalized_text=combined_norm,
                matched_pattern="context_contact",
                sub_fields=sub_fields,
                rule_reference="Rule 6(2)",
                bounding_boxes=all_boxes,
            )

        return DetectedField.not_found(
            self.field_name,
            "No contact detail tied to an explicit consumer-care or grievance context detected.",
            rule_reference="Rule 6(2)",
        )

    def _extract_consumer_care_block(self, candidates: list[Any]) -> dict[str, Any] | None:
        """Find the best spatially and sequentially associated consumer care block in candidate lines."""
        n = len(candidates)
        best_match: dict[str, Any] | None = None
        best_score = -1.0

        for i, anchor in enumerate(candidates):
            anchor_text = getattr(anchor, "text", "")
            has_anchor_context = bool(self._context.search(anchor_text))

            # Also check if anchor itself has toll free or contact keyword
            toll_free_val = first_match(self._toll_free, anchor_text)
            phone_val = first_match(self._phone, anchor_text)
            email_val = first_match(self._email, anchor_text)

            # We start clustering if line has consumer context OR contact with context
            if not has_anchor_context and not (toll_free_val or phone_val or email_val):
                continue

            # Look backwards up to 2 lines for office or company header (e.g. TATA CONSUMER PRODUCTS LTD)
            cluster_start = i
            for back_idx in range(i - 1, max(-1, i - 3), -1):
                prev_line = candidates[back_idx]
                prev_text = getattr(prev_line, "text", "")
                if self._non_contact_triggers.search(prev_text):
                    break
                if self._entity.search(prev_text) or self._office.search(prev_text) or self._context.search(prev_text):
                    cluster_start = back_idx
                else:
                    break

            # Look forward up to 8 lines to assemble full consumer care block
            cluster_lines: list[Any] = []
            prev_line_item = None

            for fwd_idx in range(cluster_start, min(n, cluster_start + 8)):
                curr_line = candidates[fwd_idx]
                curr_text = getattr(curr_line, "text", "")

                # Stop if encountering an unrelated statutory field (MRP, Net Qty, Date, Nutrition)
                if fwd_idx > i and self._non_contact_triggers.search(curr_text):
                    break

                # Spatial continuity check if bounding coordinates exist
                if prev_line_item is not None:
                    prev_bottom = getattr(prev_line_item, "bottom", None)
                    curr_top = getattr(curr_line, "top", None)
                    if prev_bottom is not None and curr_top is not None and prev_bottom > 0 and curr_top > 0:
                        v_gap = curr_top - prev_bottom
                        ref_h = max(
                            getattr(prev_line_item, "box_height", 15.0),
                            getattr(curr_line, "box_height", 15.0),
                            12.0,
                        )
                        # Break if vertical gap indicates a completely different visual section
                        if v_gap > (3.5 * ref_h) and v_gap > 120.0:
                            break

                cluster_lines.append(curr_line)
                prev_line_item = curr_line

            # Extract evidence across all lines in this cluster
            combined_text = " ".join(getattr(l, "text", "") for l in cluster_lines)

            # Check context
            has_context = bool(self._context.search(combined_text))
            if not has_context:
                continue

            # Extract contacts
            c_toll_free = first_match(self._toll_free, combined_text)
            c_phone = first_match(self._phone, combined_text)
            c_email = first_match(self._email, combined_text)

            # Require at least one valid contact channel
            if not (c_toll_free or c_phone or c_email):
                continue

            # Extract office, entity, address, pin line-by-line to avoid greedy multi-line token consumption
            c_office = None
            for line in cluster_lines:
                lt = getattr(line, "text", "")
                m = self._office.search(lt)
                if m:
                    c_office = m.group(0).strip()
                    break

            c_company = None
            for line in cluster_lines:
                lt = getattr(line, "text", "")
                m = self._entity.search(lt)
                if m:
                    cand = m.group(0).strip()
                    if "," in cand:
                        cand = cand.split(",")[-1].strip()
                    c_company = cand
                    break

            c_pin = first_match(self._pin_code, combined_text)

            address_snippet = None
            for line in cluster_lines:
                lt = getattr(line, "text", "")
                if self._address_cues.search(lt) or self._pin_code.search(lt):
                    address_snippet = lt
                    break

            # Determine primary display value
            # If both phone/toll-free and email are present, combine them
            primary_phone = c_toll_free or c_phone
            if primary_phone and c_email:
                display_val = f"{primary_phone}, {c_email}"
            elif primary_phone:
                display_val = primary_phone
            else:
                display_val = str(c_email)

            # If single-line simple declaration (e.g. "Customer Care: 9876543210"), prefer the exact phone/val
            if len(cluster_lines) == 1:
                display_val = primary_phone or c_email or display_val

            sub_fields: dict[str, str] = {
                "has_context": "true",
                "has_contact": "true",
            }
            if c_toll_free:
                sub_fields["toll_free"] = c_toll_free
            if c_phone or c_toll_free:
                sub_fields["phone"] = c_phone or c_toll_free
            if c_email:
                sub_fields["email"] = c_email
            if c_office:
                sub_fields["office"] = c_office
            if c_company:
                sub_fields["company"] = c_company
            if address_snippet:
                sub_fields["address"] = address_snippet
            if c_pin:
                sub_fields["postal_code"] = c_pin

            score = 0.0
            if c_toll_free:
                score += 6.0
            if c_phone:
                score += 4.0
            if c_email:
                score += 5.0
            if c_office:
                score += 3.0
            if c_company:
                score += 2.0
            if address_snippet:
                score += 2.0
            if has_context:
                score += 4.0

            if score > best_score:
                best_score = score
                best_match = {
                    "lines": cluster_lines,
                    "value": display_val,
                    "sub_fields": sub_fields,
                    "score": score,
                }

        return best_match
