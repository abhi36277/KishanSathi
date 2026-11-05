import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generatePlan, recalculateMissedTask } from './ruleEngine.js';

describe('Agricultural Action Plan Rule Engine', () => {

  test('generates base tasks even when weather is completely unavailable', () => {
    const stage = { stageName: 'Vegetative Growth', irrigationSensitivity: 'medium' };
    const crop = { id: 'crop-1', crop_name: 'Wheat' };
    const farmer = { id: 'farmer-1' };
    const weather = null; // Simulated weather service failure

    const plan = generatePlan({ farmer, crop, stage, weather });
    assert.ok(plan.tasks.length >= 2, 'Should generate at least base observation tasks');
    assert.ok(plan.tasks.some(t => t.task_key === 'scout_foliage'));
    assert.ok(plan.tasks.some(t => t.task_key === 'check_soil_moisture'));
    assert.strictEqual(plan.weather_attribution, 'Weather: Offline / Regional Baseline');
  });

  test('triggers rain rule when rain probability is high (>60%)', () => {
    const stage = { stageName: 'Tillering', irrigationSensitivity: 'high' };
    const crop = { id: 'crop-2', crop_name: 'Rice' };
    const farmer = { id: 'farmer-2' };
    const weather = {
      isFallback: false,
      current: { temperature: 26, wind_speed: 8 },
      forecast: [
        { date: '2026-11-05', precipitation_probability: 75, rain_sum: 18 }
      ],
      fetchedAt: '2026-11-05T10:00:00.000Z'
    };

    const plan = generatePlan({ farmer, crop, stage, weather });
    const hasDrainageTask = plan.tasks.some(t => t.task_key === 'rain_drainage_check');
    assert.ok(hasDrainageTask, 'Must include drainage check and spray delay task during heavy rain forecast');
    const drainageTask = plan.tasks.find(t => t.task_key === 'rain_drainage_check');
    assert.strictEqual(drainageTask.priority, 'high');
  });

  test('triggers wheat CRI irrigation rule during Crown Root Initiation', () => {
    const stage = { stageName: 'Crown Root Initiation (CRI)', irrigationSensitivity: 'critical' };
    const crop = { id: 'crop-3', crop_name: 'Wheat' };
    const farmer = { id: 'farmer-3' };
    const weather = { isFallback: false, current: { temperature: 22, wind_speed: 10 }, forecast: [] };

    const plan = generatePlan({ farmer, crop, stage, weather });
    const criTask = plan.tasks.find(t => t.task_key === 'wheat_cri_water');
    assert.ok(criTask, 'Must include critical first irrigation task at CRI stage');
    assert.strictEqual(criTask.priority, 'high');
  });

  test('missed-task recovery postpones task safely during heavy rain', () => {
    const task = { id: 'task-10', task_key: 'fertilizer_broadcast', priority: 'medium' };
    const cropStage = { stageName: 'Tillering', irrigationSensitivity: 'medium' };
    const result = recalculateMissedTask({
      task,
      reason: 'Heavy unseasonal rain flooded the field paths',
      cropStage,
      weather: null,
      postponeDays: 3
    });

    assert.strictEqual(result.action, 'POSTPONE');
    assert.ok(result.explanation.includes('rain') || result.explanation.includes('wetness'));
    assert.ok(result.alternativeSuggestion.includes('drainage'));
  });

  test('missed-task recovery refers to agricultural expert when disease/pest outbreak reported', () => {
    const task = { id: 'task-11', task_key: 'scout_foliage', priority: 'high' };
    const cropStage = { stageName: 'Panicle Initiation', irrigationSensitivity: 'critical' };
    const result = recalculateMissedTask({
      task,
      reason: 'Sudden yellowing and rot spots spreading rapidly on all leaves',
      cropStage,
      weather: null
    });

    assert.strictEqual(result.action, 'REFER_TO_EXPERT');
    assert.ok(result.explanation.includes('pathogen') || result.explanation.includes('outbreak'));
    assert.ok(result.alternativeSuggestion.includes('KVK') || result.alternativeSuggestion.includes('Agricultural Officer'));
  });
});
