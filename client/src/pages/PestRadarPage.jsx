import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { Radar, AlertTriangle, ShieldAlert, Radio, MapPin, Send, RefreshCw, CheckCircle2, CloudRain } from 'lucide-react';

export default function PestRadarPage() {
  const { farmer, activeCrop } = useApp();

  const [loading, setLoading] = useState(true);
  const [radarData, setRadarData] = useState(null);
  const [error, setError] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');

  // Report Form state
  const [reportPestName, setReportPestName] = useState('Stem Borer / Leaf Folder');
  const [reportCrop, setReportCrop] = useState(activeCrop?.crop_name || 'Rice (Paddy)');
  const [reportSeverity, setReportSeverity] = useState('High');
  const [reportMessage, setReportMessage] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchRadar = async () => {
    try {
      setLoading(true);
      setError('');
      const lat = farmer?.latitude || 12.5238;
      const lon = farmer?.longitude || 76.8967;
      const res = await apiClient.get(`/pest-radar?lat=${lat}&lon=${lon}&farmerId=${farmer?.id || ''}`);
      if (res.success && res.data) {
        setRadarData(res.data);
      } else {
        setError(res.error || 'Failed to load pest radar');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with pest radar service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadar();
  }, [farmer?.latitude, farmer?.longitude]);

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
        latitude: farmer?.latitude || 12.5238,
        longitude: farmer?.longitude || 76.8967,
        locationName: farmer?.district ? `${farmer.district}, ${farmer.state}` : 'Local Fields',
        message: reportMessage || `Pest alert: ${reportPestName} symptoms noticed on ${reportCrop}.`
      });

      if (res.success) {
        setReportSuccess('Pest outbreak broadcast successfully to all farmers within 50 km!');
        setShowReportModal(false);
        setReportMessage('');
        fetchRadar();
        setTimeout(() => setReportSuccess(''), 6000);
      }
    } catch (err) {
      alert('Failed to broadcast report: ' + err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '20px auto', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
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
              Nearby Pest Radar & Outbreak Map
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
            Separate ML Geospatial Radar: Micro-climate pest incubation scoring & GPS proximity alerts
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowReportModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', background: '#c62828', borderColor: '#b71c1c' }}
          >
            <Radio size={16} /> Broadcast Outbreak Alert
          </button>
          <button
            onClick={fetchRadar}
            className="btn btn-secondary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh Radar
          </button>
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

      {/* Climate Risk Banner */}
      {radarData && (
        <div className="card" style={{ padding: 16, marginBottom: 20, background: '#fff8e1', borderLeft: '5px solid #ff8f00' }}>
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
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
          <RefreshCw size={32} className="spin" style={{ color: '#c62828', marginBottom: 12 }} />
          <div>Scanning regional coordinates and calculating proximity vectors...</div>
        </div>
      ) : radarData ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {/* Radar Screen / Visual Map */}
          <div className="card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#333' }}>
                Interactive Radar (Radius: {radarData.radar_coverage_km} km)
              </div>
              <span style={{ fontSize: '0.75rem', background: '#ffebee', color: '#c62828', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                {radarData.active_threats_count} Active Outbreaks
              </span>
            </div>

            {/* Radar Circular Visual Canvas */}
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
              }} title="Your Farm Center" />

              {/* Range labels */}
              <span style={{ position: 'absolute', top: 6, left: '52%', fontSize: '0.65rem', color: '#81c784' }}>50km N</span>
              <span style={{ position: 'absolute', top: '32%', left: '52%', fontSize: '0.6rem', color: '#81c784' }}>25km</span>
              <span style={{ position: 'absolute', top: '44%', left: '52%', fontSize: '0.6rem', color: '#81c784' }}>10km</span>

              {/* Threat Nodes */}
              {radarData.outbreak_nodes.map((node, i) => (
                <div
                  key={node.id || i}
                  style={{
                    position: 'absolute',
                    top: `${node.radar_position.y}%`,
                    left: `${node.radar_position.x}%`,
                    transform: 'translate(-50%, -50%)',
                    width: node.threat_level === 'Critical' ? 16 : 12,
                    height: node.threat_level === 'Critical' ? 16 : 12,
                    borderRadius: '50%',
                    background: node.threat_level === 'Critical' ? '#ff1744' : node.threat_level === 'High' ? '#ff9100' : '#ffd600',
                    boxShadow: `0 0 8px ${node.threat_level === 'Critical' ? '#ff1744' : '#ff9100'}`,
                    cursor: 'pointer',
                    zIndex: 5
                  }}
                  title={`${node.pest_or_disease} (${node.distance_km} km away)`}
                />
              ))}
            </div>

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
              Active Threat Details & Defensive Measures
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {radarData.outbreak_nodes.map((node, i) => (
                <div
                  key={node.id || i}
                  className="card"
                  style={{
                    padding: 16,
                    borderLeft: node.threat_level === 'Critical' ? '5px solid #ff1744' : node.threat_level === 'High' ? '5px solid #ff9100' : '5px solid #fbc02d'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 2px 0', color: '#b71c1c' }}>
                        {node.pest_or_disease}
                      </h4>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        Affected Crop: <strong>{node.crop_affected}</strong> • Location: <strong>{node.location_name}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: node.threat_level === 'Critical' ? '#ffebee' : '#fff3e0',
                        color: node.threat_level === 'Critical' ? '#c62828' : '#e65100'
                      }}>
                        {node.distance_km} km away
                      </span>
                    </div>
                  </div>

                  <div style={{ background: '#fafafa', padding: 10, borderRadius: 6, fontSize: '0.82rem', color: '#444', marginTop: 8 }}>
                    <strong>Recommended Defensive Measure:</strong> {node.protective_action}
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
              This will notify all registered farmers within 50 km to inspect their fields immediately.
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
    </div>
  );
}
