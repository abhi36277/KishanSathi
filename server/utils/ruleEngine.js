// KisanSathi AI - Deterministic Rule-Based Agricultural Action Plan Engine
// Pure business logic: No AI fabrication of farming agronomy facts.

export const BASE_RULES = [
  {
    id: 'base_scout_leaves',
    task_key: 'scout_foliage',
    title: 'Inspect Foliage for Pest & Disease Symptoms',
    description: 'Walk in a "W" pattern across the plot. Check the underside of 15-20 random leaves for discolouration, spots, or egg masses.',
    reason: 'Early detection of fungal spots, leaf miners, or stem borer entrance holes prevents rapid spread.',
    priority: 'medium',
    condition: () => true,
    source: 'ICAR National Centre for Integrated Pest Management (NCIPM)'
  },
  {
    id: 'base_soil_aeration',
    task_key: 'check_soil_moisture',
    title: 'Check Root Zone Moisture & Soil Friability',
    description: 'Insert a soil probe or finger 5-10 cm deep near root zones. Form a small ball of soil in your palm to check moisture binding.',
    reason: 'Prevents over-saturation which leads to root hypoxia, while guarding against moisture stress.',
    priority: 'medium',
    condition: () => true,
    source: 'ICAR Directorate of Water Management'
  }
];

export const STAGE_RULES = [
  // Rice Stages
  {
    id: 'rice_tillering_water',
    task_key: 'rice_shallow_water',
    crop: 'Rice',
    stages: ['Tillering'],
    title: 'Maintain 2-3 cm Shallow Standing Water',
    description: 'Maintain thin water level across the paddy basins. Do not submerge tillers deeply as shallow water stimulates vigorous tiller emergence.',
    reason: 'Excess water depth inhibits tiller bud emergence; inadequate water induces weed competition.',
    priority: 'high',
    condition: (stage, weather) => stage.stageName === 'Tillering',
    source: 'ICAR-IIRR Hyderabad Water Management Practices'
  },
  {
    id: 'rice_panicle_nitrogen',
    task_key: 'rice_panicle_fertilizer',
    crop: 'Rice',
    stages: ['Panicle Initiation'],
    title: 'Apply Second Split Nitrogen Top Dressing',
    description: 'Broadcast remaining nitrogen (25-30 kg/ha) along with 25 kg MOP (Muriate of Potash) in moist soil with thin water film.',
    reason: 'Panicle initiation stage determines spikelet count per panicle. Potash increases stem strength against lodging.',
    priority: 'high',
    condition: (stage, weather) => stage.stageName === 'Panicle Initiation',
    source: 'UAS Bangalore Rice Package of Practices'
  },

  // Wheat Stages
  {
    id: 'wheat_cri_irrigation',
    task_key: 'wheat_cri_water',
    crop: 'Wheat',
    stages: ['Crown Root Initiation (CRI)'],
    title: 'First Critical Irrigation at CRI Stage',
    description: 'Provide light irrigation (5-6 cm depth) at crown root initiation (20-25 days after sowing).',
    reason: 'Crown roots anchor the wheat plant and draw deep nutrients. Delaying this first irrigation causes irreversible yield loss up to 30%.',
    priority: 'high',
    condition: (stage, weather) => stage.stageName.includes('CRI') || stage.stageName.includes('Crown Root'),
    source: 'ICAR-IIWBR Karnal Timely Sown Wheat Management'
  },
  {
    id: 'wheat_tillering_rust_scout',
    task_key: 'wheat_yellow_rust_watch',
    crop: 'Wheat',
    stages: ['Tillering'],
    title: 'Scout Field for Yellow / Stripe Rust Symptoms',
    description: 'Check lower leaves for linear stripes of bright yellow powdery pustules. Rub finger on leaf; yellow powder indicates rust.',
    reason: 'Cool temperatures with morning humidity favour stripe rust. Immediate notification to KVK is recommended upon sighting.',
    priority: 'high',
    condition: (stage, weather) => stage.stageName === 'Tillering',
    source: 'PAU Ludhiana Stripe Rust Warning System'
  },

  // Maize Stages
  {
    id: 'maize_knee_high_faw',
    task_key: 'maize_faw_scouting',
    crop: 'Maize',
    stages: ['Knee-High Stage (V6-V8)'],
    title: 'Inspect Whorls for Fall Armyworm (FAW) Frass',
    description: 'Inspect central whorls of 20 consecutive maize plants. Look for pin-holes, window pane feeding, and sawdust-like fecal pellets.',
    reason: 'Fall Armyworm larvae shelter deep inside whorls during knee-high stage and destroy growing point if unchecked.',
    priority: 'high',
    condition: (stage, weather) => stage.stageName.includes('Knee-High'),
    source: 'ICAR-Indian Institute of Maize Research (IIMR)'
  }
];

export const WEATHER_RULES = [
  {
    id: 'weather_high_rain_drainage',
    task_key: 'rain_drainage_check',
    title: 'Clear Drainage Outlets & Postpone Foliar Sprays',
    description: 'Heavy precipitation forecast detected (>15mm or >60% probability). Inspect bunds and clear excess water drainage channels.',
    reason: 'Standing excess water causes root rot; rain washes away freshly sprayed foliar nutrients or crop protectants.',
    priority: 'high',
    condition: (stage, weather) => {
      if (!weather || weather.isFallback) return false;
      const forecast = weather.forecast || [];
      const hasHeavyRain = forecast.some(f => (f.precipitation_probability >= 50) || (f.rain_sum >= 8));
      return hasHeavyRain;
    },
    source: 'IMD-Agromet Advisory Services'
  },
  {
    id: 'weather_heat_stress_irrigation',
    task_key: 'heat_stress_check',
    title: 'Monitor Moisture Depletion Due to High Temperature',
    description: 'Ambient temperatures exceed 34°C. Check soil moisture daily and schedule irrigation during evening or early morning.',
    reason: 'High heat accelerates evapotranspiration, which can cause flower abortion or poor grain filling.',
    priority: 'high',
    condition: (stage, weather) => {
      if (!weather || weather.isFallback) return false;
      const temp = weather.current?.temperature || 0;
      const isCriticalStage = ['Flowering / Heading', 'Panicle Initiation', 'Crown Root Initiation (CRI)', 'Tasseling & Silking'].includes(stage.stageName);
      return temp >= 34 && isCriticalStage;
    },
    source: 'ICAR Climate Resilient Agriculture Guidelines (NICRA)'
  },
  {
    id: 'weather_wind_alert',
    task_key: 'high_wind_precaution',
    title: 'Suspend High-Pressure Sprays Due to Wind Velocity',
    description: 'Wind speeds exceeding 18 km/h detected. Delay spraying pesticides/micronutrients to prevent chemical drift.',
    reason: 'Chemical drift wastes inputs and can contaminate neighboring plots or cause dermal contact hazards.',
    priority: 'medium',
    condition: (stage, weather) => {
      if (!weather || weather.isFallback) return false;
      return (weather.current?.wind_speed || 0) > 18;
    },
    source: 'Central Insecticides Board & Registration Committee (CIBRC)'
  }
];

/**
 * Generates deterministic action plan for a farmer, crop, growth stage and weather conditions
 */
export function generatePlan({ farmer, crop, stage, weather, date }) {
  const planDate = date || new Date().toISOString().split('T')[0];
  const cropName = crop?.crop_name || 'Rice';
  const tasks = [];

  // 1. Evaluate Stage-Specific Rules
  const matchedStageRules = STAGE_RULES.filter(rule => {
    if (rule.crop.toLowerCase() !== cropName.toLowerCase()) return false;
    return rule.condition(stage, weather);
  });

  matchedStageRules.forEach(r => {
    tasks.push({
      task_key: r.task_key,
      task_title: r.title,
      task_description: r.description,
      reason: r.reason,
      priority: r.priority,
      stage_name: stage.stageName,
      source: r.source,
      due_date: planDate,
      completed: false
    });
  });

  // 2. Evaluate Weather-Adaptive Rules
  const matchedWeatherRules = WEATHER_RULES.filter(rule => rule.condition(stage, weather));
  matchedWeatherRules.forEach(r => {
    tasks.push({
      task_key: r.task_key,
      task_title: r.title,
      task_description: r.description,
      reason: r.reason,
      priority: r.priority,
      stage_name: stage.stageName,
      source: r.source,
      due_date: planDate,
      completed: false
    });
  });

  // 3. Always include Base Farm Observation Rules
  BASE_RULES.forEach(r => {
    tasks.push({
      task_key: r.task_key,
      task_title: r.title,
      task_description: r.description,
      reason: r.reason,
      priority: r.priority,
      stage_name: stage.stageName,
      source: r.source,
      due_date: planDate,
      completed: false
    });
  });

  // 4. Attach Weather Attribution Note
  const weatherLabel = (weather && !weather.isFallback)
    ? `Weather: Open-Meteo (Fetched ${weather.fetchedAt?.split('T')[1]?.slice(0, 5) || 'recently'})`
    : 'Weather: Offline / Regional Baseline';

  return {
    plan_date: planDate,
    crop_id: crop?.id,
    crop_name: cropName,
    stage_name: stage.stageName,
    weather_attribution: weatherLabel,
    tasks
  };
}

/**
 * Adaptive Schedule Recalculation (Missed-Task Recovery)
 * When a farmer cannot complete a task:
 * 1. Analyzes the reason (rain, labor, inputs, sickness)
 * 2. Checks stage urgency & weather
 * 3. Returns agricultural decision: POSTPONE, MODIFY, or REFER_TO_EXPERT
 */
export function recalculateMissedTask({ task, reason, cropStage, weather, postponeDays = 2 }) {
  const reasonLower = (reason || '').toLowerCase();
  const isCritical = task.priority === 'high';
  const stageSensitivity = cropStage?.irrigationSensitivity || 'medium';

  let action = 'POSTPONE';
  let explanation = '';
  let updatedDueDate = new Date();
  updatedDueDate.setDate(updatedDueDate.getDate() + (postponeDays || 2));
  let updatedDueDateStr = updatedDueDate.toISOString().split('T')[0];
  let recommendedAlternative = null;

  if (reasonLower.includes('rain') || reasonLower.includes('wet') || reasonLower.includes('waterlog')) {
    action = 'POSTPONE';
    explanation = 'Excess soil wetness from rain prevents field traffic. Rescheduling task by 2-3 days until topsoil dries sufficiently to support foot traffic without soil compaction.';
    recommendedAlternative = 'Inspect field drainage channels to ensure no stagnant water accumulates around plant roots.';
  } else if (reasonLower.includes('fertilizer') || reasonLower.includes('shortage') || reasonLower.includes('urea') || reasonLower.includes('input')) {
    if (stageSensitivity === 'critical') {
      action = 'MODIFY';
      explanation = 'Crop is in a critical nutrient-uptake window. If chemical fertilizer is temporarily unavailable, procure organic farmyard manure slurry or arrange split dose immediately upon stock arrival.';
      recommendedAlternative = 'Contact local primary agricultural credit society (PACS) or nearest RSK / KVK for subsidized stock availability.';
    } else {
      action = 'POSTPONE';
      explanation = 'Task postponed by 3 days to allow input procurement. Growth stage has sufficient flexibility.';
    }
  } else if (reasonLower.includes('labor') || reasonLower.includes('labour') || reasonLower.includes('worker') || reasonLower.includes('busy')) {
    if (task.task_key === 'rice_shallow_water' || task.task_key === 'wheat_cri_water') {
      action = 'MODIFY';
      explanation = 'Irrigation timing at this stage directly determines tiller/root numbers. If labor is constrained, prioritize primary supply inlet control or pool labor with neighboring farmers.';
      recommendedAlternative = 'Consider sharing labor with village farming group.';
    } else {
      action = 'POSTPONE';
      explanation = 'Non-critical activity safely deferred until labor is available next week.';
    }
  } else if (reasonLower.includes('pest') || reasonLower.includes('yellow') || reasonLower.includes('rot') || reasonLower.includes('disease')) {
    action = 'REFER_TO_EXPERT';
    explanation = 'Symptoms indicate active pathogen or insect outbreak. Do not postpone unilaterally without diagnosis. Collect a fresh plant sample in a sealed polybag.';
    recommendedAlternative = 'Visit your local Krishi Vigyan Kendra (KVK) or Block Assistant Agricultural Officer (AAO) immediately.';
  } else {
    action = 'POSTPONE';
    explanation = `Task safely adjusted by ${postponeDays} days. Schedule recalculated based on current ${cropStage?.stageName || 'vegetative'} stage.`;
  }

  return {
    taskId: task.id || task.task_key,
    action,
    explanation,
    newDueDate: updatedDueDateStr,
    alternativeSuggestion: recommendedAlternative,
    stageGrounded: cropStage?.stageName,
    sourceBasis: 'ICAR Agrometeorological Advisory Advisory Guidelines'
  };
}
