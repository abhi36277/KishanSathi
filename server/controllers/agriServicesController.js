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
    const crop_name = req.body.crop_name || req.body.cropName || req.body.crop || 'Rice (Paddy)';
    const symptoms = req.body.symptoms || '';
    const image_base64 = req.body.image_base64 || req.body.imageBase64 || null;
    const farmerId = req.body.farmerId;

    let farmerLocation = 'Karnataka';
    if (farmerId) {
      const farmer = localStore.farmers.find(f => f.id === farmerId);
      if (farmer?.state) farmerLocation = farmer.state;
    }

    // Try Python ML Microservice first
    let result = null;
    const pyRes = await callPythonML('/ml/disease/identify', 'POST', {
      crop_name: crop_name,
      symptoms: symptoms,
      image_base64: image_base64,
      location: farmerLocation
    });

    if (pyRes.success && pyRes.data) {
      result = pyRes.data;
    } else {
      result = await identifyPlantDisease({
        cropName: crop_name,
        symptoms: symptoms,
        imageBase64: image_base64,
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

    // Run comprehensive geospatial radar incorporating crowdsourced affected areas and climate risk
    const radarResult = await calculatePestRadar({ latitude, longitude, weather });

    // Enrich with Python ML microservice climate scoring if available
    try {
      const pyRes = await callPythonML(`/ml/radar/scan?lat=${latitude}&lon=${longitude}&humidity=${humidity}&temp=${temp}`);
      if (pyRes.success && pyRes.data) {
        if (pyRes.data.climate_risk_index) radarResult.climate_threat_index = pyRes.data.climate_risk_index;
        if (pyRes.data.climate_risk_description) radarResult.climate_threat_advisory = pyRes.data.climate_risk_description;
      }
    } catch (e) {
      // offline fallback is already inside radarResult
    }

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

/**
 * Defected Plant Photo Analysis & Affected Area Reporting
 * Analyzes photo using PlantVillage Vision / Pathology AI and marks farmer's area as AFFECTED AREA
 */
export async function reportPhotoPestOutbreak(req, res) {
  try {
    const crop_name = req.body.crop_name || req.body.cropName || req.body.crop || 'Rice (Paddy)';
    const image_base64 = req.body.image_base64 || req.body.imageBase64 || null;
    const symptoms = req.body.symptoms || '';
    const farmerId = req.body.farmerId;
    const latitude = req.body.latitude;
    const longitude = req.body.longitude;
    const locationName = req.body.locationName;

    if (!image_base64) {
      return res.status(400).json({ success: false, data: null, error: 'A photo of the defected plant is required for AI analysis' });
    }

    let farmerLocation = locationName || 'Karnataka';
    let farmer = null;
    if (farmerId) {
      farmer = localStore.farmers.find(f => f.id === farmerId);
      if (farmer?.state) farmerLocation = `${farmer.village || farmer.district || ''}, ${farmer.state}`;
    }

    // 1. Diagnose photo using Python PlantVillage ML or Node fallback
    let diagnosisResult = null;
    const pyRes = await callPythonML('/ml/disease/identify', 'POST', {
      crop_name: crop_name,
      symptoms: symptoms || 'Defected foliage inspected in field survey',
      image_base64: image_base64,
      location: farmerLocation
    });

    if (pyRes.success && pyRes.data) {
      diagnosisResult = pyRes.data;
    } else {
      diagnosisResult = await identifyPlantDisease({
        cropName: crop_name,
        symptoms: symptoms || 'Defected foliage inspected in field survey',
        imageBase64: image_base64,
        farmerLocation
      });
    }

    const diagnosis = diagnosisResult.diagnosis || {};
    const diseaseName = diagnosis.disease_name || 'Unspecified Foliar Pathogen';
    const severity = diagnosis.severity || 'High';
    const repLat = parseFloat(latitude) || farmer?.latitude || 12.5238;
    const repLon = parseFloat(longitude) || farmer?.longitude || 76.8967;
    const placeName = locationName || (farmer ? `${farmer.village ? farmer.village + ', ' : ''}${farmer.district || ''}, ${farmer.state || ''}` : 'Local Fields');

    // 2. Mark this area as an AFFECTED AREA in pest_alerts
    const affectedAreaAlert = {
      id: crypto.randomUUID(),
      reporter_farmer_id: farmerId,
      pest_or_disease: diseaseName,
      crop_affected: crop_name,
      severity: severity.toLowerCase(),
      latitude: repLat,
      longitude: repLon,
      district: placeName,
      is_affected_area: true,
      is_ai_verified: true,
      hazard_radius_km: 30,
      photo_preview: image_base64.length > 30000 ? image_base64.slice(0, 30000) : image_base64,
      alert_message: `🚨 AFFECTED AREA: AI verified ${diseaseName} on ${crop_name}. Immediate preventative measures advised within 30 km radius.`,
      organic_remedy: diagnosis.organic_treatment || 'Apply 5% Neem Seed Kernel Extract (NSKE).',
      cultural_remedy: diagnosis.cultural_practices || 'Maintain drainage and inspect border crops.',
      chemical_guidelines: diagnosis.chemical_guidelines || 'Consult local KVK agronomist.',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      await supabase.from('pest_alerts').insert([affectedAreaAlert]);
    } else {
      localStore.pest_alerts.unshift(affectedAreaAlert);
      localStore.save();
    }

    // 3. Log to farmer persistent history
    if (farmerId) {
      const historyRecord = {
        id: crypto.randomUUID(),
        farmer_id: farmerId,
        date: new Date().toISOString().split('T')[0],
        activity_type: 'Pest Outbreak Alert',
        title: `Defected Plant Scanned - ${diseaseName}`,
        details: `Reported and marked ${placeName} as an affected area. AI identified ${diseaseName} (${severity} severity).`,
        status: 'Reported',
        created_at: new Date().toISOString()
      };
      localStore.farmer_crop_history.unshift(historyRecord);
      localStore.save();
    }

    return res.status(201).json({
      success: true,
      data: {
        diagnosis: diagnosisResult,
        affected_area: affectedAreaAlert,
        broadcast_message: `Area "${placeName}" has been successfully marked as an AFFECTED AREA for ${diseaseName}. All regional farmers on the radar have been alerted!`
      },
      error: null
    });
  } catch (error) {
    console.error('reportPhotoPestOutbreak error:', error);
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

/**
 * 5. Pincode & City/Town Geocoding / Location Lookup
 * Resolves Indian postal pincodes or town names to exact City, District, State, and Lat/Lon
 */
export async function lookupLocation(req, res) {
  try {
    const { pincode, query, lat, lon } = req.query;
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;

    const searchTerm = (pincode || query || '').trim();

    // 1. Text or Pincode search
    if (searchTerm) {
      if (mapboxToken && !mapboxToken.startsWith('your-')) {
        try {
          const mbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchTerm)}.json?country=in&access_token=${mapboxToken}`;
          const mbRes = await fetch(mbUrl);
          if (mbRes.ok) {
            const mbData = await mbRes.json();
            if (mbData.features && mbData.features.length > 0) {
              const feat = mbData.features[0];
              const context = feat.context || [];
              const districtCtx = context.find(c => c.id.startsWith('district')) || context.find(c => c.id.startsWith('place'));
              const stateCtx = context.find(c => c.id.startsWith('region'));
              const postcodeCtx = context.find(c => c.id.startsWith('postcode'));

              return res.json({
                success: true,
                data: {
                  source: 'Mapbox Geocoding API',
                  place_name: feat.place_name,
                  city: feat.text,
                  district: districtCtx ? districtCtx.text : feat.text,
                  state: stateCtx ? stateCtx.text : 'India',
                  pincode: postcodeCtx ? postcodeCtx.text : (/^\d{6}$/.test(searchTerm) ? searchTerm : ''),
                  latitude: feat.center[1],
                  longitude: feat.center[0]
                }
              });
            }
          }
        } catch (e) {
          console.warn('Mapbox geocoding error:', e.message);
        }
      }

      // Fallback: Official India Post Pincode API
      if (/^\d{6}$/.test(searchTerm)) {
        try {
          const postRes = await fetch(`https://api.postalpincode.in/pincode/${searchTerm}`);
          if (postRes.ok) {
            const postData = await postRes.json();
            if (postData[0]?.Status === 'Success' && postData[0]?.PostOffice?.length > 0) {
              const po = postData[0].PostOffice[0];
              const stateCoords = {
                'Andhra Pradesh': [15.9129, 79.7400],
                'Assam': [26.2006, 92.9376],
                'Bihar': [25.0961, 85.3131],
                'Gujarat': [22.2587, 71.1924],
                'Haryana': [29.0588, 76.0856],
                'Karnataka': [15.3173, 75.7139],
                'Kerala': [10.8505, 76.2711],
                'Madhya Pradesh': [22.9734, 78.6569],
                'Maharashtra': [19.7515, 75.7139],
                'Odisha': [20.9517, 85.0985],
                'Punjab': [31.1471, 75.3412],
                'Rajasthan': [27.0238, 74.2179],
                'Tamil Nadu': [11.1271, 78.6569],
                'Telangana': [18.1124, 79.0193],
                'Uttar Pradesh': [26.8467, 80.9462],
                'West Bengal': [22.9868, 87.8550],
                'Delhi': [28.7041, 77.1025]
              };
              const coords = stateCoords[po.State] || [20.5937, 78.9629];
              return res.json({
                success: true,
                data: {
                  source: 'India Post Official API',
                  place_name: `${po.Name}, ${po.District}, ${po.State} - ${searchTerm}`,
                  city: po.Name,
                  district: po.District,
                  state: po.State,
                  pincode: searchTerm,
                  latitude: coords[0],
                  longitude: coords[1]
                }
              });
            }
          }
        } catch (e) {
          console.warn('India Post API error:', e.message);
        }
      }
    }

    // 2. Reverse Geocoding by Lat / Lon
    if (lat && lon && mapboxToken && !mapboxToken.startsWith('your-')) {
      try {
        const mbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${mapboxToken}`;
        const mbRes = await fetch(mbUrl);
        if (mbRes.ok) {
          const mbData = await mbRes.json();
          if (mbData.features && mbData.features.length > 0) {
            const feat = mbData.features[0];
            const context = feat.context || [];
            const districtCtx = context.find(c => c.id.startsWith('district')) || context.find(c => c.id.startsWith('place'));
            const stateCtx = context.find(c => c.id.startsWith('region'));
            const postcodeCtx = context.find(c => c.id.startsWith('postcode'));

            return res.json({
              success: true,
              data: {
                source: 'Mapbox Reverse Geocoding API',
                place_name: feat.place_name,
                city: feat.text,
                district: districtCtx ? districtCtx.text : feat.text,
                state: stateCtx ? stateCtx.text : 'India',
                pincode: postcodeCtx ? postcodeCtx.text : '',
                latitude: parseFloat(lat),
                longitude: parseFloat(lon)
              }
            });
          }
        }
      } catch (e) {
        console.warn('Mapbox reverse geocoding error:', e.message);
      }
    }

    return res.status(404).json({
      success: false,
      data: null,
      error: 'Location not found. Please verify the pincode or town name.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: err.message });
  }
}
