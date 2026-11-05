import { supabase, isSupabaseConfigured, localStore } from '../config/db.js';
import { calculateGrowthStage } from '../utils/stageCalculator.js';
import { generatePlan, recalculateMissedTask } from '../utils/ruleEngine.js';
import { fetchWeatherData } from '../services/weatherService.js';
import crypto from 'crypto';

export async function getActionPlan(req, res) {
  try {
    const { farmerId } = req.params;
    const requestedDate = req.query.date || new Date().toISOString().split('T')[0];

    // 1. Get farmer & active crop
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

    if (!farmer) {
      return res.status(404).json({ success: false, data: null, error: 'Farmer not found' });
    }

    if (!crop) {
      return res.status(200).json({
        success: true,
        data: {
          plan_date: requestedDate,
          tasks: [],
          message: 'No active crop registered. Please add a crop in Crop Management to generate action plans.'
        },
        error: null
      });
    }

    // 2. Check if plan already exists for this crop and date
    let existingTasks = [];
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('action_plans')
        .select('*')
        .eq('crop_id', crop.id)
        .eq('plan_date', requestedDate);

      if (error) throw error;
      existingTasks = data || [];
    } else {
      existingTasks = localStore.action_plans.filter(p => p.crop_id === crop.id && p.plan_date === requestedDate);
    }

    if (existingTasks.length > 0) {
      return res.json({
        success: true,
        data: {
          farmer_id: farmer.id,
          crop_id: crop.id,
          crop_name: crop.crop_name,
          plan_date: requestedDate,
          tasks: existingTasks
        },
        error: null
      });
    }

    // 3. Generate new plan deterministically
    const weather = await fetchWeatherData(farmer.latitude, farmer.longitude);
    const stageInfo = calculateGrowthStage(crop.crop_name, crop.sowing_date, farmer.state, crop.growth_stage);
    const generated = generatePlan({ farmer, crop, stage: stageInfo, weather, date: requestedDate });

    const tasksToInsert = generated.tasks.map(t => ({
      id: crypto.randomUUID(),
      farmer_id: farmer.id,
      crop_id: crop.id,
      plan_date: requestedDate,
      task_key: t.task_key,
      task_title: t.task_title,
      task_description: t.task_description,
      reason: t.reason,
      priority: t.priority,
      due_date: requestedDate,
      completed: false,
      source: t.source,
      created_at: new Date().toISOString()
    }));

    if (isSupabaseConfigured) {
      const { data: inserted, error: insError } = await supabase
        .from('action_plans')
        .upsert(tasksToInsert, { onConflict: 'crop_id,plan_date,task_key' })
        .select();

      if (insError) throw insError;
      existingTasks = inserted || [];
    } else {
      // Avoid duplicate keys in localStore
      tasksToInsert.forEach(task => {
        const idx = localStore.action_plans.findIndex(p => p.crop_id === task.crop_id && p.plan_date === task.plan_date && p.task_key === task.task_key);
        if (idx >= 0) {
          localStore.action_plans[idx] = task;
        } else {
          localStore.action_plans.push(task);
        }
      });
      localStore.save();
      existingTasks = tasksToInsert;
    }

    return res.json({
      success: true,
      data: {
        farmer_id: farmer.id,
        crop_id: crop.id,
        crop_name: crop.crop_name,
        growth_stage: stageInfo.stageName,
        plan_date: requestedDate,
        weather_attribution: generated.weather_attribution,
        tasks: existingTasks
      },
      error: null
    });
  } catch (error) {
    console.error('Action plan generation error:', error);
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

export async function toggleActionPlan(req, res) {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ success: false, data: null, error: 'Boolean completed status required' });
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('action_plans')
        .update({ completed })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, data, error: null });
    }

    const task = localStore.action_plans.find(p => p.id === id);
    if (!task) {
      return res.status(404).json({ success: false, data: null, error: 'Action plan task not found' });
    }

    task.completed = completed;
    localStore.save();
    return res.json({ success: true, data: task, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

export async function recoverMissedTask(req, res) {
  try {
    const { farmerId, taskId, reason, postponeDays } = req.body;

    if (!taskId || !reason) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'taskId and reason for missing task are required'
      });
    }

    // Find the task
    let task = null;
    let crop = null;
    let farmer = null;

    if (isSupabaseConfigured) {
      const { data: tData } = await supabase.from('action_plans').select('*').eq('id', taskId).single();
      task = tData;
      if (task) {
        const { data: cData } = await supabase.from('crops').select('*').eq('id', task.crop_id).single();
        crop = cData;
        const { data: fData } = await supabase.from('farmers').select('*').eq('id', task.farmer_id).single();
        farmer = fData;
      }
    } else {
      task = localStore.action_plans.find(p => p.id === taskId);
      if (task) {
        crop = localStore.crops.find(c => c.id === task.crop_id);
        farmer = localStore.farmers.find(f => f.id === task.farmer_id);
      }
    }

    if (!task) {
      return res.status(404).json({ success: false, data: null, error: 'Task not found' });
    }

    const stageInfo = crop ? calculateGrowthStage(crop.crop_name, crop.sowing_date, farmer?.state || 'Karnataka', crop.growth_stage) : { stageName: 'Vegetative Growth' };
    const weather = farmer ? await fetchWeatherData(farmer.latitude, farmer.longitude) : null;

    const recoveryDecision = recalculateMissedTask({
      task,
      reason,
      cropStage: stageInfo,
      weather,
      postponeDays: postponeDays || 2
    });

    // Update task due_date if postponed
    if (recoveryDecision.action === 'POSTPONE' || recoveryDecision.action === 'MODIFY') {
      task.due_date = recoveryDecision.newDueDate;
      task.reason = `${task.reason} | Rescheduled: ${recoveryDecision.explanation}`;

      if (isSupabaseConfigured) {
        await supabase.from('action_plans').update({
          due_date: task.due_date,
          reason: task.reason
        }).eq('id', taskId);
      } else {
        localStore.save();
      }
    }

    return res.json({
      success: true,
      data: recoveryDecision,
      error: null
    });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}
