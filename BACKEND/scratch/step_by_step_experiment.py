import sys
from pathlib import Path

backend_dir = Path(r"d:\SIH 2026\packscan-ai\BACKEND")
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import cv2
import numpy as np
from src.preprocessing.image_preprocessor import ImagePreprocessor
from src.ocr.ocr_service import OCRService
from src.pipeline.analysis_pipeline import AnalysisPipeline

preprocessor = ImagePreprocessor()
ocr = OCRService()
pipeline = AnalysisPipeline()

pdir = Path(r"d:\SIH 2026\product2")
imgs = {
    "product2_1": cv2.imread(str(pdir / "product2_1.jpg")),
    "product2_2": cv2.imread(str(pdir / "product2_2.jpg")),
    "product2_3": cv2.imread(str(pdir / "product2_3.jpg")),
    "product2_4": cv2.imread(str(pdir / "product2_4.jpg")),
}

print("=" * 60)
print("EXPERIMENT REPORT: STEP 1 - MEASUREMENTS")
print("=" * 60)

for name, img in imgs.items():
    if img is None:
        print(f"{name}: FAILED TO LOAD")
        continue
    orig_h, orig_w = img.shape[:2]
    prep_res = preprocessor.preprocess(img)
    proc_h, proc_w = prep_res.processed_image.shape[:2]
    print(f"[{name}] Original: {orig_w}x{orig_h} | Processed for OCR: {proc_w}x{proc_h} | Resized: {orig_w != proc_w or orig_h != proc_h}")

print("\n" + "=" * 60)
print("EXPERIMENT REPORT: STEP 5 - NUTRITION PANEL (product2_2) TRACE")
print("=" * 60)

p2 = imgs["product2_2"]
if p2 is not None:
    ocr_res = ocr.extract(p2)
    print(f"Total raw OCR detections on product2_2: {len(ocr_res.detections)}")
    nutrition_keywords = ["energy", "kcal", "fat", "protein", "carbohydrate", "calcium", "iron", "vitamin", "361.79"]
    found_nutr = []
    for d in ocr_res.detections:
        for kw in nutrition_keywords:
            if kw in d.text.lower():
                found_nutr.append((d.text, d.confidence, d.bounding_box))
                break
    print(f"Detected nutrition-related tokens ({len(found_nutr)}):")
    for text, conf, bbox in found_nutr:
        print(f"   - '{text}' (conf: {conf:.4f})")

    # Trace through pipeline
    pipe_res = pipeline.analyze_package(p2)
    print(f"\nPipeline detected_fields on product2_2:")
    for f_name, det in pipe_res.detected_fields.items():
        if det.found:
            print(f"   - {f_name}: value='{det.value}' (conf={det.confidence})")
        else:
            print(f"   - {f_name}: NOT FOUND")

print("\n" + "=" * 60)
print("EXPERIMENT REPORT: STEP 2 - DECLARATION PANEL (product2_3)")
print("=" * 60)

p3 = imgs["product2_3"]
if p3 is not None:
    ocr_p3 = ocr.extract(p3)
    print(f"Full-image raw OCR detections on product2_3 ({len(ocr_p3.detections)} tokens):")
    for d in ocr_p3.detections:
        print(f"   '{d.text}' (conf={d.confidence:.4f}) bbox={d.bounding_box}")

    # Let's find the declaration strip crop
    # In product2_3, let's see where the MRP / PKD / date is located
    # From previous testing / bbox, it's roughly in the middle-lower region or let's inspect all boxes
    h3, w3 = p3.shape[:2]
    # Crop around the declaration box
    # Let's crop y from 40% to 85%, x from 0% to 100%
    crop_strip = p3[int(h3*0.45):int(h3*0.80), int(w3*0.05):int(w3*0.95)]
    ch, cw = crop_strip.shape[:2]
    print(f"\nTargeted crop dimensions: {cw}x{ch}")
    ocr_crop = ocr.extract(crop_strip)
    print(f"Targeted crop raw OCR ({len(ocr_crop.detections)} tokens):")
    for d in ocr_crop.detections:
        print(f"   [CROP] '{d.text}' (conf={d.confidence:.4f})")

    # Test CLAHE vs raw on crop
    gray_crop = cv2.cvtColor(crop_strip, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    clahe_crop = clahe.apply(gray_crop)
    clahe_crop_bgr = cv2.cvtColor(clahe_crop, cv2.COLOR_GRAY2BGR)
    ocr_clahe = ocr.extract(clahe_crop_bgr)
    print(f"\nTargeted crop + CLAHE raw OCR ({len(ocr_clahe.detections)} tokens):")
    for d in ocr_clahe.detections:
        print(f"   [CLAHE CROP] '{d.text}' (conf={d.confidence:.4f})")
