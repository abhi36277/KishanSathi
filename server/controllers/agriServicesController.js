import { identifyPlantDisease } from '../services/diseaseVisionML.js';
import { predictMandiPrices } from '../services/pricePredictorML.js';
import { calculateFullCropLifecycle } from '../services/cropLifecycleML.js';
import { calculatePestRadar, reportPestOutbreak } from '../services/pestRadarML.js';
import { fetchWeatherData } from '../services/weatherService.js';
import { callPythonML } from '../services/pythonMLBridge.js';
import { localStore, isSupabaseConfigured, supabase } from '../config/db.js';
import crypto from 'crypto';

/**
 * 1. Disease Identification Pipeline (Python ML Microservice with local fallback)
 */
export async function identifyDisease(req, res) {
  try {
    const { farmerId, crop_name, symptoms, image_base64 } = req.body;

    let farmerLocation = 'Karnataka';
    if (farmerId) {
      const farmer = localStore.farmers.find(f => f.id === farmerId);
      if (farmer?.state) farmerLocation = farmer.state;
    }

    // Try Python ML Microservice first
    let result = null;
    const pyRes = await callPythonML('/ml/disease/identify', 'POST', {
      crop_name: crop_name || 'Rice (Paddy)',
      symptoms: symptoms || '',
      image_base64: image_base64 || null,
      location: farmerLocation
    });

    if (pyRes.success && pyRes.data) {
      result = pyRes.data;
    } else {
      result = await identifyPlantDisease({
        cropName: crop_name || 'Rice (Paddy)',
        symptoms: symptoms || '',
        imageBase64: image_base64 || null,
        farmerLocation
      });
    }

    // Save report in farmer history
    if (farmerId) {
      const reportRecord = {
        id: crypto.randomUUID(),
        farmer_id: farmerId,
        crop_name: crop_name || 'General Crop',
        image_path: image_base64 ? 'uploaded_leaf_scan.jpg' : 'symptom_scan.jpg',
        prediction: result.diagnosis?.disease_name,
        confidence: result.diagnosis?.confidence,
        symptoms: symptoms || 'Visual foliage scan',
        recommendations: (result.diagnosis?.organic_treatment || '') + ' | ' + (result.diagnosis?.chemical_guidelines || ''),
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured) {
        await supabase.from('disease_reports').insert([reportRecord]);
      } else {
        localStore.disease_reports.unshift(reportRecord);
        localStore.save();
      }
    }

    return res.json({
      success: true,
      data: result,
      error: null
    });
  } catch (error) {
    console.error('Disease identification error:', error);
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

/**
 * 2. Mandi Market Prices & 7-Day Trend Prediction (Python ML Microservice with local fallback)
 */
export async function getMarketPrices(req, res) {
  try {
    const { state = 'Karnataka', crop = 'Rice' } = req.query;

    const pyRes = await callPythonML(`/ml/prices/predict?state=${encodeURIComponent(state)}&crop=${encodeURIComponent(crop)}`);
    if (pyRes.success && pyRes.data) {
      return res.json({ success: true, data: pyRes.data, error: null });
    }

    const priceResult = await predictMandiPrices({ state, crop });
    return res.json({
      success: true,
      data: priceResult,
      error: null
    });
  } catch (error) {
    console.error('Market price error:', error);
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

/**
 * 3. Full Crop Lifecycle Tracker: Sowing, Irrigation, Fertilizer (Python ML Microservice with local fallback)
 */
export async function getCropLifecycle(req, res) {
  try {
    const { farmerId } = req.params;

    const farmer = localStore.farmers.find(f => f.id === farmerId);
    const crop = localStore.crops.filter(c => c.farmer_id === farmerId).pop();

    if (!crop) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'No active crop found for this farmer. Please add a crop first.'
      });
    }

    const pyRes = await callPythonML(`/ml/lifecycle/calculate?crop=${encodeURIComponent(crop.crop_name)}&sowing_date=${encodeURIComponent(crop.sowing_date)}`);
    if (pyRes.success && pyRes.data) {
      return res.json({
        success: true,
        data: {
          crop,
          farmer_name: farmer?.name,
          lifecycle: pyRes.data
        },
        error: null
      });
    }

    const lifecycle = await calculateFullCropLifecycle({
      cropName: crop.crop_name,
      sowingDate: crop.sowing_date,
      farmerLocation: farmer?.state || 'Karnataka'
    });

    return res.json({
      success: true,
      data: {
        crop,
        farmer_name: farmer?.name,
        lifecycle
      },
      error: null
    });
  } catch (error) {
    console.error('Crop lifecycle error:', error);
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

/**
 * 4. Geospatial Pest Radar by Location API & Micro-climate Alert Map (Python ML Microservice with local fallback)
 */
export async function getPestRadar(req, res) {
  try {
    const { lat, lon, farmerId } = req.query;

    let latitude = parseFloat(lat);
    let longitude = parseFloat(lon);

    if ((isNaN(latitude) || isNaN(longitude)) && farmerId) {
      const farmer = localStore.farmers.find(f => f.id === farmerId);
      if (farmer) {
        latitude = farmer.latitude;
        longitude = farmer.longitude;
      }
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      latitude = 12.5238;
      longitude = 76.8967;
    }

    // Micro-climate telemetry
    let weather = null;
    try {
      weather = await fetchWeatherData(latitude, longitude);
    } catch (e) {
      // ignore
    }

    const humidity = weather?.current?.humidity ?? 78.0;
    const temp = weather?.current?.temperature ?? 26.5;

    const pyRes = await callPythonML(`/ml/radar/scan?lat=${latitude}&lon=${longitude}&humidity=${humidity}&temp=${temp}`);
    if (pyRes.success && pyRes.data) {
      return res.json({ success: true, data: pyRes.data, error: null });
    }

    const radarResult = await calculatePestRadar({ latitude, longitude, weather });
    return res.json({
      success: true,
      data: radarResult,
      error: null
    });
  } catch (error) {
    console.error('Pest radar error:', error);
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

/**
 * Report a new pest outbreak and alert neighbors
 */
export async function submitPestReport(req, res) {
  try {
    const { reporterFarmerId, pestName, cropAffected, severity, latitude, longitude, locationName, message } = req.body;

    if (!pestName || !cropAffected) {
      return res.status(400).json({ success: false, data: null, error: 'pestName and cropAffected are required' });
    }

    const reportResult = await reportPestOutbreak({
      reporterFarmerId,
      pestName,
      cropAffected,
      severity: severity || 'High',
      latitude: latitude || 12.5238,
      longitude: longitude || 76.8967,
      locationName: locationName || 'Local Region',
      message
    });

    return res.status(201).json({
      success: true,
      data: reportResult,
      error: null
    });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}
