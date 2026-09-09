import json
import sys
from pathlib import Path
import cv2

backend_dir = Path(r"d:\SIH 2026\packscan-ai\BACKEND")
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

sys.stdout.reconfigure(encoding="utf-8")

from src.pipeline.analysis_pipeline import AnalysisPipeline
from src.ocr.ocr_normalizer import normalize_detections
from src.ocr.spatial_grouping import SpatialGrouper

pipeline = AnalysisPipeline()
grouper = SpatialGrouper()

images = sorted(Path(r"d:\SIH 2026\product2").glob("*.jpg"))

for img_path in images:
    print(f"\n=======================================================")
    print(f"IMAGE: {img_path.name}")
    print(f"=======================================================")
    img = cv2.imread(str(img_path))
    res = pipeline.analyze_package(img)

    print(f"Preprocessing rotation: {res.preprocessing.selected_rotation}°")
    print(f"\n--- RAW OCR TOKENS ({len(res.ocr.detections)}) ---")
    for idx, d in enumerate(res.ocr.detections):
        codepoints = [f"U+{ord(c):04X}" for c in d.text]
        print(f"  [{idx:02d}] conf={d.confidence:.3f} | repr={repr(d.text)} | cps={codepoints[:6]} | bbox={d.bounding_box[0]}")

    print(f"\n--- NORMALIZED TOKENS ---")
    norm_dets = normalize_detections(res.ocr.detections)
    for idx, nd in enumerate(norm_dets):
        if nd.text != nd.raw_text:
            print(f"  [{idx:02d}] raw={repr(nd.raw_text)} -> norm={repr(nd.text)}")

    print(f"\n--- GROUPED LINES ({len(res.ocr.grouped_lines)}) ---")
    for idx, gl in enumerate(res.ocr.grouped_lines):
        print(f"  Line {idx:02d}: {repr(gl.text)} (conf={gl.confidence:.3f})")

    print(f"\n--- DETECTED FIELDS ---")
    for f_name, f_val in res.detected_fields.items():
        if f_val.found:
            print(f"  FOUND {f_name}: {repr(f_val.value)} (conf={f_val.confidence}) pattern={f_val.matched_pattern} sub_fields={f_val.sub_fields}")
        else:
            print(f"  NOT FOUND {f_name}: {f_val.notes}")

    print(f"\n--- COMPLIANCE STATUS: {res.compliance.overall_status.value} ---")
    for chk in res.compliance.checks:
        print(f"  {chk.field}: status={chk.status.value} reason={chk.reason}")
