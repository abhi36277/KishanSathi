# KisanSathi AI - Python Machine Learning Microservices

This directory contains the independent **Python-based Machine Learning & Agronomic Intelligence** pipelines powering KisanSathi AI.

## Architecture

Each machine learning task runs as an independent, decoupled Python model:

| Pipeline | File | Description |
|---|---|---|
| **Disease Vision ML** | `models/disease_vision_ml.py` | Computer Vision & Plant Pathology diagnostic pipeline (Gemini Vision + ICAR Decision Tree). |
| **Mandi Price Predictor ML** | `models/price_predictor_ml.py` | Time-series 7-day ARIMA price forecasting, arrival volume modeling, and net freight profit ranking. |
| **Crop Lifecycle ML** | `models/crop_lifecycle_ml.py` | Growing Degree Day (GDD) and stage optimization engine for sowing, irrigation depth, and fertilizer top-dressing. |
| **Geospatial Pest Radar ML** | `models/pest_radar_ml.py` | Haversine proximity clustering & atmospheric humidity/temperature incubation estimator. |
| **Multilingual Conversational ML** | `models/multilingual_chat_ml.py` | Context-grounded trilingual NLP agent (English, Hindi, Kannada) with per-farmer memory. |

## Quick Start

### 1. Configure Environment Variables
Copy `.env.example` to `.env` and paste your free API keys:
```bash
cp .env.example .env
```

Available free API keys:
- **Google Gemini API Key:** Free tier from [Google AI Studio](https://aistudio.google.com).
- **HuggingFace API Key:** Free tier from [Hugging Face Settings](https://huggingface.co/settings/tokens).

*(If no keys are provided, each model automatically runs its high-precision, offline verified ICAR heuristic agronomic engine without errors.)*

### 2. Start the Microservice
Double-click `run_ml.bat` or run:
```bash
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI Swagger UI is available at:
👉 **http://localhost:8000/docs**
