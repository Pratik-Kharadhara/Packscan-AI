@echo off
title PACKSCAN AI Prototype Launcher
echo ========================================================
echo   PACKSCAN AI — Legal Metrology Screening Prototype
echo   Smart India Hackathon 2026 | Vision Forge
echo ========================================================
echo.

echo [1/2] Starting BACKEND (FastAPI + Legal Metrology OCR on http://127.0.0.1:8000)...
start "PACKSCAN AI Backend" cmd /k "cd /d \"%~dp0BACKEND\" && .venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starting FRONTEND (Vite + TypeScript + React on http://localhost:3000)...
start "PACKSCAN AI Frontend" cmd /k "cd /d \"%~dp0FRONTEND\" && npm run dev"

echo.
echo ========================================================
echo   Servers are launching!
echo   Frontend UI:  http://localhost:3000
echo   Backend API:  http://127.0.0.1:8000/docs
echo ========================================================
echo.
pause
