$env:PYTHONIOENCODING = "utf-8"
Set-Location -Path $PSScriptRoot
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  🌾 KisanSathi AI - Python ML Microservices Engine" -ForegroundColor Green
Write-Host "  Endpoints running on http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Interactive OpenAPI docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
