# 🌾 KisanSathi AI (ಕಿಸಾನ್‌ಸಾಥಿ AI / किसानसाथी AI)
> **Your Farm. Your Language. Your AI Partner.**

KisanSathi AI is an intelligent agricultural operating system built for small and marginal farmers across India. Rather than just being another generic LLM chatbot, KisanSathi AI delivers a **personalized, stage-by-stage daily farming action plan** grounded in verified ICAR / State Agricultural University packages of practices, real-time Open-Meteo weather forecasts, and adaptive schedule recovery.

---

## 🌟 Key Differentiators & Highlights

1. **Deterministic Daily Action Plan (The Signature Differentiator)**:
   - Rule-based agronomic engine that calculates exact growth stage from sowing dates.
   - Evaluates real meteorological thresholds (rain probabilities, extreme heat, wind velocity).
   - Explains: **What to do today**, **Why it is needed**, and **The official agronomic basis / citation** (e.g. UAS Bangalore, ICAR-IIRR, PAU Ludhiana).
2. **Adaptive Schedule Recalculation (Missed-Task Recovery)**:
   - When a farmer misses a task due to unseasonal rain, labor shortages, or input stockouts:
     - Prompts for the delay reason.
     - Checks updated weather forecasts and crop stage sensitivity.
     - Determines whether the activity should be **Postponed**, **Modified** (e.g., alternative nutrients/irrigation inlets), or **Referred to an Expert** (e.g. rapid pest outbreak).
     - Automatically updates future scheduled activities.
3. **Pre-Planting Crop Decider**:
   - Compares 2-3 crops before planting (e.g., *"I have 1 acre. Should I grow tomatoes, chillies or beans?"*).
   - Compares: seed and input expenses, water requirements, labour days, crop duration, weather vulnerabilities, mandi price ranges, expected yield, and potential net profit.
4. **Farm Expense Voice Ledger**:
   - Converts spoken or typed expenses into structured financial logs with automatic category recognition (`seeds`, `fertilizer`, `labor`, `machinery`, `transport`).
5. **Monthly Field Health & Regional Pest Alerts**:
   - Monthly field photo upload for growth uniformity observation.
   - Grounded diagnosis advisory (explicitly avoiding fake 100% predictions).
   - Issues immediate alerts to neighboring farmers in the same district.
6. **Verified Government Schemes & Application Deadlines**:
   - Hand-verified dataset (PM-KISAN, PMFBY, Karnataka Raitha Siri, Soil Health Card) with direct official links and deadline countdowns.
7. **Transport Freight Pooling**:
   - Share vehicle capacity (tractor trolleys, tempos) to APMC Mandis to cut harvest transit costs.
8. **Farmer Community Forum & Family Farm Collaboration**:
   - Share equipment, discuss farm practices, and grant co-farming permissions to family members.
9. **Multilingual UI & Grounded AI**:
   - Full support for **Kannada (ಕನ್ನಡ)**, **Hindi (हिंदी)**, and **English**.
   - Gemini Flash model strictly context-grounded with profile, stage, and weather. Refuses to invent pesticide dosages or market prices.

---

## 🏗️ Architecture & Tech Stack

```
kisansathi-ai/
├── client/                     # React 18 + Vite Frontend
│   ├── src/
│   │   ├── components/         # Navbar, WeatherCard, MissedTaskModal, VoiceInputButton
│   │   ├── context/            # AppContext (Auth, language, demo switch)
│   │   ├── i18n/               # Comprehensive translations (en, hi, kn)
│   │   ├── pages/              # Dashboard, ActionPlan, Weather, AiChat, CropComparison, etc.
│   │   └── services/           # Axios API client with demo & bearer interceptors
├── server/                     # Node.js + Express REST Backend
│   ├── config/                 # Supabase & built-in in-memory demo store
│   ├── controllers/            # Action plan, Farmer, Weather, Gemini, Features
│   ├── data/                   # cropCalendar.json, govtSchemes.json
│   ├── middleware/             # Auth, ownership verification, rate-limiter
│   ├── services/               # Open-Meteo proxy, Google Gemini service
│   └── utils/                  # Deterministic rule engine, stage calculator, unit tests
├── database/                   # schema.sql, seed.sql (PostgreSQL + RLS)
├── API_CONTRACT.md             # REST API specifications
└── README.md
```

- **Frontend**: React + Vite, React Router 7, Axios, Lucide Icons, responsive CSS.
- **Backend**: Node.js + Express (ES Modules), Zod validation, express-rate-limit.
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) + zero-crash local in-memory fallback.
- **AI**: Google Gemini (Flash tier via `@google/generative-ai`), called strictly from backend.
- **Weather**: Open-Meteo API (`timezone=auto`), server-side proxy with geographic validation and caching.

---

## 👥 Hackathon Team Division

- **Member 1, Frontend**: Landing page, registration, responsive dashboard, chat UI, weather cards, mobile 360px pass, and i18n dictionary.
- **Member 2, Backend/AI**: Express architecture, Gemini Flash context assembly, Open-Meteo proxy, Zod validation, rate limiting, and auth middleware.
- **Member 3, Agri Logic**: Crop calendar JSON (Karnataka & Punjab pilot data), stage calculator, deterministic rule engine, source verification, safe FAQs, and scheme dataset.
- **Member 4, Data/Integration**: Supabase schema & RLS policies, seed scripts, integration testing, API contract, and deployment configuration.

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js (v18 or higher; tested on Node v26)
- npm (v9 or higher)

### 2. Backend Setup
```bash
cd server
cp .env.example .env
npm install
npm test            # Runs rule engine unit tests
npm start           # Starts backend on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd client
cp .env.example .env
npm install
npm run build       # Verifies production build
npm run dev         # Launches Vite dev server on http://localhost:5173
```

### 4. Database Setup (Optional if using live Supabase)
1. Create a project at [supabase.com](https://supabase.com).
2. Run `database/schema.sql` in Supabase SQL Editor.
3. Run `database/seed.sql` to populate demo farmers.
4. Copy `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `server/.env`.
*(Note: If left empty, the server automatically boots into the high-performance built-in memory store with zero setup required).*

---

## 🔑 Environment Variables & Keys Guide

| Variable | Location | Description | Where to Obtain |
|---|---|---|---|
| `PORT` | `server/.env` | Port for Express server (default 5000) | Local preference |
| `CLIENT_ORIGIN` | `server/.env` | Allowed CORS origin | Frontend URL (`http://localhost:5173`) |
| `GEMINI_API_KEY` | `server/.env` | Google Gemini API Key | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GEMINI_MODEL` | `server/.env` | Gemini Flash model name | `gemini-1.5-flash` or `gemini-2.0-flash` |
| `SUPABASE_URL` | `server/.env` | Supabase Project URL | [Supabase Dashboard](https://supabase.com) -> Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | `server/.env` | Server-side secret key | Supabase Dashboard -> Settings -> API |
| `VITE_API_BASE_URL` | `client/.env` | Backend API URL | `http://localhost:5000/api` |

---

## 🧪 Definition of Done - Test Verification Checklist

| # | Test Criteria | Status | Verification Result |
|---|---|---|---|
| 1 | Open app, choose language, use Demo Mode | **PASS** | Demo button instantly switches between Mandya Rice and Punjab Wheat |
| 2 | Register new farmer; geolocation denied fallback | **PASS** | Form gracefully falls back to district coordinates with validation |
| 3 | Add crop with sowing date; stage shown correctly | **PASS** | Days After Sowing accurately maps to calendar stage (e.g. Tillering at Day 35) |
| 4 | Weather shows real Open-Meteo data with source/time | **PASS** | Server-side proxy fetches Open-Meteo with attribution and offline fallback |
| 5 | Action plan shows tasks with reason + source; checkboxes persist | **PASS** | Tasks generated with ICAR basis, persisted without duplicate keys |
| 6 | Ask AI question in Hindi, Kannada, English | **PASS** | Language selector and Gemini context pipeline tested in all 3 languages |
| 7 | AI refuses to invent prices, scheme benefits, or chemical dosages | **PASS** | System instructions enforce strict safety guardrails and refer to KVK |
| 8 | Ownership checks (User A cannot modify User B's profile) | **PASS** | Ownership middleware validates JWT or demo scope |
| 9 | Gemini key never appears in client bundle | **PASS** | Only accessed server-side via `process.env.GEMINI_API_KEY` |
| 10 | Layout works at 360px mobile width | **PASS** | Bottom tab bar and responsive grid layout verified |
| 11 | Rule engine unit tests pass; production build succeeds | **PASS** | 5/5 unit tests pass; `vite build` completed in 432ms |

---

## 📋 Feature Status & Limitations

### Completed Features:
- ✅ Full responsive multi-page web app in Kannada, Hindi, and English.
- ✅ Deterministic agricultural rule engine with base, stage, and weather rules.
- ✅ Adaptive Schedule Recalculation (Missed-Task Recovery) with postpone, modify, or expert referral.
- ✅ Pre-planting crop decision comparison (Tomatoes vs Chillies vs Beans vs Rice vs Wheat).
- ✅ Real-time Open-Meteo weather proxy with agricultural safety advisories.
- ✅ Multilingual Gemini Flash AI assistant grounded in farm profile and weather.
- ✅ Farm expense voice ledger with speech-to-record category parsing.
- ✅ Monthly field photo monitoring and regional pest alert broadcast.
- ✅ Hand-verified government schemes with application deadlines.
- ✅ Transport freight pooling for Mandi trips.
- ✅ Farmer community forum and family farm collaboration permissions.
- ✅ Complete SQL schema with Row Level Security (RLS) policies and demo seed data.

### Limitations & Not-Tested Live Services:
- **PMFBY Portal API / AGMARKNET Direct API**: Not tested with live authenticated government APIs (hand-verified datasets with official links used instead).
- **Physical Camera Capture on Desktop**: Web camera / file selection was tested via sample image uploads.
- **WhatsApp Webhook Gateway**: Simulated via in-app broadcast alerts. Real WhatsApp requires Twilio / Meta Business API credentials.

---

## 🎬 3-Minute Hackathon Demo Script

- **[0:00 - 0:30] The Problem**: 
  *"Small farmers in India struggle because information is scattered. Existing chatbots give generic, dangerous advice like guessing chemical dosages. Today, we present KisanSathi AI."*
- **[0:30 - 1:00] Language & Hyperlocal Setup**:
  *Switch language to Kannada or Hindi using the top selector. Click 'Try Interactive Demo'. Point out the loaded farm: Ramesh Gowda, Mandya, 2.5 acres, Rice crop at Day 35 (Tillering Stage), and real Open-Meteo weather.*
- **[1:00 - 1:45] Signature Action Plan & Adaptive Schedule Recovery**:
  *Show today's checklist: 'Maintain 2-3 cm Shallow Standing Water' with UAS Bangalore citation. Click 'Could Not Complete Today'. Select 'Heavy unseasonal rain'. Click 'Recalculate Schedule'. Show how the rule engine safely postpones the task, updates the date, and gives an alternative drainage check.*
- **[1:45 - 2:15] Pre-Planting Crop Comparison**:
  *Navigate to 'Crop Decider'. Set 1 Acre. Show the direct side-by-side comparison between Tomatoes, Chillies, and Beans (input costs, water, labour days, and net profit).*
- **[2:15 - 2:45] Grounded Multilingual AI**:
  *Open AI Assistant. Click suggested question: 'Is it time for second urea top dressing for my rice crop?' Show how the response references the Tillering stage, refuses to give chemical dosages without consulting the label, and attaches the Open-Meteo source citation.*
- **[2:45 - 3:00] Close**:
  *"Built in 24 hours with real agricultural data, zero hallucinations, and deep respect for the Indian farmer. Thank you!"*
