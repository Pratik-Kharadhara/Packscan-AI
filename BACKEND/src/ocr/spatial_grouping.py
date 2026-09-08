"""Adaptive spatial grouping for OCR bounding boxes.

Groups individual word/phrase bounding boxes into coherent horizontal lines
and stacked key-value blocks using height-adaptive geometric thresholds.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from src.ocr.ocr_normalizer import NormalizedDetection
from src.ocr.ocr_types import Point


def compute_bounding_envelope(
    boxes: list[tuple[Point, Point, Point, Point]],
) -> tuple[Point, Point, Point, Point]:
    """Compute the minimum bounding rectangle enclosing all input boxes."""
    if not boxes:
        return ((0.0, 0.0), (0.0, 0.0), (0.0, 0.0), (0.0, 0.0))
    all_x: list[float] = []
    all_y: list[float] = []
    for box in boxes:
        for x, y in box:
            all_x.append(float(x))
            all_y.append(float(y))
    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)
    return ((min_x, min_y), (max_x, min_y), (max_x, max_y), (min_x, max_y))


class GroupedLine(BaseModel):
    """A spatially coherent line formed by adjacent OCR detections."""

    text: str
    raw_text: str
    confidence: float = Field(ge=0.0, le=1.0)
    bounding_box: tuple[Point, Point, Point, Point]
    detections: list[NormalizedDetection]

    @property
    def box_height(self) -> float:
        ys = [p[1] for p in self.bounding_box]
        return max(ys) - min(ys)

    @property
    def box_width(self) -> float:
        xs = [p[0] for p in self.bounding_box]
        return max(xs) - min(xs)

    @property
    def center_y(self) -> float:
        ys = [p[1] for p in self.bounding_box]
        return sum(ys) / len(ys)

    @property
    def center_x(self) -> float:
        xs = [p[0] for p in self.bounding_box]
        return sum(xs) / len(xs)

    @property
    def left(self) -> float:
        return min(p[0] for p in self.bounding_box)

    @property
    def right(self) -> float:
        return max(p[0] for p in self.bounding_box)

    @property
    def top(self) -> float:
        return min(p[1] for p in self.bounding_box)

    @property
    def bottom(self) -> float:
        return max(p[1] for p in self.bounding_box)

    @classmethod
    def from_detections(cls, detections: list[NormalizedDetection]) -> "GroupedLine":
        """Build a GroupedLine from an ordered list of normalized detections."""
        if not detections:
            raise ValueError("detections list cannot be empty")

        # Sort left-to-right
        sorted_dets = sorted(detections, key=lambda d: d.center_x)
        text = " ".join(d.text for d in sorted_dets).strip()
        raw_text = " ".join(d.raw_text for d in sorted_dets).strip()
        avg_confidence = sum(d.confidence for d in sorted_dets) / len(sorted_dets)
        envelope = compute_bounding_envelope([d.bounding_box for d in sorted_dets])

        return cls(
            text=text,
            raw_text=raw_text,
            confidence=avg_confidence,
            bounding_box=envelope,
            detections=sorted_dets,
        )


class SpatialGrouper:
    """Adaptive spatial clustering of OCR detections."""

    def __init__(
        self,
        y_center_factor: float = 0.55,
        max_height_ratio_diff: float = 0.65,
        max_horizontal_gap_factor: float = 2.8,
        stacked_vertical_gap_factor: float = 1.8,
    ) -> None:
        self.y_center_factor = y_center_factor
        self.max_height_ratio_diff = max_height_ratio_diff
        self.max_horizontal_gap_factor = max_horizontal_gap_factor
        self.stacked_vertical_gap_factor = stacked_vertical_gap_factor

    def group_lines(self, detections: list[NormalizedDetection]) -> list[GroupedLine]:
        """Group detections into coherent lines using adaptive vertical and horizontal limits."""
        if not detections:
            return []

        # 1. Sort by vertical center (top-to-bottom)
        sorted_by_y = sorted(detections, key=lambda d: d.center_y)

        # 2. Cluster into rough vertical bands
        bands: list[list[NormalizedDetection]] = []
        for det in sorted_by_y:
            placed = False
            for band in bands:
                band_avg_h = sum(d.box_height for d in band) / len(band)
                band_avg_cy = sum(d.center_y for d in band) / len(band)
                ref_h = max(band_avg_h, det.box_height, 10.0)

                # Vertical similarity check (adaptive to font height)
                y_diff = abs(det.center_y - band_avg_cy)
                h_diff = abs(det.box_height - band_avg_h) / ref_h

                if y_diff <= (self.y_center_factor * ref_h) and h_diff <= self.max_height_ratio_diff:
                    band.append(det)
                    placed = True
                    break

            if not placed:
                bands.append([det])

        # 3. For each band, sort horizontally and split if horizontal gap is too large
        result_lines: list[GroupedLine] = []
        for band in bands:
            band_sorted_x = sorted(band, key=lambda d: d.left)
            current_segment: list[NormalizedDetection] = [band_sorted_x[0]]

            for next_det in band_sorted_x[1:]:
                prev_det = current_segment[-1]
                gap = next_det.left - prev_det.right
                ref_h = max(prev_det.box_height, next_det.box_height, 10.0)
                max_allowed_gap = self.max_horizontal_gap_factor * ref_h

                # If gap is small enough, keep in same segment; otherwise split!
                # (Prevents merging "MRP ₹32" on the left with "NET QTY 1kg" on far right)
                if gap <= max_allowed_gap:
                    current_segment.append(next_det)
                else:
                    result_lines.append(GroupedLine.from_detections(current_segment))
                    current_segment = [next_det]

            if current_segment:
                result_lines.append(GroupedLine.from_detections(current_segment))

        # Sort final lines top-to-bottom, left-to-right
        return sorted(result_lines, key=lambda line: (round(line.top / 20.0), line.left))

    def generate_stacked_pairs(self, lines: list[GroupedLine]) -> list[GroupedLine]:
        """Generate composite lines for vertically stacked declarations (e.g. NET QTY above 1 kg)."""
        stacked: list[GroupedLine] = []
        n = len(lines)

        for i in range(n):
            top_line = lines[i]
            for j in range(i + 1, min(i + 4, n)):
                bottom_line = lines[j]
                v_gap = bottom_line.top - top_line.bottom
                ref_h = max(top_line.box_height, bottom_line.box_height, 10.0)

                # Check if bottom_line is directly underneath top_line
                if 0 <= v_gap <= (self.stacked_vertical_gap_factor * ref_h):
                    # Check horizontal overlap
                    overlap = min(top_line.right, bottom_line.right) - max(top_line.left, bottom_line.left)
                    min_w = min(top_line.box_width, bottom_line.box_width)
                    if overlap > 0 or (abs(top_line.left - bottom_line.left) < ref_h * 2.0):
                        composite = GroupedLine(
                            text=f"{top_line.text} {bottom_line.text}",
                            raw_text=f"{top_line.raw_text} {bottom_line.raw_text}",
                            confidence=min(top_line.confidence, bottom_line.confidence),
                            bounding_box=compute_bounding_envelope([top_line.bounding_box, bottom_line.bounding_box]),
                            detections=top_line.detections + bottom_line.detections,
                        )
                        stacked.append(composite)

        return stacked
