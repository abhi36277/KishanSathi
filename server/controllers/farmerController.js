import { z } from 'zod';
import { supabase, isSupabaseConfigured, localStore } from '../config/db.js';
import crypto from 'crypto';

const registerFarmerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  state: z.string().min(2, 'State is required'),
  district: z.string().min(2, 'District is required'),
  village: z.string().optional(),
  language: z.enum(['en', 'hi', 'kn']).default('en'),
  latitude: z.number().min(6.0).max(38.0, 'Latitude must be within India coordinates (6° to 38° N)'),
  longitude: z.number().min(68.0).max(98.0, 'Longitude must be within India coordinates (68° to 98° E)'),
  area_acres: z.number().positive('Farm area must be greater than 0'),
  soil_type: z.string().min(2, 'Soil type is required'),
  crop_name: z.string().min(2, 'Crop name is required'),
  sowing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Sowing date must be YYYY-MM-DD'),
  variety: z.string().optional()
});

export async function registerFarmer(req, res) {
  try {
    const parseResult = registerFarmerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }

    const val = parseResult.data;
    const authUserId = req.user?.id || crypto.randomUUID();

    if (isSupabaseConfigured) {
      // 1. Insert Farmer
      const { data: farmer, error: fError } = await supabase
        .from('farmers')
        .insert([{
          auth_user_id: authUserId,
          name: val.name,
          phone: val.phone || null,
          state: val.state,
          district: val.district,
          village: val.village || '',
          language: val.language,
          latitude: val.latitude,
          longitude: val.longitude,
          is_demo: false
        }])
        .select()
        .single();

      if (fError) throw fError;

      // 2. Insert Farm
      const { data: farm, error: farmError } = await supabase
        .from('farms')
        .insert([{
          farmer_id: farmer.id,
          area_acres: val.area_acres,
          soil_type: val.soil_type
        }])
        .select()
        .single();

      if (farmError) throw farmError;

      // 3. Insert Initial Crop
      const { data: crop, error: cropError } = await supabase
        .from('crops')
        .insert([{
          farmer_id: farmer.id,
          crop_name: val.crop_name,
          sowing_date: val.sowing_date,
          variety: val.variety || 'Standard Local Variety',
          growth_stage: 'Germination / Early Vegetative'
        }])
        .select()
        .single();

      if (cropError) throw cropError;

      return res.status(201).json({
        success: true,
        data: {
          farmer,
          farm,
          crop,
          token: authUserId
        },
        error: null
      });
    }

    // Local / In-memory Fallback
    const farmerId = crypto.randomUUID();
    const farmId = crypto.randomUUID();
    const cropId = crypto.randomUUID();

    const newFarmer = {
      id: farmerId,
      auth_user_id: authUserId,
      name: val.name,
      phone: val.phone || '',
      state: val.state,
      district: val.district,
      village: val.village || '',
      language: val.language,
      latitude: val.latitude,
      longitude: val.longitude,
      is_demo: false,
      created_at: new Date().toISOString()
    };

    const newFarm = {
      id: farmId,
      farmer_id: farmerId,
      area_acres: val.area_acres,
      soil_type: val.soil_type,
      created_at: new Date().toISOString()
    };

    const newCrop = {
      id: cropId,
      farmer_id: farmerId,
      crop_name: val.crop_name,
      sowing_date: val.sowing_date,
      variety: val.variety || 'Standard Variety',
      growth_stage: 'Germination / Early Vegetative',
      created_at: new Date().toISOString()
    };

    localStore.farmers.push(newFarmer);
    localStore.farms.push(newFarm);
    localStore.crops.push(newCrop);
    localStore.save();

    return res.status(201).json({
      success: true,
      data: {
        farmer: newFarmer,
        farm: newFarm,
        crop: newCrop,
        token: `local-token-${authUserId}`
      },
      error: null
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: error.message || 'Farmer registration failed'
    });
  }
}

export async function getFarmerProfile(req, res) {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured) {
      const { data: farmer, error: fError } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', id)
        .single();

      if (fError || !farmer) {
        return res.status(404).json({ success: false, data: null, error: 'Farmer not found' });
      }

      const { data: farms } = await supabase
        .from('farms')
        .select('*')
        .eq('farmer_id', id);

      const { data: crops } = await supabase
        .from('crops')
        .select('*')
        .eq('farmer_id', id);

      return res.json({
        success: true,
        data: {
          ...farmer,
          farms: farms || [],
          crops: crops || []
        },
        error: null
      });
    }

    const farmer = localStore.farmers.find(f => f.id === id);
    if (!farmer) {
      return res.status(404).json({ success: false, data: null, error: 'Farmer not found' });
    }

    const farms = localStore.farms.filter(f => f.farmer_id === id);
    const crops = localStore.crops.filter(c => c.farmer_id === id);

    return res.json({
      success: true,
      data: {
        ...farmer,
        farms,
        crops
      },
      error: null
    });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: error.message });
  }
}
