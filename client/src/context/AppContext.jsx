import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import apiClient from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('kisansathi_lang') || 'en');
  const [farmer, setFarmer] = useState(null);
  const [crops, setCrops] = useState([]);
  const [activeCrop, setActiveCrop] = useState(null);
  const [loadingFarmer, setLoadingFarmer] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Helper for i18n
  const t = translations[language] || translations.en;

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('kisansathi_lang', newLang);
  };

  const resolveActiveCrop = (cropList) => {
    if (!cropList || cropList.length === 0) return null;
    const storedId = localStorage.getItem('kisansathi_active_crop_id');
    if (storedId) {
      const match = cropList.find(c => c.id === storedId);
      if (match) return match;
    }
    const explicitActive = cropList.find(c => c.is_active);
    if (explicitActive) return explicitActive;
    return cropList[0];
  };

  const loadFarmerProfile = async () => {
    const token = localStorage.getItem('kisansathi_token');
    if (!token) {
      setFarmer(null);
      setCrops([]);
      setActiveCrop(null);
      setLoadingFarmer(false);
      return;
    }

    try {
      setLoadingFarmer(true);
      const res = await apiClient.get('/auth/me');
      if (res.success && res.data?.farmer) {
        setFarmer(res.data.farmer);
        const userCrops = res.data.crops || [];
        setCrops(userCrops);
        const resolved = resolveActiveCrop(userCrops);
        setActiveCrop(resolved);
        if (resolved) {
          localStorage.setItem('kisansathi_active_crop_id', resolved.id);
        }
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Session expired or profile fetch failed:', err.message);
      logout();
    } finally {
      setLoadingFarmer(false);
    }
  };

  const refreshCrops = async () => {
    try {
      const res = await apiClient.get('/crops');
      if (res.success && Array.isArray(res.data)) {
        setCrops(res.data);
        const resolved = resolveActiveCrop(res.data);
        setActiveCrop(resolved);
        if (resolved) {
          localStorage.setItem('kisansathi_active_crop_id', resolved.id);
        }
        return res.data;
      }
    } catch (err) {
      console.error('Failed to refresh crops:', err);
    }
    return [];
  };

  const switchActiveCrop = async (target) => {
    const targetCrop = typeof target === 'string' ? crops.find(c => c.id === target) : target;
    if (!targetCrop) return;

    // Optimistically update
    setActiveCrop(targetCrop);
    localStorage.setItem('kisansathi_active_crop_id', targetCrop.id);

    try {
      await apiClient.post(`/crops/${targetCrop.id}/set-active`);
      setCrops(prev => prev.map(c => ({
        ...c,
        is_active: c.id === targetCrop.id
      })));
    } catch (err) {
      console.warn('Backend sync for active crop warning:', err.message);
    }
  };

  const login = async (phone, password) => {
    try {
      setAuthError(null);
      const res = await apiClient.post('/auth/login', { phone, password });
      if (res.success && res.data?.token) {
        localStorage.setItem('kisansathi_token', res.data.token);
        localStorage.setItem('kisansathi_farmer_id', res.data.farmer.id);
        setFarmer(res.data.farmer);
        const userCrops = res.data.crops || [];
        setCrops(userCrops);
        const resolved = resolveActiveCrop(userCrops);
        setActiveCrop(resolved);
        if (resolved) {
          localStorage.setItem('kisansathi_active_crop_id', resolved.id);
        }
        return { success: true };
      }
      return { success: false, error: res.error || 'Login failed' };
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const registerFarmerAccount = async (formData) => {
    try {
      setAuthError(null);
      const res = await apiClient.post('/auth/register', formData);
      if (res.success && res.data?.token) {
        localStorage.setItem('kisansathi_token', res.data.token);
        localStorage.setItem('kisansathi_farmer_id', res.data.farmer.id);
        setFarmer(res.data.farmer);
        if (res.data.crop) {
          const userCrops = [res.data.crop];
          setCrops(userCrops);
          setActiveCrop(res.data.crop);
          localStorage.setItem('kisansathi_active_crop_id', res.data.crop.id);
        }
        return { success: true };
      }
      return { success: false, error: res.error || 'Registration failed' };
    } catch (err) {
      const errorMsg = err.message || 'Registration failed';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('kisansathi_token');
    localStorage.removeItem('kisansathi_farmer_id');
    localStorage.removeItem('kisansathi_active_crop_id');
    setFarmer(null);
    setCrops([]);
    setActiveCrop(null);
  };

  useEffect(() => {
    loadFarmerProfile();
  }, []);

  return (
    <AppContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        farmer,
        crops,
        setCrops,
        activeCrop,
        setActiveCrop,
        switchActiveCrop,
        refreshCrops,
        loadingFarmer,
        authError,
        login,
        registerFarmerAccount,
        loadFarmerProfile,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
