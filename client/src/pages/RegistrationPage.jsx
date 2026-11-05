import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MapPin, Sprout, ArrowRight, Lock, Phone } from 'lucide-react';

export default function RegistrationPage() {
  const { changeLanguage, registerFarmerAccount } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    state: 'Karnataka',
    district: 'Mandya',
    village: '',
    language: 'kn',
    area_acres: '2.5',
    soil_type: 'Red Sandy Loam',
    crop_name: 'Rice (Paddy)',
    sowing_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    variety: 'Jyothi / Sona Masoori',
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
        crop_name: 'Rice (Paddy)',
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
        setGeoStatus(`Location access denied or timed out (${err.message}). Using regional coordinates.`);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.phone || !formData.password || !formData.crop_name) {
      setError('Please fill in your name, mobile number, security PIN, and crop.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
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

      const res = await registerFarmerAccount(payload);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '24px auto', padding: '0 16px' }}>
      <div className="card" style={{ padding: '2rem 1.5rem', borderTop: '4px solid var(--primary-green)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-green)', margin: '0 0 4px 0' }}>
              Register Your Farm Account
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Create your farmer profile to get customized daily action plans & alerts
            </p>
          </div>
          <Link
            to="/login"
            className="btn"
            style={{
              fontSize: '0.82rem',
              padding: '6px 12px',
              background: '#e8f5e9',
              color: '#2e7d32',
              textDecoration: 'none',
              borderRadius: 6,
              fontWeight: 600
            }}
          >
            Already Registered? Login
          </Link>
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
              1. Farmer Identity & Login Details
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
                <label className="form-label">Mobile Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Set Login PIN / Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="e.g. 1234"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Language *</label>
                <select name="language" value={formData.language} onChange={handleChange} className="form-select">
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Farm Location */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.75rem' }}>
              2. Location & Field Coordinates
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">State *</label>
                <select name="state" value={formData.state} onChange={handleStateChange} className="form-select">
                  <option value="Karnataka">Karnataka (Pilot Region)</option>
                  <option value="Punjab">Punjab (Wheat Belt)</option>
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
                <label className="form-label">Village / Taluk</label>
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

            <div style={{ background: 'var(--bg-light)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>GPS Field Coordinates</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formData.latitude}°N, {formData.longitude}°E
                </div>
                {geoStatus && <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '2px' }}>{geoStatus}</div>}
              </div>
              <button
                type="button"
                onClick={detectLocation}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                <MapPin size={14} /> Detect via GPS
              </button>
            </div>
          </div>

          {/* Section 3: Farm & Crop Details */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.75rem' }}>
              3. Land Area & Crop Details
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Farm Size (Acres) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  name="area_acres"
                  required
                  value={formData.area_acres}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Soil Type *</label>
                <select name="soil_type" value={formData.soil_type} onChange={handleChange} className="form-select">
                  <option value="Red Sandy Loam">Red Sandy Loam</option>
                  <option value="Black Cotton Soil">Black Cotton Soil (Regur)</option>
                  <option value="Alluvial Soil">Alluvial Soil</option>
                  <option value="Clayey Loam">Clayey Loam</option>
                  <option value="Laterite Soil">Laterite Soil</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Main Crop *</label>
                <select name="crop_name" value={formData.crop_name} onChange={handleChange} className="form-select">
                  <option value="Rice (Paddy)">Rice / Paddy (ಭತ್ತ / धान)</option>
                  <option value="Wheat">Wheat (ಗೋಧಿ / गेहूं)</option>
                  <option value="Maize">Maize (ಮೆಕ್ಕೆಜೋಳ / मक्का)</option>
                  <option value="Tomatoes">Tomatoes (ಟೊಮ್ಯಾಟೊ / टमाटर)</option>
                  <option value="Chillies">Chillies (ಮೆಣಸಿನಕಾಯಿ / मिर्च)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sowing / Transplanting Date *</label>
                <input
                  type="date"
                  name="sowing_date"
                  required
                  value={formData.sowing_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Crop Variety (Optional)</label>
                <input
                  type="text"
                  name="variety"
                  placeholder="e.g. Jyothi, Sona Masoori, HD-2967, Pioneer Hybrid"
                  value={formData.variety}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700 }}
          >
            {loading ? 'Creating Your Profile...' : (
              <>
                <Sprout size={18} /> Register & Generate Farming Plan <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
