import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import apiClient from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('kisansathi_lang') || 'en');
  const [isDemo, setIsDemo] = useState(() => localStorage.getItem('kisansathi_is_demo') === 'true');
  const [farmer, setFarmer] = useState(null);
  const [activeCrop, setActiveCrop] = useState(null);
  const [loadingFarmer, setLoadingFarmer] = useState(true);

  // Helper for i18n
  const t = translations[language] || translations.en;

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('kisansathi_lang', newLang);
  };

  const loadFarmerProfile = async (farmerId, isDemoMode = false) => {
    try {
      setLoadingFarmer(true);
      const res = await apiClient.get(`/farmers/${farmerId}`);
      if (res.success && res.data) {
        setFarmer(res.data);
        if (res.data.crops && res.data.crops.length > 0) {
          setActiveCrop(res.data.crops[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load farmer profile:', err);
    } finally {
      setLoadingFarmer(false);
    }
  };

  const startDemoMode = async (pilotRegion = 'karnataka') => {
    const demoId = pilotRegion === 'punjab' 
      ? '00000000-0000-0000-0000-000000000004'
      : '00000000-0000-0000-0000-000000000001';

    localStorage.setItem('kisansathi_is_demo', 'true');
    localStorage.setItem('kisansathi_token', 'demo-token');
    localStorage.setItem('kisansathi_farmer_id', demoId);
    setIsDemo(true);
    await loadFarmerProfile(demoId, true);
  };

  const logout = () => {
    localStorage.removeItem('kisansathi_is_demo');
    localStorage.removeItem('kisansathi_token');
    localStorage.removeItem('kisansathi_farmer_id');
    setIsDemo(false);
    setFarmer(null);
    setActiveCrop(null);
  };

  // Initial load
  useEffect(() => {
    const savedId = localStorage.getItem('kisansathi_farmer_id');
    const savedDemo = localStorage.getItem('kisansathi_is_demo') === 'true';

    if (savedId) {
      loadFarmerProfile(savedId, savedDemo);
    } else {
      // Default to demo farmer for frictionless hackathon exploration
      startDemoMode('karnataka');
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        isDemo,
        farmer,
        activeCrop,
        setActiveCrop,
        loadingFarmer,
        startDemoMode,
        loadFarmerProfile,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
