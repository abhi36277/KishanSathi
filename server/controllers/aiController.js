import { getGeminiReply } from '../services/geminiService.js';
import { supabase, isSupabaseConfigured, localStore } from '../config/db.js';
import { calculateGrowthStage } from '../utils/stageCalculator.js';
import { fetchWeatherData } from '../services/weatherService.js';
import crypto from 'crypto';

export async function chatWithAI(req, res) {
  try {
    const { farmerId, message, language } = req.body;

    if (!farmerId || !message) {
      return res.status(400).json({ success: false, data: null, error: 'farmerId and message are required' });
    }

    // 1. Gather context
    let farmer = null;
    let crop = null;

    if (isSupabaseConfigured) {
      const { data: fData } = await supabase.from('farmers').select('*').eq('id', farmerId).single();
      farmer = fData;
      if (farmer) {
        const { data: cData } = await supabase.from('crops').select('*').eq('farmer_id', farmerId).order('created_at', { ascending: false }).limit(1);
        crop = cData?.[0] || null;
      }
    } else {
      farmer = localStore.farmers.find(f => f.id === farmerId);
      crop = localStore.crops.filter(c => c.farmer_id === farmerId).pop() || null;
    }

    const stage = crop
      ? calculateGrowthStage(crop.crop_name, crop.sowing_date, farmer?.state || 'Karnataka', crop.growth_stage)
      : null;

    const weather = farmer
      ? await fetchWeatherData(farmer.latitude, farmer.longitude)
      : null;

    let tasks = [];
    if (crop) {
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('action_plans').select('*').eq('crop_id', crop.id).limit(5);
        tasks = data || [];
      } else {
        tasks = localStore.action_plans.filter(p => p.crop_id === crop.id).slice(0, 5);
      }
    }

    // 2. Query Gemini / Knowledge Base
    const aiResult = await getGeminiReply({
      farmer,
      crop,
      stage,
      weather,
      tasks,
      userMessage: message,
      language: language || farmer?.language || 'en'
    });

    // 3. Save to chat history
    const userMsgRecord = {
      id: crypto.randomUUID(),
      farmer_id: farmerId,
      role: 'user',
      message,
      created_at: new Date().toISOString()
    };

    const aiMsgRecord = {
      id: crypto.randomUUID(),
      farmer_id: farmerId,
      role: 'assistant',
      message: aiResult.reply,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      await supabase.from('chat_history').insert([userMsgRecord, aiMsgRecord]);
    } else {
      localStore.chat_history.push(userMsgRecord, aiMsgRecord);
    }

    return res.json({
      success: true,
      data: {
        reply: aiResult.reply,
        source: aiResult.source,
        timestamp: aiResult.timestamp,
        contextUsed: {
          crop: crop?.crop_name,
          stage: stage?.stageName,
          weatherAvailable: !weather?.isFallback
        }
      },
      error: null
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

export async function getChatHistory(req, res) {
  try {
    const { farmerId } = req.params;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return res.json({ success: true, data: data || [], error: null });
    }

    const history = localStore.chat_history.filter(h => h.farmer_id === farmerId);
    return res.json({ success: true, data: history, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}
