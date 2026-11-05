import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import apiClient from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('kisansathi_lang') || 'en');
  const [farmer, setFarmer] = useState(null);
  const [activeCrop, setActiveCrop] = useState(null);
  const [loadingFarmer, setLoadingFarmer] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Helper for i18n
  const t = translations[language] || translations.en;

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('kisansathi_lang', newLang);
  };

  const loadFarmerProfile = async () => {
    const token = localStorage.getItem('kisansathi_token');
    if (!token) {
      setFarmer(null);
      setActiveCrop(null);
      setLoadingFarmer(false);
      return;
    }

    try {
      setLoadingFarmer(true);
      const res = await apiClient.get('/auth/me');
      if (res.success && res.data?.farmer) {
        setFarmer(res.data.farmer);
        if (res.data.crops && res.data.crops.length > 0) {
          setActiveCrop(res.data.crops[0]);
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

  const login = async (phone, password) => {
    try {
      setAuthError(null);
      const res = await apiClient.post('/auth/login', { phone, password });
      if (res.success && res.data?.token) {
        localStorage.setItem('kisansathi_token', res.data.token);
        localStorage.setItem('kisansathi_farmer_id', res.data.farmer.id);
        setFarmer(res.data.farmer);
        if (res.data.crops && res.data.crops.length > 0) {
          setActiveCrop(res.data.crops[0]);
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
          setActiveCrop(res.data.crop);
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
    setFarmer(null);
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
        activeCrop,
        setActiveCrop,
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
