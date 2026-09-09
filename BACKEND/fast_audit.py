"""Focused, fast audit of PACKSCAN AI's complete pipeline on Product1 images."""

import os
import sys
import glob
import json
import cv2
import numpy as np

from config import MAX_PREPROCESS_DIMENSION, DEFAULT_MIN_OCR_CONFIDENCE
from src.quality.image_quality import ImageQualityAssessor
from src.preprocessing.image_preprocessor import ImagePreprocessor
from src.ocr.ocr_service import OCRService
from src.pipeline.analysis_pipeline import AnalysisPipeline

def run_audit():
    qa = ImageQualityAssessor()
    pp = ImagePreprocessor()
    ocr = OCRService()
    pipeline = AnalysisPipeline()

    paths = sorted(glob.glob("data/sample_data/Product1_*.jpeg"))
    report = []

    for p in paths:
        fname = os.path.basename(p)
        print(f"Auditing {fname}...", flush=True)

        raw = cv2.imread(p)
        orig_h, orig_w, orig_c = raw.shape

        # Step 1: Quality
        quality = qa.assess(raw)

        # Step 2: Preprocessing
        prep = pp.preprocess(raw)
        proc = prep.processed_image
        proc_h, proc_w = proc.shape[:2]

        # Step 3: OCR on Preprocessed
        ocr_res = ocr.extract(proc)

        # Step 4: Full Pipeline execution
        pipe_res = pipeline.analyze_package(raw)

        # Step 5: Test 180 Rotation
        raw_180 = cv2.rotate(raw, cv2.ROTATE_180)
        prep_180 = pp.preprocess(raw_180).processed_image
        ocr_180 = ocr.extract(prep_180)
        pipe_180 = pipeline.analyze_package(raw_180)

        det_normal = {k: v.value for k, v in pipe_res.detected_fields.items() if v.found}
        det_180 = {k: v.value for k, v in pipe_180.detected_fields.items() if v.found}

        confs = [d.confidence for d in ocr_res.detections]
        confs_180 = [d.confidence for d in ocr_180.detections]

        item = {
            "file": fname,
            "original_res": f"{orig_w}x{orig_h}",
            "original_channels": orig_c,
            "ocr_input_res": f"{proc_w}x{proc_h}",
            "ocr_input_channels": 1 if proc.ndim == 2 else proc.shape[2],
            "ocr_input_dtype": str(proc.dtype),
            "did_resize": proc_w != orig_w or proc_h != orig_h,
            "preprocessing_ops": list(prep.operations),
            "blur_score": round(quality.metrics.blur_score, 2),
            "brightness_score": round(quality.metrics.brightness_score, 2),
            "quality_usable": quality.usable,
            "quality_issues": quality.issues,
            "ocr_detections_0deg": len(ocr_res.detections),
            "ocr_avg_conf_0deg": round(float(np.mean(confs)), 2) if confs else 0.0,
            "ocr_detections_180deg": len(ocr_180.detections),
            "ocr_avg_conf_180deg": round(float(np.mean(confs_180)), 2) if confs_180 else 0.0,
            "fields_detected_0deg": det_normal,
            "fields_detected_180deg": det_180,
            "compliance_0deg": pipe_res.compliance.overall_status.value,
            "compliance_180deg": pipe_180.compliance.overall_status.value,
            "pipeline_warnings": pipe_res.processing_warnings,
        }
        report.append(item)
        print(f"Done {fname}: 0deg={len(ocr_res.detections)} dets, 180deg={len(ocr_180.detections)} dets | Fields 0deg: {list(det_normal.keys())} | Fields 180deg: {list(det_180.keys())}", flush=True)

    with open("audit_summary.json", "w") as f:
        json.dump(report, f, indent=2)

    print("\nAUDIT SUMMARY SAVED TO audit_summary.json", flush=True)

if __name__ == "__main__":
    run_audit()
