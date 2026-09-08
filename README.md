# PACKSCAN AI — Smart India Hackathon 2026 Prototype

> **Legal Metrology (Packaged Commodities) Rules, 2011 Automated Screening Tool**  
> *Developed by Team Vision Forge*

---

## 🏛 System Overview

PACKSCAN AI is an automated visual audit and OCR screening assistant designed to check whether packaged consumer goods comply with mandatory statutory declarations under the **Legal Metrology (Packaged Commodities) Rules, 2011**.

It performs end-to-end computer vision screening:
`Package Photo -> Quality Check -> Preprocessing -> OCR -> Spatial Grouping -> Legal Metrology Rule Engine -> Explainable Dashboard -> Official Form-A Inspection PDF Notice`

---

## 📂 Project Architecture

```
packscan-ai/
├── run_prototype.bat               # One-click launcher for both Backend & Frontend
├── BACKEND/                        # Python / OpenCV / EasyOCR / FastAPI Server
│   ├── server.py                   # FastAPI REST API (/api/scan, /api/history, /api/report/pdf)
│   ├── config.py                   # Calibrated thresholds & paths
│   ├── requirements.txt            # Python dependencies
│   ├── rules/                      # Legal Metrology rules & regex patterns JSON
│   ├── src/
│   │   ├── quality/                # Soft blur & lighting quality assessment
│   │   ├── preprocessing/          # Contrast & orientation handling
│   │   ├── ocr/                    # EasyOCR + OCR Normalizer + Spatial Line Grouping
│   │   ├── detection/              # 6 Mandatory field detectors (MRP, Date, Qty, etc.)
│   │   ├── rules/                  # Statutory Legal Metrology rule engine (Rule 6, 10, 13)
│   │   ├── reporting/              # Official ReportLab PDF generator
│   │   ├── database/               # SQLite persistent scan history repository
│   │   └── pipeline/               # Package analysis orchestrator
│   └── tests/                      # 29 PyTest test cases
└── FRONTEND/                       # Modern TypeScript / React / Vite UI
    ├── src/
    │   ├── components/
    │   │   ├── landing/            # SIH presentation & GovTech pitch view
    │   │   ├── scan/               # Single, Multi-Angle, & Batch upload zone
    │   │   ├── results/            # Interactive bounding box overlays & report
    │   │   ├── history/            # Historical SQLite audit trail & filterable logs
    │   │   ├── howItWorks/         # Technical methodology explanation
    │   │   └── about/              # Problem statement, team & regulatory context
    │   ├── services/
    │   │   ├── analyzer.ts         # Direct REST bridge to /api/scan with client fallback
    │   │   └── pdfGenerator.ts     # Client-side PDF export
    │   └── types/                  # Shared TypeScript interfaces
    └── vite.config.ts              # Proxy routing /api -> http://127.0.0.1:8000
```

---

## 🚀 How to Run the Prototype

### Option 1: One-Click Launcher (Windows)
Double-click:
```cmd
run_prototype.bat
```

### Option 2: Manual Terminal Startup

**Terminal 1 — Backend API:**
```powershell
cd BACKEND
.venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation available at: `http://127.0.0.1:8000/docs`

**Terminal 2 — Frontend UI:**
```powershell
cd FRONTEND
npm run dev
```
Access the application at: `http://localhost:3000`

---

## 🧪 Verification & Tests

To run the complete backend test suite:
```powershell
cd BACKEND
.venv\Scripts\python.exe -m pytest
```
*Current status: 29 passed in 1.00s.*
