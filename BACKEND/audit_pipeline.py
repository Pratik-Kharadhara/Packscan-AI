"""Diagnostic script to audit PACKSCAN AI pipeline on Product1_1 through Product1_7."""

import os
import glob
import cv2
import numpy as np
from PIL import Image

from config import MAX_PREPROCESS_DIMENSION, DEFAULT_MIN_OCR_CONFIDENCE
from src.quality.image_quality import ImageQualityAssessor
from src.preprocessing.image_preprocessor import ImagePreprocessor
from src.ocr.ocr_service import OCRService
from src.pipeline.analysis_pipeline import AnalysisPipeline

def audit():
    image_paths = sorted(glob.glob("data/sample_data/Product1_*.jpeg"))
    print(f"Found {len(image_paths)} images: {[os.path.basename(p) for p in image_paths]}")

    preprocessor = ImagePreprocessor()
    quality_assessor = ImageQualityAssessor()
    ocr_service = OCRService()
    pipeline = AnalysisPipeline()

    print("\n" + "="*80)
    print("DETAILED PIPELINE AUDIT REPORT")
    print("="*80)

    for path in image_paths:
        fname = os.path.basename(path)
        print(f"\n>>> AUDITING: {fname}")

        # 1. Original Image Inspection
        raw_bgr = cv2.imread(path)
        orig_h, orig_w, orig_c = raw_bgr.shape
        file_size_bytes = os.path.getsize(path)

        # Check EXIF orientation if any
        pil_img = Image.open(path)
        exif = pil_img.getexif()
        orientation_tag = exif.get(0x0112, "None")

        print(f"  [1] Original File: {orig_w}x{orig_h}, Channels: {orig_c}, File Size: {file_size_bytes/1024:.1f} KB, EXIF Orientation: {orientation_tag}")

        # 2. Quality assessment
        quality = quality_assessor.assess(raw_bgr)
        print(f"  [2] Quality Assessment: Usable={quality.usable}, BlurScore={quality.metrics.blur_score:.2f}, Brightness={quality.metrics.brightness_score:.2f}")
        if quality.issues:
            print(f"      Quality Issues: {quality.issues}")

        # 3. Preprocessing inspection
        prep_res = preprocessor.preprocess(raw_bgr)
        proc_img = prep_res.processed_image
        proc_h, proc_w = proc_img.shape[:2]
        proc_ndim = proc_img.ndim
        proc_dtype = proc_img.dtype
        print(f"  [3] Preprocessing: Output shape={proc_img.shape} (ndim={proc_ndim}), dtype={proc_dtype}, Operations={prep_res.operations}")
        print(f"      Resolution change: {orig_w}x{orig_h} -> {proc_w}x{proc_h} (scale={proc_w/orig_w:.4f})")

        # 4. OCR Extraction on Preprocessed Image
        ocr_res = ocr_service.extract(proc_img)
        print(f"  [4] OCR Extraction on Preprocessed: {len(ocr_res.detections)} raw detections, {len(ocr_res.grouped_lines)} grouped lines")

        # Sample top detections & confidence distribution
        confs = [d.confidence for d in ocr_res.detections]
        avg_conf = np.mean(confs) if confs else 0.0
        low_conf_count = sum(1 for c in confs if c < DEFAULT_MIN_OCR_CONFIDENCE)
        print(f"      Confidence stats: min={min(confs) if confs else 0:.2f}, avg={avg_conf:.2f}, max={max(confs) if confs else 0:.2f}, below {DEFAULT_MIN_OCR_CONFIDENCE}: {low_conf_count}/{len(confs)}")

        # 5. Contrast OCR with Raw BGR directly
        raw_ocr_res = ocr_service.extract(raw_bgr)
        print(f"  [5] Comparison - OCR on Raw BGR directly: {len(raw_ocr_res.detections)} detections (vs {len(ocr_res.detections)} preprocessed)")

        # 6. Check Rotation / Orientation
        # Test 180-degree rotation
        bgr_180 = cv2.rotate(raw_bgr, cv2.ROTATE_180)
        ocr_180 = ocr_service.extract(bgr_180)
        print(f"  [6] Comparison - OCR on 180° Rotated: {len(ocr_180.detections)} detections")

        # 7. Check Field Detection from Pipeline
        pipe_res = pipeline.analyze_package(raw_bgr)
        detected = {k: v.value for k, v in pipe_res.detected_fields.items() if v.found}
        missing = [k for k, v in pipe_res.detected_fields.items() if not v.found]
        print(f"  [7] Fields Detected: {detected}")
        print(f"      Fields Missing: {missing}")

        # 8. Check Bounding Boxes Coordinate Space
        for f_name, f_det in pipe_res.detected_fields.items():
            if f_det.found and f_det.bounding_boxes:
                b = f_det.bounding_boxes[0]
                xs = [p[0] for p in b]
                ys = [p[1] for p in b]
                print(f"      Field '{f_name}' bbox sample: x=[{min(xs):.1f}..{max(xs):.1f}], y=[{min(ys):.1f}..{max(ys):.1f}] vs proc dims ({proc_w}x{proc_h}) vs orig dims ({orig_w}x{orig_h})")
                break

if __name__ == "__main__":
    audit()
