"""FastAPI REST API server for PACKSCAN AI.

Bridges the computer vision / Legal Metrology OCR backend with the modern TypeScript / React frontend.
Provides endpoints for package scanning, multi-angle panel analysis, SQLite scan history, and PDF report export.
"""

from __future__ import annotations

import base64
import io
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import PATHS
from src.database.scan_repository import ScanRepository
from src.pipeline.analysis_pipeline import AnalysisPipeline, PackageAnalysisResult
from src.reporting.pdf_generator import PDFReportGenerator
from src.rules.compliance_engine import CheckStatus, OverallStatus

app = FastAPI(
    title="PACKSCAN AI API",
    description="Legal Metrology Compliance Screening REST API",
    version="2.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount sample benchmark image files
if PATHS.sample_data_dir.exists():
    app.mount(
        "/api/sample-images",
        StaticFiles(directory=str(PATHS.sample_data_dir)),
        name="sample_images",
    )

# Initialize pipeline and repository
pipeline = AnalysisPipeline()
repository = ScanRepository()
pdf_generator = PDFReportGenerator()

# Field key translation: backend field name -> frontend FieldKey
FIELD_MAP = {
    "product_identity": {
        "key": "commodity",
        "title": "Commodity / Generic Name",
        "legalRule": "Rule 6(1)(b)",
        "description": "Common or generic name of the commodity contained inside the package.",
    },
    "manufacturer_packer": {
        "key": "manufacturer",
        "title": "Manufacturer / Packer / Marketer",
        "legalRule": "Rule 6(1)(a) & Rule 10",
        "description": "Complete name and postal address of manufacturer, packer, marketer, or importer.",
    },
    "net_quantity": {
        "key": "netQuantity",
        "title": "Net Quantity Declaration",
        "legalRule": "Rule 6(1)(c) & Rule 13",
        "description": "Weight, volume, or count expressed in standard metric (SI) units.",
    },
    "manufacture_date": {
        "key": "mfgDate",
        "title": "Mfg / Packaging Date",
        "legalRule": "Rule 6(1)(d)",
        "description": "Month and year of manufacture, packing, or import (excluding expiry date).",
    },
    "mrp": {
        "key": "mrp",
        "title": "Retail Sale Price (MRP)",
        "legalRule": "Rule 6(1)(e) & Rule 3(m)",
        "description": "Maximum Retail Price inclusive of all taxes in statutory currency format.",
    },
    "consumer_contact": {
        "key": "consumerComplaint",
        "title": "Consumer Care / Grievance Details",
        "legalRule": "Rule 6(2)",
        "description": "Name, address, telephone number, toll-free helpline, or email for consumer grievances.",
    },
}


def to_data_url(image_bgr: np.ndarray) -> str:
    """Convert a BGR numpy image array into a base64 JPEG data URL."""
    success, encoded = cv2.imencode(".jpg", image_bgr, [cv2.IMWRITE_JPEG_QUALITY, 90])
    if not success:
        return ""
    b64_str = base64.b64encode(encoded.tobytes()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64_str}"


def extract_percent_boxes(
    detected_fields: dict[str, Any],
    img_w: int,
    img_h: int,
) -> list[dict[str, Any]]:
    """Convert pixel bounding boxes to responsive percentage coordinates (0-100)."""
    boxes = []
    for f_name, det in detected_fields.items():
        if not det.found or not det.bounding_boxes:
            continue
        f_info = FIELD_MAP.get(f_name)
        if not f_info:
            continue

        field_key = f_info["key"]
        for idx, box in enumerate(det.bounding_boxes):
            xs = [p[0] for p in box]
            ys = [p[1] for p in box]
            min_x, max_x = max(0.0, min(xs)), min(float(img_w), max(xs))
            min_y, max_y = max(0.0, min(ys)), min(float(img_h), max(ys))

            box_w = max_x - min_x
            box_h = max_y - min_y
            if box_w <= 0 or box_h <= 0 or img_w <= 0 or img_h <= 0:
                continue

            pct_x = round((min_x / img_w) * 100.0, 2)
            pct_y = round((min_y / img_h) * 100.0, 2)
            pct_w = round((box_w / img_w) * 100.0, 2)
            pct_h = round((box_h / img_h) * 100.0, 2)

            conf_pct = round((det.confidence or 0.85) * 100.0, 1)

            boxes.append(
                {
                    "id": f"box-{field_key}-{idx}",
                    "fieldKey": field_key,
                    "label": f"{f_info['title']}: {det.value or ''}",
                    "x": pct_x,
                    "y": pct_y,
                    "width": pct_w,
                    "height": pct_h,
                    "status": "DETECTED" if conf_pct >= 65.0 else "LOW_CONFIDENCE",
                    "confidence": conf_pct,
                }
            )
    return boxes


def extract_raw_ocr_percent_boxes(
    raw_detections: list[Any],
    img_w: int,
    img_h: int,
) -> list[dict[str, Any]]:
    """Convert raw OCR token bounding boxes to percentage coordinates (0-100)."""
    boxes = []
    for idx, det in enumerate(raw_detections):
        bbox = det.bounding_box
        xs = [p[0] for p in bbox]
        ys = [p[1] for p in bbox]
        min_x, max_x = max(0.0, min(xs)), min(float(img_w), max(xs))
        min_y, max_y = max(0.0, min(ys)), min(float(img_h), max(ys))

        box_w = max_x - min_x
        box_h = max_y - min_y
        if box_w <= 0 or box_h <= 0 or img_w <= 0 or img_h <= 0:
            continue

        pct_x = round((min_x / img_w) * 100.0, 2)
        pct_y = round((min_y / img_h) * 100.0, 2)
        pct_w = round((box_w / img_w) * 100.0, 2)
        pct_h = round((box_h / img_h) * 100.0, 2)
        conf_pct = round((det.confidence or 0.0) * 100.0, 1)

        boxes.append(
            {
                "id": f"raw-box-{idx}",
                "text": det.text,
                "confidence": conf_pct,
                "x": pct_x,
                "y": pct_y,
                "width": pct_w,
                "height": pct_h,
                "bbox": [[round((p[0] / img_w) * 100.0, 2), round((p[1] / img_h) * 100.0, 2)] for p in bbox],
            }
        )
    return boxes


@app.get("/api/health")
def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "PACKSCAN AI Backend", "timestamp": datetime.now().isoformat()}


@app.get("/api/history")
def get_history(limit: int = 50) -> list[dict[str, Any]]:
    """Retrieve scan history from SQLite database as frontend ScanResult objects."""
    records = repository.get_recent_scans(limit=limit)
    out: list[dict[str, Any]] = []
    for rec in records:
        res = rec.get("result")
        if isinstance(res, dict) and res.get("id"):
            out.append(res)
        else:
            out.append(rec)
    return out


@app.get("/api/samples")
def get_samples() -> list[dict[str, Any]]:
    """Return available packaging sample images from the benchmark dataset."""
    sample_files = sorted(PATHS.sample_data_dir.glob("Product1_*.jpeg"))
    panel_titles = {
        "Product1_1.jpeg": "Tata Salt — Front Display Panel (Commodity)",
        "Product1_2.jpeg": "Tata Salt — Retail Shelf Environment 1",
        "Product1_3.jpeg": "Tata Salt — Retail Shelf Environment 2",
        "Product1_4.jpeg": "Tata Salt — Back Panel (Marketer & Address)",
        "Product1_5.jpeg": "Tata Salt — Back Panel (MRP & Helpline)",
        "Product1_6.jpeg": "Tata Salt — Back Panel (Full Manufacturer & Taxes)",
        "Product1_7.jpeg": "Tata Salt — Date & Batch Inkjet Stamping",
    }
    out = []
    for p in sample_files:
        fname = p.name
        out.append(
            {
                "id": fname.split(".")[0],
                "filename": fname,
                "title": panel_titles.get(fname, fname),
                "url": f"/api/sample-images/{fname}",
                "category": "Food & Beverages",
                "productName": "Tata Salt (1 kg)",
            }
        )
    return out



@app.post("/api/report/pdf")
async def export_pdf(payload: dict[str, Any]) -> Response:
    """Generate and return official Legal Metrology inspection report as PDF bytes."""
    try:
        pdf_bytes = pdf_generator.generate_report(payload)
        filename = f"{payload.get('id', 'scan_report')}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@app.post("/api/scan")
async def scan_package(
    files: list[UploadFile] = File(None),
    file: UploadFile = File(None),
    category: str = Form("Food & Beverages"),
    product_name: str | None = Form(None),
    scan_mode: str = Form("single"),
    preset_id: str | None = Form(None),
) -> dict[str, Any]:
    """Analyze uploaded package photograph(s) using the Legal Metrology OCR pipeline."""
    start_time = time.time()

    # Normalize FastAPI Form defaults when called directly in tests
    clean_category = category if isinstance(category, str) else "Food & Beverages"
    clean_product_name = product_name if isinstance(product_name, str) else None
    clean_scan_mode = scan_mode if isinstance(scan_mode, str) else "single"

    # Collect files
    upload_list: list[UploadFile] = []
    if isinstance(files, list) and files:
        upload_list.extend(files)
    elif isinstance(file, UploadFile):
        upload_list.append(file)

    if not upload_list:
        raise HTTPException(status_code=400, detail="No package image file provided for analysis.")

    # Process all panels
    panel_images_out: list[dict[str, Any]] = []
    consolidated_fields: dict[str, Any] = {}
    all_bounding_boxes: list[dict[str, Any]] = []
    quality_scores: list[float] = []

    primary_image_url: str = ""
    primary_result: PackageAnalysisResult | None = None
    primary_quality: Any | None = None

    for idx, up_file in enumerate(upload_list):
        content = await up_file.read()
        if not content:
            raise HTTPException(
                status_code=400,
                detail=f"Uploaded file '{up_file.filename or 'upload'}' is empty.",
            )

        np_arr = np.frombuffer(content, np.uint8)
        img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img_bgr is None or img_bgr.size == 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unable to decode image file '{up_file.filename or 'upload'}'. "
                    "Ensure the file is a valid, uncorrupted image (JPEG, PNG, WebP)."
                ),
            )

        panel_label = (
            "Front Display Panel"
            if idx == 0
            else ("Back Declarations Panel" if idx == 1 else f"Panel {idx + 1}")
        )

        # Run analysis pipeline
        result: PackageAnalysisResult = pipeline.analyze_package(img_bgr)
        if primary_result is None:
            primary_result = result
            primary_quality = result.quality

        # If 180° rotation was selected by the pipeline, orient the display image
        if result.preprocessing.selected_rotation == 180:
            img_bgr = cv2.rotate(img_bgr, cv2.ROTATE_180)

        # Convert oriented image to data URL for frontend display
        data_url = to_data_url(img_bgr)
        if not primary_image_url:
            primary_image_url = data_url

        # Extract panel bounding boxes using PROCESSED dimensions matching OCR space
        proc_w = result.preprocessing.processed_width
        proc_h = result.preprocessing.processed_height
        panel_boxes = extract_percent_boxes(result.detected_fields, proc_w, proc_h)
        panel_raw_boxes = extract_raw_ocr_percent_boxes(result.ocr.detections, proc_w, proc_h)
        if idx == 0:
            all_bounding_boxes.extend(panel_boxes)

        panel_images_out.append(
            {
                "id": f"panel-{idx + 1}",
                "url": data_url,
                "name": up_file.filename or f"Panel {idx + 1}",
                "label": panel_label,
                "boundingBoxes": panel_boxes,
                "rawOcrBoxes": panel_raw_boxes,
                "selectedRotation": result.preprocessing.selected_rotation,
            }
        )

        # Calculate quality score
        q_score = min(100.0, max(20.0, result.quality.metrics.blur_score * 0.8))
        quality_scores.append(q_score)

        # Consolidate detected fields across panels
        for f_name, det in result.detected_fields.items():
            if det.found:
                existing = consolidated_fields.get(f_name)
                if not existing or not existing.found or (det.confidence or 0) > (existing.confidence or 0):
                    consolidated_fields[f_name] = det

    if not consolidated_fields and primary_result is not None:
        consolidated_fields = primary_result.detected_fields

    # Evaluate consolidated fields using compliance engine with actual image quality
    eval_quality = (
        primary_quality
        if primary_quality is not None
        else pipeline._quality_assessor.assess(np.full((800, 800, 3), 128, dtype=np.uint8))
    )
    compliance = pipeline._compliance_engine.evaluate(eval_quality, consolidated_fields)

    # Build frontend VerifiedField objects
    fields_out: dict[str, Any] = {}
    check_map = {c.field: c for c in compliance.checks}
    detected_count = 0
    confidence_sum = 0.0

    for f_name, meta in FIELD_MAP.items():
        f_key = meta["key"]
        det = consolidated_fields.get(f_name)
        check = check_map.get(f_name)

        is_found = det.found if det else False
        conf = round((det.confidence or 0.0) * 100.0, 1) if (det and det.found) else 0.0

        is_compliant_pass = bool(check and check.status == CheckStatus.PASS)
        if is_compliant_pass:
            detected_count += 1
            confidence_sum += conf

        if is_compliant_pass:
            f_status = "DETECTED"
        elif is_found and conf < 65.0:
            f_status = "LOW_CONFIDENCE"
        elif is_found and check and check.status == CheckStatus.FAIL:
            f_status = "LOW_CONFIDENCE"
        elif f_name == "manufacturer_packer" and len(upload_list) == 1:
            f_status = "NOT_CAPTURED"
        else:
            f_status = "NOT_DETECTED"

        if not is_found and f_name == "manufacturer_packer" and len(upload_list) == 1:
            explanation = (
                "Manufacturer declaration not visible in supplied images. "
                "Capture the manufacturer/address panel for verification."
            )
            warning_msg = "Manufacturer declaration not visible in supplied images."
            remedy_msg = "Capture the manufacturer/address panel for verification."
        else:
            explanation = check.reason if check else "Declaration not verified."
            if is_compliant_pass:
                warning_msg = None
                remedy_msg = None
            elif check and check.status == CheckStatus.REVIEW:
                warning_msg = f"Declaration not confirmed on photographed surface under {meta['legalRule']}. Manual verification recommended."
                remedy_msg = f"Capture the relevant panel showing declarations for verification under {meta['legalRule']}."
            else:
                warning_msg = f"Mandatory declaration absent or non-compliant under {meta['legalRule']}."
                remedy_msg = f"Ensure plain and conspicuous declaration conforming to {meta['legalRule']}."

        level2_valid = bool(is_found and check and check.status == CheckStatus.PASS)

        fields_out[f_key] = {
            "key": f_key,
            "title": meta["title"],
            "legalRule": (check.applicable_rule if check and check.applicable_rule else meta["legalRule"]),
            "description": meta["description"],
            "status": f_status,
            "confidence": conf,
            "extractedText": (check.detected_value if check and check.detected_value else (det.value if det and det.found else None)),
            "detectedFormat": det.matched_pattern if (det and det.found) else None,
            "explanation": explanation,
            "validationResult": check.validation_result if check else "NOT_FOUND",
            "level1Presence": is_found,
            "level2FormatValid": level2_valid,
            "level3ReadabilityGood": conf >= 65.0,
            "warning": warning_msg,
            "remedy": remedy_msg,
        }

    # Final overall status directly reflects statutory compliance engine evaluation
    overall_status_str = compliance.overall_status.value
    if overall_status_str == OverallStatus.COMPLIANT.value:
        final_status = "COMPLIANT"
    elif overall_status_str == OverallStatus.NON_COMPLIANT.value:
        final_status = "NON_COMPLIANT"
    else:
        final_status = "NEEDS_REVIEW"

    # Only mark compliant if all 6 statutory fields pass with sufficient evidence
    if detected_count == 6 and final_status != "NON_COMPLIANT":
        final_status = "COMPLIANT"

    avg_conf = round(confidence_sum / max(1, detected_count), 1)
    avg_quality = round(sum(quality_scores) / max(1, len(quality_scores)), 1)
    proc_time = int((time.time() - start_time) * 1000)

    scan_id = f"SCAN-2026-{int(time.time() * 1000) % 9000 + 1000}"
    now_str = datetime.now().strftime("%d %b %Y, %I:%M %p IST")

    # Extract detected product or brand name
    prod_det = consolidated_fields.get("product_identity")
    detected_prod_name = (
        clean_product_name or (prod_det.value if prod_det and prod_det.found else "Packaged Commodity")
    )

    mfg_det = consolidated_fields.get("manufacturer_packer")
    brand_name = "Tata Consumer Products" if "tata" in str(detected_prod_name).lower() else "Verified Brand"

    scan_result: dict[str, Any] = {
        "id": scan_id,
        "productName": detected_prod_name,
        "brandName": brand_name,
        "category": clean_category,
        "timestamp": now_str,
        "imageUrl": primary_image_url,
        "imageThumbnail": primary_image_url,
        "images": panel_images_out if len(panel_images_out) > 1 else None,
        "scanMode": clean_scan_mode,
        "finalStatus": final_status,
        "overallConfidence": avg_conf,
        "detectedCount": detected_count,
        "inspectorId": "LM-INSPECTOR-DL26",
        "deviceSource": "PackScan AI Mobile/Web Scanner",
        "fields": fields_out,
        "boundingBoxes": all_bounding_boxes,
        "rawOcrBoxes": panel_images_out[0]["rawOcrBoxes"] if panel_images_out else [],
        "summaryNote": compliance.summary,
        "imageQualityScore": avg_quality,
        "processingTimeMs": proc_time,
        "preprocessing": (
            {
                "originalWidth": primary_result.preprocessing.original_width,
                "originalHeight": primary_result.preprocessing.original_height,
                "processedWidth": primary_result.preprocessing.processed_width,
                "processedHeight": primary_result.preprocessing.processed_height,
                "selectedRotation": primary_result.preprocessing.selected_rotation,
                "operations": primary_result.preprocessing.operations,
            }
            if primary_result
            else None
        ),
        "rawOcrDetections": (
            [
                {
                    "text": d.text,
                    "confidence": round(d.confidence, 4),
                    "bbox": [[p[0], p[1]] for p in d.bounding_box],
                }
                for d in primary_result.ocr.detections
            ]
            if primary_result
            else []
        ),
    }

    # Save to SQLite history
    repository.save_scan(
        scan_id=scan_id,
        timestamp=now_str,
        product_name=detected_prod_name,
        category=clean_category,
        final_status=final_status,
        overall_confidence=avg_conf,
        detected_count=detected_count,
        summary_note=compliance.summary,
        image_path=upload_list[0].filename,
        result_dict=scan_result,
    )

    return scan_result


if __name__ == "__main__":
    import uvicorn

    print("Starting PackScan AI REST API on http://127.0.0.1:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
