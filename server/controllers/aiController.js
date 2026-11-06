import { generateMultilingualReply } from '../services/multilingualChatML.js';
import { calculateFullCropLifecycle } from '../services/cropLifecycleML.js';
import { fetchWeatherData } from '../services/weatherService.js';
import { supabase, isSupabaseConfigured, localStore } from '../config/db.js';
import crypto from 'crypto';

/**
 * Multilingual Context-Aware AI Chatbot
 * Enforces per-farmer memory, plant lifecycle stage grounding, and persistent chat history.
 */
export async function chatWithAI(req, res) {
  try {
    const { farmerId, message, language } = req.body;

    if (!farmerId || !message) {
      return res.status(400).json({ success: false, data: null, error: 'farmerId and message are required' });
    }

    // 1. Gather Farmer & Crop Context
    let farmer = null;
    let crop = null;
    let farm = null;
    let farmerHistory = [];

    if (isSupabaseConfigured) {
      const { data: fData } = await supabase.from('farmers').select('*').eq('id', farmerId).single();
      farmer = fData;
      if (farmer) {
        const { data: cData } = await supabase.from('crops').select('*').eq('farmer_id', farmerId).order('created_at', { ascending: false }).limit(1);
        crop = cData?.[0] || null;
        const { data: fmData } = await supabase.from('farms').select('*').eq('farmer_id', farmerId).limit(1);
        farm = fmData?.[0] || null;
      }
    } else {
      farmer = localStore.farmers.find(f => f.id === farmerId);
      const farmerCrops = localStore.crops.filter(c => c.farmer_id === farmerId);
      crop = farmerCrops.find(c => c.is_active) || farmerCrops[farmerCrops.length - 1] || null;
      farm = localStore.farms.find(f => f.farmer_id === farmerId) || {};
      if (crop) {
        if (crop.area_acres) farm.area_acres = crop.area_acres;
        if (crop.soil_type) farm.soil_type = crop.soil_type;
      }
      farmerHistory = (localStore.farmer_crop_history || []).filter(h => h.farmer_id === farmerId).slice(0, 5);
    }

    // 2. Compute Plant Lifecycle Model Context
    let lifecycle = null;
    if (crop) {
      lifecycle = await calculateFullCropLifecycle({
        cropName: crop.crop_name,
        sowingDate: crop.sowing_date,
        farmerLocation: farmer?.state || 'Karnataka'
      });
    }

    // 3. Fetch Real-time Open-Meteo Weather Telemetry
    let weather = null;
    if (farmer && farmer.latitude && farmer.longitude) {
      weather = await fetchWeatherData(farmer.latitude, farmer.longitude);
    }

    // 4. Retrieve Farmer's Recent Chat History
    let recentHistory = [];
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('chat_history')
        .select('*')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: true })
        .limit(10);
      recentHistory = data || [];
    } else {
      recentHistory = localStore.chat_history
        .filter(h => h.farmer_id === farmerId)
        .slice(-10);
    }

    // 5. Query Multilingual Conversational Model
    const targetLanguage = language || farmer?.language || 'en';
    const aiResult = await generateMultilingualReply({
      farmer,
      farm,
      crop,
      lifecycle,
      weather,
      farmerHistory,
      recentHistory,
      userMessage: message,
      language: targetLanguage
    });

    // 6. Persist Conversation to Database
    const userMsgRecord = {
      id: crypto.randomUUID(),
      farmer_id: farmerId,
      role: 'user',
      message: message.trim(),
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
      localStore.save();
    }

    return res.json({
      success: true,
      data: {
        reply: aiResult.reply,
        source: aiResult.source,
        language: aiResult.language,
        timestamp: aiResult.timestamp,
        plant_lifecycle_context: {
          crop: crop?.crop_name,
          sowing_date: crop?.sowing_date,
          days_after_sowing: lifecycle?.days_after_sowing,
          stage: lifecycle?.current_stage?.name,
          next_irrigation: lifecycle?.upcoming_milestones?.next_irrigation_due,
          next_fertilizer: lifecycle?.upcoming_milestones?.next_fertilizer_target
        },
        weather_telemetry: weather ? {
          temp: weather.current?.temperature,
          condition: weather.current?.condition,
          rain_prob: weather.forecast?.[0]?.precipitation_probability
        } : null
      },
      error: null
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

/**
 * Retrieve Complete Chat History for a Farmer
 */
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

    const history = localStore.chat_history
      .filter(h => h.farmer_id === farmerId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return res.json({ success: true, data: history, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

/**
 * Clear Chat History for a Farmer
 */
export async function clearChatHistory(req, res) {
  try {
    const { farmerId } = req.params;

    if (isSupabaseConfigured) {
      await supabase.from('chat_history').delete().eq('farmer_id', farmerId);
    } else {
      localStore.chat_history = localStore.chat_history.filter(h => h.farmer_id !== farmerId);
      localStore.save();
    }

    return res.json({ success: true, message: 'Chat history cleared successfully', error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}
