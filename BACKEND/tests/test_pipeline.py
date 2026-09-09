"""Foundation and end-to-end orchestration tests."""

from pathlib import Path

import numpy as np

from src.ocr.ocr_service import OCRService
from src.pipeline.analysis_pipeline import AnalysisPipeline


def test_required_foundation_files_exist() -> None:
    project_root = Path(__file__).resolve().parents[1]

    for relative_path in (
        "app.py",
        "config.py",
        "requirements.txt",
        "rules/compliance_rules.json",
        "rules/detection_patterns.json",
        "src/pipeline/analysis_pipeline.py",
    ):
        assert (project_root / relative_path).is_file()


class FakeReader:
    def readtext(self, image: object, *, detail: int, paragraph: bool) -> list[object]:
        return [
            ([[0, 0], [50, 0], [50, 10], [0, 10]], "Product: Apricot Scrub", 0.95),
            ([[0, 15], [50, 15], [50, 25], [0, 25]], "Manufactured by: Example Ltd", 0.95),
            ([[0, 30], [50, 30], [50, 40], [0, 40]], "Net Qty: 100 g", 0.95),
            ([[0, 45], [50, 45], [50, 55], [0, 55]], "Mfd: 08/2026", 0.95),
            ([[0, 60], [50, 60], [50, 70], [0, 70]], "MRP Rs. 145", 0.95),
            ([[0, 75], [50, 75], [50, 85], [0, 85]], "Customer Care: 9876543210", 0.95),
        ]


def test_pipeline_returns_complete_compliant_result_from_structured_ocr() -> None:
    image = np.full((700, 800, 3), 127, dtype=np.uint8)
    image[300:305, :] = 0

    result = AnalysisPipeline(ocr_service=OCRService(reader=FakeReader())).analyze_package(image)

    assert result.compliance.overall_status == "COMPLIANT"
    assert result.preprocessing.operations == ["rgb_conversion"]
    assert result.preprocessing.selected_rotation == 0
    assert result.ocr.detections[0].text == "Product: Apricot Scrub"
    assert result.processing_warnings == []


def test_pipeline_annotate_result() -> None:
    image = np.full((700, 800, 3), 127, dtype=np.uint8)
    image[300:305, :] = 0

    pipeline = AnalysisPipeline(ocr_service=OCRService(reader=FakeReader()))
    result = pipeline.analyze_package(image)
    annotated = pipeline.annotate_result(result, original_image=image)

    assert isinstance(annotated, np.ndarray)
    assert annotated.shape == (700, 800, 3)
