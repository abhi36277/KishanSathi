import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { MapPin, Sparkles, Sprout, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegistrationPage() {
  const { t, changeLanguage, startDemoMode, loadFarmerProfile } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    state: 'Karnataka',
    district: 'Mandya',
    village: '',
    language: 'kn',
    area_acres: '2.5',
    soil_type: 'Red Sandy Loam',
    crop_name: 'Rice',
    sowing_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    variety: 'JGL 1798 (Paddy)',
    latitude: 12.5238,
    longitude: 76.8967
  });

  const [geoStatus, setGeoStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'language') {
      changeLanguage(value);
    }
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    if (selectedState === 'Karnataka') {
      setFormData(prev => ({
        ...prev,
        state: 'Karnataka',
        district: 'Mandya',
        crop_name: 'Rice',
        latitude: 12.5238,
        longitude: 76.8967,
        language: 'kn'
      }));
      changeLanguage('kn');
    } else if (selectedState === 'Punjab') {
      setFormData(prev => ({
        ...prev,
        state: 'Punjab',
        district: 'Ludhiana',
        crop_name: 'Wheat',
        latitude: 30.9010,
        longitude: 75.8573,
        language: 'hi'
      }));
      changeLanguage('hi');
    } else {
      setFormData(prev => ({
        ...prev,
        state: selectedState,
        district: 'District HQ',
        latitude: 20.5937,
        longitude: 78.9629
      }));
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation not supported by browser. Using district coordinates.');
      return;
    }
    setGeoStatus('Detecting GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(4)),
          longitude: parseFloat(pos.coords.longitude.toFixed(4))
        }));
        setGeoStatus(`GPS detected: ${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`);
      },
      (err) => {
        setGeoStatus(`Location access denied or timed out (${err.message}). Using regional district coordinates.`);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.state || !formData.district || !formData.crop_name) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        phone: formData.phone,
        state: formData.state,
        district: formData.district,
        village: formData.village,
        language: formData.language,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        area_acres: parseFloat(formData.area_acres),
        soil_type: formData.soil_type,
        crop_name: formData.crop_name,
        sowing_date: formData.sowing_date,
        variety: formData.variety
      };

      const res = await apiClient.post('/farmers', payload);
      if (res.success && res.data) {
        localStorage.setItem('kisansathi_is_demo', 'false');
        localStorage.setItem('kisansathi_token', res.data.token || res.data.farmer.id);
        localStorage.setItem('kisansathi_farmer_id', res.data.farmer.id);
        await loadFarmerProfile(res.data.farmer.id, false);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2rem 1.5rem', borderTop: '4px solid var(--primary-green)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-green)' }}>
              Register Your Farm Profile
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Get your custom daily farming plan and hyperlocal weather advisories
            </p>
          </div>
          <button
            type="button"
            onClick={() => { startDemoMode('karnataka'); navigate('/dashboard'); }}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          >
            <Sparkles size={14} /> Try Demo Instead
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Farmer Identity */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.75rem' }}>
              1. Farmer Information
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Ramesh Gowda"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Language</label>
              <select name="language" value={formData.language} onChange={handleChange} className="form-select">
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Location & Coordinates */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.75rem' }}>
              2. Farm Location (For Real-Time Weather)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">State *</label>
                <select name="state" value={formData.state} onChange={handleStateChange} className="form-select">
                  <option value="Karnataka">Karnataka (Pilot Region)</option>
                  <option value="Punjab">Punjab (Pilot Region)</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">District *</label>
                <input
                  type="text"
                  name="district"
                  required
                  value={formData.district}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Village / Hobli</label>
                <input
                  type="text"
                  name="village"
                  placeholder="e.g. Shivalli"
                  value={formData.village}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* Geolocation Button */}
            <div style={{ marginTop: '0.25rem', marginBottom: '0.75rem' }}>
              <button
                type="button"
                onClick={detectLocation}
                className="btn-outline"
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
              >
                <MapPin size={15} /> Detect GPS Coordinates
              </button>
              {geoStatus && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  {geoStatus}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Farm & Active Crop */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.75rem' }}>
              3. Farm Area & Current Crop
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Farm Size (Acres) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  name="area_acres"
                  value={formData.area_acres}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Soil Type</label>
                <select name="soil_type" value={formData.soil_type} onChange={handleChange} className="form-select">
                  <option value="Red Sandy Loam">Red Sandy Loam</option>
                  <option value="Black Cotton Soil">Black Cotton Soil</option>
                  <option value="Alluvial Loam">Alluvial Loam</option>
                  <option value="Clayey Soil">Clayey Soil</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Main Crop *</label>
                <select name="crop_name" value={formData.crop_name} onChange={handleChange} className="form-select">
                  <option value="Rice">Rice (Paddy)</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Maize">Maize (Corn)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sowing Date *</label>
                <input
                  type="date"
                  name="sowing_date"
                  required
                  value={formData.sowing_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Variety</label>
                <input
                  type="text"
                  name="variety"
                  placeholder="e.g. JGL 1798 / PBW 550"
                  value={formData.variety}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
          >
            {loading ? 'Creating Farm Profile...' : 'Complete Registration & Open Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
