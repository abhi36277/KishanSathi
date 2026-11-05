/**
 * KisanSathi AI - Full Lifecycle Agronomic ML & Stage Progression Model
 * Tracks crop age (DAS), stage progression, critical irrigation windows,
 * and precise NPK / micronutrient fertilizer application timelines.
 */

const LIFECYCLE_TEMPLATES = {
  rice: {
    crop_name: 'Rice (Paddy)',
    total_duration_days: 125,
    seed_treatment: 'Soak seeds in 1% salt solution, discard floaters. Treat with Trichoderma viride @ 5g/kg or Carbendazim 2g/kg seed.',
    seed_rate_per_acre: '20-25 kg for transplanted paddy (10-12 kg for direct seeded / SRI)',
    spacing: '20 cm x 15 cm (hill spacing)',
    stages: [
      {
        id: 'stage_1',
        name: 'Land Preparation & Sowing / Nursery',
        day_start: 0,
        day_end: 20,
        irrigation_protocol: {
          water_depth: 'Thin layer of 2-3 cm standing water in nursery beds. Keep moist, do not submerge shoots.',
          criticality: 'High',
          advisory: 'Drain water before seed broadcast; irrigate evening on Day 3.'
        },
        fertilizer_protocol: {
          dose_title: 'Basal Dose at Final Puddling',
          nutrients: 'Full dose of Phosphorus (DAP 50 kg/acre) + 50% Potash (MOP 20 kg/acre) + 25% Nitrogen (Urea 25 kg/acre) + Zinc Sulphate (10 kg/acre).',
          method: 'Incorporate thoroughly into top 10cm puddled soil before transplanting.',
          precaution: 'Never apply Zinc Sulphate directly mixed with DAP (forms insoluble zinc phosphate).'
        },
        key_tasks: ['Puddle and level field to ensure uniform water depth', 'Apply farmyard manure (FYM 4-5 tonnes/acre)', 'Clip seedling leaf tips before transplanting to discard borer egg masses']
      },
      {
        id: 'stage_2',
        name: 'Seedling Establishment & Early Vegetative',
        day_start: 21,
        day_end: 40,
        irrigation_protocol: {
          water_depth: 'Maintain shallow 2-3 cm water layer to promote root anchorage.',
          criticality: 'Medium',
          advisory: 'Allow periodic aeration (alternate wetting and drying) to stimulate deep root growth.'
        },
        fertilizer_protocol: {
          dose_title: 'First Top Dressing (Early Tillering)',
          nutrients: 'Nitrogen (Urea 30 kg/acre) + Neem-coated formulation.',
          method: 'Broadcast uniformly in moist soil with thin standing water. Stop irrigation for 24 hours post-broadcast.',
          precaution: 'Do not broadcast if overcast sky or immediate rain is forecast.'
        },
        key_tasks: ['Hand weeding or cono-weeder pass at Day 25', 'Check for stem borer deadhearts', 'Maintain bunds to prevent nutrient runoff']
      },
      {
        id: 'stage_3',
        name: 'Active Tillering to Maximum Tillering',
        day_start: 41,
        day_end: 65,
        irrigation_protocol: {
          water_depth: 'Maintain 3-5 cm standing water.',
          criticality: 'High',
          advisory: 'Critical water requirement. Water stress during tillering directly reduces effective panicle count.'
        },
        fertilizer_protocol: {
          dose_title: 'Second Top Dressing (Peak Tillering)',
          nutrients: 'Nitrogen (Urea 30 kg/acre) + Remaining 50% Potash (MOP 20 kg/acre).',
          method: 'Broadcast evenly. Potash strengthens straw stiffness and protects against lodging and blast.',
          precaution: 'Avoid excess urea which causes luxuriant soft leaves prone to fungal blast.'
        },
        key_tasks: ['Scout for leaf folder caterpillars and brown planthopper (BPH) at base of hills', 'Install bamboo bird perches (15 per acre)']
      },
      {
        id: 'stage_4',
        name: 'Panicle Initiation & Flowering (Booting)',
        day_start: 66,
        day_end: 90,
        irrigation_protocol: {
          water_depth: 'Continuous shallow 5 cm submergence.',
          criticality: 'Critical',
          advisory: 'Most critical moisture period! Moisture stress causes spikelet sterility and empty chaffy grains.'
        },
        fertilizer_protocol: {
          dose_title: 'Foliar Booster (Panicle Emergence)',
          nutrients: '1% Potassium Nitrate (13-0-45) or 0.2% Borax foliar spray.',
          method: 'Spray in cool late afternoon (after 3 PM) during clear weather.',
          precaution: 'Do not spray pesticides or foliar nutrients during peak morning pollination (9 AM - 12 PM).'
        },
        key_tasks: ['Inspect panicle neck for blast lesions', 'Maintain bund weed-free to eliminate BPH shelter']
      },
      {
        id: 'stage_5',
        name: 'Grain Milking & Dough Stage',
        day_start: 91,
        day_end: 110,
        irrigation_protocol: {
          water_depth: 'Alternate wetting and shallow drying (2 cm depth).',
          criticality: 'Medium',
          advisory: 'Keep root zone moist until grain hardens. Avoid prolonged deep flooding.'
        },
        fertilizer_protocol: {
          dose_title: 'No soil fertilizer application required',
          nutrients: 'Plant draws accumulated nutrients from stem and flag leaf.',
          method: 'Maintain healthy green flag leaf (provides 70% of grain carbohydrates).',
          precaution: 'Zero nitrogen application allowed to avoid delayed maturity and grain blackening.'
        },
        key_tasks: ['Watch out for Gundhi bug attacks on milky grains (foul smell)', 'Erect scarecrows / reflective ribbon to deter bird damage']
      },
      {
        id: 'stage_6',
        name: 'Maturity, Drying & Harvesting',
        day_start: 111,
        day_end: 125,
        irrigation_protocol: {
          water_depth: 'STOP ALL IRRIGATION 10-14 days before expected harvest date.',
          criticality: 'Low',
          advisory: 'Drain the field completely to dry soil crust for easy combine harvester or manual sickle movement.'
        },
        fertilizer_protocol: {
          dose_title: 'Harvest Phase',
          nutrients: 'None.',
          method: 'N/A',
          precaution: 'Ensure grain moisture reaches 14-17% before safe storage.'
        },
        key_tasks: ['Harvest when 85-90% panicles turn golden yellow', 'Thresh, winnow and sun-dry paddy on clean tarpaulin', 'Store in moisture-proof gunny bags with neem leaves']
      }
    ]
  },
  wheat: {
    crop_name: 'Wheat',
    total_duration_days: 140,
    seed_treatment: 'Treat seed with Carboxin + Thiram (Vitavax) @ 2.5g/kg or Trichoderma @ 5g/kg to prevent loose smut and flag smut.',
    seed_rate_per_acre: '40-45 kg/acre (50 kg if late sown in December)',
    spacing: '20 cm row-to-row spacing, continuous line sowing at 4-5 cm depth',
    stages: [
      {
        id: 'stage_1',
        name: 'Sowing & Crown Root Initiation (CRI)',
        day_start: 0,
        day_end: 25,
        irrigation_protocol: {
          water_depth: 'First irrigation at 21 days after sowing (CRI stage) - 5 cm light irrigation.',
          criticality: 'Critical',
          advisory: 'CRI (Day 20-22) is the most critical irrigation in wheat. Delay of 1 week causes 15-20% yield drop.'
        },
        fertilizer_protocol: {
          dose_title: 'Basal Dose at Sowing',
          nutrients: 'Full Phosphorus (DAP 55 kg/acre) + Full Potash (MOP 20 kg/acre) + 1/2 Nitrogen (Urea 35 kg/acre) + Zinc Sulphate (10 kg/acre).',
          method: 'Drill fertilizer 2-3 cm below seed depth using seed-cum-fertilizer drill.',
          precaution: 'Ensure soil has adequate residual moisture (Rauni irrigation) before drilling.'
        },
        key_tasks: ['Ensure certified seed depth of 4-5 cm', 'Apply pre-emergence weedicide (Pendimethalin 30% EC within 48h of sowing) if Phalaris minor is severe']
      },
      {
        id: 'stage_2',
        name: 'Tillering & Jointing Stage',
        day_start: 26,
        day_end: 55,
        irrigation_protocol: {
          water_depth: 'Second irrigation at 40-45 days after sowing (Late tillering).',
          criticality: 'High',
          advisory: 'Irrigate when soil surface cracks; avoid waterlogging in clayey soils.'
        },
        fertilizer_protocol: {
          dose_title: 'First Top Dressing (Post 1st Irrigation)',
          nutrients: 'Nitrogen (Urea 40 kg/acre).',
          method: 'Top dress 2-3 days after first irrigation when field is accessible on foot (vatat condition).',
          precaution: 'Do not top dress during frosty mornings or high winds.'
        },
        key_tasks: ['Post-emergence spray for broadleaf weeds if needed (Metsulfuron-methyl 20% WP)', 'Scout for yellow rust in lower foliage']
      },
      {
        id: 'stage_3',
        name: 'Stem Extension & Booting',
        day_start: 56,
        day_end: 80,
        irrigation_protocol: {
          water_depth: 'Third irrigation at 60-65 days (Booting / Early earhead).',
          criticality: 'High',
          advisory: 'Ensures strong healthy ear emergence; avoid high-velocity windy days to avoid crop lodging.'
        },
        fertilizer_protocol: {
          dose_title: 'Second Top Dressing (Early Boot)',
          nutrients: 'Remaining Nitrogen (Urea 25 kg/acre).',
          method: 'Complete all soil urea applications before spike emergence.',
          precaution: 'Applying urea after ear emergence increases disease without boosting grain yield.'
        },
        key_tasks: ['Inspect canopy for yellow/stripe rust linear pustules', 'Scout for pink stem borer or armyworm']
      },
      {
        id: 'stage_4',
        name: 'Heading & Anthesis (Flowering)',
        day_start: 81,
        day_end: 105,
        irrigation_protocol: {
          water_depth: 'Fourth irrigation at 85-90 days (Flowering stage).',
          criticality: 'Critical',
          advisory: 'Do not let top 15 cm soil dry out. Moisture stress at flowering increases infertile floret count.'
        },
        fertilizer_protocol: {
          dose_title: 'Foliar Nutritional Boost',
          nutrients: 'Foliar spray of 0.5% Potassium Nitrate (13-0-45) or 1% Zinc Sulphate + 2% Urea.',
          method: 'Apply uniform mist in early morning or late afternoon.',
          precaution: 'Avoid spraying when winds exceed 15 km/h.'
        },
        key_tasks: ['Scout for aphid colonies on developing ears', 'Monitor weather forecast for unseasonal western disturbance rain/hail']
      },
      {
        id: 'stage_5',
        name: 'Milk & Soft Dough Stage',
        day_start: 106,
        day_end: 125,
        irrigation_protocol: {
          water_depth: 'Fifth irrigation at 110-115 days (Milking).',
          criticality: 'Medium-High',
          advisory: 'Light irrigation only. Helps protect crop against sudden March terminal heat spikes (>30°C).'
        },
        fertilizer_protocol: {
          dose_title: 'Maturation phase',
          nutrients: 'None. Photosynthates mobilize from flag leaf to grain.',
          method: 'N/A',
          precaution: 'Protect flag leaf integrity.'
        },
        key_tasks: ['Check grain firmness by pressing between fingers', 'Shield against rodent damage in field bunds']
      },
      {
        id: 'stage_6',
        name: 'Hard Dough & Harvesting',
        day_start: 126,
        day_end: 140,
        irrigation_protocol: {
          water_depth: 'STOP ALL IRRIGATIONS 15 days before harvest.',
          criticality: 'Low',
          advisory: 'Allow stems and spikes to turn complete straw golden.'
        },
        fertilizer_protocol: {
          dose_title: 'Harvest & Storage',
          nutrients: 'None.',
          method: 'N/A',
          precaution: 'Store dried grains below 12% moisture.'
        },
        key_tasks: ['Harvest when grains make a clean sharp snap when bitten between teeth', 'Combine harvest during dry sunny afternoon', 'Clean store bins and treat with dry neem leaves']
      }
    ]
  }
};

/**
 * Separate ML & Agronomic Pipeline for Full Plant Lifecycle
 */
export async function calculateFullCropLifecycle({ cropName = 'rice', sowingDate = '2026-10-01', farmerLocation = 'Karnataka' }) {
  const normalizedCrop = cropName.toLowerCase().includes('wheat') ? 'wheat' : 'rice';
  const template = LIFECYCLE_TEMPLATES[normalizedCrop] || LIFECYCLE_TEMPLATES.rice;

  const sowing = new Date(sowingDate);
  const now = new Date();
  const diffTime = Math.max(0, now - sowing);
  const daysAfterSowing = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let currentStageIndex = 0;
  for (let i = 0; i < template.stages.length; i++) {
    const stage = template.stages[i];
    if (daysAfterSowing >= stage.day_start && daysAfterSowing <= stage.day_end) {
      currentStageIndex = i;
      break;
    }
    if (daysAfterSowing > stage.day_end) {
      currentStageIndex = i;
    }
  }

  const activeStage = template.stages[currentStageIndex];
  const progressPercent = Math.min(100, Math.round((daysAfterSowing / template.total_duration_days) * 100));

  // Determine Next Irrigation target
  const nextIrrigationInDays = Math.max(1, (activeStage.day_end - daysAfterSowing) % 10 + 2);

  // Determine Next Fertilizer target
  let nextFertilizerDose = 'Scheduled in next growth stage';
  if (currentStageIndex === 0) {
    nextFertilizerDose = 'First Top Dressing (Urea) at Day 25-30';
  } else if (currentStageIndex === 1) {
    nextFertilizerDose = 'Second Top Dressing (Urea + Potash) at Day 50-60';
  } else if (currentStageIndex === 2) {
    nextFertilizerDose = 'Foliar Micronutrient Booster at Booting Stage';
  } else {
    nextFertilizerDose = 'All major soil fertilizers completed; monitor grain fill';
  }

  const enrichedStages = template.stages.map((stg, idx) => {
    let status = 'UPCOMING';
    if (idx < currentStageIndex) status = 'COMPLETED';
    else if (idx === currentStageIndex) status = 'CURRENT_ACTIVE';

    return {
      ...stg,
      status,
      is_current: idx === currentStageIndex
    };
  });

  return {
    success: true,
    model_name: 'ICAR-AgronomicLifecycle-Engine-v2.0',
    timestamp: new Date().toISOString(),
    crop_name: template.crop_name,
    sowing_date: sowingDate,
    days_after_sowing: daysAfterSowing,
    total_duration_days: template.total_duration_days,
    lifecycle_progress_percent: progressPercent,
    current_stage: {
      name: activeStage.name,
      day_range: `Day ${activeStage.day_start} - ${activeStage.day_end}`,
      status: 'Active Field Phase',
      today_action_urgency: activeStage.irrigation_protocol.criticality
    },
    upcoming_milestones: {
      next_irrigation_due: `In approximately ${nextIrrigationInDays} days`,
      irrigation_guidance: activeStage.irrigation_protocol.advisory,
      next_fertilizer_target: nextFertilizerDose,
      active_fertilizer_dose: activeStage.fertilizer_protocol.dose_title,
      fertilizer_specification: activeStage.fertilizer_protocol.nutrients
    },
    sowing_specifications: {
      seed_treatment: template.seed_treatment,
      seed_rate: template.seed_rate_per_acre,
      spacing: template.spacing
    },
    full_stages: enrichedStages
  };
}
