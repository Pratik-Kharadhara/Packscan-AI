"""Central paths and conservative placeholder settings for PACKSCAN AI."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent


@dataclass(frozen=True)
class AppPaths:
    """Filesystem locations used by the application and later pipeline stages."""

    project_root: Path = PROJECT_ROOT
    rules_dir: Path = PROJECT_ROOT / "rules"
    raw_data_dir: Path = PROJECT_ROOT / "data" / "raw"
    processed_data_dir: Path = PROJECT_ROOT / "data" / "processed"
    annotated_data_dir: Path = PROJECT_ROOT / "data" / "annotated"
    sample_data_dir: Path = PROJECT_ROOT / "data" / "sample_data"
    database_dir: Path = PROJECT_ROOT / "storage" / "database"
    reports_dir: Path = PROJECT_ROOT / "storage" / "reports"
    ocr_models_dir: Path = PROJECT_ROOT / "storage" / "ocr_models"


PATHS = AppPaths()

# These are configuration placeholders, not compliance conclusions. Values will be
# calibrated on real-package images during later development phases.
MIN_IMAGE_WIDTH = 640
MIN_IMAGE_HEIGHT = 480
DEFAULT_MIN_OCR_CONFIDENCE = 0.70
OCR_LANGUAGES = ("en",)
USE_GPU_FOR_OCR = False

# Calibrated image-quality and preprocessing thresholds.
# Hard thresholds cause hard rejection (usable=False).
# Soft thresholds generate advisory warnings without blocking OCR.
HARD_MIN_BLUR_SCORE = 15.0
SOFT_BLUR_WARNING_THRESHOLD = 70.0
MIN_BLUR_SCORE = HARD_MIN_BLUR_SCORE

HARD_MIN_BRIGHTNESS_SCORE = 20.0
HARD_MAX_BRIGHTNESS_SCORE = 245.0
MIN_BRIGHTNESS_SCORE = 40.0
MAX_BRIGHTNESS_SCORE = 220.0
MAX_PREPROCESS_DIMENSION = 1600


def ensure_runtime_directories() -> None:
    """Create directories used for generated files when an application run needs them."""

    for directory in (
        PATHS.raw_data_dir,
        PATHS.processed_data_dir,
        PATHS.annotated_data_dir,
        PATHS.sample_data_dir,
        PATHS.database_dir,
        PATHS.reports_dir,
        PATHS.ocr_models_dir,
    ):
        directory.mkdir(parents=True, exist_ok=True)
