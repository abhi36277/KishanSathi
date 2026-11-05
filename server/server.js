import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requireAuth, verifyFarmerOwnership } from './middleware/auth.js';
import { aiRateLimiter } from './middleware/rateLimiter.js';
import { registerFarmer, getFarmerProfile } from './controllers/farmerController.js';
import { addCrop, getCropsByFarmer, updateCropStage } from './controllers/cropController.js';
import { fetchWeatherData } from './services/weatherService.js';
import { getActionPlan, toggleActionPlan, recoverMissedTask } from './controllers/actionPlanController.js';
import { chatWithAI, getChatHistory } from './controllers/aiController.js';
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

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request Logger (strips sensitive personal information)
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
      version: '1.0.0',
      database: dbHealth,
      integrations: {
        gemini: process.env.GEMINI_API_KEY ? 'configured' : 'mock_fallback_mode',
        supabase: isSupabaseConfigured ? 'connected' : 'local_disk_persistent',
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

// Database Table Inspector Endpoint (for Visual DB viewers & MySQL parity)
app.get('/api/db/tables/:tableName', (req, res) => {
  const { tableName } = req.params;
  const validTables = ['farmers', 'farms', 'crops', 'action_plans', 'chat_history', 'farm_expenses', 'transport_pools', 'community_posts', 'pest_alerts'];
  if (!validTables.includes(tableName)) {
    return res.status(404).json({ success: false, data: null, error: `Table '${tableName}' not found. Available tables: ${validTables.join(', ')}` });
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

// 3. Farmer Registration & Profile
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

// 6. AI Assistant (Rate Limited)
app.post('/api/ai/chat', aiRateLimiter, requireAuth, chatWithAI);
app.get('/api/ai/history/:farmerId', requireAuth, verifyFarmerOwnership, getChatHistory);

// 7. Advanced & Stretch Agricultural Features
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

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: `Route not found: ${req.method} ${req.originalUrl}`
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
    console.log(`🌾 KisanSathi AI Server running on port ${PORT}`);
    console.log(`   Health check available at http://localhost:${PORT}/api/health`);
  });
}

export default app;
