@echo off
REM ═══════════════════════════════════════════════════════════════
REM  REAS ML Service — Start FastAPI Server
REM  Activates the virtual environment and launches the service.
REM ═══════════════════════════════════════════════════════════════

cd /d "%~dp0"

if not exist ".venv" (
    echo Virtual environment not found. Please run setup.bat first.
    pause
    exit /b 1
)

echo.
echo ╔══════════════════════════════════════════╗
echo ║  REAS ML Service — Starting on :8000    ║
echo ╚══════════════════════════════════════════╝
echo.

if exist "road_extraction_model.pth" (
    echo [INFO] Trained model found: road_extraction_model.pth ✓
) else (
    echo [WARN] road_extraction_model.pth not found.
    echo        Predictions will use random weights (demo mode).
    echo        See README or convert_model.py to load your trained model.
)

echo.
echo [INFO] Starting FastAPI at http://localhost:8000
echo [INFO] API docs available at http://localhost:8000/docs
echo [INFO] Press Ctrl+C to stop.
echo.

.venv\Scripts\uvicorn.exe inference:app --host 0.0.0.0 --port 8000 --reload
