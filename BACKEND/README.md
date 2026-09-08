# PACKSCAN AI

An AI-assisted first-level screening tool for packaged-commodity declarations. It helps users inspect visible package information; it does not replace a Legal Metrology Officer or make final legal determinations.

## MVP flow

`Image -> quality check -> preprocessing -> OCR -> field detection -> configurable rules -> explainable result -> annotated image`

The only overall outcomes are `COMPLIANT`, `NON_COMPLIANT`, and `NEEDS_REVIEW`. An OCR failure or poor image must result in review, not an unsupported non-compliance finding.

## Project layout

- `app.py` is the Streamlit entry point and remains UI-only.
- `src/pipeline` will orchestrate the analysis flow.
- `src/quality`, `src/preprocessing`, and `src/ocr` isolate image/OCR work.
- `src/detection` will convert OCR observations into declaration candidates.
- `src/rules` will evaluate externally configured screening rules.
- `src/annotation`, `src/reporting`, and `src/database` are reserved for later phases.
- `rules/` holds configuration, never scattered legal or detection logic.

## Development phases

1. Foundation (current): repository structure, configuration, documentation, and dependencies.
2. OCR proof of concept (complete): image to structured text, confidence, and bounding boxes.
3. Image quality and preprocessing (complete): resolution, blur, brightness, and conservative OCR preparation.
4. Field detectors (complete): modular OCR-evidence detectors driven by external patterns.
5. Configurable screening-rule engine (complete): confidence-aware PASS, FAIL, and REVIEW checks with exactly three overall outcomes.
6. End-to-end pipeline (complete): analyze_package(image) returns quality, OCR, evidence, and screening results.
7. Evidence annotation.
8. Streamlit UI.
9. Scan history and PDF reporting.
10. Testing, real-package validation, and demo preparation.

## Setup

```powershell
cd "D:\SIH 2026\packscan-ai"
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
pytest
```

`pytest` is expected to report no collected tests until Phase 2 adds test cases.

To screen one image from the command line:

```powershell
python run_analysis.py data/sample_data/IMG20260829183421.jpg
```

## Team conventions

- Keep OCR, detection, rule evaluation, annotation, and UI separate.
- Put tunable thresholds and patterns in `rules/`, not code.
- Use structured data and explain every status.
- Do not treat absent OCR text as proof that a mandatory declaration is absent.
