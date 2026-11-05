import { supabase, isSupabaseConfigured, localStore } from '../config/db.js';

/**
 * Authentication Middleware
 * Enforces per-farmer token authentication and attaches authenticated user context
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Authentication required. Missing Bearer token in Authorization header.'
      });
    }

    const token = authHeader.split(' ')[1];
    req.token = token;

    // 1. Supabase Token Verification (if configured)
    if (isSupabaseConfigured) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        req.user = user;
        return next();
      }
    }

    // 2. Local Store Session Verification
    const matchingFarmer = localStore.farmers.find(f => 
      f.session_token === token ||
      f.id === token ||
      f.auth_user_id === token ||
      `session-${f.id}` === token
    );

    if (matchingFarmer) {
      req.user = {
        id: matchingFarmer.id,
        auth_user_id: matchingFarmer.auth_user_id,
        name: matchingFarmer.name,
        role: 'farmer'
      };
      return next();
    }

    return res.status(401).json({
      success: false,
      data: null,
      error: 'Invalid or expired session. Please log in again.'
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Authentication failed: ' + error.message
    });
  }
}

/**
 * Enforces strict per-farmer ownership checks on sensitive resources
 */
export async function verifyFarmerOwnership(req, res, next) {
  const targetFarmerId = req.params.farmerId || req.params.id || req.body.farmerId;
  
  if (!targetFarmerId) {
    return res.status(400).json({ success: false, data: null, error: 'Target farmer ID is required.' });
  }

  const currentUserId = req.user?.id;
  const currentAuthId = req.user?.auth_user_id;

  if (currentUserId === targetFarmerId || currentAuthId === targetFarmerId) {
    return next();
  }

  // Double-check against farmer record in localStore
  const farmer = localStore.farmers.find(f => f.id === targetFarmerId);
  if (!farmer) {
    return res.status(404).json({ success: false, data: null, error: 'Farmer profile not found.' });
  }

  if (farmer.id === currentUserId || farmer.auth_user_id === currentUserId || farmer.auth_user_id === currentAuthId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    data: null,
    error: 'Access denied: You can only view or manage your own farm records.'
  });
}
