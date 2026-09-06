"""Streamlit web application for PACKSCAN AI.

Decision-support and legal metrology compliance screening system for packaged commodities.
This UI orchestrates backend modules without embedding OCR, detection, or compliance rules.
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image
import streamlit as st

from config import PATHS
from src.annotation.image_annotator import FIELD_COLORS, FIELD_DISPLAY_NAMES, ImageAnnotator
from src.pipeline.analysis_pipeline import AnalysisPipeline, PackageAnalysisResult
from src.preprocessing.image_preprocessor import ImagePreprocessor, PreprocessingOptions
from src.rules.compliance_engine import CheckStatus, OverallStatus
from src.rules.rule_loader import RuleLoader
from src.utils.image_utils import bgr_to_rgb, load_image

# -----------------------------------------------------------------------------
# App Configuration & Styling
# -----------------------------------------------------------------------------

st.set_page_config(
    page_title="PACKSCAN AI | Legal Metrology Scanner",
    page_icon="📦",
    layout="wide",
    initial_sidebar_state="expanded",
)

CUSTOM_CSS = """
<style>
    /* Metric and Card styling */
    .metric-card {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 12px;
        transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .metric-card:hover {
        border-color: rgba(255, 255, 255, 0.25);
    }
    .status-hero {
        padding: 24px;
        border-radius: 12px;
        margin-bottom: 24px;
        text-align: center;
        border-width: 2px;
        border-style: solid;
    }
    .status-compliant {
        background: linear-gradient(135deg, rgba(46, 204, 113, 0.15), rgba(39, 174, 96, 0.05));
        border-color: #2ecc71;
    }
    .status-non-compliant {
        background: linear-gradient(135deg, rgba(231, 76, 60, 0.15), rgba(192, 57, 43, 0.05));
        border-color: #e74c3c;
    }
    .status-needs-review {
        background: linear-gradient(135deg, rgba(243, 156, 18, 0.15), rgba(211, 84, 0, 0.05));
        border-color: #f39c12;
    }
    .status-badge {
        display: inline-block;
        font-weight: 700;
        font-size: 0.85rem;
        padding: 4px 10px;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .badge-pass { background-color: #27ae60; color: #ffffff; }
    .badge-fail { background-color: #c0392b; color: #ffffff; }
    .badge-review { background-color: #d35400; color: #ffffff; }
    .badge-na { background-color: #7f8c8d; color: #ffffff; }

    /* Legend pills */
    .legend-tag {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 4px;
        margin-right: 6px;
        margin-bottom: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #ffffff;
    }
</style>
"""

st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


# -----------------------------------------------------------------------------
# Cached Resources & Helper Functions
# -----------------------------------------------------------------------------


@st.cache_resource(show_spinner="Initializing PACKSCAN AI OCR Engine...")
def get_pipeline(
    apply_contrast: bool = True,
    apply_denoising: bool = False,
    apply_thresholding: bool = False,
) -> AnalysisPipeline:
    """Instantiate and cache the pipeline to avoid re-initializing OCR models."""
    options = PreprocessingOptions(
        apply_contrast_enhancement=apply_contrast,
        apply_denoising=apply_denoising,
        apply_thresholding=apply_thresholding,
    )
    preprocessor = ImagePreprocessor(options=options)
    return AnalysisPipeline(preprocessor=preprocessor)


@st.cache_data
def get_available_sample_images() -> list[Path]:
    """Retrieve existing sample images for quick demo selection."""
    sample_dir = PATHS.sample_data_dir
    if not sample_dir.exists():
        return []
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    return sorted([p for p in sample_dir.iterdir() if p.suffix.lower() in valid_exts])


def render_header() -> None:
    col1, col2 = st.columns([0.8, 0.2])
    with col1:
        st.title("PACKSCAN AI")
        st.markdown(
            "**AI-Assisted Packaged Commodity Legal Metrology Compliance Scanner**  \n"
            "*Digital first-level screening and decision support system (SIH 2026)*"
        )
    with col2:
        st.markdown(
            "<div style='text-align: right; padding-top: 10px;'>"
            "<span style='background-color: #2980b9; color: white; padding: 4px 10px; "
            "border-radius: 4px; font-size: 0.85rem; font-weight: bold;'>SIH26034 MVP</span>"
            "</div>",
            unsafe_allow_html=True,
        )
    st.divider()


def render_status_hero(compliance: Any, quality: Any) -> None:
    status_str = compliance.overall_status.value
    if status_str == OverallStatus.COMPLIANT.value:
        hero_class = "status-compliant"
        icon = "✅"
        headline = "COMPLIANT — Ready for Verification"
        subtext = compliance.summary
    elif status_str == OverallStatus.NON_COMPLIANT.value:
        hero_class = "status-non-compliant"
        icon = "❌"
        headline = "NON-COMPLIANT — Mandatory Discrepancy Found"
        subtext = compliance.summary
    else:
        hero_class = "status-needs-review"
        icon = "⚠️"
        headline = "NEEDS REVIEW — Manual Inspection Recommended"
        subtext = compliance.summary

    st.markdown(
        f"""
        <div class="status-hero {hero_class}">
            <h2 style="margin: 0 0 8px 0;">{icon} {headline}</h2>
            <p style="margin: 0; font-size: 1.1rem; opacity: 0.95;">{subtext}</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_quality_metrics(quality: Any, preprocessing: Any) -> None:
    st.subheader("Image Quality & Preprocessing Assessment")
    q_col1, q_col2, q_col3, q_col4 = st.columns(4)

    with q_col1:
        usability_badge = "✅ USABLE" if quality.usable else "⚠️ UNUSABLE"
        st.metric("OCR Usability", usability_badge)

    with q_col2:
        blur_status = "Sharp" if quality.metrics.blur_score >= 80.0 else "Blurry (<80)"
        st.metric("Focus Score (Blur)", f"{quality.metrics.blur_score:.1f}", blur_status)

    with q_col3:
        st.metric("Brightness Score", f"{quality.metrics.brightness_score:.1f} / 255")

    with q_col4:
        st.metric(
            "Dimensions",
            f"{quality.metrics.width} × {quality.metrics.height} px",
            f"Processed: {preprocessing.processed_width}×{preprocessing.processed_height}",
        )

    if quality.issues:
        for issue in quality.issues:
            st.warning(f"⚠️ **Image Quality Notice**: {issue}")

    with st.expander("ℹ️ Preprocessing Operations Applied", expanded=False):
        st.write(f"Operations sequence: `{' ➔ '.join(preprocessing.operations)}`")
        st.caption(
            "The preprocessing pipeline resizes oversized packaging, converts to grayscale, "
            "and enhances local contrast to maximize text recognition accuracy without altering source evidence."
        )


def render_field_table(detected_fields: dict[str, Any], checks: list[Any]) -> None:
    st.subheader("Field-by-Field Legal Metrology Checks")
    check_map = {check.field: check for check in checks}

    display_fields = [
        ("product_identity", "Product / Commodity Identity"),
        ("manufacturer_packer", "Manufacturer / Packer / Importer"),
        ("net_quantity", "Net Quantity Declaration"),
        ("manufacture_date", "Mfg / Pre-pack Date"),
        ("mrp", "Retail Sale Price (MRP)"),
        ("consumer_contact", "Consumer Care / Grievance Details"),
    ]

    for field_key, field_title in display_fields:
        detected = detected_fields.get(field_key)
        check = check_map.get(field_key)

        status_val = check.status.value if check else "NOT_CHECKED"
        badge_class = {
            "PASS": "badge-pass",
            "FAIL": "badge-fail",
            "REVIEW": "badge-review",
            "NOT_APPLICABLE": "badge-na",
        }.get(status_val, "badge-na")

        with st.container():
            c1, c2, c3 = st.columns([0.35, 0.45, 0.20])
            with c1:
                st.markdown(
                    f"**{field_title}**  \n"
                    f"<span class='status-badge {badge_class}'>{status_val}</span>",
                    unsafe_allow_html=True,
                )
            with c2:
                if detected and detected.found:
                    st.markdown(f"**Extracted Value**: `{detected.value}`")
                    if detected.matched_text and detected.matched_text != detected.value:
                        st.caption(f"Matched Text: *\"{detected.matched_text}\"*")
                else:
                    st.markdown("*No matching declaration detected.*")

                if check:
                    st.caption(f"Rule evaluation: {check.reason}")

            with c3:
                if detected and detected.confidence is not None:
                    conf_pct = int(detected.confidence * 100)
                    st.progress(detected.confidence, text=f"Confidence: {conf_pct}%")
                else:
                    st.caption("Confidence: N/A")

            st.divider()


def render_visual_evidence(
    original_image_rgb: np.ndarray,
    annotated_image_bgr: np.ndarray,
) -> None:
    st.subheader("Visual Evidence Verification")

    annotated_image_rgb = bgr_to_rgb(annotated_image_bgr)

    # Color Legend
    st.markdown(
        """
        **Visual Legend:** &nbsp;
        <span class="legend-tag" style="background-color: #ff9900;">MRP</span>
        <span class="legend-tag" style="background-color: #00b4d8;">Net Qty</span>
        <span class="legend-tag" style="background-color: #9b59b6;">Mfg Date</span>
        <span class="legend-tag" style="background-color: #1e88e5;">Manufacturer</span>
        <span class="legend-tag" style="background-color: #27ae60;">Consumer Care</span>
        <span class="legend-tag" style="background-color: #e67e22;">Product Identity</span>
        """,
        unsafe_allow_html=True,
    )

    col1, col2 = st.columns(2)
    with col1:
        st.markdown("**Original Package Image**")
        st.image(original_image_rgb, use_container_width=True)

    with col2:
        st.markdown("**Annotated Screening Evidence**")
        st.image(annotated_image_rgb, use_container_width=True)

    # Download annotated image button
    buf = io.BytesIO()
    annotated_pil = Image.fromarray(annotated_image_rgb)
    annotated_pil.save(buf, format="JPEG", quality=92)
    st.download_button(
        label="💾 Download Annotated Evidence (JPEG)",
        data=buf.getvalue(),
        file_name="packscan_annotated_evidence.jpg",
        mime="image/jpeg",
    )


# -----------------------------------------------------------------------------
# Main Application Execution
# -----------------------------------------------------------------------------


def main() -> None:
    render_header()

    # --- Sidebar Controls ---
    st.sidebar.header("Scan Input & Settings")
    input_source = st.sidebar.radio(
        "Select Image Source:",
        ["Upload Image", "Sample Product Gallery"],
        index=0,
    )

    image_array: np.ndarray | None = None
    image_filename: str | None = None

    if input_source == "Upload Image":
        uploaded_file = st.sidebar.file_uploader(
            "Upload package photo (JPG, PNG, WebP):",
            type=["jpg", "jpeg", "png", "webp"],
            help="Upload a clear photograph of a packaged commodity showing mandatory declarations.",
        )
        if uploaded_file is not None:
            image_filename = uploaded_file.name
            file_bytes = np.asarray(bytearray(uploaded_file.read()), dtype=np.uint8)
            image_array = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    else:
        sample_files = get_available_sample_images()
        if sample_files:
            sample_options = {p.name: p for p in sample_files}
            selected_name = st.sidebar.selectbox(
                "Choose sample image from dataset:",
                options=list(sample_options.keys()),
            )
            if selected_name:
                image_filename = selected_name
                selected_path = sample_options[selected_name]
                image_array = load_image(selected_path)
        else:
            st.sidebar.info("No sample images found in data/sample_data/")

    # Preprocessing options in sidebar
    st.sidebar.subheader("Preprocessing Options")
    opt_contrast = st.sidebar.checkbox("Enhance Contrast (CLAHE)", value=True)
    opt_denoise = st.sidebar.checkbox("Noise Reduction", value=False)
    opt_threshold = st.sidebar.checkbox("Adaptive Thresholding", value=False)

    # Active Screening Profile in sidebar
    with st.sidebar.expander("📋 Active Compliance Profile", expanded=False):
        rules = RuleLoader().load()
        st.write(f"**Profile**: {rules.profile_name}")
        st.write(f"**Version**: {rules.version}")
        st.caption(rules.note)
        for f_name, r in rules.fields.items():
            req_icon = "Mandatory" if r.required else "Optional"
            st.write(f"• `{f_name}`: {req_icon} (min conf: {r.minimum_confidence})")

    # Run Analysis Button
    scan_triggered = st.sidebar.button("🔍 Scan Package Compliance", type="primary", use_container_width=True)

    if image_array is None:
        st.info("👈 Please upload a package photo or select a sample image from the sidebar to begin screening.")
        return

    # If scan not explicitly clicked yet, show preview
    if not scan_triggered and "last_result" not in st.session_state:
        st.subheader("Selected Package Preview")
        st.image(bgr_to_rgb(image_array), caption=image_filename or "Package Photo", width=500)
        st.caption("Click **'Scan Package Compliance'** in the sidebar to run the screening pipeline.")
        return

    # Trigger or display analysis
    pipeline = get_pipeline(
        apply_contrast=opt_contrast,
        apply_denoising=opt_denoise,
        apply_thresholding=opt_threshold,
    )

    with st.spinner("Analyzing package: checking quality, extracting declarations, evaluating rules..."):
        result: PackageAnalysisResult = pipeline.analyze_package(image_array)
        annotated_image = pipeline.annotate_result(result, original_image=image_array)

    # Display Results
    render_status_hero(result.compliance, result.quality)

    # Visual Evidence side-by-side
    render_visual_evidence(bgr_to_rgb(image_array), annotated_image)

    st.divider()

    # Image Quality metrics
    render_quality_metrics(result.quality, result.preprocessing)

    st.divider()

    # Field-by-field breakdown
    render_field_table(result.detected_fields, result.compliance.checks)

    # Processing warnings if any
    if result.processing_warnings:
        for warning in result.processing_warnings:
            st.error(f"⚠️ {warning}")

    # Raw OCR transparency drawer
    with st.expander("🔍 Auditability: Raw OCR Text & Coordinates", expanded=False):
        st.markdown(f"**Total Detections**: {len(result.ocr.detections)}")
        ocr_rows = []
        for det in result.ocr.detections:
            ocr_rows.append({
                "Text": det.text,
                "Confidence": f"{det.confidence:.3f}",
                "Box Coordinates": str(det.bounding_box),
            })
        if ocr_rows:
            st.dataframe(ocr_rows, use_container_width=True)
        else:
            st.write("No OCR text was extracted.")


if __name__ == "__main__":
    main()
