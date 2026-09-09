"""Semantic label-to-value association layer for Legal Metrology declaration extraction.

Associates statutory values (dates, quantities, prices) with nearby statutory labels
(Date of Packaging, Mfg, Use By, Expiry, Best Before, MRP, Net Quantity) using
bounding-box geometry, spatial proximity, and contextual alignment.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import math
import re
from typing import Any

from src.ocr.ocr_service import OCRResult
from src.ocr.ocr_types import OCRDetection, Point


STATUTORY_LABELS: dict[str, list[str]] = {
    "packaging_date": [
        r"\bdate\s*of\s*packa[tq]ing\b",
        r"\bdate\s*of\s*packaging\b",
        r"\bpackaging\s*date\b",
        r"\bdate\s*of\s*pkd\b",
        r"\bpkd\s*date\b",
        r"\bpkd\b",
        r"\bpacked\b",
        r"\bpackaging\b",
    ],
    "manufacture_date": [
        r"\bda[tl]e\s*of\s*mfg\b",
        r"\bdate\s*of\s*mfg\b",
        r"\bmfg\s*date\b",
        r"\bdate\s*of\s*manufacture\b",
        r"\bmanufacture\s*date\b",
        r"\bdate\s*of\s*mfd\b",
        r"\bmfd\s*date\b",
        r"\bmfg\b",
        r"\bmfd\b",
        r"\bmanufactured\b",
    ],
    "use_by_date": [
        r"\buse\s*by\b",
        r"\buse\s*before\b",
    ],
    "expiry_date": [
        r"\bexpiry\s*(?:date)?\b",
        r"\bexp\s*(?:date)?\b",
        r"\bexpiry\b",
        r"\bexp\b",
    ],
    "best_before_date": [
        r"\bbest\s*before\b",
    ],
    "mrp": [
        r"\bm\.?r\.?p\.?\b",
        r"\bmax(?:imum)?\s*retail\s*price\b",
        r"\bretail\s*price\b",
        r"\br\.?p\.?\b",
        r"\bmrp\?",
    ],
    "tax_included": [
        r"\b(?:incl[;:,.]*|inclusive)\s*(?:of)?\s*(?:all\s*tax(?:es)?|ofalltaxes)\b",
    ],
    "net_quantity": [
        r"\bnet\s*(?:qty|quantity|wt|weight)?\b",
    ],
    "batch_number": [
        r"\b(?:batch|b\.?\s*no|lot|l\.?\s*no|bn)\b",
    ],
}

COMPILED_LABELS: dict[str, re.Pattern[str]] = {
    cat: re.compile("|".join(f"(?:{p})" for p in patterns), re.IGNORECASE)
    for cat, patterns in STATUTORY_LABELS.items()
}

DATE_VALUE_REGEX = re.compile(
    r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b|"
    r"\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[ ./-]+\d{2,4})\b|"
    r"\b(\d{1,2}[ ./-]+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[ .,-]+\d{2,4})\b|"
    r"\b((?:0?[1-9]|1[0-2])[/-]\d{2,4})\b",
    re.IGNORECASE,
)

QTY_VALUE_REGEX = re.compile(
    r"\b(\d+(?:[.,]\d+)?)\s*(mg|g|gm|gms|kg|ml|l|litre|litres|pcs?|pieces?|units?|n|u)\b",
    re.IGNORECASE,
)

DATE_FALSE_POSITIVE = re.compile(
    r"(?:/|[a-zA-Z]{3}/|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[/-])\d+\s*g\b",
    re.IGNORECASE,
)

PRICE_VALUE_REGEX = re.compile(
    r"(?:(?:[₹\?<*{]|rs\.?|inr)\s*)?(\d{1,5}(?:[.,]\d{1,2})?)\s*(?:/[-–—]|/ -|/-)?",
    re.IGNORECASE,
)


@dataclass
class StatutoryLabelMatch:
    category: str
    text: str
    matched_text: str
    detection: Any
    bounding_box: tuple[Point, Point, Point, Point] | None
    left: float
    top: float
    right: float
    bottom: float
    center_x: float
    center_y: float
    width: float
    height: float
    index: int


@dataclass
class StatutoryValueMatch:
    val_type: str  # "date", "quantity", "price"
    raw_value: str
    normalized_value: str
    matched_text: str
    detection: Any
    bounding_box: tuple[Point, Point, Point, Point] | None
    left: float
    top: float
    right: float
    bottom: float
    center_x: float
    center_y: float
    width: float
    height: float
    index: int
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class AssociationResult:
    category: str
    label_text: str
    value: str
    label_match: StatutoryLabelMatch | None
    value_match: StatutoryValueMatch
    score: float
    supporting_evidence: list[StatutoryLabelMatch] = field(default_factory=list)
    bounding_boxes: list[tuple[Point, Point, Point, Point]] = field(default_factory=list)
    confidence: float = 0.90


def _get_box_coords(box: Any) -> tuple[float, float, float, float, float, float, float, float]:
    """Return left, top, right, bottom, center_x, center_y, width, height."""
    if not box:
        return 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    pts = list(box)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    l, r = min(xs), max(xs)
    t, b = min(ys), max(ys)
    return l, t, r, b, (l + r) / 2.0, (t + b) / 2.0, (r - l), (b - t)


class SemanticAssociator:
    """Discovers and pairs statutory labels with their geographically nearest values."""

    def __init__(self) -> None:
        self._label_patterns = COMPILED_LABELS

    def associate(self, ocr_result: OCRResult) -> dict[str, AssociationResult]:
        """Perform 2D geometric and contextual association across all detections in ocr_result."""
        detections = list(ocr_result.detections)
        if not detections and ocr_result.grouped_lines:
            detections = [
                d
                for line in ocr_result.grouped_lines
                for d in (line.detections if hasattr(line, "detections") else [line])
            ]

        # 1. Extract labels and values
        labels: list[StatutoryLabelMatch] = []
        date_values: list[StatutoryValueMatch] = []
        qty_values: list[StatutoryValueMatch] = []
        price_values: list[StatutoryValueMatch] = []

        for idx, det in enumerate(detections):
            text = getattr(det, "text", "")
            raw_text = getattr(det, "raw_text", text)
            box = getattr(det, "bounding_box", None)
            l, t, r, b, cx, cy, w, h = _get_box_coords(box)

            # Check for statutory labels
            for cat, pat in self._label_patterns.items():
                m = pat.search(text)
                if m:
                    labels.append(
                        StatutoryLabelMatch(
                            category=cat,
                            text=text,
                            matched_text=m.group(0).strip(),
                            detection=det,
                            bounding_box=box,
                            left=l,
                            top=t,
                            right=r,
                            bottom=b,
                            center_x=cx,
                            center_y=cy,
                            width=w,
                            height=h,
                            index=idx,
                        )
                    )

            # Check for date values
            for dm in DATE_VALUE_REGEX.finditer(text):
                matched_val = dm.group(0).strip()
                # Exclude obvious non-dates (e.g. fractions or dimensions)
                if len(matched_val) >= 4:
                    date_values.append(
                        StatutoryValueMatch(
                            val_type="date",
                            raw_value=matched_val,
                            normalized_value=matched_val,
                            matched_text=text,
                            detection=det,
                            bounding_box=box,
                            left=l,
                            top=t,
                            right=r,
                            bottom=b,
                            center_x=cx,
                            center_y=cy,
                            width=w,
                            height=h,
                            index=idx,
                        )
                    )

            # Check for net quantity values
            for qm in QTY_VALUE_REGEX.finditer(text):
                num, unit = qm.group(1), qm.group(2).lower()
                window = text[max(0, qm.start() - 10) : min(len(text), qm.end() + 2)]
                if DATE_FALSE_POSITIVE.search(window):
                    continue
                norm_q = f"{num} {unit}"
                qty_values.append(
                    StatutoryValueMatch(
                        val_type="quantity",
                        raw_value=norm_q,
                        normalized_value=norm_q,
                        matched_text=text,
                        detection=det,
                        bounding_box=box,
                        left=l,
                        top=t,
                        right=r,
                        bottom=b,
                        center_x=cx,
                        center_y=cy,
                        width=w,
                        height=h,
                        index=idx,
                        extra={"amount": num, "unit": unit},
                    )
                )

            # Check for price values
            for pm in PRICE_VALUE_REGEX.finditer(text):
                p_num = pm.group(1)
                # Filter out pure small numbers without currency unless adjacent to MRP
                if p_num and not QTY_VALUE_REGEX.search(text) and not DATE_VALUE_REGEX.search(text):
                    price_values.append(
                        StatutoryValueMatch(
                            val_type="price",
                            raw_value=p_num,
                            normalized_value=f"₹{p_num}",
                            matched_text=text,
                            detection=det,
                            bounding_box=box,
                            left=l,
                            top=t,
                            right=r,
                            bottom=b,
                            center_x=cx,
                            center_y=cy,
                            width=w,
                            height=h,
                            index=idx,
                            extra={"amount": p_num},
                        )
                    )

        # 2. Perform bipartite competitive matching
        results: dict[str, AssociationResult] = {}

        # 2a. Associate Dates (Packaging Date, Manufacture Date, Use By Date, Expiry Date, Best Before Date)
        date_categories = ["packaging_date", "manufacture_date", "use_by_date", "expiry_date", "best_before_date"]
        date_labels = [l for l in labels if l.category in date_categories]

        date_pair_scores: list[tuple[float, StatutoryLabelMatch, StatutoryValueMatch]] = []
        for d_lbl in date_labels:
            for d_val in date_values:
                score = self._compute_spatial_affinity(d_lbl, d_val)
                if score > 0:
                    date_pair_scores.append((score, d_lbl, d_val))

        # Sort highest score first
        date_pair_scores.sort(key=lambda x: x[0], reverse=True)

        assigned_labels: set[int] = set()
        assigned_values: set[int] = set()

        for score, lbl, val in date_pair_scores:
            lbl_id = id(lbl)
            val_id = id(val)
            if lbl_id in assigned_labels or val_id in assigned_values:
                continue

            assigned_labels.add(lbl_id)
            assigned_values.add(val_id)

            boxes = []
            if lbl.bounding_box:
                boxes.append(lbl.bounding_box)
            if val.bounding_box and val.bounding_box not in boxes:
                boxes.append(val.bounding_box)

            conf = (
                (float(getattr(lbl.detection, "confidence", 0.95)) + float(getattr(val.detection, "confidence", 0.95)))
                / 2.0
            )

            results[lbl.category] = AssociationResult(
                category=lbl.category,
                label_text=lbl.matched_text,
                value=val.normalized_value,
                label_match=lbl,
                value_match=val,
                score=score,
                bounding_boxes=boxes,
                confidence=conf,
            )

        # 2b. Associate Net Quantity
        qty_labels = [l for l in labels if l.category == "net_quantity"]
        best_qty_score = -1.0
        best_qty_pair = None

        for q_lbl in qty_labels:
            for q_val in qty_values:
                score = self._compute_spatial_affinity(q_lbl, q_val)
                if score > best_qty_score:
                    best_qty_score = score
                    best_qty_pair = (q_lbl, q_val)

        if best_qty_pair:
            q_lbl, q_val = best_qty_pair
            boxes = []
            if q_lbl.bounding_box:
                boxes.append(q_lbl.bounding_box)
            if q_val.bounding_box and q_val.bounding_box not in boxes:
                boxes.append(q_val.bounding_box)

            conf = (
                (float(getattr(q_lbl.detection, "confidence", 0.95)) + float(getattr(q_val.detection, "confidence", 0.95)))
                / 2.0
            )
            results["net_quantity"] = AssociationResult(
                category="net_quantity",
                label_text=q_lbl.matched_text,
                value=q_val.normalized_value,
                label_match=q_lbl,
                value_match=q_val,
                score=best_qty_score,
                bounding_boxes=boxes,
                confidence=conf,
            )

        # 2c. Associate MRP and Tax Support
        mrp_labels = [l for l in labels if l.category == "mrp"]
        tax_labels = [l for l in labels if l.category == "tax_included"]
        batch_labels = [l for l in labels if l.category == "batch_number"]

        best_mrp_score = -1.0
        best_mrp_pair = None

        for m_lbl in mrp_labels:
            for p_val in price_values:
                # Value must not be a date or quantity
                if p_val.raw_value in [v.raw_value for v in date_values]:
                    continue

                # Check if this numeric value is actually a batch number governed by BN/Lot/Batch
                is_batch_val = False
                for b_lbl in batch_labels:
                    b_score = self._compute_spatial_affinity(b_lbl, p_val)
                    if b_score > 35.0:
                        is_batch_val = True
                        break
                if is_batch_val:
                    continue

                score = self._compute_spatial_affinity(m_lbl, p_val)

                # Bonus for explicit two-decimal price format (e.g. 50.00) or currency symbol
                amt_str = p_val.extra.get("amount", p_val.raw_value)
                if "." in amt_str or "," in amt_str:
                    score += 15.0
                if "₹" in p_val.matched_text or "rs" in p_val.matched_text.lower():
                    score += 10.0

                # Strong bonus for exact same-row horizontal alignment (top edges within 20% height)
                if m_lbl.height > 0 and abs(p_val.top - m_lbl.top) <= 0.25 * m_lbl.height:
                    score += 15.0

                if score > best_mrp_score:
                    best_mrp_score = score
                    best_mrp_pair = (m_lbl, p_val)

        if best_mrp_pair:
            m_lbl, p_val = best_mrp_pair
            boxes = []
            if m_lbl.bounding_box:
                boxes.append(m_lbl.bounding_box)
            if p_val.bounding_box and p_val.bounding_box not in boxes:
                boxes.append(p_val.bounding_box)

            # Find supporting tax labels near MRP
            supporting_tax = []
            for t_lbl in tax_labels:
                t_score = self._compute_spatial_affinity(m_lbl, t_lbl)
                if t_score > 20.0 or abs(t_lbl.top - m_lbl.bottom) < 150.0:
                    supporting_tax.append(t_lbl)
                    if t_lbl.bounding_box and t_lbl.bounding_box not in boxes:
                        boxes.append(t_lbl.bounding_box)

            conf = (
                (float(getattr(m_lbl.detection, "confidence", 0.95)) + float(getattr(p_val.detection, "confidence", 0.95)))
                / 2.0
            )
            results["mrp"] = AssociationResult(
                category="mrp",
                label_text=m_lbl.matched_text,
                value=p_val.normalized_value,
                label_match=m_lbl,
                value_match=p_val,
                score=best_mrp_score,
                supporting_evidence=supporting_tax,
                bounding_boxes=boxes,
                confidence=conf,
            )

        return results

    def _compute_spatial_affinity(self, label: Any, val: Any) -> float:
        """Compute geometric 2D spatial affinity between label and value."""
        # Same detection / token: maximum score
        if getattr(label, "detection", None) is getattr(val, "detection", None):
            return 100.0

        l_box = getattr(label, "bounding_box", None)
        v_box = getattr(val, "bounding_box", None)

        # Fallback if bounding boxes are missing or mock 0,0
        if not l_box or not v_box or (label.width == 0 and label.height == 0):
            idx_diff = abs(getattr(val, "index", 0) - getattr(label, "index", 0))
            if idx_diff <= 2:
                return max(10.0, 60.0 - idx_diff * 15.0)
            return 0.0

        ref_h = max(label.height, val.height, 15.0)
        ref_w = max(label.width, val.width, 30.0)

        # 1. Horizontal side-by-side row configuration (e.g. NET QUANTITY: 100 g, MRP: 50.00)
        h_gap = val.left - label.right
        v_overlap = min(label.bottom, val.bottom) - max(label.top, val.top)
        center_dy = abs(val.center_y - label.center_y)

        if v_overlap > -0.2 * ref_h and -0.5 * ref_h <= h_gap <= 5.0 * ref_h:
            score = 85.0 - (max(0.0, h_gap) / ref_h) * 5.0 - (center_dy / ref_h) * 8.0
            return max(0.0, score)

        # 2. Vertical stacked column configuration (e.g. Date of Packaging above 27/07/26)
        v_gap = val.top - label.bottom
        h_overlap = min(label.right, val.right) - max(label.left, val.left)
        center_dx = abs(val.center_x - label.center_x)
        left_dx = abs(val.left - label.left)

        if v_gap >= -0.3 * ref_h and v_gap <= 4.0 * ref_h:
            if h_overlap > -0.4 * ref_w or center_dx <= 1.4 * ref_w or left_dx <= 0.4 * ref_w:
                score = 80.0 - (max(0.0, v_gap) / ref_h) * 5.0 - (center_dx / ref_w) * 10.0
                if left_dx <= 0.25 * ref_w:
                    score += 10.0  # Column left alignment bonus
                return max(0.0, score)

        # 3. Euclidean distance fallback for diagonally nearby pairs
        dist = math.hypot(val.center_x - label.center_x, val.center_y - label.center_y)
        if dist <= 3.5 * max(ref_w, ref_h):
            return max(0.0, 45.0 - (dist / max(ref_w, ref_h)) * 10.0)

        return 0.0
