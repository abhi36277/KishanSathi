"""
KisanSathi AI - Python Autonomous ML Microservice Engine
FastAPI Service hosting 5 distinct Machine Learning & Agronomic Pipelines:
1. Plant Disease & Computer Vision Model
2. APMC Mandi Price Forecasting Model
3. Growing Degree Day Crop Lifecycle Model
4. Geospatial Pest Threat Radar Model
5. Grounded Multilingual Conversational Model
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Ensure ml_services root is in Python sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")

# Import the 5 separate ML modules
from models.disease_vision_ml import diagnose_crop_disease
from models.price_predictor_ml import predict_mandi_prices
from models.crop_lifecycle_ml import calculate_crop_lifecycle
from models.pest_radar_ml import scan_pest_radar
from models.multilingual_chat_ml import chat_multilingual

app = FastAPI(
    title="KisanSathi AI - Python ML Engine",
    description="Dedicated Python Machine Learning & Agricultural Intelligence Microservice",
    version="2.0.0"
)

# Enable CORS for communication with Node.js backend and React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request schemas
class DiseaseScanRequest(BaseModel):
    crop_name: str = "Rice (Paddy)"
    symptoms: str = ""
    image_base64: Optional[str] = None
    location: str = "Karnataka"


class ChatQueryRequest(BaseModel):
    farmer_name: str = "Farmer"
    crop_name: str = "Rice (Paddy)"
    stage_name: str = "Tillering"
    das: int = 35
    user_query: str
    language: str = "en"
    weather_summary: str = "Normal weather conditions"
    chat_history: Optional[List[Dict[str, str]]] = None


# 1. System Health Check
@app.get("/ml/health")
def ml_health_check():
    return {
        "status": "healthy",
        "service": "KisanSathi-Python-ML-Engine",
        "python_runtime": "3.13.1",
        "models_running": {
            "disease_vision_ml": "ICAR-Pathology-ComputerVision-v2",
            "price_predictor_ml": "MandiPrice-ARIMA-Forecast-v2",
            "crop_lifecycle_ml": "GDD-AgronomicLifecycle-v2",
            "pest_radar_ml": "Haversine-Climate-PestRadar-v2",
            "multilingual_chat_ml": "Grounded-Trilingual-Agent-v2"
        },
        "api_keys_configured": {
            "gemini": bool(os.getenv("GEMINI_API_KEY") and not os.getenv("GEMINI_API_KEY").startswith("your-")),
            "huggingface": bool(os.getenv("HUGGINGFACE_API_KEY") and not os.getenv("HUGGINGFACE_API_KEY").startswith("your-"))
        }
    }


# 2. Pipeline 1: Disease Vision ML
@app.post("/ml/disease/identify")
def endpoint_disease_id(req: DiseaseScanRequest):
    try:
        return diagnose_crop_disease(
            crop_name=req.crop_name,
            symptoms=req.symptoms,
            image_base64=req.image_base64,
            location=req.location
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 3. Pipeline 2: Mandi Price Predictor ML
@app.get("/ml/prices/predict")
def endpoint_price_predict(state: str = "Karnataka", crop: str = "Rice"):
    try:
        return predict_mandi_prices(state=state, crop=crop)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 4. Pipeline 3: Crop Lifecycle & Sowing/Irrigation Schedule ML
@app.get("/ml/lifecycle/calculate")
def endpoint_lifecycle(crop: str = "Rice", sowing_date: str = "2026-10-01"):
    try:
        return calculate_crop_lifecycle(crop_name=crop, sowing_date=sowing_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 5. Pipeline 4: Geospatial Pest Threat Radar ML
@app.get("/ml/radar/scan")
def endpoint_pest_radar(lat: float = 12.5238, lon: float = 76.8967, humidity: float = 78.0, temp: float = 26.5):
    try:
        return scan_pest_radar(user_lat=lat, user_lon=lon, humidity=humidity, temperature=temp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 6. Pipeline 5: Multilingual Grounded Conversational AI
@app.post("/ml/chat/grounded")
def endpoint_multilingual_chat(req: ChatQueryRequest):
    try:
        return chat_multilingual(
            farmer_name=req.farmer_name,
            crop_name=req.crop_name,
            stage_name=req.stage_name,
            das=req.das,
            user_query=req.user_query,
            language=req.language,
            weather_summary=req.weather_summary,
            chat_history=req.chat_history
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    print(f"🌾 Starting KisanSathi Python ML Engine on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
