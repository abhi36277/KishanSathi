# KisanSathi AI - API Contract

All responses conform to the standard structure:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```
Or on failure:
```json
{
  "success": false,
  "data": null,
  "error": "Error message description"
}
```

### Authentication & Authorization
- Protected endpoints require an `Authorization: Bearer <SUPABASE_JWT>` header, or `x-demo-user: true` for demo mode.
- In demo mode, ownership is mapped to the seeded demo user (`00000000-0000-0000-0000-000000000001` or `...004`).

---

## 1. System Endpoints

### `GET /api/health`
Checks server status, uptime and configured integrations.
- **Auth**: None
- **Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-11-05T15:00:00.000Z",
    "version": "1.0.0",
    "services": {
      "supabase": "connected | fallback_memory",
      "gemini": "configured | fallback_mock",
      "weather": "open-meteo"
    }
  },
  "error": null
}
```

---

## 2. Farmers & Farm Profiles

### `POST /api/farmers`
Registers a new farmer profile.
- **Request Body**:
```json
{
  "name": "Ramesh Gowda",
  "phone": "+919876543210",
  "state": "Karnataka",
  "district": "Mandya",
  "village": "Shivalli",
  "language": "kn",
  "latitude": 12.5238,
  "longitude": 76.8967,
  "area_acres": 2.5,
  "soil_type": "Red Sandy Loam",
  "crop_name": "Rice",
  "sowing_date": "2026-10-01",
  "variety": "JGL 1798"
}
```

### `GET /api/farmers/:id`
Retrieves farmer profile with farms and active crops.
- **Auth**: Required (Ownership check)

---

## 3. Crop Management

### `POST /api/crops`
Adds a crop to a farmer's farm.
- **Request Body**: `{ "farmerId": "...", "crop_name": "Rice", "sowing_date": "2026-10-01", "variety": "JGL 1798" }`

### `GET /api/crops/:farmerId`
Lists crops for a farmer.

### `PATCH /api/crops/:id`
Updates growth stage.
- **Request Body**: `{ "growth_stage": "Tillering" }`

---

## 4. Weather (Open-Meteo Proxy)

### `GET /api/weather?lat=12.5238&lon=76.8967`
Server-side weather fetch with validation and plain language agricultural advisory.
- **Auth**: None
- **Response**:
```json
{
  "success": true,
  "data": {
    "current": {
      "temperature": 28.4,
      "humidity": 68,
      "wind_speed": 11.2,
      "weather_code": 1,
      "condition": "Mainly Clear",
      "precipitation": 0.0
    },
    "forecast": [
      {
        "date": "2026-11-05",
        "temp_max": 31.0,
        "temp_min": 21.2,
        "precipitation_probability": 15,
        "rain_sum": 0.0,
        "condition": "Partly Cloudy"
      }
    ],
    "advisory": "Weather conditions are favorable for field operations.",
    "source": "Open-Meteo",
    "fetchedAt": "2026-11-05T15:10:00.000Z"
  },
  "error": null
}
```

---

## 5. Daily Action Plan & Adaptive Schedule

### `GET /api/action-plan/:farmerId?date=2026-11-05`
Generates or retrieves deterministic action plan for the crop & stage.

### `PATCH /api/action-plan/:id`
Toggles task completion.
- **Request Body**: `{ "completed": true }`

### `POST /api/action-plan/recover-missed`
Adaptive schedule recalculation: handles missed activities with agricultural rules.
- **Request Body**:
```json
{
  "farmerId": "...",
  "taskId": "...",
  "reason": "Heavy unseasonal rain made field unapproachable",
  "postponeDays": 2
}
```

---

## 6. AI Assistant (Gemini Flash)

### `POST /api/ai/chat`
Rate-limited context-grounded conversational endpoint.
- **Request Body**:
```json
{
  "farmerId": "...",
  "message": "Is it time for second urea top dressing for my rice crop?",
  "language": "kn"
}
```

---

## 7. Pre-Planting Crop Comparison & Extra Modules

### `POST /api/crop-comparison`
Compares 2-3 crops for a given acreage, soil, and region.
- **Request Body**: `{ "acres": 1, "region": "Karnataka", "crops": ["Tomatoes", "Chillies", "Beans"] }`

### `POST /api/expenses` / `GET /api/expenses/:farmerId`
Expense ledger with voice transcript parsing and category totals.

### `POST /api/crop-loss/evidence`
PMFBY insurance claim package generator.

### `GET /api/transport-pools` & `POST /api/transport-pools`
Transport pooling rides and load sharing.

### `GET /api/community/posts` & `POST /api/community/posts`
Farmer community Q&A and pest alerts.
