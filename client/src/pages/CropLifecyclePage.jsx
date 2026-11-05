import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { Sprout, Droplets, FlaskConical, Calendar, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export default function CropLifecyclePage() {
  const { farmer, activeCrop } = useApp();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchLifecycle = async () => {
    if (!farmer?.id) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get(`/crop-lifecycle/${farmer.id}`);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to calculate crop lifecycle');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to crop lifecycle service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLifecycle();
  }, [farmer?.id, activeCrop?.id]);

  return (
    <div style={{ maxWidth: 960, margin: '20px auto', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: '#e8f5e9',
              color: '#2e7d32',
              padding: '6px 10px',
              borderRadius: 8,
              display: 'inline-flex'
            }}>
              <Sprout size={22} />
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#1b5e20' }}>
              Full Crop Lifecycle: Sowing, Irrigation & Fertilizer
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
            Separate ML Agronomic Model: Day-by-day stage tracking from land prep to harvest
          </p>
        </div>

        <button
          onClick={fetchLifecycle}
          className="btn btn-secondary"
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh Lifecycle
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#ffebee', color: '#c62828', borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
          <RefreshCw size={32} className="spin" style={{ color: '#2e7d32', marginBottom: 12 }} />
          <div>Computing crop growth degree days and agronomic timeline...</div>
        </div>
      ) : data?.lifecycle ? (
        <div>
          {/* Overview Progress Card */}
          <div className="card" style={{ padding: 22, marginBottom: 20, borderTop: '4px solid #2e7d32' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>Active Crop</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1b5e20' }}>
                  {data.lifecycle.crop_name}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#666' }}>
                  Sown on: <strong>{data.lifecycle.sowing_date}</strong>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>Crop Age</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2e7d32' }}>
                  Day {data.lifecycle.days_after_sowing} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#666' }}>of {data.lifecycle.total_duration_days}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#666' }}>
                  {data.lifecycle.lifecycle_progress_percent}% of total duration
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>Current Active Stage</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#e65100' }}>
                  {data.lifecycle.current_stage.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#666' }}>
                  {data.lifecycle.current_stage.day_range}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ background: '#e0e0e0', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{
                background: 'linear-gradient(90deg, #66bb6a, #2e7d32)',
                width: `${data.lifecycle.lifecycle_progress_percent}%`,
                height: '100%',
                transition: 'width 0.5s ease'
              }} />
            </div>

            {/* Next Urgent Milestones */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              <div style={{ background: '#e0f2fe', padding: 12, borderRadius: 8, borderLeft: '4px solid #0284c7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>
                  <Droplets size={16} /> Next Irrigation Target:
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0c4a6e' }}>
                  {data.lifecycle.upcoming_milestones.next_irrigation_due}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#0369a1', marginTop: 2 }}>
                  {data.lifecycle.upcoming_milestones.irrigation_guidance}
                </div>
              </div>

              <div style={{ background: '#fef3c7', padding: 12, borderRadius: 8, borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#b45309', marginBottom: 4 }}>
                  <FlaskConical size={16} /> Next Fertilizer Target:
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#78350f' }}>
                  {data.lifecycle.upcoming_milestones.next_fertilizer_target}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#92400e', marginTop: 2 }}>
                  Active Dose: {data.lifecycle.upcoming_milestones.active_fertilizer_dose}
                </div>
              </div>
            </div>
          </div>

          {/* Sowing Specifications Card */}
          <div className="card" style={{ padding: 18, marginBottom: 20, background: '#fafafa' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', margin: '0 0 10px 0' }}>
              🌱 Sowing & Seed Specifications (From Start)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, fontSize: '0.85rem' }}>
              <div>
                <strong>Seed Treatment:</strong>
                <div style={{ color: '#555', marginTop: 2 }}>{data.lifecycle.sowing_specifications.seed_treatment}</div>
              </div>
              <div>
                <strong>Seed Rate / Spacing:</strong>
                <div style={{ color: '#555', marginTop: 2 }}>
                  Rate: {data.lifecycle.sowing_specifications.seed_rate}<br />
                  Spacing: {data.lifecycle.sowing_specifications.spacing}
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Lifecycle Stages Timeline */}
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#333', marginBottom: 14 }}>
            Stage-by-Stage Detailed Cultivation Protocols
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.lifecycle.full_stages.map((stg, i) => {
              const isCurrent = stg.status === 'CURRENT_ACTIVE';
              const isDone = stg.status === 'COMPLETED';

              return (
                <div
                  key={stg.id}
                  className="card"
                  style={{
                    padding: 18,
                    borderLeft: isCurrent ? '5px solid #2e7d32' : isDone ? '5px solid #81c784' : '5px solid #ccc',
                    background: isCurrent ? '#f9fbf9' : '#fff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: isCurrent ? '#2e7d32' : isDone ? '#e8f5e9' : '#f0f0f0',
                        color: isCurrent ? '#fff' : isDone ? '#2e7d32' : '#888',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        {isDone ? '✓' : i + 1}
                      </span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: isCurrent ? '#1b5e20' : '#333' }}>
                        {stg.name}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: '#666', background: '#eee', padding: '2px 8px', borderRadius: 4 }}>
                        Day {stg.day_start} - {stg.day_end}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: isCurrent ? '#e8f5e9' : isDone ? '#f1f8e9' : '#f5f5f5',
                      color: isCurrent ? '#2e7d32' : isDone ? '#558b2f' : '#777'
                    }}>
                      {isCurrent ? '● CURRENT STAGE' : isDone ? 'COMPLETED' : 'UPCOMING'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    {/* Irrigation Column */}
                    <div style={{ background: '#f0f9ff', padding: 12, borderRadius: 8, border: '1px solid #bae6fd' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>
                        <Droplets size={16} /> Irrigation Schedule (Criticality: {stg.irrigation_protocol.criticality}):
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#0c4a6e', marginBottom: 4 }}>
                        {stg.irrigation_protocol.water_depth}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#0284c7' }}>
                        💡 {stg.irrigation_protocol.advisory}
                      </div>
                    </div>

                    {/* Fertilizer Column */}
                    <div style={{ background: '#fefce8', padding: 12, borderRadius: 8, border: '1px solid #fef08a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#a16207', marginBottom: 6 }}>
                        <FlaskConical size={16} /> {stg.fertilizer_protocol.dose_title}:
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#713f12', marginBottom: 4 }}>
                        {stg.fertilizer_protocol.nutrients}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#854d0e' }}>
                        Method: {stg.fertilizer_protocol.method}
                      </div>
                      {stg.fertilizer_protocol.precaution && (
                        <div style={{ fontSize: '0.75rem', color: '#c2410c', marginTop: 4 }}>
                          ⚠️ Precaution: {stg.fertilizer_protocol.precaution}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tasks in stage */}
                  <div style={{ marginTop: 10, fontSize: '0.82rem', color: '#555' }}>
                    <strong>Key Field Activities:</strong> {stg.key_tasks.join(' • ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
