"""Run the current PACKSCAN AI pipeline against a local package image.

Usage:
    python run_analysis.py data/sample_data/my_product.jpg
"""

from __future__ import annotations

import argparse
from pathlib import Path

from src.pipeline.analysis_pipeline import analyze_package


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run PACKSCAN AI's first-level package screening pipeline."
    )
    parser.add_argument("image", type=Path, help="Path to a JPG, PNG, or other OpenCV-readable image.")
    args = parser.parse_args()

    result = analyze_package(args.image)
    print(result.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
