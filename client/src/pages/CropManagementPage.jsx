import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { Sprout, Plus, Calendar, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';

export default function CropManagementPage() {
  const { farmer, activeCrop, setActiveCrop, t } = useApp();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCrop, setNewCrop] = useState({
    crop_name: 'Rice',
    sowing_date: new Date().toISOString().split('T')[0],
    variety: 'JGL 1798',
    growth_stage: 'Tillering'
  });
  const [updatingStage, setUpdatingStage] = useState(false);

  const fetchCrops = async () => {
    if (!farmer) return;
    try {
      setLoading(true);
      const res = await apiClient.get(`/crops/${farmer.id}`);
      if (res.success && res.data) {
        setCrops(res.data);
        if (res.data.length > 0 && !activeCrop) {
          setActiveCrop(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching crops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, [farmer]);

  const handleAddCrop = async (e) => {
    e.preventDefault();
    if (!farmer) return;
    try {
      const res = await apiClient.post('/crops', {
        farmerId: farmer.id,
        crop_name: newCrop.crop_name,
        sowing_date: newCrop.sowing_date,
        variety: newCrop.variety,
        growth_stage: newCrop.growth_stage
      });
      if (res.success && res.data) {
        setCrops(prev => [res.data, ...prev]);
        setActiveCrop(res.data);
        setShowAddForm(false);
      }
    } catch (err) {
      alert(`Could not add crop: ${err.message}`);
    }
  };

  const handleUpdateStage = async (cropId, newStage) => {
    try {
      setUpdatingStage(true);
      const res = await apiClient.patch(`/crops/${cropId}`, {
        growth_stage: newStage
      });
      if (res.success && res.data) {
        setCrops(prev => prev.map(c => c.id === cropId ? res.data : c));
        if (activeCrop?.id === cropId) {
          setActiveCrop(res.data);
        }
      }
    } catch (err) {
      alert(`Could not update stage: ${err.message}`);
    } finally {
      setUpdatingStage(false);
    }
  };

  const currentCrop = activeCrop || crops[0];

  // Stage stages definition for rice/wheat/maize
  const STAGE_OPTIONS = {
    Rice: ['Nursery / Germination', 'Tillering', 'Panicle Initiation', 'Flowering / Heading', 'Grain Filling', 'Maturity / Harvest'],
    Wheat: ['Sowing & Emergence', 'Crown Root Initiation (CRI)', 'Tillering', 'Jointing / Stem Elongation', 'Booting & Heading', 'Milking & Dough', 'Ripening & Harvest'],
    Maize: ['Germination / Emergence', 'Knee-High Stage (V6-V8)', 'Tasseling & Silking', 'Grain Filling', 'Physiological Maturity']
  };

  const availableStages = STAGE_OPTIONS[currentCrop?.crop_name] || STAGE_OPTIONS.Rice;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="card" style={{ borderTop: '4px solid var(--primary-green)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sprout size={24} /> Crop Management & Growth Stage Tracking
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Track days after sowing (DAS), stage transitions, and custom variety milestones
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Add New Crop
          </button>
        </div>
      </div>

      {/* Add Crop Modal / Inline Form */}
      {showAddForm && (
        <div className="card" style={{ background: '#f4faf5', border: '1px solid #c8e6c9' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary-green)' }}>
            Register New Crop Plot
          </h3>
          <form onSubmit={handleAddCrop}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Crop Name</label>
                <select
                  className="form-select"
                  value={newCrop.crop_name}
                  onChange={(e) => setNewCrop({ ...newCrop, crop_name: e.target.value })}
                >
                  <option value="Rice">Rice (Paddy)</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Maize">Maize</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sowing Date</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={newCrop.sowing_date}
                  onChange={(e) => setNewCrop({ ...newCrop, sowing_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Variety</label>
                <input
                  type="text"
                  placeholder="e.g. JGL 1798 or PBW 550"
                  className="form-input"
                  value={newCrop.variety}
                  onChange={(e) => setNewCrop({ ...newCrop, variety: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ fontSize: '0.85rem' }}>
                Save Crop
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-outline" style={{ fontSize: '0.85rem' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Crop Detail & Interactive Stage Stepper */}
      {currentCrop && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '0.4rem' }}>
                Active Pilot Plot
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                {currentCrop.crop_name} ({currentCrop.variety || 'Standard'})
              </h2>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>📅 Sown: <strong>{currentCrop.sowing_date}</strong></span>
                <span>🌱 Current Stage: <strong style={{ color: 'var(--primary-green)' }}>{currentCrop.growth_stage}</strong></span>
              </div>
            </div>

            {/* Manual Stage Override Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Update Stage:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                value={currentCrop.growth_stage}
                onChange={(e) => handleUpdateStage(currentCrop.id, e.target.value)}
                disabled={updatingStage}
              >
                {availableStages.map((stage, idx) => (
                  <option key={idx} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Visual Growth Stages Stepper */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Growth Stage Milestones
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fit, minmax(130px, 1fr))`,
              gap: '0.5rem'
            }}>
              {availableStages.map((stage, index) => {
                const isCurrent = stage.toLowerCase() === currentCrop.growth_stage?.toLowerCase();
                return (
                  <div
                    key={index}
                    style={{
                      border: `1px solid ${isCurrent ? 'var(--primary-green)' : 'var(--border-light)'}`,
                      background: isCurrent ? 'var(--primary-green-subtle)' : '#fbfcfb',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isCurrent ? 'var(--primary-green)' : '#d1e3d3',
                      color: isCurrent ? 'white' : 'var(--text-dark)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      marginBottom: '0.4rem'
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? 'var(--primary-green)' : 'var(--text-dark)' }}>
                      {stage}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* List of All Farmer Crops */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          All Registered Crops
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {crops.map(c => (
            <div
              key={c.id}
              onClick={() => setActiveCrop(c)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: activeCrop?.id === c.id ? '#f4faf5' : 'white',
                border: `1px solid ${activeCrop?.id === c.id ? 'var(--primary-green)' : 'var(--border-light)'}`,
                cursor: 'pointer'
              }}
            >
              <div>
                <strong>{c.crop_name}</strong> - {c.variety || 'Local'} ({c.growth_stage})
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Sowing date: {c.sowing_date}
                </div>
              </div>
              <span className="badge badge-success">
                {activeCrop?.id === c.id ? 'Active' : 'Select'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
