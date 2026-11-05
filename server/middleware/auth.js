import { supabase, isSupabaseConfigured, localStore } from '../config/db.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const isDemoHeader = req.headers['x-demo-user'] === 'true';

    // 1. Demo Mode Fast Path
    if (isDemoHeader) {
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        is_demo: true,
        role: 'authenticated'
      };
      return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Authorization header missing or invalid. Use Bearer <token> or x-demo-user: true'
      });
    }

    const token = authHeader.split(' ')[1];

    // If Supabase is connected, verify JWT using Supabase Auth
    if (isSupabaseConfigured) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({
          success: false,
          data: null,
          error: 'Invalid or expired session token'
        });
      }
      req.user = user;
      return next();
    }

    // Local / In-memory fallback auth token format: "local-user-<id>" or demo token
    if (token.startsWith('local-token-')) {
      const userId = token.replace('local-token-', '');
      req.user = { id: userId, is_demo: false };
      return next();
    }

    if (token === 'demo-token') {
      req.user = { id: '00000000-0000-0000-0000-000000000001', is_demo: true };
      return next();
    }

    // Default anonymous session payload
    req.user = { id: token, is_demo: false };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Authentication failure: ' + error.message
    });
  }
}

/**
 * Checks that the requested farmer belongs to the authenticated user or is a demo farmer
 */
export async function verifyFarmerOwnership(req, res, next) {
  const farmerId = req.params.farmerId || req.params.id || req.body.farmerId;
  if (!farmerId) {
    return res.status(400).json({ success: false, data: null, error: 'Farmer ID required' });
  }

  // Allow demo access
  if (req.user?.is_demo || farmerId === '00000000-0000-0000-0000-000000000001' || farmerId === '00000000-0000-0000-0000-000000000004') {
    return next();
  }

  if (isSupabaseConfigured) {
    const { data: farmer, error } = await supabase
      .from('farmers')
      .select('id, auth_user_id, is_demo')
      .eq('id', farmerId)
      .single();

    if (error || !farmer) {
      return res.status(404).json({ success: false, data: null, error: 'Farmer profile not found' });
    }

    if (!farmer.is_demo && farmer.auth_user_id !== req.user.id) {
      return res.status(403).json({ success: false, data: null, error: 'Forbidden: You do not have ownership of this farm profile' });
    }
    return next();
  }

  // Local store ownership check
  const farmer = localStore.farmers.find(f => f.id === farmerId);
  if (!farmer) {
    return res.status(404).json({ success: false, data: null, error: 'Farmer profile not found' });
  }

  if (!farmer.is_demo && farmer.auth_user_id !== req.user.id) {
    return res.status(403).json({ success: false, data: null, error: 'Forbidden: You do not have ownership of this farm profile' });
  }

  return next();
}
