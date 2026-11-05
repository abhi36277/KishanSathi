import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { requireAuth, verifyFarmerOwnership } from './middleware/auth.js';
import { aiRateLimiter } from './middleware/rateLimiter.js';
import { register, login, getMe, logout } from './controllers/authController.js';
import { registerFarmer, getFarmerProfile } from './controllers/farmerController.js';
import { addCrop, getCropsByFarmer, updateCropStage } from './controllers/cropController.js';
import { fetchWeatherData } from './services/weatherService.js';
import { getActionPlan, toggleActionPlan, recoverMissedTask } from './controllers/actionPlanController.js';
import { chatWithAI, getChatHistory, clearChatHistory } from './controllers/aiController.js';
import {
  identifyDisease,
  getMarketPrices,
  getCropLifecycle,
  getPestRadar,
  submitPestReport,
  lookupLocation
} from './controllers/agriServicesController.js';
import {
  compareCrops,
  addExpense,
  getExpenses,
  analyzeFieldPhoto,
  getPestAlerts,
  getTransportPools,
  createTransportPool,
  getCommunityPosts,
  createCommunityPost,
  createCropLossEvidence,
  getGovtSchemes
} from './controllers/featuresController.js';
import { localStore, isSupabaseConfigured } from './config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173', '*'],
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));

// Request Logger (strips passwords & personal data)
app.use('/api', (req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// 1. System Health Check
app.get('/api/health', (req, res) => {
  const dbHealth = localStore.getHealthSummary();
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0',
      database: dbHealth,
      ml_models: {
        disease_vision_ml: 'ICAR Plant Pathology Decision Tree + Gemini Flash Vision',
        market_price_ml: 'MandiPrice-Forecast-ARIMA-v2.1',
        crop_lifecycle_ml: 'ICAR-AgronomicLifecycle-Engine-v2.0',
        pest_radar_ml: 'KisanSathi-GeoPestRadar-ML-v2.0',
        multilingual_chat_ml: 'Grounded Conversational Agent (en/hi/kn)'
      },
      integrations: {
        gemini: process.env.GEMINI_API_KEY ? 'configured' : 'knowledge_base_mode',
        weather: 'open-meteo (live)'
      }
    },
    error: null
  });
});

// Database Health Check Endpoint
app.get('/api/db/health', (req, res) => {
  res.json({
    success: true,
    data: localStore.getHealthSummary(),
    error: null
  });
});

// Database Table Inspector Endpoint
app.get('/api/db/tables/:tableName', (req, res) => {
  const { tableName } = req.params;
  const validTables = ['farmers', 'farms', 'crops', 'action_plans', 'chat_history', 'disease_reports', 'farm_expenses', 'transport_pools', 'community_posts', 'pest_alerts'];
  if (!validTables.includes(tableName)) {
    return res.status(404).json({ success: false, data: null, error: `Table '${tableName}' not found.` });
  }
  const tableData = localStore[tableName] || [];
  return res.json({
    success: true,
    table: tableName,
    count: tableData.length,
    data: tableData,
    error: null
  });
});

// 2. Weather Endpoint (Open-Meteo Server-Side Proxy - Public)
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, data: null, error: 'Query parameters lat and lon are required' });
    }
    const weatherData = await fetchWeatherData(lat, lon);
    return res.json({ success: true, data: weatherData, error: null });
  } catch (error) {
    return res.status(400).json({ success: false, data: null, error: error.message });
  }
});

// 3. Authentication & Farmer Profile
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', requireAuth, getMe);
app.post('/api/auth/logout', logout);

app.post('/api/farmers', registerFarmer);
app.get('/api/farmers/:id', requireAuth, verifyFarmerOwnership, getFarmerProfile);

// 4. Crop Management
app.post('/api/crops', requireAuth, addCrop);
app.get('/api/crops/:farmerId', requireAuth, verifyFarmerOwnership, getCropsByFarmer);
app.patch('/api/crops/:id', requireAuth, updateCropStage);

// 5. Daily Action Plan & Missed-Task Recovery
app.get('/api/action-plan/:farmerId', requireAuth, verifyFarmerOwnership, getActionPlan);
app.patch('/api/action-plan/:id', requireAuth, toggleActionPlan);
app.post('/api/action-plan/recover-missed', requireAuth, recoverMissedTask);

// 6. Multilingual Conversational AI Assistant (Maintains Chat History & Crop Lifecycle Memory)
app.post('/api/ai/chat', aiRateLimiter, requireAuth, chatWithAI);
app.get('/api/ai/history/:farmerId', requireAuth, verifyFarmerOwnership, getChatHistory);
app.delete('/api/ai/history/:farmerId', requireAuth, verifyFarmerOwnership, clearChatHistory);

// 7. Specialized Separate ML Model Endpoints
// ML Model 1: Disease Identification Pipeline
app.post('/api/disease/identify', identifyDisease);

// ML Model 2: Mandi Market Prices & 7-Day Trend Prediction
app.get('/api/prices/mandi', getMarketPrices);

// ML Model 3: Crop Lifecycle Planner (Day-by-Day Sowing, Irrigation, Fertilizer)
app.get('/api/crop-lifecycle/:farmerId', requireAuth, verifyFarmerOwnership, getCropLifecycle);

// ML Model 4: Geospatial Pest Radar by Location API with Live Alert Map
app.get('/api/pest-radar', getPestRadar);
app.post('/api/pest-radar/report', requireAuth, submitPestReport);
app.get('/api/location/lookup', lookupLocation);

// 8. Agricultural & Community Features
app.post('/api/crop-comparison', compareCrops);
app.post('/api/expenses', requireAuth, addExpense);
app.get('/api/expenses/:farmerId', requireAuth, verifyFarmerOwnership, getExpenses);

app.post('/api/field-photo/analyze', requireAuth, analyzeFieldPhoto);
app.get('/api/pest-alerts', getPestAlerts);

app.get('/api/transport-pools', getTransportPools);
app.post('/api/transport-pools', requireAuth, createTransportPool);

app.get('/api/community/posts', getCommunityPosts);
app.post('/api/community/posts', requireAuth, createCommunityPost);

app.post('/api/crop-loss/evidence', requireAuth, createCropLossEvidence);
app.get('/api/schemes', getGovtSchemes);

// Serve Static Frontend if built in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Fallback to index.html for SPA client routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      data: null,
      error: `Route not found: ${req.method} ${req.originalUrl}`
    });
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(200).send('KisanSathi AI Backend running. Start Vite dev server for frontend UI.');
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    data: null,
    error: err.message || 'Internal Server Error'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🌾 KisanSathi AI v2.0 Server running on port ${PORT}`);
    console.log(`   Health check available at http://localhost:${PORT}/api/health`);
  });
}

export default app;
