Write-Host "========================================================" -ForegroundColor Green
Write-Host "   Starting KisanSathi AI v2.0                          " -ForegroundColor Green
Write-Host "   (MySQL + Python ML Engine + Node Backend + Frontend) " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

Set-Location $PSScriptRoot

Write-Host "`n[1/4] Ensuring MySQL Server is running on port 3306..." -ForegroundColor Cyan
Start-Process "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" -ArgumentList "--datadir=`"$PSScriptRoot\database\mysql_data`"", "--port=3306" -WindowStyle Hidden

Write-Host "[2/4] Starting Python ML Microservices Engine on port 8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ml_services; python -m uvicorn app:app --host 0.0.0.0 --port 8000"

Write-Host "[3/4] Starting Node.js Backend Server on port 5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start"

Write-Host "[4/4] Starting React Frontend Client on port 5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

Write-Host "`nWaiting 3 seconds for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "`nOpening browser at http://localhost:5173 ..." -ForegroundColor Green
Start-Process "http://localhost:5173"
