@echo off
REM ═══════════════════════════════════════════════════════════════
REM  REAS ML Service — One-Time Environment Setup
REM  Run this script ONCE to create the virtual environment
REM  and install all Python dependencies.
REM ═══════════════════════════════════════════════════════════════

echo.
echo ╔══════════════════════════════════════════╗
echo ║  REAS ML Service — Environment Setup    ║
echo ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM ── Step 1: Create virtual environment ──────────────────────────
echo [1/3] Creating Python virtual environment (.venv) ...
python -m venv .venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment.
    echo        Make sure Python is installed and on PATH.
    pause
    exit /b 1
)
echo       Done ✓

REM ── Step 2: Upgrade pip ─────────────────────────────────────────
echo [2/3] Upgrading pip ...
.venv\Scripts\python.exe -m pip install --upgrade pip --quiet
echo       Done ✓

REM ── Step 3: Install dependencies ────────────────────────────────
echo [3/3] Installing dependencies (this may take a few minutes) ...
.venv\Scripts\pip.exe install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Dependency installation failed. Check requirements.txt.
    pause
    exit /b 1
)
echo       Done ✓

echo.
echo ══════════════════════════════════════════════
echo  Setup complete!
echo.
echo  NEXT STEPS:
echo  1. Copy your trained model file here:
echo     road_extraction_model.pth
echo     (or run convert_model.py if you have a .h5 file)
echo.
echo  2. Start the service:
echo     start.bat
echo ══════════════════════════════════════════════
echo.
pause
