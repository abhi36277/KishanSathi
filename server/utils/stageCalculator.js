import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let calendarData = null;
try {
  const raw = fs.readFileSync(path.join(__dirname, '../data/cropCalendar.json'), 'utf8');
  calendarData = JSON.parse(raw);
} catch (e) {
  console.error('Error loading cropCalendar.json:', e);
}

/**
 * Calculates current growth stage and progress based on sowing date and crop
 * @param {string} cropName - e.g. "Rice", "Wheat", "Maize"
 * @param {string} sowingDateStr - "YYYY-MM-DD"
 * @param {string} state - "Karnataka" | "Punjab" etc.
 * @param {string} [manualStageOverride] - User manual override
 */
export function calculateGrowthStage(cropName, sowingDateStr, state = 'Karnataka', manualStageOverride = null) {
  const sowingDate = new Date(sowingDateStr);
  const today = new Date();
  
  // Calculate days since sowing (DAS)
  const diffTime = today.getTime() - sowingDate.getTime();
  const daysAfterSowing = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  // Normalize state & crop name lookup
  const cropKey = Object.keys(calendarData || {}).find(k => k.toLowerCase() === (cropName || '').toLowerCase()) || 'Rice';
  const cropObj = calendarData?.[cropKey] || {};
  
  const regionKey = Object.keys(cropObj).find(r => r.toLowerCase() === (state || '').toLowerCase()) || Object.keys(cropObj)[0];
  const varietyGroup = cropObj[regionKey] || Object.values(cropObj)[0];

  if (!varietyGroup || !varietyGroup.stages) {
    return {
      stageName: manualStageOverride || 'Vegetative Growth',
      daysAfterSowing,
      progressPercent: Math.min(100, Math.round((daysAfterSowing / 120) * 100)),
      keyActivities: 'Regular field monitoring and weeding',
      source: 'General educational guidance',
      verified: false,
      totalDurationDays: 120
    };
  }

  const { duration_days, stages } = varietyGroup;

  // Find stage based on DAS
  let matchedStage = stages.find(s => daysAfterSowing >= s.start_day && daysAfterSowing <= s.end_day);
  
  // If past final stage or before 0
  if (!matchedStage) {
    if (daysAfterSowing > duration_days) {
      matchedStage = stages[stages.length - 1];
    } else {
      matchedStage = stages[0];
    }
  }

  // If user provided a manual override that exists in stages, honor it
  let activeStageName = matchedStage.name;
  if (manualStageOverride) {
    const overrideMatch = stages.find(s => s.name.toLowerCase() === manualStageOverride.toLowerCase());
    if (overrideMatch) {
      matchedStage = overrideMatch;
      activeStageName = overrideMatch.name;
    } else {
      activeStageName = manualStageOverride;
    }
  }

  const progressPercent = Math.min(100, Math.max(0, Math.round((daysAfterSowing / duration_days) * 100)));

  return {
    stageId: matchedStage.id || 'current_stage',
    stageName: activeStageName,
    daysAfterSowing,
    progressPercent,
    keyActivities: matchedStage.key_activities,
    irrigationSensitivity: matchedStage.irrigation_sensitivity || 'medium',
    source: matchedStage.source || 'General educational guidance',
    verified: matchedStage.verified ?? false,
    totalDurationDays: duration_days,
    allStages: stages.map(s => ({
      name: s.name,
      startDay: s.start_day,
      endDay: s.end_day,
      isCurrent: s.name === activeStageName
    }))
  };
}
