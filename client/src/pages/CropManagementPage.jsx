import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import {
  Sprout,
  Plus,
  Calendar,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Trash2,
  Layers,
  Droplets,
  MapPin,
  TrendingUp,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

// Comprehensive Indian crop agronomic profiles and stages
const CROP_CATALOG = {
  'Rice (Paddy)': {
    varieties: ['Sona Masoori', 'Jyothi', 'IR-64', 'Basmati 1121', 'MTU 1010', 'Swarna (MTU 7029)', 'PR 126'],
    defaultSoil: 'Alluvial Loam',
    durationDays: 130,
    stages: [
      'Nursery & Seedbed (0-20 DAS)',
      'Active Tillering (21-45 DAS)',
      'Panicle Initiation (46-70 DAS)',
      'Flowering & Heading (71-90 DAS)',
      'Grain Filling & Milking (91-115 DAS)',
      'Maturity & Harvest (116-130 DAS)'
    ]
  },
  'Wheat': {
    varieties: ['HD-2967', 'HD-3086', 'PBW-550', 'Sharbati', 'GW-322', 'WH-1105', 'DBW 187 (Karan Vandana)'],
    defaultSoil: 'Alluvial Loam',
    durationDays: 125,
    stages: [
      'Crown Root Initiation (CRI) (18-25 DAS)',
      'Active Tillering (26-45 DAS)',
      'Jointing & Stem Elongation (46-65 DAS)',
      'Booting & Heading (66-85 DAS)',
      'Milking & Dough Stage (86-105 DAS)',
      'Ripening & Harvest (106-125 DAS)'
    ]
  },
  'Maize (Corn)': {
    varieties: ['Pioneer P3396', 'DeKalb 9108', 'HQPM-1', 'Ganga 11', 'Bio 9681', 'Kaveri 50'],
    defaultSoil: 'Sandy Loam',
    durationDays: 110,
    stages: [
      'Emergence & Seedling (0-15 DAS)',
      'Knee-High Vegetative V6-V8 (16-35 DAS)',
      'Tasseling & Silking (36-60 DAS)',
      'Kernel Blister & Milk (61-85 DAS)',
      'Dent & Physiological Maturity (86-110 DAS)'
    ]
  },
  'Cotton': {
    varieties: ['Bt Cotton RCH 659', 'Bollgard II', 'Suraj', 'MCU 5', 'DCH 32'],
    defaultSoil: 'Black Cotton Clay',
    durationDays: 165,
    stages: [
      'Seedling & Squaring (0-40 DAS)',
      'Early Flowering & Boll Formation (41-75 DAS)',
      'Peak Boll Formation (76-115 DAS)',
      'Boll Bursting & Maturation (116-150 DAS)',
      'Final Picking (151-165 DAS)'
    ]
  },
  'Mustard / Rapeseed': {
    varieties: ['Pusa Bold', 'Giriraj (DRMRIJ 31)', 'Kranti', 'Pusa Jai Kisan', 'RH 749'],
    defaultSoil: 'Sandy Loam',
    durationDays: 115,
    stages: [
      'Seedling Emergence (0-20 DAS)',
      'Rosette & Vegetative Branching (21-45 DAS)',
      'Flowering (46-70 DAS)',
      'Siliqua Pod Development (71-95 DAS)',
      'Seed Maturation & Harvesting (96-115 DAS)'
    ]
  },
  'Potato': {
    varieties: ['Kufri Jyoti', 'Kufri Pukhraj', 'Kufri Bahar', 'Kufri Chipsona-1', 'Kufri Sindhuri'],
    defaultSoil: 'Sandy Loam',
    durationDays: 105,
    stages: [
      'Sprout Emergence (0-20 DAS)',
      'Stolon & Vegetative Growth (21-40 DAS)',
      'Tuber Initiation (41-60 DAS)',
      'Tuber Bulking (61-85 DAS)',
      'Vine Senescence & Harvest (86-105 DAS)'
    ]
  },
  'Tomato': {
    varieties: ['Pusa Ruby', 'Abhinav (Syngenta)', 'Arka Rakshak', 'Arka Saurabh', 'Himsona'],
    defaultSoil: 'Red Sandy Loam',
    durationDays: 120,
    stages: [
      'Nursery & Transplanting (0-25 DAS)',
      'Vegetative Branching (26-45 DAS)',
      'Flowering & Fruit Set (46-70 DAS)',
      'Fruit Sizing & Green Mature (71-95 DAS)',
      'Breaker & Red Ripe Harvest (96-120 DAS)'
    ]
  },
  'Soybean': {
    varieties: ['JS 335', 'JS 95-60', 'NRC 37', 'JS 20-34', 'RVS 2001-4'],
    defaultSoil: 'Black Cotton Clay',
    durationDays: 105,
    stages: [
      'Germination & Emergence (0-15 DAS)',
      'Vegetative Canopy V2-V4 (16-35 DAS)',
      'Flowering & Pod Initiation R1-R3 (36-60 DAS)',
      'Pod Filling & Seed Expansion R5-R6 (61-85 DAS)',
      'Physiological Maturity & Harvest R7-R8 (86-105 DAS)'
    ]
  },
  'Onion': {
    varieties: ['Nashik Red', 'Bhima Super', 'Bhima Shakti', 'Pusa Madhavi', 'Agrifound Dark Red'],
    defaultSoil: 'Sandy Loam',
    durationDays: 135,
    stages: [
      'Seedling Emergence & Stand (0-30 DAS)',
      'Vegetative Foliage (31-65 DAS)',
      'Bulb Initiation & Swelling (66-100 DAS)',
      'Bulb Maturity & Neck Fall (101-125 DAS)',
      'Harvest & Field Curing (126-135 DAS)'
    ]
  },
  'Gram (Chickpea / Chana)': {
    varieties: ['JG 11', 'JAK 9218', 'Pusa 362', 'Vijay', 'JG 14'],
    defaultSoil: 'Black Cotton Clay',
    durationDays: 110,
    stages: [
      'Seedling Emergence & Branching (0-25 DAS)',
      'Vegetative Canopy (26-45 DAS)',
      'Flowering & Pod Set (46-75 DAS)',
      'Pod Filling & Seed Development (76-95 DAS)',
      'Physiological Maturity & Harvest (96-110 DAS)'
    ]
  },
  'Groundnut (Peanut)': {
    varieties: ['TMV 2', 'JL 24 (Phule Pragati)', 'TAG 24', 'Kadiri 6', 'GG 20'],
    defaultSoil: 'Red Sandy Loam',
    durationDays: 120,
    stages: [
      'Germination & Emergence (0-20 DAS)',
      'Vegetative Branching & Flowering (21-40 DAS)',
      'Pegging & Pod Penetration (41-65 DAS)',
      'Pod Development & Seed Filling (66-95 DAS)',
      'Pod Maturation & Harvest (96-120 DAS)'
    ]
  },
  'Sugarcane': {
    varieties: ['Co 0238', 'Co 86032', 'CoLk 94184', 'Co 6907', 'Co 0118'],
    defaultSoil: 'Alluvial Loam',
    durationDays: 365,
    stages: [
      'Germination & Sprouting (0-45 DAS)',
      'Formative & Tillering (46-120 DAS)',
      'Grand Growth & Cane Elongation (121-270 DAS)',
      'Maturity & Sugar Ripening (271-330 DAS)',
      'Harvesting & Ratoon (331-365 DAS)'
    ]
  }
};

const SOIL_OPTIONS = [
  'Red Sandy Loam',
  'Black Cotton Clay',
  'Alluvial Loam',
  'Sandy Loam',
  'Clay Loam',
  'Laterite Soil'
];

const IRRIGATION_OPTIONS = [
  'Borewell / Tube-well',
  'Canal Water',
  'Drip Irrigation System',
  'Sprinkler Irrigation',
  'Rainfed (Monsoon Dependent)'
];

export default function CropManagementPage() {
  const navigate = useNavigate();
  const { farmer, activeCrop, crops, setCrops, switchActiveCrop, refreshCrops, t } = useApp();

  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // New crop enrollment state
  const [selectedCropName, setSelectedCropName] = useState('Wheat');
  const [plotName, setPlotName] = useState('North Plot A');
  const [areaAcres, setAreaAcres] = useState('2.5');
  const [soilType, setSoilType] = useState('Alluvial Loam');
  const [irrigationType, setIrrigationType] = useState('Borewell / Tube-well');
  const [sowingDate, setSowingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 35);
    return d.toISOString().split('T')[0];
  });
  const [variety, setVariety] = useState('HD-2967');
  const [growthStage, setGrowthStage] = useState('Crown Root Initiation (CRI) (18-25 DAS)');
  const [makeActive, setMakeActive] = useState(true);

  // Sync variety and stages when selected crop changes
  useEffect(() => {
    const catalog = CROP_CATALOG[selectedCropName];
    if (catalog) {
      if (catalog.varieties && catalog.varieties.length > 0) {
        setVariety(catalog.varieties[0]);
      }
      if (catalog.defaultSoil) {
        setSoilType(catalog.defaultSoil);
      }
      if (catalog.stages && catalog.stages.length > 0) {
        setGrowthStage(catalog.stages[1] || catalog.stages[0]);
      }
      setPlotName(`${selectedCropName.split(' ')[0]} Field`);
    }
  }, [selectedCropName]);

  const loadData = async () => {
    if (!farmer) return;
    setLoading(true);
    try {
      await refreshCrops();
    } catch (err) {
      console.error('Failed to load crops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [farmer]);

  const handleAddCrop = async (e) => {
    e.preventDefault();
    if (!farmer) return;
    setSubmitting(true);
    setActionSuccess('');

    try {
      const res = await apiClient.post('/crops', {
        farmerId: farmer.id,
        crop_name: selectedCropName,
        plot_name: plotName.trim() || `${selectedCropName} Plot`,
        area_acres: parseFloat(areaAcres) || 2.5,
        soil_type: soilType,
        irrigation_type: irrigationType,
        sowing_date: sowingDate,
        variety: variety.trim() || 'Certified Variety',
        growth_stage: growthStage,
        is_active: makeActive
      });

      if (res.success && res.data) {
        setActionSuccess(`Enrolled ${res.data.crop_name} (${res.data.plot_name})! System protocol activated.`);
        setShowAddForm(false);
        await refreshCrops();
        if (makeActive) {
          switchActiveCrop(res.data);
        }
      }
    } catch (err) {
      alert(`Could not enroll crop: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStage = async (cropId, newStage) => {
    try {
      const res = await apiClient.patch(`/crops/${cropId}`, {
        growth_stage: newStage
      });
      if (res.success) {
        await refreshCrops();
      }
    } catch (err) {
      alert(`Could not update stage: ${err.message}`);
    }
  };

  const handleDeleteCrop = async (cropId, cropTitle) => {
    if (!window.confirm(`Are you sure you want to remove the plot for ${cropTitle}?`)) return;
    try {
      const res = await apiClient.delete(`/crops/${cropId}`);
      if (res.success) {
        await refreshCrops();
      }
    } catch (err) {
      alert(`Could not delete crop: ${err.message}`);
    }
  };

  const handleActivate = async (crop) => {
    await switchActiveCrop(crop);
    setActionSuccess(`Switched active protocol to ${crop.crop_name} (${crop.plot_name || 'Plot'}). Daily Planner & Mandi Forecast updated!`);
  };

  const currentCrop = activeCrop || (crops.length > 0 ? crops[0] : null);

  // Helper to compute Days After Sowing (DAS)
  const getDAS = (dateStr) => {
    if (!dateStr) return 0;
    const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header */}
      <div className="card" style={{ borderTop: '4px solid var(--primary-green)', background: 'linear-gradient(135deg, #ffffff 0%, #f4faf5 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(46, 125, 50, 0.1)', color: 'var(--primary-green)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              <ShieldCheck size={14} /> ICAR Multi-Crop Agronomic Protocol Engine
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Sprout size={26} color="var(--primary-green)" /> Multi-Crop Management & Plot Protocols
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem', marginBottom: 0 }}>
              Enroll plots with custom acreages, soil profiles, and irrigation systems. The Daily Planner, Checker, and Mandi Forecast adapt to the active protocol.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', padding: '0.55rem 1.1rem' }}
            >
              <Plus size={18} /> {showAddForm ? 'Close Enrollment' : 'Enroll New Crop / Plot'}
            </button>
            <button
              onClick={loadData}
              className="btn-outline"
              style={{ padding: '0.55rem 0.85rem' }}
              title="Refresh plots"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div style={{ marginTop: '1rem', padding: '0.65rem 0.9rem', background: '#e8f5e9', border: '1px solid #81c784', borderRadius: '8px', color: '#1b5e20', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Enroll New Crop Modal / Form */}
      {showAddForm && (
        <div className="card" style={{ background: '#ffffff', border: '2px solid var(--primary-green)', boxShadow: '0 8px 24px rgba(46, 125, 50, 0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-green)', margin: 0 }}>
                🌾 Enroll New Crop & Tailor Its Protocol
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Specify crop variety, plot name, acreage, soil type, and irrigation source for precise dosage & calendar tracking.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddCrop}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              {/* Crop Selection */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Crop Name *</label>
                <select
                  className="form-select"
                  value={selectedCropName}
                  onChange={(e) => setSelectedCropName(e.target.value)}
                >
                  {Object.keys(CROP_CATALOG).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Plot Name */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Plot Name / Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Canal Plot, Plot B"
                  className="form-input"
                  value={plotName}
                  onChange={(e) => setPlotName(e.target.value)}
                />
              </div>

              {/* Plot Area in Acres */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Plot Area (Acres) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  required
                  className="form-input"
                  value={areaAcres}
                  onChange={(e) => setAreaAcres(e.target.value)}
                />
              </div>

              {/* Variety */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Crop Variety</label>
                <input
                  type="text"
                  placeholder="e.g. HD-2967 or PBW-550"
                  className="form-input"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  list="variety-suggestions"
                />
                <datalist id="variety-suggestions">
                  {CROP_CATALOG[selectedCropName]?.varieties.map((v, i) => (
                    <option key={i} value={v} />
                  ))}
                </datalist>
              </div>

              {/* Soil Type for this Plot */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Soil Type of this Plot *</label>
                <select
                  className="form-select"
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                >
                  {SOIL_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Irrigation Source */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Irrigation Source *</label>
                <select
                  className="form-select"
                  value={irrigationType}
                  onChange={(e) => setIrrigationType(e.target.value)}
                >
                  {IRRIGATION_OPTIONS.map(irr => (
                    <option key={irr} value={irr}>{irr}</option>
                  ))}
                </select>
              </div>

              {/* Sowing Date */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Sowing Date *</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                />
              </div>

              {/* Current Growth Stage */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Current Growth Stage *</label>
                <select
                  className="form-select"
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value)}
                >
                  {CROP_CATALOG[selectedCropName]?.stages.map((stg, i) => (
                    <option key={i} value={stg}>{stg}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Set as Active Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', padding: '0.75rem', background: '#f4faf5', borderRadius: '8px', border: '1px solid #c8e6c9' }}>
              <input
                type="checkbox"
                id="makeActiveCheck"
                checked={makeActive}
                onChange={(e) => setMakeActive(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-green)', cursor: 'pointer' }}
              />
              <label htmlFor="makeActiveCheck" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-dark)', cursor: 'pointer' }}>
                Set as Active Protocol across the entire website (Daily Planner, Checker & Mandi Forecast will switch to this crop immediately)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ padding: '0.6rem 1.4rem', fontWeight: 700 }}
              >
                {submitting ? 'Enrolling Plot...' : 'Save & Activate Plot Protocol'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-outline"
                style={{ padding: '0.6rem 1.2rem' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Crop Protocol Banner */}
      {currentCrop && (
        <div className="card" style={{ background: '#f4faf5', border: '2px solid var(--primary-green)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary-green)', color: 'white', padding: '0.35rem 1rem', borderBottomLeftRadius: '12px', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={14} /> ACTIVE SYSTEM PROTOCOL
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', paddingTop: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                  {currentCrop.crop_name}
                </h2>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  ({currentCrop.variety || 'Certified High-Yield'})
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                  {currentCrop.plot_name || 'Main Field'}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Layers size={16} color="var(--primary-green)" />
                  <span>Area: <strong style={{ color: 'var(--text-dark)' }}>{currentCrop.area_acres || 2.5} Acres</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={16} color="var(--primary-green)" />
                  <span>Soil: <strong style={{ color: 'var(--text-dark)' }}>{currentCrop.soil_type || 'Red Sandy Loam'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Droplets size={16} color="var(--primary-green)" />
                  <span>Irrigation: <strong style={{ color: 'var(--text-dark)' }}>{currentCrop.irrigation_type || 'Borewell'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={16} color="var(--primary-green)" />
                  <span>Sown: <strong style={{ color: 'var(--text-dark)' }}>{currentCrop.sowing_date}</strong> (Day {getDAS(currentCrop.sowing_date)})</span>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignSelf: 'center' }}>
              <button
                onClick={() => navigate(`/planner?cropId=${currentCrop.id}`)}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <span>Daily Planner & Tracker</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate(`/market-prices?crop=${encodeURIComponent(currentCrop.crop_name)}`)}
                className="btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <TrendingUp size={16} />
                <span>Mandi Prices & Forecast</span>
              </button>
            </div>
          </div>

          {/* Growth Stage Stepper */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #d7edd9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-green)', textTransform: 'uppercase' }}>
                Current Growth Stage: <strong>{currentCrop.growth_stage}</strong>
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Advance Stage:</span>
                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                  value={currentCrop.growth_stage}
                  onChange={(e) => handleUpdateStage(currentCrop.id, e.target.value)}
                >
                  {(CROP_CATALOG[currentCrop.crop_name]?.stages || [
                    'Sowing / Emergence',
                    'Vegetative Growth',
                    'Flowering & Reproduction',
                    'Maturity & Harvest'
                  ]).map((stg, idx) => (
                    <option key={idx} value={stg}>{stg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of All Enrolled Crops / Plots */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
              All Enrolled Plots ({crops.length})
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Switch the active protocol to see dosages, weather checklists, and harvest countdown for that specific plot.
            </p>
          </div>
        </div>

        {crops.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#fafafa', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
            <Sprout size={48} color="#a5d6a7" style={{ marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.3rem' }}>No Crops Registered Yet</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 1rem auto' }}>
              Enroll your first plot with its acreage, soil type, and sowing date to begin following personalized ICAR protocols.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Enroll First Crop
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {crops.map((c) => {
              const isActive = (activeCrop?.id === c.id) || (c.is_active && !activeCrop);
              const das = getDAS(c.sowing_date);
              const catalog = CROP_CATALOG[c.crop_name];
              const totalDays = catalog?.durationDays || 120;
              const progressPct = Math.min(100, Math.round((das / totalDays) * 100));

              return (
                <div
                  key={c.id}
                  style={{
                    border: `2px solid ${isActive ? 'var(--primary-green)' : 'var(--border-light)'}`,
                    borderRadius: '12px',
                    padding: '1.1rem',
                    background: isActive ? '#f4faf5' : 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isActive ? '0 4px 14px rgba(46, 125, 50, 0.08)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                            {c.crop_name}
                          </h4>
                          {isActive && (
                            <span style={{ background: 'var(--primary-green)', color: 'white', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {c.plot_name || 'Plot'} • {c.variety || 'Certified Variety'}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteCrop(c.id, `${c.crop_name} - ${c.plot_name || 'Plot'}`)}
                        style={{ background: 'transparent', border: 'none', color: '#9e9e9e', cursor: 'pointer', padding: '0.2rem' }}
                        title="Delete Plot"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Metadata Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: isActive ? 'rgba(255,255,255,0.7)' : '#f9fbf9', padding: '0.65rem', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Plot Area:</span>
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{c.area_acres || 2.5} Acres</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Soil Type:</span>
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{c.soil_type || 'Red Sandy Loam'}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Irrigation:</span>
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{c.irrigation_type || 'Borewell'}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Sown:</span>
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{c.sowing_date} (Day {das})</div>
                      </div>
                    </div>

                    {/* Growth Stage & Progress */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Current Stage:</span>
                        <strong style={{ color: 'var(--primary-green)' }}>{c.growth_stage}</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--primary-green)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                    {isActive ? (
                      <button
                        onClick={() => navigate(`/planner?cropId=${c.id}`)}
                        className="btn-primary"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.45rem' }}
                      >
                        <span>Open Planner</span>
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(c)}
                        className="btn-outline"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.45rem', borderColor: 'var(--primary-green)', color: 'var(--primary-green)' }}
                      >
                        <Check size={14} />
                        <span>Activate Protocol</span>
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`/planner?cropId=${c.id}`)}
                      className="btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                      title="View Planner"
                    >
                      <Clock size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
