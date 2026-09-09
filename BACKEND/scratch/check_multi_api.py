import urllib.request
import json
import uuid
from pathlib import Path

pdir = Path(r"d:\SIH 2026\product2")
files_to_send = [
    pdir / "product2_1.jpg",
    pdir / "product2_2.jpg",
    pdir / "product2_3.jpg",
    pdir / "product2_4.jpg",
]

boundary = uuid.uuid4().hex
body_parts = []

for p in files_to_send:
    if not p.exists():
        continue
    with open(p, "rb") as f:
        content = f.read()
    body_parts.append(
        (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="files"; filename="{p.name}"\r\n'
            f"Content-Type: image/jpeg\r\n\r\n"
        ).encode("utf-8")
        + content
        + b"\r\n"
    )

body = b"".join(body_parts) + f"--{boundary}--\r\n".encode("utf-8")

req = urllib.request.Request(
    "http://127.0.0.1:8000/api/scan",
    data=body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
)

try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    print("SUCCESS: Received multi-angle API response.")
    print("images in response:", len(data.get("images", [])))
    for idx, panel in enumerate(data.get("images", [])):
        print(f"Panel {idx+1} ({panel.get('name')}): {len(panel.get('boundingBoxes', []))} compliance boxes, {len(panel.get('rawOcrBoxes', []))} raw OCR boxes")
        has_361 = any("361.79" in b.get("text", "") or "kcal" in b.get("text", "").lower() for b in panel.get("rawOcrBoxes", []))
        if has_361:
            print(f"  -> Panel {idx+1} contains 361.79 Kcal!")

except Exception as e:
    print("ERROR calling multi-angle API:", e)
