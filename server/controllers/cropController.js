import { z } from 'zod';
import { supabase, isSupabaseConfigured, localStore } from '../config/db.js';
import crypto from 'crypto';

const addCropSchema = z.object({
  farmerId: z.string().uuid(),
  crop_name: z.string().min(2),
  sowing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  variety: z.string().optional(),
  growth_stage: z.string().optional()
});

const updateStageSchema = z.object({
  growth_stage: z.string().min(2, 'Growth stage is required')
});

export async function addCrop(req, res) {
  try {
    const parse = addCropSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: parse.error.errors.map(e => e.message).join(', ')
      });
    }

    const val = parse.data;

    if (isSupabaseConfigured) {
      const { data: crop, error } = await supabase
        .from('crops')
        .insert([{
          farmer_id: val.farmerId,
          crop_name: val.crop_name,
          sowing_date: val.sowing_date,
          variety: val.variety || 'Local Standard',
          growth_stage: val.growth_stage || 'Sowing/Germination'
        }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ success: true, data: crop, error: null });
    }

    const newCrop = {
      id: crypto.randomUUID(),
      farmer_id: val.farmerId,
      crop_name: val.crop_name,
      sowing_date: val.sowing_date,
      variety: val.variety || 'Local Standard',
      growth_stage: val.growth_stage || 'Sowing/Germination',
      created_at: new Date().toISOString()
    };
    localStore.crops.push(newCrop);
    localStore.save();

    return res.status(201).json({ success: true, data: newCrop, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

export async function getCropsByFarmer(req, res) {
  try {
    const { farmerId } = req.params;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, data: data || [], error: null });
    }

    const crops = localStore.crops.filter(c => c.farmer_id === farmerId);
    return res.json({ success: true, data: crops, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

export async function updateCropStage(req, res) {
  try {
    const { id } = req.params;
    const parse = updateStageSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: parse.error.errors.map(e => e.message).join(', ')
      });
    }

    const { growth_stage } = parse.data;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('crops')
        .update({ growth_stage })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, data, error: null });
    }

    const crop = localStore.crops.find(c => c.id === id);
    if (!crop) {
      return res.status(404).json({ success: false, data: null, error: 'Crop not found' });
    }

    crop.growth_stage = growth_stage;
    localStore.save();
    return res.json({ success: true, data: crop, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}
