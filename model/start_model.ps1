Set-Location -Path $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "      FraudShield - Fraud Text Classification Model" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Ensure .env exists
if (-not (Test-Path ".env")) {
    Write-Host "[.env] not found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

# 2. Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[INFO] Detected $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python is not found in PATH. Please install Python 3.10+." -ForegroundColor Red
    exit 1
}

# 3. Setup Virtual Environment
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "[INFO] Creating virtual environment in venv..." -ForegroundColor Yellow
    python -m venv venv
}

# 4. Activate Virtual Environment
Write-Host "[INFO] Activating virtual environment..." -ForegroundColor Green
& ".\venv\Scripts\Activate.ps1"

# 5. Install requirements
Write-Host "[INFO] Installing required dependencies..." -ForegroundColor Yellow
python -m pip install --upgrade pip
pip install -r requirements.txt

# 6. Start Uvicorn
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting FastAPI model server on http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Swagger docs: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
