import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { MapPin, Sprout, ArrowRight, Lock, Phone, Search, CheckCircle2 } from 'lucide-react';

export const ALL_INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

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
    pincode: '571401',
    language: 'kn',
    area_acres: '2.5',
    soil_type: 'Red Sandy Loam',
    crop_name: 'Rice (Paddy)',
    sowing_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    variety: 'Jyothi / Sona Masoori',
    latitude: 12.5238,
    longitude: 76.8967
  });

  const [pincodeSearching, setPincodeSearching] = useState(false);
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

  // Instant Pincode Auto-Fill for ANY Pincode across India
  const handlePincodeChange = async (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pincode: val }));

    if (val.length === 6) {
      try {
        setPincodeSearching(true);
        setGeoStatus('Locating pincode across India...');
        const res = await apiClient.get(`/location/lookup?pincode=${val}`);
        if (res && res.success && res.data) {
          const d = res.data;
          setFormData(prev => ({
            ...prev,
            pincode: val,
            state: d.state || prev.state,
            district: d.district || prev.district,
            village: d.city || prev.village,
            latitude: d.latitude || prev.latitude,
            longitude: d.longitude || prev.longitude
          }));
          setGeoStatus(`✓ Verified Location: ${d.city ? d.city + ', ' : ''}${d.district}, ${d.state} (PIN: ${val})`);
        }
      } catch (err) {
        setGeoStatus('PIN code recorded. You can adjust the state or district if needed.');
      } finally {
        setPincodeSearching(false);
      }
    }
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setFormData(prev => ({
      ...prev,
      state: selectedState
    }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation not supported by browser. Using district coordinates.');
      return;
    }
    setGeoStatus('Detecting GPS location across India...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lon
        }));

        try {
          const res = await apiClient.get(`/location/lookup?lat=${lat}&lon=${lon}`);
          if (res && res.success && res.data) {
            const d = res.data;
            setFormData(prev => ({
              ...prev,
              state: d.state || prev.state,
              district: d.district || prev.district,
              village: d.city || prev.village,
              pincode: d.pincode || prev.pincode
            }));
            setGeoStatus(`✓ GPS Detected: ${d.city ? d.city + ', ' : ''}${d.district}, ${d.state} (${lat}°N, ${lon}°E)`);
          } else {
            setGeoStatus(`GPS detected: ${lat}°N, ${lon}°E`);
          }
        } catch (e) {
          setGeoStatus(`GPS detected: ${lat}°N, ${lon}°E`);
        }
      },
      (err) => {
        setGeoStatus(`Location access denied or timed out (${err.message}).`);
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
        pincode: formData.pincode,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-green)', margin: '0 0 4px 0' }}>
              Register Your Farm Account
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Create your farmer profile to get customized daily action plans & alerts throughout India
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
          <div style={{ padding: '0.75rem 1rem', background: '#ffebee', color: '#c62828', borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Farmer Identity */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.75rem' }}>
              1. Farmer Identity & Login Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Ramesh Gowda / Gurpreet Singh"
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

          {/* Section 2: Farm Location with Any Indian Pincode Auto-Fill */}
          <div style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={16} style={{ color: '#2e7d32' }} /> 2. Location & Field Coordinates (All-India)
              </h4>
              <button
                type="button"
                onClick={detectLocation}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <MapPin size={13} /> Detect via GPS
              </button>
            </div>

            {/* Pincode Auto-Fill Bar */}
            <div style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#166534' }}>
                Enter Pincode (Auto-fills City, District & State across India)
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  name="pincode"
                  maxLength={6}
                  placeholder="Type any 6-digit Indian PIN (e.g. 571401, 110001, 141001, 226001, 400001)..."
                  value={formData.pincode}
                  onChange={handlePincodeChange}
                  className="form-input"
                  style={{ fontWeight: 600, fontSize: '0.92rem', borderColor: formData.pincode?.length === 6 ? '#2e7d32' : '#cbd5e1' }}
                />
                {pincodeSearching && (
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Searching...</span>
                )}
              </div>
              {geoStatus && (
                <div style={{ fontSize: '0.8rem', color: geoStatus.startsWith('✓') ? '#15803d' : '#64748b', marginTop: 4, fontWeight: 500 }}>
                  {geoStatus}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">State (All 36 States & UTs) *</label>
                <select name="state" value={formData.state} onChange={handleStateChange} className="form-select">
                  {ALL_INDIAN_STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">District *</label>
                <input
                  type="text"
                  name="district"
                  required
                  placeholder="e.g. Mandya / Ludhiana / Nashik"
                  value={formData.district}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Village / Taluk / Town</label>
                <input
                  type="text"
                  name="village"
                  placeholder="e.g. Shivalli / Khanna"
                  value={formData.village}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>
              <span>GPS Coordinates: <strong>{formData.latitude}° N, {formData.longitude}° E</strong></span>
              <span>Selected State: <strong style={{ color: '#0f172a' }}>{formData.state}</strong></span>
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
                  step="0.5"
                  min="0.5"
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
                  <option value="Black Cotton (Regur)">Black Cotton (Regur)</option>
                  <option value="Alluvial Soil">Alluvial Soil (Indo-Gangetic)</option>
                  <option value="Clay Loam">Clay Loam</option>
                  <option value="Laterite Soil">Laterite Soil</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Main Crop *</label>
                <select name="crop_name" value={formData.crop_name} onChange={handleChange} className="form-select">
                  <option value="Rice (Paddy)">Rice / Paddy (ಭತ್ತ / धान)</option>
                  <option value="Wheat">Wheat (ಗೋಧಿ / गेहूं)</option>
                  <option value="Maize">Maize (ಮೆಕ್ಕೆಜೋಳ / मक्का)</option>
                  <option value="Cotton">Cotton (ಹತ್ತಿ / कपास)</option>
                  <option value="Tomatoes">Tomatoes (ಟೊಮ್ಯಾಟೊ / टमाटर)</option>
                  <option value="Mustard">Mustard (ಸಾಸಿವೆ / सरसों)</option>
                  <option value="Sugarcane">Sugarcane (ಕಬ್ಬು / गन्ना)</option>
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
                  placeholder="e.g. Jyothi, PBW-343, HD-2967, Shriram 111"
                  value={formData.variety}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {loading ? 'Creating Your Farm Profile...' : 'Complete All-India Registration'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
