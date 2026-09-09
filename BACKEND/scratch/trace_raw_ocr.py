import sys
from pathlib import Path
import cv2

backend_dir = Path(r"d:\SIH 2026\packscan-ai\BACKEND")
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from src.ocr.ocr_service import OCRService

ocr = OCRService()
img_path = Path(r"d:\SIH 2026\product2\product2_3.jpg")
img = cv2.imread(str(img_path))
res = ocr.extract(img)

print(f"=== RAW OCR TOKENS FOR {img_path.name} ===")
for idx, d in enumerate(res.detections):
    text = d.text
    cps = [f"U+{ord(c):04X} ({c})" for c in text]
    print(f"Token {idx:02d}:")
    print(f"   repr: {repr(text)}")
    print(f"   conf: {d.confidence:.4f}")
    print(f"   bbox: {d.bounding_box}")
    print(f"   chars: {' '.join(cps)}")
