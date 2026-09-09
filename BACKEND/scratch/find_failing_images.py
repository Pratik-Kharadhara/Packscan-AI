import sys
from pathlib import Path

backend_dir = Path(r"d:\SIH 2026\packscan-ai\BACKEND")
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import cv2
from src.ocr.ocr_service import OCRService

ocr = OCRService()

all_imgs = [
    *Path(r"d:\SIH 2026\product2").glob("*.jpg"),
    *Path(r"d:\SIH 2026\data").glob("*.jpg"),
    *Path(r"C:\Users\Pratik Kharadhara\Downloads\Telegram Desktop").glob("*.jpg"),
]

print(f"Scanning {len(all_imgs)} images for '361.79', '50/-', 'DUTA', 'JUL/26'...")

for p in all_imgs:
    img = cv2.imread(str(p))
    if img is None:
        continue
    res = ocr.extract(img)
    full = " ".join(d.text for d in res.detections)
    hits = []
    if "361.79" in full or "Kcal" in full or "kcal" in full:
        hits.append("Kcal/361.79")
    if "50" in full or "51" in full:
        hits.append("50/51")
    if "JUL" in full or "jul" in full:
        hits.append("JUL")
    if "DUTA" in full or "duta" in full or "GOLD" in full or "Gold" in full:
        hits.append("DUTA/GOLD")

    if hits:
        print(f"\nHIT on {p} -> {hits}")
        for d in res.detections:
            for term in ["361.79", "kcal", "50", "51", "JUL", "DUTA", "Gold", "GOLD"]:
                if term.lower() in d.text.lower():
                    print(f"   [{term}] token: {repr(d.text)} (conf={d.confidence:.3f})")
