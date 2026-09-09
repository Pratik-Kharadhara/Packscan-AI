import sys
from pathlib import Path

backend_dir = Path(r"d:\SIH 2026\packscan-ai\BACKEND")
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import cv2
from src.ocr.ocr_service import OCRService
from src.pipeline.analysis_pipeline import AnalysisPipeline
from server import extract_percent_boxes, extract_raw_ocr_percent_boxes

upload_dir = Path(r"C:\Users\Pratik Kharadhara\.gemini\antigravity-ide\brain\c2d54823-1e5a-45cf-9fe1-387f15c9570c\.user_uploaded")
img_files = [
    upload_dir / "media_1788949171911.jpg", # Image 1: FSSAI panel
    upload_dir / "media_1788949172033.jpg", # Image 2: Front DUTA
    upload_dir / "media_1788949172079.jpg", # Image 3: Declaration strip (₹50)
    upload_dir / "media_1788949172089.jpg", # Image 4: Nutrition + Cookme Enterprises
]

ocr = OCRService()
pipeline = AnalysisPipeline()

print("=" * 70)
print("RUNNING VERIFICATION ON 4 UPLOADED PRODUCT IMAGES")
print("=" * 70)

panel_names = [
    "Panel 1: FSSAI Notice Panel",
    "Panel 2: Front Brand & Commodity Display",
    "Panel 3: MRP & Packaging Date Declaration Strip",
    "Panel 4: Nutrition Table & Manufacturer Address",
]

for idx, (p, name) in enumerate(zip(img_files, panel_names)):
    print("\n" + "=" * 70)
    print(f"[{idx + 1}] {name} ({p.name})")
    print("=" * 70)
    img = cv2.imread(str(p))
    if img is None:
        print("ERROR: Could not load image")
        continue

    h, w = img.shape[:2]
    print(f"Dimensions: {w}x{h} px")

    # Run analysis pipeline
    res = pipeline.analyze_package(img)
    proc_w = res.preprocessing.processed_width
    proc_h = res.preprocessing.processed_height
    rot = res.preprocessing.selected_rotation

    print(f"Selected Rotation: {rot}° | Processed dims: {proc_w}x{proc_h}")
    print(f"\n--- RAW OCR DETECTIONS ({len(res.ocr.detections)} tokens) ---")
    for d_idx, d in enumerate(res.ocr.detections):
        print(f"  {d_idx + 1:2d}. {repr(d.text):<36} (conf: {d.confidence:.4f})")

    print(f"\n--- STATUTORY COMPLIANCE FIELDS DETECTED ON THIS PANEL ---")
    found_any = False
    for f_name, det in res.detected_fields.items():
        if det.found:
            found_any = True
            print(f"  * {f_name.upper()}: '{det.value}' (conf: {det.confidence:.2f}, role: {det.role})")
    if not found_any:
        print("  (No statutory compliance fields on this panel)")

    # Raw OCR boxes
    raw_boxes = extract_raw_ocr_percent_boxes(res.ocr.detections, proc_w, proc_h)
    comp_boxes = extract_percent_boxes(res.detected_fields, proc_w, proc_h)
    print(f"\nUI Stats -> Compliance Boxes: {len(comp_boxes)} | All OCR Boxes: {len(raw_boxes)}")
