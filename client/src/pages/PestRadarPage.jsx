import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { Radar, AlertTriangle, ShieldAlert, Radio, MapPin, Send, RefreshCw, CheckCircle2, CloudRain, Search, Satellite, Compass, Thermometer, Camera, Upload, X, ShieldCheck } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYW1hbi15YWRhdi1zdC1qb2hucyIsImEiOiJjbXczeXRwZjMwMHV0MnpyNHg3YWtwcnl6In0.gYS7RjQbPZnyWJzZGVIxbw';

export default function PestRadarPage() {
  const { farmer, activeCrop } = useApp();

  const [loading, setLoading] = useState(true);
  const [radarData, setRadarData] = useState(null);
  const [error, setError] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');

  // Defected Plant Photo Scan State
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanCrop, setScanCrop] = useState(activeCrop?.crop_name || 'Wheat');
  const [scanSymptoms, setScanSymptoms] = useState('');
  const [scanPhotoBase64, setScanPhotoBase64] = useState(null);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanningPhoto, setScanningPhoto] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');

  // Location & Geocoding State
  const [locationInput, setLocationInput] = useState(farmer?.pincode || (farmer?.district ? `${farmer.district}, ${farmer.state}` : '571401'));
  const [locationSearching, setLocationSearching] = useState(false);
  const [activeLocation, setActiveLocation] = useState({
    city: farmer?.village || 'Mandya',
    district: farmer?.district || 'Mandya',
    state: farmer?.state || 'Karnataka',
    pincode: farmer?.pincode || '571401',
    latitude: farmer?.latitude || 12.5238,
    longitude: farmer?.longitude || 76.8967,
    place_name: farmer?.district ? `${farmer.district}, ${farmer.state}` : 'Mandya, Karnataka, India'
  });

  // Display Mode: 'radar' vs 'satellite'
  const [viewMode, setViewMode] = useState('radar');

  // Report Form state
  const [reportPestName, setReportPestName] = useState('Stem Borer / Leaf Folder');
  const [reportCrop, setReportCrop] = useState(activeCrop?.crop_name || 'Rice (Paddy)');
  const [reportSeverity, setReportSeverity] = useState('High');
  const [reportMessage, setReportMessage] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchRadarForCoords = async (lat, lon) => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get(`/pest-radar?lat=${lat}&lon=${lon}&farmerId=${farmer?.id || ''}`);
      if (res && res.success && res.data) {
        setRadarData(res.data);
      } else {
        setError(res?.error || 'Failed to load pest radar');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with pest radar service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadarForCoords(activeLocation.latitude, activeLocation.longitude);
  }, [activeLocation.latitude, activeLocation.longitude]);

  // Handle Location / Pincode Search
  const handleLocationLookup = async (e) => {
    if (e) e.preventDefault();
    if (!locationInput.trim()) return;

    try {
      setLocationSearching(true);
      setError('');
      const isPin = /^\d{6}$/.test(locationInput.trim());
      const queryParam = isPin ? `pincode=${encodeURIComponent(locationInput.trim())}` : `query=${encodeURIComponent(locationInput.trim())}`;
      const res = await apiClient.get(`/location/lookup?${queryParam}`);

      if (res && res.success && res.data) {
        const d = res.data;
        setActiveLocation({
          city: d.city || locationInput,
          district: d.district || d.city || '',
          state: d.state || 'India',
          pincode: d.pincode || (isPin ? locationInput.trim() : ''),
          latitude: d.latitude || 12.5238,
          longitude: d.longitude || 76.8967,
          place_name: d.place_name || locationInput
        });
      } else {
        setError('Location not found. Please verify the pincode or town name.');
      }
    } catch (err) {
      console.warn('Geocoding error:', err);
      setError('Could not resolve location. Using nearest regional center.');
    } finally {
      setLocationSearching(false);
    }
  };

  // GPS Device Geolocation
  const handleGPSDetect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocationSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await apiClient.get(`/location/lookup?lat=${latitude}&lon=${longitude}`);
          if (res && res.success && res.data) {
            const d = res.data;
            setActiveLocation({
              city: d.city || 'Detected Location',
              district: d.district || '',
              state: d.state || 'India',
              pincode: d.pincode || '',
              latitude,
              longitude,
              place_name: d.place_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
            setLocationInput(d.pincode || d.city || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } else {
            setActiveLocation(prev => ({ ...prev, latitude, longitude }));
          }
        } catch (e) {
          setActiveLocation(prev => ({ ...prev, latitude, longitude }));
        } finally {
          setLocationSearching(false);
        }
      },
      (err) => {
        alert('Could not obtain GPS coordinates: ' + err.message);
        setLocationSearching(false);
      },
      { timeout: 10000 }
    );
  };

  const handleBroadcastReport = async (e) => {
    e.preventDefault();
    if (!reportPestName || !reportCrop) return;

    try {
      setSubmittingReport(true);
      const res = await apiClient.post('/pest-radar/report', {
        reporterFarmerId: farmer?.id,
        pestName: reportPestName,
        cropAffected: reportCrop,
        severity: reportSeverity,
        latitude: activeLocation.latitude,
        longitude: activeLocation.longitude,
        locationName: activeLocation.city ? `${activeLocation.city}, ${activeLocation.state}` : 'Local Fields',
        message: reportMessage || `Pest alert: ${reportPestName} symptoms noticed on ${reportCrop}.`
      });

      if (res && res.success) {
        setReportSuccess('Pest outbreak broadcast successfully to all farmers within 50 km!');
        setShowReportModal(false);
        setReportMessage('');
        fetchRadarForCoords(activeLocation.latitude, activeLocation.longitude);
        setTimeout(() => setReportSuccess(''), 6000);
      }
    } catch (err) {
      alert('Failed to broadcast report: ' + err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setScanError('Please select an image under 8MB');
      return;
    }

    setScanError('');
    const reader = new FileReader();
    reader.onload = () => {
      setScanPreview(reader.result);
      setScanPhotoBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPhotoScan = async (e) => {
    e.preventDefault();
    if (!scanPhotoBase64) {
      setScanError('Please take or upload a photo of the defected leaf/plant.');
      return;
    }

    try {
      setScanningPhoto(true);
      setScanError('');
      setScanResult(null);

      const res = await apiClient.post('/pest-radar/report-photo', {
        farmerId: farmer?.id,
        crop_name: scanCrop,
        image_base64: scanPhotoBase64,
        symptoms: scanSymptoms,
        latitude: activeLocation.latitude,
        longitude: activeLocation.longitude,
        locationName: activeLocation.city ? `${activeLocation.city}, ${activeLocation.state}` : 'Local Region'
      });

      if (res && res.success && res.data) {
        setScanResult(res.data);
        setReportSuccess(`AI Confirmed: ${res.data.diagnosis?.diagnosis?.disease_name}. Area marked as AFFECTED AREA on the radar!`);
        fetchRadarForCoords(activeLocation.latitude, activeLocation.longitude);
        setTimeout(() => setReportSuccess(''), 8000);
      } else {
        setScanError(res?.error || 'Analysis failed. Please try a clearer photo.');
      }
    } catch (err) {
      setScanError('Error during AI diagnosis: ' + err.message);
    } finally {
      setScanningPhoto(false);
    }
  };

  // Generate Mapbox Static Satellite Image URL with pins
  const getMapboxSatelliteUrl = () => {
    const lat = activeLocation.latitude;
    const lon = activeLocation.longitude;
    // Mapbox Static Images API: center at lon,lat, zoom 12, 640x360@2x
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-s-farm+2e7d32(${lon},${lat})/${lon},${lat},11.5,0/640x360@2x?access_token=${MAPBOX_TOKEN}`;
  };

  return (
    <div style={{ maxWidth: 980, margin: '20px auto', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '6px 10px',
              borderRadius: 8,
              display: 'inline-flex'
            }}>
              <Radar size={22} />
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#b71c1c' }}>
              Nearby Pest Radar & Satellite Outbreak Map
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
            Micro-climate pest incubation scoring (Open-Meteo) & Mapbox satellite proximity radar
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setShowScanModal(true); setScanResult(null); setScanError(''); }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', background: '#b71c1c', borderColor: '#7f0000' }}
          >
            <Camera size={16} /> Scan & Report Defected Plant
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
          >
            <Radio size={16} /> Broadcast Outbreak
          </button>
          <button
            onClick={() => fetchRadarForCoords(activeLocation.latitude, activeLocation.longitude)}
            className="btn btn-secondary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Pincode & City/Town Search Bar */}
      <div className="card" style={{ padding: 14, marginBottom: 18, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <form onSubmit={handleLocationLookup} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 280px' }}>
            <MapPin size={18} style={{ color: '#c62828' }} />
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Enter Indian Pincode or City/Town (e.g. 571401, Mandya, Karnal, Ludhiana)..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={locationSearching}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '8px 14px' }}
          >
            <Search size={15} className={locationSearching ? 'spin' : ''} />
            {locationSearching ? 'Searching...' : 'Check Location'}
          </button>

          <button
            type="button"
            onClick={handleGPSDetect}
            disabled={locationSearching}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '8px 12px' }}
            title="Detect GPS coordinates automatically"
          >
            <Compass size={15} /> My GPS
          </button>
        </form>

        {/* Resolved Location Badge */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0', fontSize: '0.83rem', color: '#475569' }}>
          <div>
            <strong>City/Town:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{activeLocation.city || 'Regional Center'}</span>
          </div>
          <div>
            <strong>District:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{activeLocation.district || 'Mandya'}</span>
          </div>
          <div>
            <strong>State:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{activeLocation.state || 'Karnataka'}</span>
          </div>
          {activeLocation.pincode && (
            <div>
              <strong>PIN:</strong> <span style={{ color: '#2e7d32', fontWeight: 700 }}>{activeLocation.pincode}</span>
            </div>
          )}
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginLeft: 'auto' }}>
            GPS: {activeLocation.latitude.toFixed(4)}° N, {activeLocation.longitude.toFixed(4)}° E
          </div>
        </div>
      </div>

      {reportSuccess && (
        <div style={{ padding: '12px 16px', background: '#e8f5e9', color: '#2e7d32', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={18} /> {reportSuccess}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#ffebee', color: '#c62828', borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Climate Risk Banner with Open-Meteo live readings */}
      {radarData && (
        <div className="card" style={{ padding: 16, marginBottom: 20, background: '#fff8e1', borderLeft: '5px solid #ff8f00' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <CloudRain size={18} style={{ color: '#e65100' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#e65100' }}>
                  Micro-Climate Incubation Index: {radarData.climate_threat_index}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#5d4037' }}>
                {radarData.climate_threat_advisory}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 14, background: '#fff', padding: '6px 12px', borderRadius: 8, border: '1px solid #fed7aa', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9a3412' }}>
                <Thermometer size={14} /> Open-Meteo Live Data
              </div>
              <div style={{ color: '#431407', fontWeight: 600 }}>
                Coverage: {radarData.radar_coverage_km || 50} km Radius
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
          <RefreshCw size={32} className="spin" style={{ color: '#c62828', marginBottom: 12 }} />
          <div>Scanning regional coordinates and calculating proximity vectors...</div>
        </div>
      ) : radarData ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {/* Radar / Satellite Visual Display */}
          <div className="card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              {/* View Mode Toggle Buttons */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: 2, borderRadius: 8 }}>
                <button
                  type="button"
                  onClick={() => setViewMode('radar')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    background: viewMode === 'radar' ? '#ffffff' : 'transparent',
                    color: viewMode === 'radar' ? '#0f172a' : '#64748b',
                    boxShadow: viewMode === 'radar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Radar size={13} style={{ display: 'inline', marginRight: 4 }} /> Radar HUD
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('satellite')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    background: viewMode === 'satellite' ? '#ffffff' : 'transparent',
                    color: viewMode === 'satellite' ? '#0f172a' : '#64748b',
                    boxShadow: viewMode === 'satellite' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Satellite size={13} style={{ display: 'inline', marginRight: 4 }} /> Mapbox Satellite
                </button>
              </div>

              <span style={{ fontSize: '0.75rem', background: '#ffebee', color: '#c62828', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                {radarData.active_threats_count} Active Outbreaks
              </span>
            </div>

            {viewMode === 'radar' ? (
              /* Radar Circular Visual Canvas */
              <div style={{
                position: 'relative',
                width: 320,
                height: 320,
                margin: '0 auto',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #1a2a1a 0%, #0d1a0d 100%)',
                border: '2px solid #2e7d32',
                boxShadow: '0 0 20px rgba(46, 125, 50, 0.3)',
                overflow: 'hidden'
              }}>
                {/* Concentric rings */}
                <div style={{ position: 'absolute', top: '15%', left: '15%', width: '70%', height: '70%', borderRadius: '50%', border: '1px dashed rgba(76, 175, 80, 0.4)' }} />
                <div style={{ position: 'absolute', top: '30%', left: '30%', width: '40%', height: '40%', borderRadius: '50%', border: '1px dashed rgba(76, 175, 80, 0.5)' }} />
                
                {/* Center Crosshair */}
                <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 1, background: 'rgba(76, 175, 80, 0.3)' }} />
                <div style={{ position: 'absolute', top: 0, left: '50%', width: 1, height: '100%', background: 'rgba(76, 175, 80, 0.3)' }} />

                {/* Center Farmer Marker */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#4caf50',
                  boxShadow: '0 0 10px #4caf50',
                  zIndex: 10
                }} title={`Your Center: ${activeLocation.city}`} />

                {/* Range labels */}
                <span style={{ position: 'absolute', top: 6, left: '52%', fontSize: '0.65rem', color: '#81c784' }}>50km N</span>
                <span style={{ position: 'absolute', top: '32%', left: '52%', fontSize: '0.6rem', color: '#81c784' }}>25km</span>
                <span style={{ position: 'absolute', top: '44%', left: '52%', fontSize: '0.6rem', color: '#81c784' }}>10km</span>

                {/* Threat Nodes */}
                {(radarData.outbreak_nodes || []).map((node, i) => (
                  <div
                    key={node.id || i}
                    style={{
                      position: 'absolute',
                      top: `${node.radar_position?.y ?? 50}%`,
                      left: `${node.radar_position?.x ?? 50}%`,
                      transform: 'translate(-50%, -50%)',
                      width: node.is_affected_area ? 20 : node.threat_level === 'Critical' ? 16 : 12,
                      height: node.is_affected_area ? 20 : node.threat_level === 'Critical' ? 16 : 12,
                      borderRadius: '50%',
                      background: node.is_affected_area ? '#d50000' : node.threat_level === 'Critical' ? '#ff1744' : node.threat_level === 'High' ? '#ff9100' : '#ffd600',
                      boxShadow: node.is_affected_area ? '0 0 14px #ff1744, 0 0 4px #fff' : `0 0 8px ${node.threat_level === 'Critical' ? '#ff1744' : '#ff9100'}`,
                      border: node.is_affected_area ? '2px solid #ffffff' : 'none',
                      cursor: 'pointer',
                      zIndex: node.is_affected_area ? 8 : 5
                    }}
                    title={`${node.is_affected_area ? '[AFFECTED AREA] ' : ''}${node.pest_or_disease} (${node.distance_km} km away)`}
                  />
                ))}
              </div>
            ) : (
              /* Mapbox High-Resolution Satellite View */
              <div style={{
                position: 'relative',
                width: '100%',
                height: 320,
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #cbd5e1'
              }}>
                <img
                  src={getMapboxSatelliteUrl()}
                  alt={`Mapbox Satellite Map of ${activeLocation.city}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    // Fallback to stylized dark map if token limit or offline
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Satellite size={12} /> Mapbox Satellite Streets • {activeLocation.city}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 14, fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff1744' }} /> &lt;15 km (Critical)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff9100' }} /> 15-35 km (High)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffd600' }} /> 35-60 km (Moderate)
              </div>
            </div>
          </div>

          {/* Outbreak Threat List & Defensive Actions */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#333', margin: '0 0 12px 0' }}>
              Active Outbreaks around {activeLocation.city || 'Your Area'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(radarData.outbreak_nodes || []).map((node, i) => (
                <div
                  key={node.id || i}
                  className="card"
                  style={{
                    padding: 16,
                    borderLeft: node.is_affected_area ? '6px solid #d50000' : node.threat_level === 'Critical' ? '5px solid #ff1744' : node.threat_level === 'High' ? '5px solid #ff9100' : '5px solid #fbc02d',
                    background: node.is_affected_area ? '#fff5f5' : '#fff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {node.is_affected_area && (
                          <span style={{
                            background: '#d50000',
                            color: '#fff',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: 4,
                            letterSpacing: '0.04em'
                          }}>
                            AFFECTED AREA &bull; AI SCANNED
                          </span>
                        )}
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: node.is_affected_area ? '#b71c1c' : '#212121' }}>
                          {node.pest_or_disease}
                        </h4>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 3 }}>
                        Affected Crop: <strong>{node.crop_affected}</strong> • Location: <strong>{node.location_name}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: node.is_affected_area || node.threat_level === 'Critical' ? '#ffebee' : '#fff3e0',
                        color: node.is_affected_area || node.threat_level === 'Critical' ? '#c62828' : '#e65100'
                      }}>
                        {node.distance_km === 0 ? 'Inside Your Area' : `${node.distance_km} km away`}
                      </span>
                    </div>
                  </div>

                  {node.photo_preview && (
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      <img
                        src={node.photo_preview}
                        alt="Defected plant sample"
                        style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #ef9a9a' }}
                      />
                    </div>
                  )}

                  <div style={{ background: node.is_affected_area ? '#ffebee' : '#fafafa', padding: 10, borderRadius: 6, fontSize: '0.82rem', color: '#444', marginTop: 8 }}>
                    <strong style={{ color: node.is_affected_area ? '#b71c1c' : '#333' }}>
                      {node.is_affected_area ? '⚠️ Urgent Outbreak Containment:' : 'Recommended Defensive Measure:'}
                    </strong>{' '}
                    {node.protective_action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Broadcast Modal */}
      {showReportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: 24, background: '#fff' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 12px 0', color: '#b71c1c' }}>
              Broadcast Pest Outbreak Alert
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 16px 0' }}>
              This will notify all farmers within 50 km of {activeLocation.city} to inspect their fields immediately.
            </p>

            <form onSubmit={handleBroadcastReport}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                  Pest or Disease Observed *
                </label>
                <input
                  type="text"
                  required
                  value={reportPestName}
                  onChange={(e) => setReportPestName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                  Crop Affected *
                </label>
                <input
                  type="text"
                  required
                  value={reportCrop}
                  onChange={(e) => setReportCrop(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                  Severity Level
                </label>
                <select
                  value={reportSeverity}
                  onChange={(e) => setReportSeverity(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                >
                  <option value="Critical">Critical (Fast Spreading / Severe Damage)</option>
                  <option value="High">High (Noticeable Foliage Damage)</option>
                  <option value="Moderate">Moderate (Early Inception)</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                  Specific Advisory or Symptoms for Neighbors
                </label>
                <textarea
                  rows={3}
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  placeholder="e.g. Yellowing and whorl frass found on 5 acres; please check early morning..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="btn btn-secondary"
                  disabled={submittingReport}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingReport}
                  style={{ background: '#c62828', borderColor: '#b71c1c' }}
                >
                  {submittingReport ? 'Broadcasting...' : 'Broadcast Alert Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCAN DEFECTED PLANT & MARK AFFECTED AREA */}
      {showScanModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24, background: '#fff', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={22} color="#b71c1c" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#b71c1c' }}>
                  AI Defected Plant Scan & Affected Area Alert
                </h3>
              </div>
              <button
                onClick={() => setShowScanModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#666', margin: '0 0 16px 0' }}>
              Upload a photograph of your defected crop or leaf. Our trained PlantVillage vision AI will diagnose the disease, and immediately mark your area (<strong>{activeLocation.city || 'your coordinates'}</strong>) as an <strong>AFFECTED AREA</strong> on the regional radar for all farmers to see!
            </p>

            {scanError && (
              <div style={{ background: '#ffebee', color: '#c62828', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: '0.84rem' }}>
                {scanError}
              </div>
            )}

            {!scanResult ? (
              <form onSubmit={handleSubmitPhotoScan}>
                {/* Photo Upload Zone */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                    Defected Leaf / Plant Photo *
                  </label>
                  <div style={{
                    border: '2px dashed #ef9a9a',
                    borderRadius: 10,
                    padding: '16px',
                    textAlign: 'center',
                    background: '#fff9f9',
                    cursor: 'pointer',
                    position: 'relative'
                  }}>
                    {scanPreview ? (
                      <div>
                        <img
                          src={scanPreview}
                          alt="Defected plant preview"
                          style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, margin: '0 auto 8px auto', display: 'block' }}
                        />
                        <span style={{ fontSize: '0.78rem', color: '#c62828', fontWeight: 600 }}>Click or drag to change photo</span>
                      </div>
                    ) : (
                      <div style={{ padding: '20px 0' }}>
                        <Upload size={32} color="#c62828" style={{ margin: '0 auto 8px auto' }} />
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#b71c1c' }}>
                          Upload Defected Foliage Photo
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 4 }}>
                          Supports JPG, PNG up to 8MB
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                      Crop Name
                    </label>
                    <select
                      value={scanCrop}
                      onChange={(e) => setScanCrop(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                    >
                      <option value="Wheat">Wheat</option>
                      <option value="Rice (Paddy)">Rice / Paddy</option>
                      <option value="Tomatoes">Tomatoes</option>
                      <option value="Potato">Potato</option>
                      <option value="Maize">Maize / Corn</option>
                      <option value="Chillies">Chillies</option>
                      <option value="Cotton">Cotton</option>
                      <option value="Mustard">Mustard</option>
                      <option value="Bean">Beans / Pulses</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                      Affected Location
                    </label>
                    <input
                      type="text"
                      disabled
                      value={activeLocation.place_name || activeLocation.city}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#f5f5f5', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                    Optional Symptoms or Notes
                  </label>
                  <input
                    type="text"
                    value={scanSymptoms}
                    onChange={(e) => setScanSymptoms(e.target.value)}
                    placeholder="e.g. Yellow linear stripes spreading after rain..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowScanModal(false)}
                    className="btn btn-secondary"
                    disabled={scanningPhoto}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={scanningPhoto}
                    style={{ background: '#b71c1c', borderColor: '#7f0000', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {scanningPhoto ? (
                      <>
                        <RefreshCw size={14} className="spin" /> Analyzing Photo with AI...
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={15} /> Diagnose & Mark Affected Area
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success & Diagnosis Report Card */
              <div>
                <div style={{
                  background: '#e8f5e9',
                  border: '1px solid #81c784',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 16,
                  color: '#1b5e20',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <ShieldCheck size={20} />
                  <div>
                    <strong>Successfully Marked as Affected Area!</strong>
                    <div style={{ fontSize: '0.8rem' }}>{scanResult.broadcast_message}</div>
                  </div>
                </div>

                {/* Diagnosis Summary */}
                <div style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  padding: 14,
                  background: '#fafafa',
                  marginBottom: 16
                }}>
                  <span style={{
                    fontSize: '0.72rem',
                    background: '#ffebee',
                    color: '#c62828',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: 700
                  }}>
                    {scanResult.diagnosis?.diagnosis?.severity || 'HIGH'} SEVERITY THREAT
                  </span>
                  <h4 style={{ margin: '6px 0 2px 0', fontSize: '1.1rem', color: '#b71c1c', fontWeight: 800 }}>
                    {scanResult.diagnosis?.diagnosis?.disease_name}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8 }}>
                    Pathogen: {scanResult.diagnosis?.diagnosis?.pathogen_type} &bull; AI Confidence: {scanResult.diagnosis?.diagnosis?.confidence}%
                  </div>

                  <div style={{ fontSize: '0.84rem', color: '#333', lineHeight: 1.5 }}>
                    <strong>Symptoms Identified:</strong> {scanResult.diagnosis?.diagnosis?.symptoms_identified || scanResult.diagnosis?.diagnosis?.symptoms}
                  </div>

                  <div style={{ marginTop: 8, fontSize: '0.82rem', background: '#e8f5e9', padding: '8px 10px', borderRadius: 6, color: '#1b5e20' }}>
                    <strong>Recommended Organic Remedy:</strong> {scanResult.diagnosis?.diagnosis?.organic_treatment}
                  </div>

                  <div style={{ marginTop: 6, fontSize: '0.82rem', background: '#fff3e0', padding: '8px 10px', borderRadius: 6, color: '#e65100' }}>
                    <strong>Containment Guidelines:</strong> {scanResult.diagnosis?.diagnosis?.chemical_guidelines}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setShowScanModal(false); setScanResult(null); }}
                    className="btn btn-primary"
                    style={{ background: '#2e7d32' }}
                  >
                    Done & View on Radar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
