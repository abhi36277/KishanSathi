@echo off
title KisanSathi AI - Python ML Engine (Port 8000)
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
echo ========================================================
echo  KisanSathi AI - Python ML Microservices Engine
echo  Running on http://localhost:8000
echo  Documentation: http://localhost:8000/docs
echo ========================================================
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
pause
