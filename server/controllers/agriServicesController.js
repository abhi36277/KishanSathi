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
