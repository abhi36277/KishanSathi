/**
 * KisanSathi AI - Grounded Daily Planner, Tracker & Checker Controller
 * Context-grounded in Crop Type, Growth Stage (DAS), Soil Type, Farm Area,
 * Live Open-Meteo Weather Telemetry, Harvesting Forecast & Permanent History.
 */

import { localStore } from '../config/db.js';
import { fetchWeatherData } from '../services/weatherService.js';
import crypto from 'crypto';

// Standard agronomic crop cycle durations and stage profiles
const CROP_PROFILES = {
  'rice': {
    name: 'Rice / Paddy',
    total_days: 125,
    stages: [
      { name: 'Nursery & Sowing', days: [0, 15] },
      { name: 'Transplanting & Seedling Establishment', days: [16, 28] },
      { name: 'Active Tillering', days: [29, 50] },
      { name: 'Panicle Initiation & Booting', days: [51, 75] },
      { name: 'Flowering & Heading', days: [76, 95] },
      { name: 'Milk & Dough Grain Filling', days: [96, 112] },
      { name: 'Physiological Maturity & Harvest', days: [113, 125] }
    ],
    basal_fertilizer_per_acre: 'DAP 50kg + MOP 20kg + Zinc Sulphate 10kg',
    top_dressing_per_acre: 'Neem-coated Urea 25kg + Bio-potash 10kg',
    critical_stages: ['Tillering', 'Panicle Initiation', 'Flowering']
  },
  'wheat': {
    name: 'Wheat',
    total_days: 120,
    stages: [
      { name: 'Sowing & Germination', days: [0, 14] },
      { name: 'Crown Root Initiation (CRI)', days: [15, 25] },
      { name: 'Tillering', days: [26, 45] },
      { name: 'Jointing & Stem Extension', days: [46, 65] },
      { name: 'Booting & Heading', days: [66, 85] },
      { name: 'Milking & Grain Dough', days: [86, 105] },
      { name: 'Maturity & Harvest', days: [106, 120] }
    ],
    basal_fertilizer_per_acre: 'DAP 55kg + MOP 15kg',
    top_dressing_per_acre: 'Urea 30kg per split',
    critical_stages: ['Crown Root Initiation', 'Tillering', 'Booting']
  },
  'maize': {
    name: 'Maize / Corn',
    total_days: 105,
    stages: [
      { name: 'Germination & Early Emergence', days: [0, 12] },
      { name: 'Knee-High Vegetative Stage', days: [13, 35] },
      { name: 'Tasseling & Pollen Shed', days: [36, 55] },
      { name: 'Silking & Ear Formation', days: [56, 75] },
      { name: 'Grain Blister & Denting', days: [76, 95] },
      { name: 'Black Layer Maturity & Harvest', days: [96, 105] }
    ],
    basal_fertilizer_per_acre: 'DAP 50kg + Potash 20kg + Zinc 10kg',
    top_dressing_per_acre: 'Urea 35kg into central whorl',
    critical_stages: ['Knee-High', 'Tasseling', 'Silking']
  },
  'potato': {
    name: 'Potato',
    total_days: 90,
    stages: [
      { name: 'Sprouting & Emergence', days: [0, 18] },
      { name: 'Vegetative Growth & Canopy Dev', days: [19, 38] },
      { name: 'Tuber Initiation & Stolon Hooking', days: [39, 55] },
      { name: 'Tuber Bulking & Expansion', days: [56, 78] },
      { name: 'Skin Setting & Haulm Cutting', days: [79, 90] }
    ],
    basal_fertilizer_per_acre: 'NPK 12:32:16 100kg + FYM 5 tonnes',
    top_dressing_per_acre: 'Calcium Nitrate 25kg + SOP 25kg',
    critical_stages: ['Tuber Initiation', 'Tuber Bulking']
  },
  'tomatoes': {
    name: 'Tomatoes',
    total_days: 110,
    stages: [
      { name: 'Nursery & Transplanting', days: [0, 20] },
      { name: 'Early Vegetative Branching', days: [21, 40] },
      { name: 'Flower Cluster Initiation', days: [41, 60] },
      { name: 'Fruit Set & Expansion', days: [61, 85] },
      { name: 'Breaker to Red Ripe Harvest', days: [86, 110] }
    ],
    basal_fertilizer_per_acre: 'SSP 100kg + MOP 30kg + Neem Cake 100kg',
    top_dressing_per_acre: '19:19:19 @ 5kg/acre fertigation',
    critical_stages: ['Flowering', 'Fruit Bulking']
  },
  'chillies': {
    name: 'Chillies',
    total_days: 150,
    stages: [
      { name: 'Transplanting & Rooting', days: [0, 25] },
      { name: 'Active Branching', days: [26, 50] },
      { name: 'Flowering & Budding', days: [51, 80] },
      { name: 'Green Pod Development', days: [81, 115] },
      { name: 'Ripening & Multiple Pickings', days: [116, 150] }
    ],
    basal_fertilizer_per_acre: 'DAP 50kg + MOP 25kg',
    top_dressing_per_acre: 'Complex 20:20:0:13 @ 30kg',
    critical_stages: ['Flowering', 'Pod Development']
  },
  'cotton': {
    name: 'Cotton',
    total_days: 165,
    stages: [
      { name: 'Germination & Seedling', days: [0, 20] },
      { name: 'Vegetative Square Formation', days: [21, 55] },
      { name: 'Flowering & Early Boll Dev', days: [56, 95] },
      { name: 'Boll Development & Bulking', days: [96, 135] },
      { name: 'Boll Bursting & Fiber Picking', days: [136, 165] }
    ],
    basal_fertilizer_per_acre: 'DAP 50kg + MOP 30kg + Magnesium Sulphate 10kg',
    top_dressing_per_acre: 'Urea 30kg + Potassium Nitrate 1% foliar',
    critical_stages: ['Square Formation', 'Flowering', 'Boll Bulking']
  },
  'mustard': {
    name: 'Mustard',
    total_days: 100,
    stages: [
      { name: 'Germination & Emergence', days: [0, 12] },
      { name: 'Rosette & Vegetative Stage', days: [13, 30] },
      { name: 'Bolting & Inflorescence', days: [31, 50] },
      { name: 'Flowering & Siliqua Formation', days: [51, 75] },
      { name: 'Pod Maturation & Harvest', days: [76, 100] }
    ],
    basal_fertilizer_per_acre: 'DAP 40kg + Single Super Phosphate 50kg (Sulphur)',
    top_dressing_per_acre: 'Urea 25kg at first irrigation (Rosette stage)',
    critical_stages: ['Rosette', 'Flowering']
  },
  'onion': {
    name: 'Onion',
    total_days: 120,
    stages: [
      { name: 'Nursery & Transplanting', days: [0, 20] },
      { name: 'Vegetative Foliage Growth', days: [21, 50] },
      { name: 'Bulb Initiation & Swelling', days: [51, 85] },
      { name: 'Bulb Development & Maturation', days: [86, 105] },
      { name: 'Neck Fall, Curing & Harvest', days: [106, 120] }
    ],
    basal_fertilizer_per_acre: 'DAP 50kg + MOP 30kg + Sulphur 10kg',
    top_dressing_per_acre: 'Urea 25kg split at 30 & 45 days after transplanting',
    critical_stages: ['Bulb Initiation', 'Bulb Development']
  },
  'soyabean': {
    name: 'Soyabean',
    total_days: 95,
    stages: [
      { name: 'Germination & Emergence (VE-VC)', days: [0, 10] },
      { name: 'Vegetative Branching (V1-V4)', days: [11, 30] },
      { name: 'Flowering & Early Bloom (R1-R2)', days: [31, 50] },
      { name: 'Pod Development & Seed Filling (R3-R5)', days: [51, 75] },
      { name: 'Physiological Maturity & Leaf Drop', days: [76, 95] }
    ],
    basal_fertilizer_per_acre: 'DAP 40kg + Potash 15kg + Bradyrhizobium seed inoculant',
    top_dressing_per_acre: 'Foliar spray of 19:19:19 @ 1kg/acre at flowering',
    critical_stages: ['Flowering', 'Pod Filling']
  },
  'gram': {
    name: 'Bengal Gram / Chana',
    total_days: 105,
    stages: [
      { name: 'Sowing & Seedling Emergence', days: [0, 15] },
      { name: 'Branching & Vegetative Growth', days: [16, 40] },
      { name: 'Flower Budding & Bloom', days: [41, 65] },
      { name: 'Podding & Grain Development', days: [66, 90] },
      { name: 'Pod Desiccation & Harvest', days: [91, 105] }
    ],
    basal_fertilizer_per_acre: 'DAP 40kg + Gypsum 50kg',
    top_dressing_per_acre: '2% Urea foliar spray at podding',
    critical_stages: ['Branching', 'Podding']
  },
  'groundnut': {
    name: 'Groundnut / Peanut',
    total_days: 115,
    stages: [
      { name: 'Emergence & Seedling', days: [0, 18] },
      { name: 'Vegetative Branching', days: [19, 35] },
      { name: 'Flowering & Peg Initiation', days: [36, 60] },
      { name: 'Pod Development & Kernal Bulking', days: [61, 95] },
      { name: 'Maturity & Pulling Harvest', days: [96, 115] }
    ],
    basal_fertilizer_per_acre: 'Gypsum 150kg + DAP 35kg + Potash 20kg',
    top_dressing_per_acre: 'Gypsum 150kg at 40-45 days (Pegging stage)',
    critical_stages: ['Flowering', 'Pegging', 'Pod Development']
  },
  'sugarcane': {
    name: 'Sugarcane',
    total_days: 360,
    stages: [
      { name: 'Germination & Settling', days: [0, 45] },
      { name: 'Tillering & Formative Phase', days: [46, 120] },
      { name: 'Grand Growth & Internode Elongation', days: [121, 270] },
      { name: 'Ripening & Sucrose Accumulation', days: [271, 360] }
    ],
    basal_fertilizer_per_acre: 'SSP 200kg + MOP 50kg + Zinc Sulphate 10kg',
    top_dressing_per_acre: 'Urea 50kg in 3 equal splits up to 90 days',
    critical_stages: ['Tillering', 'Grand Growth']
  }
};

function getProfile(cropName) {
  const clean = (cropName || '').toLowerCase();
  for (const [key, prof] of Object.entries(CROP_PROFILES)) {
    if (clean.includes(key)) return prof;
  }
  return CROP_PROFILES['rice'];
}

function calculateCurrentStage(profile, das) {
  for (const st of profile.stages) {
    if (das >= st.days[0] && das <= st.days[1]) {
      const stageProgress = Math.round(((das - st.days[0]) / Math.max(1, st.days[1] - st.days[0])) * 100);
      return {
        name: st.name,
        range_days: st.days,
        stage_progress_pct: Math.min(100, Math.max(0, stageProgress))
      };
    }
  }
  return {
    name: das > profile.total_days ? 'Post-Harvest / Stubble' : profile.stages[0].name,
    range_days: [0, profile.total_days],
    stage_progress_pct: 100
  };
}

/**
 * GET /api/planner/:farmerId
 * Returns complete grounded context: Crop, Stage, Soil, Area, Weather, Harvesting Forecast,
 * Daily Tasks (Checker), and Persistent Activity History.
 */
export async function getDailyPlannerAndTracker(req, res) {
  try {
    const { farmerId } = req.params;

    let farmer = localStore.farmers.find(f => f.id === farmerId);
    if (!farmer) {
      farmer = localStore.farmers[0] || {
        id: farmerId,
        name: 'Farmer',
        state: 'Karnataka',
        district: 'Mandya',
        village: 'Shivalli',
        latitude: 12.5238,
        longitude: 76.8967
      };
    }

    let farm = localStore.farms.filter(f => f.farmer_id === farmerId).pop() || {
      id: crypto.randomUUID(),
      farmer_id: farmerId,
      area_acres: 2.5,
      soil_type: 'Red Sandy Loam'
    };

    // Retrieve all crops for this farmer and pick requested or active crop
    if (!localStore.crops) localStore.crops = [];
    const allCrops = localStore.crops.filter(c => c.farmer_id === farmerId);
    let crop = null;

    if (req.query.cropId) {
      crop = allCrops.find(c => c.id === req.query.cropId);
    }
    if (!crop) {
      crop = allCrops.find(c => c.is_active) || allCrops[allCrops.length - 1];
    }
    if (!crop) {
      const d = new Date();
      d.setDate(d.getDate() - 35);
      crop = {
        id: crypto.randomUUID(),
        farmer_id: farmerId,
        crop_name: 'Rice (Paddy)',
        variety: 'Jyothi / Sona Masoori',
        sowing_date: d.toISOString().split('T')[0],
        growth_stage: 'Active Tillering',
        area_acres: 2.5,
        soil_type: 'Red Sandy Loam',
        irrigation_type: 'Canal / Flow',
        plot_name: 'Main Paddy Plot',
        is_active: true
      };
      allCrops.push(crop);
      localStore.crops.push(crop);
      localStore.save();
    }

    const area = parseFloat(crop.area_acres) || parseFloat(farm.area_acres) || 2.5;
    const soil = (crop.soil_type || farm.soil_type || 'Red Sandy Loam').trim();
    const irrigation = crop.irrigation_type || 'Borewell / Canal';
    const plotName = crop.plot_name || `${crop.crop_name} Plot`;

    // 1. Fetch Real-time Open-Meteo Weather
    let weather = null;
    const lat = farmer.latitude || 12.5238;
    const lon = farmer.longitude || 76.8967;
    try {
      weather = await fetchWeatherData(lat, lon);
    } catch (e) {
      console.warn('Weather fetch notice:', e.message);
    }

    const currentTemp = weather?.current?.temperature ?? 27;
    const currentHumidity = weather?.current?.humidity ?? 76;
    const rainChance = weather?.forecast?.[0]?.precipitation_probability ?? 10;
    const rainMm = weather?.forecast?.[0]?.precipitation ?? 0.0;
    const weatherCondition = weather?.current?.condition ?? 'Partly Cloudy';

    // 2. Compute Lifecycle & Harvesting Time
    const sowingDate = new Date(crop.sowing_date || Date.now());
    const now = new Date();
    const das = Math.max(1, Math.floor((now - sowingDate) / 86400000));

    const profile = getProfile(crop.crop_name);
    const currentStage = calculateCurrentStage(profile, das);

    const harvestStart = new Date(sowingDate.getTime() + profile.total_days * 86400000);
    const harvestEnd = new Date(sowingDate.getTime() + (profile.total_days + 8) * 86400000);
    const daysUntilHarvest = Math.max(0, profile.total_days - das);
    const overallProgressPct = Math.min(100, Math.round((das / profile.total_days) * 100));

    // 3. Soil Context Evaluation
    let soilGuideline = '';
    let soilWaterNeed = 'Normal';
    if (soil.toLowerCase().includes('sandy')) {
      soilGuideline = 'High drainage and rapid water percolation. Requires frequent, lighter irrigation; avoid fertilizer leaching with split applications.';
      soilWaterNeed = 'High (Frequent Light Cycles)';
    } else if (soil.toLowerCase().includes('clay') || soil.toLowerCase().includes('black')) {
      soilGuideline = 'High moisture retention with risk of soil compaction and waterlogging. Ensure bund drainage slits are open; avoid standing water.';
      soilWaterNeed = 'Moderate (Well-Drained)';
    } else {
      soilGuideline = 'Balanced moisture holding capacity and good nutrient friability. Maintain steady root-zone moisture.';
      soilWaterNeed = 'Standard Depth';
    }

    // 4. Scale inputs for the farmer's specific acreage
    const ureaDoseScaled = `${Math.round(25 * area)} kg total (${25} kg/acre x ${area} acres)`;
    const neemDoseScaled = `${Math.round(1.5 * area * 10) / 10} Litres in ${Math.round(150 * area)}L water`;

    // 5. Dynamic Smart Tasks tailored to Stage + Soil + Area + Live Weather
    const todayStr = now.toISOString().split('T')[0];
    const generatedTasks = [];

    // Task 1: Irrigation & Soil Water Checker
    if (rainChance > 55 || rainMm > 12) {
      generatedTasks.push({
        id: `task-irr-${todayStr}`,
        task_key: 'rain_drainage_check',
        title: 'Open Bund Drainage Outlets & Hold Irrigation',
        category: 'Irrigation & Drainage',
        priority: 'High',
        time_estimate: '30 mins',
        area_application: `Entire ${area} Acre Plot`,
        soil_impact: soilGuideline,
        weather_alert: `Rain forecast detected: ${rainMm}mm (${rainChance}% chance). Wet canopy prevents water loss.`,
        instructions: `Inspect downstream bunds and clear weeds blocking field drain gates. Do NOT run borewell or canal pumps today.`
      });
    } else {
      generatedTasks.push({
        id: `task-irr-${todayStr}`,
        task_key: 'moisture_irrigation_run',
        title: `Stage Irrigation Check (${soilWaterNeed})`,
        category: 'Irrigation & Drainage',
        priority: 'Medium',
        time_estimate: '45 mins',
        area_application: `Active ${area} Acres`,
        soil_impact: soilGuideline,
        weather_alert: `Warm atmospheric conditions (${currentTemp}°C, ${currentHumidity}% humidity). Evapotranspiration is steady.`,
        instructions: `Check root zone at 5-10 cm depth. If dry, provide light surface irrigation to maintain moist field capacity without deep submergence.`
      });
    }

    // Task 2: Stage-Grounded Fertilizer / Nutrient Checker
    if (das <= 25) {
      generatedTasks.push({
        id: `task-nut-${todayStr}`,
        task_key: 'basal_micro_boost',
        title: 'Root Establishment & Basal Micronutrient Check',
        category: 'Fertilizer & Soil Nutrition',
        priority: 'High',
        time_estimate: '1 hour',
        area_application: `Calculated for ${area} Acres: ${Math.round(10 * area)} kg Zinc Sulphate`,
        soil_impact: `Apply directly into moist root layer for optimal cation binding in ${soil}.`,
        weather_alert: rainChance > 50 ? 'Postpone spreading until rains pass to avoid chemical runoff.' : 'Clear weather: Ideal absorption window.',
        instructions: `Apply recommended basal mix along rows. Keep soil friable to encourage root anchorage.`
      });
    } else if (das <= 60) {
      generatedTasks.push({
        id: `task-nut-${todayStr}`,
        task_key: 'tillering_top_dress',
        title: `Top-Dressing for Active ${currentStage.name}`,
        category: 'Fertilizer & Soil Nutrition',
        priority: 'High',
        time_estimate: '1 hour',
        area_application: `Exact Quantity for your ${area} Acres: ${ureaDoseScaled}`,
        soil_impact: `In ${soil}, split urea application into two doses 7 days apart to eliminate leaching loss.`,
        weather_alert: rainChance > 40 ? 'Rain expected soon; avoid broadcast spreading to prevent nutrient wash-off.' : 'Weather is dry; broadcast urea and follow with light water flush.',
        instructions: `Broadcast Neem-coated urea in morning hours (7-9 AM) when dew has evaporated but sun is not harsh.`
      });
    } else {
      generatedTasks.push({
        id: `task-nut-${todayStr}`,
        task_key: 'reproductive_foliar_spray',
        title: 'Foliar Potassium & Grain Filling Nourishment',
        category: 'Fertilizer & Soil Nutrition',
        priority: 'Medium',
        time_estimate: '45 mins',
        area_application: `Scaled for ${area} Acres: ${Math.round(1.5 * area)} kg 00-00-50 (SOP) in ${Math.round(150 * area)}L water`,
        soil_impact: 'Foliar nutrient bypassing root uptake barrier for quick grain translocation.',
        weather_alert: 'Spray only when wind speed is under 12 km/h and no rain is forecast within 6 hours.',
        instructions: `Direct spray onto flag leaves and developing panicles during late afternoon (4-6 PM).`
      });
    }

    // Task 3: Crop Protection & Health Checker
    if (currentHumidity > 80 && currentTemp >= 20 && currentTemp <= 29) {
      generatedTasks.push({
        id: `task-prot-${todayStr}`,
        task_key: 'pathogen_preventative_scout',
        title: 'Fungal Pathogen Scouting (High Humidity Alert)',
        category: 'Crop Protection & Health',
        priority: 'High',
        time_estimate: '35 mins',
        area_application: `${area} Acres Perimeter & Canopy`,
        soil_impact: 'Dense canopy over moist soil increases micro-climatic relative humidity at plant base.',
        weather_alert: `High humidity (${currentHumidity}%) creates prime incubation conditions for leaf blast and sheath rot.`,
        instructions: `Walk through fields in a 'W' pattern. Inspect 20 random hills for spindle spots or leaf edge curling. Spray 5% Neem Seed Kernel Extract (${neemDoseScaled}) as a preventative shield.`
      });
    } else {
      generatedTasks.push({
        id: `task-prot-${todayStr}`,
        task_key: 'routine_pest_scout',
        title: 'Routine Canopy & Underside Leaf Scouting',
        category: 'Crop Protection & Health',
        priority: 'Normal',
        time_estimate: '25 mins',
        area_application: `${area} Acres`,
        soil_impact: 'Scout field borders nearest to irrigation channels.',
        weather_alert: `Current temperature ${currentTemp}°C. Routine pest activity levels.`,
        instructions: `Check undersides of 15 leaves for thrips, mites, or stem borer egg masses. If spotted, report with photo in Pest Radar.`
      });
    }

    // 6. Merge with Persistent Checker State
    if (!localStore.daily_tracker) localStore.daily_tracker = [];
    const farmerTrackerRecords = localStore.daily_tracker.filter(t => t.farmer_id === farmerId && t.date === todayStr);

    const checklist = generatedTasks.map(gt => {
      const existing = farmerTrackerRecords.find(tr => tr.task_id === gt.id);
      return {
        ...gt,
        completed: existing ? Boolean(existing.completed) : false,
        completed_at: existing?.completed_at || null,
        notes: existing?.notes || ''
      };
    });

    // 7. Retrieve Farmer's Permanent Activity History ("What has already been done")
    if (!localStore.farmer_crop_history) localStore.farmer_crop_history = [];
    let history = localStore.farmer_crop_history
      .filter(h => h.farmer_id === farmerId)
      .map(h => ({
        id: h.id,
        title: h.title || h.action_title || 'Field Activity',
        activity_type: h.activity_type || h.crop_stage || 'Field Task',
        details: h.details || h.description || '',
        date: h.date || (h.created_at ? h.created_at.split('T')[0] : 'Recent'),
        status: h.status || 'Completed',
        created_at: h.created_at
      }))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // If history is empty for demo, seed realistic past activities so farmer sees history immediately
    if (history.length === 0) {
      const pastSowingDate = new Date(sowingDate);
      const pastBasalDate = new Date(sowingDate.getTime() + 86400000 * 5);
      const pastIrrDate = new Date(sowingDate.getTime() + 86400000 * 18);

      const demoPastRecords = [
        {
          id: crypto.randomUUID(),
          farmer_id: farmerId,
          crop_name: crop.crop_name,
          crop_stage: 'Nursery / Sowing',
          action_title: 'Sowing & Seed Treatment Done',
          description: `Certified seed treatment with Trichoderma viride completed. Sown across ${area} acres.`,
          date: pastSowingDate.toISOString().split('T')[0],
          status: 'Completed',
          created_at: pastSowingDate.toISOString()
        },
        {
          id: crypto.randomUUID(),
          farmer_id: farmerId,
          crop_name: crop.crop_name,
          crop_stage: 'Establishment',
          action_title: 'Basal Soil Nutrition Applied',
          description: `Applied ${Math.round(50 * area)}kg DAP and ${Math.round(10 * area)}kg Zinc Sulphate in ${soil}.`,
          date: pastBasalDate.toISOString().split('T')[0],
          status: 'Completed',
          created_at: pastBasalDate.toISOString()
        },
        {
          id: crypto.randomUUID(),
          farmer_id: farmerId,
          crop_name: crop.crop_name,
          crop_stage: 'Vegetative Initiation',
          action_title: 'First Vegetative Irrigation & Weeding',
          description: 'Hand weeding along furrows completed. Light irrigation provided to settle root zone.',
          date: pastIrrDate.toISOString().split('T')[0],
          status: 'Completed',
          created_at: pastIrrDate.toISOString()
        }
      ];

      localStore.farmer_crop_history.push(...demoPastRecords);
      localStore.save();
      history.push(...demoPastRecords);
    }

    return res.json({
      success: true,
      data: {
        farmer_context: {
          farmer_id: farmer.id,
          name: farmer.name,
          location: `${farmer.village || farmer.district || 'Mandya'}, ${farmer.state || 'Karnataka'}`,
          district: farmer.district || 'Mandya',
          state: farmer.state || 'Karnataka',
          coordinates: { latitude: lat, longitude: lon },
          crop_id: crop.id,
          crop_name: crop.crop_name,
          variety: crop.variety || 'Certified Variety',
          sowing_date: crop.sowing_date,
          growth_stage: currentStage.name,
          stage_progress_pct: currentStage.stage_progress_pct,
          das,
          soil_type: soil,
          soil_water_need: soilWaterNeed,
          soil_guideline: soilGuideline,
          area_acres: area,
          irrigation_type: irrigation,
          plot_name: plotName,
          is_active: !!crop.is_active
        },
        all_crops: allCrops,
        weather_telemetry: {
          temperature_c: currentTemp,
          humidity_pct: currentHumidity,
          rain_chance_pct: rainChance,
          rain_mm: rainMm,
          condition: weatherCondition,
          source: 'Open-Meteo Live API'
        },
        harvest_forecast: {
          total_crop_duration_days: profile.total_days,
          days_after_sowing: das,
          days_until_harvest: daysUntilHarvest,
          overall_progress_pct: overallProgressPct,
          expected_harvest_window: `${harvestStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} - ${harvestEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          harvest_recommendation: daysUntilHarvest <= 15
            ? 'Drain field 10 days before harvest to firm soil for threshing machinery. Check for 85% golden grain coloration.'
            : `Crop is at ${currentStage.name} stage (${overallProgressPct}% of lifecycle). Maintain scheduled nutrition.`
        },
        current_situation: {
          health_score: currentHumidity > 85 ? 88 : 95,
          active_threat: currentHumidity > 80 ? 'Moderate Blast / Spore Risk due to air saturation' : 'Normal',
          soil_moisture_status: rainChance > 50 ? 'Ample Moisture (Rain Inbound)' : 'Adequate Field Capacity',
          tasks_total: checklist.length,
          tasks_completed: checklist.filter(t => t.completed).length,
          summary: `${farmer.name}'s ${crop.crop_name} is at Day ${das} (${currentStage.name}) on ${area} acres of ${soil}. Expected harvest in ${daysUntilHarvest} days.`
        },
        daily_planner_tasks: checklist,
        completed_history: history
      },
      error: null
    });
  } catch (error) {
    console.error('Planner & Tracker error:', error);
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

/**
 * POST /api/planner/task/check
 * Toggles a daily task as Completed / Pending with farmer notes, persisting across sessions.
 */
export async function toggleTaskChecker(req, res) {
  try {
    const { farmerId, taskId, completed, notes, taskTitle, cropStage } = req.body;
    if (!farmerId || !taskId) {
      return res.status(400).json({ success: false, error: 'farmerId and taskId are required' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (!localStore.daily_tracker) localStore.daily_tracker = [];

    let existing = localStore.daily_tracker.find(t => t.farmer_id === farmerId && t.task_id === taskId && t.date === todayStr);

    if (existing) {
      existing.completed = Boolean(completed);
      existing.completed_at = completed ? new Date().toISOString() : null;
      if (notes) existing.notes = notes;
    } else {
      existing = {
        id: crypto.randomUUID(),
        farmer_id: farmerId,
        task_id: taskId,
        date: todayStr,
        completed: Boolean(completed),
        completed_at: completed ? new Date().toISOString() : null,
        notes: notes || ''
      };
      localStore.daily_tracker.push(existing);
    }

    // If marked completed, add an entry to the permanent historical timeline
    if (completed) {
      if (!localStore.farmer_crop_history) localStore.farmer_crop_history = [];
      const histItem = {
        id: crypto.randomUUID(),
        farmer_id: farmerId,
        crop_stage: cropStage || 'Active Phase',
        action_title: taskTitle || 'Scheduled Field Task Completed',
        description: notes || 'Task verified and checked off in Daily Planner.',
        date: todayStr,
        status: 'Completed',
        created_at: new Date().toISOString()
      };
      localStore.farmer_crop_history.unshift(histItem);
    }

    localStore.save();

    return res.json({
      success: true,
      data: {
        task_id: taskId,
        completed: existing.completed,
        completed_at: existing.completed_at,
        message: existing.completed ? 'Task checked off and logged in your farm history!' : 'Task reopened.'
      },
      error: null
    });
  } catch (error) {
    console.error('Task check error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/planner/activity/log
 * Adds a custom farm activity to the farmer's permanent history log.
 */
export async function logFarmerActivity(req, res) {
  try {
    const farmerId = req.body.farmerId;
    const actionTitle = req.body.actionTitle || req.body.title || req.body.name;
    const description = req.body.description || req.body.details || req.body.notes || 'Field activity recorded by farmer.';
    const cropStage = req.body.cropStage || req.body.activity_type || 'Active Growth';
    const date = req.body.date || new Date().toISOString().split('T')[0];

    if (!farmerId || !actionTitle) {
      return res.status(400).json({ success: false, error: 'farmerId and title/actionTitle are required' });
    }

    if (!localStore.farmer_crop_history) localStore.farmer_crop_history = [];

    const item = {
      id: crypto.randomUUID(),
      farmer_id: farmerId,
      crop_stage: cropStage,
      action_title: actionTitle.trim(),
      title: actionTitle.trim(),
      activity_type: cropStage,
      description: description,
      details: description,
      date: date,
      status: 'Completed',
      created_at: new Date().toISOString()
    };

    localStore.farmer_crop_history.unshift(item);
    localStore.save();

    return res.status(201).json({
      success: true,
      data: item,
      message: 'Farm activity successfully added to permanent timeline!'
    });
  } catch (error) {
    console.error('Log activity error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PATCH /api/planner/context/:farmerId
 * Updates crop, growth stage, soil type, sowing date, or area.
 */
export async function updateFarmerContext(req, res) {
  try {
    const { farmerId } = req.params;
    const { crop_name, growth_stage, sowing_date, soil_type, area_acres } = req.body;

    // Update farm
    let farm = localStore.farms.filter(f => f.farmer_id === farmerId).pop();
    if (farm) {
      if (soil_type) farm.soil_type = soil_type;
      if (area_acres) farm.area_acres = parseFloat(area_acres);
    } else {
      farm = {
        id: crypto.randomUUID(),
        farmer_id: farmerId,
        area_acres: parseFloat(area_acres) || 2.5,
        soil_type: soil_type || 'Red Sandy Loam'
      };
      localStore.farms.push(farm);
    }

    // Update crop
    let crop = localStore.crops.filter(c => c.farmer_id === farmerId).pop();
    if (crop) {
      if (crop_name) crop.crop_name = crop_name;
      if (growth_stage) crop.growth_stage = growth_stage;
      if (sowing_date) crop.sowing_date = sowing_date;
    } else {
      crop = {
        id: crypto.randomUUID(),
        farmer_id: farmerId,
        crop_name: crop_name || 'Rice (Paddy)',
        growth_stage: growth_stage || 'Tillering',
        sowing_date: sowing_date || new Date().toISOString().split('T')[0]
      };
      localStore.crops.push(crop);
    }

    localStore.save();

    return res.json({
      success: true,
      data: { farm, crop },
      message: 'Farmer context updated! New daily plan, harvest forecast & dosage generated.'
    });
  } catch (error) {
    console.error('Update context error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
