import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { ShieldAlert, UploadCloud, CheckCircle2, AlertTriangle, Users, Sparkles, Send } from 'lucide-react';

export default function FieldMonitorPage() {
  const { farmer, activeCrop, t } = useApp();
  const [symptoms, setSymptoms] = useState('');
  const [broadcastAlert, setBroadcastAlert] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [photoSelected, setPhotoSelected] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!farmer) return;

    try {
      setAnalyzing(true);
      const res = await apiClient.post('/field-photo/analyze', {
        farmerId: farmer.id,
        crop_name: activeCrop?.crop_name || 'Rice',
        symptoms,
        image_path: 'field_canopy_upload.jpg',
        broadcastPestAlert: broadcastAlert
      });

      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (err) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="card" style={{ borderTop: '4px solid #e11d48' }}>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={24} color="#e11d48" /> {t.fieldMonitor.title}
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {t.fieldMonitor.subtitle}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Upload Form */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            {t.fieldMonitor.uploadTitle}
          </h3>

          <form onSubmit={handleAnalyze}>
            {/* Visual File Dropzone simulation */}
            <div
              onClick={() => setPhotoSelected(true)}
              style={{
                border: `2px dashed ${photoSelected ? 'var(--primary-green)' : '#cbd5e1'}`,
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
                background: photoSelected ? '#f0fdf4' : '#fafafa',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              <UploadCloud size={36} color={photoSelected ? 'var(--primary-green)' : '#94a3b8'} style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                {photoSelected ? '✓ Field Photo Attached (canopy_check.jpg)' : 'Click to Select or Take Field Photo'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                JPEG, PNG up to 10MB
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t.fieldMonitor.symptomsLabel}</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder={t.fieldMonitor.symptomsPlaceholder}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>

            {/* Community Alert Broadcast Toggle */}
            <div style={{
              background: '#fff1f2',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #fecdd3',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <input
                type="checkbox"
                id="alertToggle"
                checked={broadcastAlert}
                onChange={(e) => setBroadcastAlert(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#e11d48' }}
              />
              <label htmlFor="alertToggle" style={{ fontSize: '0.85rem', color: '#9f1239', fontWeight: 600, cursor: 'pointer' }}>
                {t.fieldMonitor.broadcastAlert} ({farmer?.district || 'Your District'})
              </label>
            </div>

            <button
              type="submit"
              disabled={analyzing}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', background: '#e11d48' }}
            >
              {analyzing ? (
                <span>Analyzing Crop Health & Symptoms...</span>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>{t.fieldMonitor.analyzeBtn}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            {t.fieldMonitor.observationTitle}
          </h3>

          {!result ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Upload a monthly field photo or enter observed symptoms to receive guided agronomic recommendations.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                background: result.report.is_pest_alert ? '#fff1f2' : '#f0fdf4',
                border: `1px solid ${result.report.is_pest_alert ? '#fecdd3' : '#bbf7d0'}`,
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  {result.report.is_pest_alert ? <AlertTriangle size={20} color="#e11d48" /> : <CheckCircle2 size={20} color="var(--primary-green)" />}
                  <strong style={{ fontSize: '1rem', color: result.report.is_pest_alert ? '#9f1239' : 'var(--primary-green)' }}>
                    {result.report.prediction}
                  </strong>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 }}>
                  {result.report.recommendations}
                </div>
              </div>

              {result.broadcastSummary && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '0.82rem',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Users size={16} />
                  <span>📢 <strong>Broadcast Sent:</strong> {result.broadcastSummary}</span>
                </div>
              )}

              <div style={{
                background: '#f8fafc',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)'
              }}>
                <strong>Important Notice:</strong> {result.disclaimer}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
