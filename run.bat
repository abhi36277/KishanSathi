@echo off
TITLE KisanSathi AI - Launching Full Stack & Python ML
echo ========================================================
echo   Starting KisanSathi AI v2.0
echo   (MySQL + Python ML Engine + Node Backend + Frontend)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/4] Ensuring MySQL Server is running on port 3306...
start /b "" "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir="%~dp0database\mysql_data" --port=3306

echo [2/4] Launching Python ML Microservice on port 8000...
start "KisanSathi Python ML" cmd /k "cd ml_services && python -m uvicorn app:app --host 0.0.0.0 --port 8000"

echo [3/4] Launching Node.js Backend Server on port 5000...
start "KisanSathi Server" cmd /k "cd server && npm start"

echo [4/4] Launching React Vite Frontend on port 5173...
start "KisanSathi Client" cmd /k "cd client && npm run dev"

echo.
echo ========================================================
echo All Systems Starting!
echo MySQL Server: localhost:3306 (DB: kisansathi)
echo Python ML:    http://localhost:8000/docs
echo Backend API:  http://localhost:5000/api/health
echo Frontend Web: http://localhost:5173
echo ========================================================
timeout /t 3 >nul
start http://localhost:5173
