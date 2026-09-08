import sys
import time
import threading
import requests
import uvicorn
from server import app

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="error")

def test_full_pipeline_e2e():
    # Start server in background thread on port 8001
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    time.sleep(2)

    base_url = "http://127.0.0.1:8001"

    print("=== 1. Testing Health Endpoint ===")
    res = requests.get(f"{base_url}/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("Health check passed:", res.json())

    print("\n=== 2. Testing Scan API with Product1_7.jpeg ===")
    with open("data/sample_data/Product1_7.jpeg", "rb") as f:
        files = {"files": ("Product1_7.jpeg", f, "image/jpeg")}
        scan_res = requests.post(
            f"{base_url}/api/scan",
            files=files,
            data={"category": "Food & Beverages", "scan_mode": "single"},
        )

    assert scan_res.status_code == 200, f"Scan failed: {scan_res.text}"
    data = scan_res.json()
    print("Scan ID:", data.get("id"))
    print("Final Status:", data.get("finalStatus"))
    print("Overall Confidence:", data.get("overallConfidence"), "%")
    print("Detected Fields Count:", data.get("detectedCount"))
    print("Bounding boxes generated:", len(data.get("boundingBoxes", [])))
    for k, field in data.get("fields", {}).items():
        print(f"  - {k} ({field.get('status')}): {field.get('extractedText')}")

    print("\n=== 3. Testing SQLite History Endpoint ===")
    hist_res = requests.get(f"{base_url}/api/history")
    assert hist_res.status_code == 200, f"History failed: {hist_res.text}"
    history = hist_res.json()
    print(f"History retrieved {len(history)} records")
    assert len(history) > 0, "No records found in history"

    print("\n=== 4. Testing Official PDF Report Generation ===")
    pdf_res = requests.post(f"{base_url}/api/report/pdf", json=data)
    assert pdf_res.status_code == 200, f"PDF failed: {pdf_res.text}"
    pdf_size = len(pdf_res.content)
    print(f"PDF successfully generated ({pdf_size} bytes)")
    assert pdf_size > 1000, "PDF size too small"

    print("\n>>> ALL REAL-TIME API & OCR INTEGRATION CHECKS PASSED! <<<")

if __name__ == "__main__":
    test_full_pipeline_e2e()

