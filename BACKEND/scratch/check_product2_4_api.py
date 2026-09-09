import urllib.request
import json
import uuid
from pathlib import Path

img_path = Path(r"d:\SIH 2026\product2\product2_4.jpg")
boundary = uuid.uuid4().hex

with open(img_path, "rb") as f:
    file_bytes = f.read()

body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="files"; filename="{img_path.name}"\r\n'
    f"Content-Type: image/jpeg\r\n\r\n"
).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

req = urllib.request.Request(
    "http://127.0.0.1:8000/api/scan",
    data=body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
)

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    print("SUCCESS: Received API response.")
    print("Keys in response:", list(data.keys()))
    print("rawOcrBoxes in root count:", len(data.get("rawOcrBoxes", [])))
    print("boundingBoxes in root count:", len(data.get("boundingBoxes", [])))
    print("images in response:", data.get("images") is not None)

    raw_boxes = data.get("rawOcrBoxes", [])
    has_361 = any("361.79" in b.get("text", "") or "kcal" in b.get("text", "").lower() for b in raw_boxes)
    print("rawOcrBoxes contains 361.79 Kcal:", has_361)
    for b in raw_boxes:
        if "361" in b.get("text", "") or "kcal" in b.get("text", "").lower():
            print("Matching box:", b)

    prod_identity = data.get("fields", {}).get("commodity", {})
    print("Commodity field status:", prod_identity.get("status"))
    print("Commodity field extractedText:", prod_identity.get("extractedText"))

except Exception as e:
    print("ERROR calling API:", e)
