@echo off
cd /d "%~dp0"
echo ========================================================
echo       FraudShield - Fraud Text Classification Model
echo ========================================================
echo.

:: 1. Ensure .env exists
if not exist .env (
    echo [.env] not found. Copying from .env.example...
    copy .env.example .env
)

:: 2. Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not found in PATH. Please install Python 3.10+ and add it to PATH.
    pause
    exit /b 1
)

:: 3. Setup Virtual Environment
if not exist "venv\Scripts\activate.bat" (
    echo [INFO] Creating virtual environment in venv...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

:: 4. Activate Virtual Environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

:: 5. Install / Update dependencies
echo [INFO] Installing required dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

:: 6. Launch Uvicorn Server
echo.
echo ========================================================
echo Starting FastAPI model server on http://127.0.0.1:8000
echo Swagger documentation: http://127.0.0.1:8000/docs
echo ========================================================
echo.

uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
