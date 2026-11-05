@echo off
TITLE KisanSathi AI - Launching System
echo ========================================================
echo   Starting KisanSathi AI (MySQL + Backend + Frontend)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Ensuring MySQL Server is running on port 3306...
start /b "" "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir="%~dp0database\mysql_data" --port=3306

echo [2/3] Launching Backend Server on port 5000...
start "KisanSathi Server" cmd /k "cd server && npm start"

echo [3/3] Launching Frontend Client on port 5173...
start "KisanSathi Client" cmd /k "cd client && npm run dev"

echo.
echo ========================================================
echo All Systems Starting!
echo MySQL Server: localhost:3306 (DB: kisansathi)
echo Backend API:  http://localhost:5000/api/health
echo Frontend Web: http://localhost:5173
echo ========================================================
timeout /t 3 >nul
start http://localhost:5173
