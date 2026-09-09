import sys
from pathlib import Path

backend_dir = Path(r"d:\SIH 2026\packscan-ai\BACKEND")
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import cv2
import easyocr
import numpy as np

# Load product2_3 (the declaration panel)
img_path = Path(r"d:\SIH 2026\product2\product2_3.jpg")
img = cv2.imread(str(img_path))
h, w = img.shape[:2]

print(f"Original image size: {w}x{h}")

# The declaration area in product2_3:
# The strip with "RP (For W.B.)", "Incl of all tax)", "₹50/- PKD.JUL/26", "₹51/- L.NO.L/G/26"
# and "Net Wt. : 50g"
# Let's define the declaration crop:
# In full image OCR, tokens like "ei Wt: : 503" was at y: 472..520, x: 60..230
# "{50/ - PKD JUL/ 26" was at y: 642..715, x: 269..668
# "E51 - L.NOL/6/26" was at y: 701..776, x: 272..677
crop_y1, crop_y2 = int(h * 0.35), int(h * 0.70)
crop_x1, crop_x2 = int(w * 0.05), int(w * 0.75)
crop = img[crop_y1:crop_y2, crop_x1:crop_x2]
ch, cw = crop.shape[:2]
print(f"Targeted crop size: {cw}x{ch}")

# Save crop for visual reference if needed
cv2.imwrite(str(backend_dir / "scratch" / "declaration_crop.jpg"), crop)

from src.ocr.ocr_service import OCRService

ocr_service = OCRService()
reader = ocr_service._get_reader()

def run_ocr(target_img, name, mag=1.0):
    res = reader.readtext(target_img, mag_ratio=mag)
    print(f"\n--- {name} (mag_ratio={mag}, total tokens={len(res)}) ---")
    target_terms = ["50", "51", "pkd", "jul", "wt", "net", "l.no", "lot", "serial"]
    for bbox, text, conf in res:
        matches = [t for t in target_terms if t in text.lower()]
        flag = f" [MATCH: {','.join(matches)}]" if matches else ""
        print(f"   {repr(text):<30} conf={conf:.4f}{flag}")

print("==================================================")
print("EXPERIMENT 1: Full Image vs Targeted Crop (mag_ratio=1.0)")
print("==================================================")
run_ocr(img, "FULL IMAGE", mag=1.0)
run_ocr(crop, "TARGETED CROP (raw RGB)", mag=1.0)

print("\n==================================================")
print("EXPERIMENT 2: Targeted Crop with mag_ratio 1.5 and 2.0")
print("==================================================")
run_ocr(crop, "TARGETED CROP", mag=1.5)
run_ocr(crop, "TARGETED CROP", mag=2.0)

print("\n==================================================")
print("EXPERIMENT 3: Targeted Crop with CLAHE (mag_ratio=1.0)")
print("==================================================")
gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
clahe_img = cv2.cvtColor(clahe.apply(gray), cv2.COLOR_GRAY2BGR)
run_ocr(clahe_img, "TARGETED CROP + CLAHE", mag=1.0)
