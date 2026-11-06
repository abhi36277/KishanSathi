import { z } from 'zod';
import { supabase, isSupabaseConfigured, localStore } from '../config/db.js';
import crypto from 'crypto';

const addCropSchema = z.object({
  farmerId: z.string().uuid(),
  crop_name: z.string().min(2),
  sowing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  variety: z.string().optional(),
  growth_stage: z.string().optional(),
  area_acres: z.union([z.number(), z.string()]).optional(),
  soil_type: z.string().optional(),
  irrigation_type: z.string().optional(),
  plot_name: z.string().optional(),
  is_active: z.boolean().optional()
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
    const area = parseFloat(val.area_acres) || 2.5;
    const soil = val.soil_type || 'Red Sandy Loam';
    const irrigation = val.irrigation_type || 'Borewell / Tube-well';
    const plot = val.plot_name || `${val.crop_name} Plot`;
    const makeActive = val.is_active !== false;

    // Deactivate other crops if new one is active
    if (makeActive) {
      localStore.crops.forEach(c => {
        if (c.farmer_id === val.farmerId) {
          c.is_active = false;
        }
      });
    }

    const newCrop = {
      id: crypto.randomUUID(),
      farmer_id: val.farmerId,
      crop_name: val.crop_name,
      variety: val.variety || 'Certified Variety',
      sowing_date: val.sowing_date,
      growth_stage: val.growth_stage || 'Sowing / Emergence',
      area_acres: area,
      soil_type: soil,
      irrigation_type: irrigation,
      plot_name: plot,
      is_active: makeActive,
      created_at: new Date().toISOString()
    };

    localStore.crops.push(newCrop);

    // Sync farmer's active farm plot specs
    if (makeActive) {
      let farm = localStore.farms.find(f => f.farmer_id === val.farmerId);
      if (farm) {
        farm.area_acres = area;
        farm.soil_type = soil;
      } else {
        localStore.farms.push({
          id: crypto.randomUUID(),
          farmer_id: val.farmerId,
          area_acres: area,
          soil_type: soil,
          created_at: new Date().toISOString()
        });
      }
    }

    // Record in permanent farmer history
    if (!localStore.farmer_crop_history) localStore.farmer_crop_history = [];
    localStore.farmer_crop_history.unshift({
      id: crypto.randomUUID(),
      farmer_id: val.farmerId,
      date: val.sowing_date,
      activity_type: 'Crop Enrollment',
      title: `Enrolled New Crop: ${val.crop_name} (${val.variety || 'Standard'})`,
      details: `Configured ${area} acres on ${soil} soil with ${irrigation}. Current stage: ${newCrop.growth_stage}.`,
      status: 'Active',
      created_at: new Date().toISOString()
    });

    localStore.save();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('crops').insert([{
          id: newCrop.id,
          farmer_id: val.farmerId,
          crop_name: val.crop_name,
          sowing_date: val.sowing_date,
          variety: val.variety || 'Certified Variety',
          growth_stage: val.growth_stage || 'Sowing / Emergence'
        }]);
      } catch (sbErr) {
        console.warn('Supabase mirror notice:', sbErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      data: newCrop,
      message: `Successfully enrolled ${newCrop.crop_name} (${plot}). System protocol activated.`
    });
  } catch (error) {
    console.error('addCrop error:', error);
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

export async function getCropsByFarmer(req, res) {
  try {
    const { farmerId } = req.params;

    if (!localStore.crops) localStore.crops = [];
    const crops = localStore.crops
      .filter(c => c.farmer_id === farmerId)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // Ensure at least one crop is marked active
    if (crops.length > 0 && !crops.some(c => c.is_active)) {
      crops[0].is_active = true;
      localStore.save();
    }

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

    const crop = localStore.crops.find(c => c.id === id);
    if (!crop) {
      return res.status(404).json({ success: false, data: null, error: 'Crop not found' });
    }

    crop.growth_stage = growth_stage;

    // Log stage milestone to permanent history
    if (!localStore.farmer_crop_history) localStore.farmer_crop_history = [];
    localStore.farmer_crop_history.unshift({
      id: crypto.randomUUID(),
      farmer_id: crop.farmer_id,
      date: new Date().toISOString().split('T')[0],
      activity_type: 'Growth Stage Transition',
      title: `${crop.crop_name}: Advanced to ${growth_stage}`,
      details: `Growth stage updated by farmer. Agronomic protocol recalibrated.`,
      status: 'Active',
      created_at: new Date().toISOString()
    });

    localStore.save();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('crops').update({ growth_stage }).eq('id', id);
      } catch (e) {
        // ignore
      }
    }

    return res.json({ success: true, data: crop, error: null });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}

export async function setActiveCrop(req, res) {
  try {
    const { id } = req.params;
    const crop = localStore.crops.find(c => c.id === id);
    if (!crop) {
      return res.status(404).json({ success: false, error: 'Crop not found' });
    }

    // Set this crop active and deactivate other crops of this farmer
    localStore.crops.forEach(c => {
      if (c.farmer_id === crop.farmer_id) {
        c.is_active = (c.id === id);
      }
    });

    // Sync farm specifications
    let farm = localStore.farms.find(f => f.farmer_id === crop.farmer_id);
    if (farm) {
      if (crop.area_acres) farm.area_acres = crop.area_acres;
      if (crop.soil_type) farm.soil_type = crop.soil_type;
    }

    localStore.save();

    return res.json({
      success: true,
      data: crop,
      message: `Active crop protocol switched to ${crop.crop_name} (${crop.plot_name || crop.variety}).`
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteCrop(req, res) {
  try {
    const { id } = req.params;
    const cropIdx = localStore.crops.findIndex(c => c.id === id);
    if (cropIdx === -1) {
      return res.status(404).json({ success: false, error: 'Crop not found' });
    }

    const removed = localStore.crops.splice(cropIdx, 1)[0];

    // If the removed crop was active, make the latest crop active
    const remaining = localStore.crops.filter(c => c.farmer_id === removed.farmer_id);
    if (remaining.length > 0 && !remaining.some(c => c.is_active)) {
      remaining[0].is_active = true;
    }

    localStore.save();
    return res.json({ success: true, message: `Crop ${removed.crop_name} removed.` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
