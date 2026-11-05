import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { Scale, CheckCircle2, TrendingUp, Droplets, Clock, Users, ShieldAlert, ArrowRight } from 'lucide-react';

export default function CropComparisonPage() {
  const { t } = useApp();
  const [acres, setAcres] = useState(1);
  const [selectedCrops, setSelectedCrops] = useState(['Tomatoes', 'Chillies', 'Beans']);
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(false);

  const availableCrops = ['Tomatoes', 'Chillies', 'Beans', 'Rice', 'Wheat'];

  const toggleCrop = (cropName) => {
    if (selectedCrops.includes(cropName)) {
      if (selectedCrops.length > 1) {
        setSelectedCrops(selectedCrops.filter(c => c !== cropName));
      }
    } else {
      if (selectedCrops.length < 3) {
        setSelectedCrops([...selectedCrops, cropName]);
      } else {
        alert('You can compare up to 3 crops at a time.');
      }
    }
  };

  const handleCompare = async () => {
    try {
      setLoading(true);
      const res = await apiClient.post('/crop-comparison', {
        acres: parseFloat(acres) || 1,
        crops: selectedCrops
      });
      if (res.success && res.data) {
        setComparisonData(res.data.comparison || []);
      }
    } catch (err) {
      console.error('Error fetching crop comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCompare();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="card" style={{ borderTop: '4px solid #059669' }}>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Scale size={24} color="#059669" /> {t.comparison.title}
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {t.comparison.subtitle}
        </p>

        {/* Inputs */}
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ maxWidth: '280px' }}>
            <label className="form-label">{t.comparison.acresLabel}</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={acres}
              onChange={(e) => setAcres(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">{t.comparison.selectCrops}</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {availableCrops.map(crop => {
                const isSelected = selectedCrops.includes(crop);
                return (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => toggleCrop(crop)}
                    className={isSelected ? 'btn-primary' : 'btn-outline'}
                    style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem', borderRadius: '20px' }}
                  >
                    {isSelected && <CheckCircle2 size={14} style={{ marginRight: '4px' }} />}
                    {crop}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <button
              onClick={handleCompare}
              disabled={loading}
              className="btn-primary"
              style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}
            >
              {loading ? 'Evaluating Agricultural Benchmarks...' : t.comparison.compareBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Cards / Table */}
      {comparisonData.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
          gap: '1.25rem'
        }}>
          {comparisonData.map((crop, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                borderTop: `4px solid ${idx === 0 ? '#10b981' : idx === 1 ? '#f59e0b' : '#3b82f6'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                marginBottom: 0
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                    {crop.crop_name}
                  </h3>
                  <span className="badge badge-success">For {crop.acres} Acre(s)</span>
                </div>

                <div style={{
                  background: '#f0fdf4',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--primary-green)', fontWeight: 700 }}>
                    {t.comparison.netProfit}
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-green)' }}>
                    {crop.potential_net_profit}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Gross: {crop.potential_gross_revenue}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t.comparison.inputCost}:</span>
                    <strong>{crop.estimated_input_cost}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t.comparison.laborDays}:</span>
                    <strong>{crop.estimated_labor_days}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t.comparison.duration}:</span>
                    <strong>{crop.duration}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t.comparison.waterNeed}:</span>
                    <strong>{crop.water_requirement}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t.comparison.expectedYield}:</span>
                    <strong>{crop.expected_yield_range}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t.comparison.mandiPrice}:</span>
                    <strong style={{ fontSize: '0.8rem' }}>{crop.mandi_price_range}</strong>
                  </div>

                  <div style={{ marginTop: '0.4rem', background: '#fffbeb', padding: '0.6rem', borderRadius: '8px', fontSize: '0.78rem' }}>
                    <strong style={{ color: '#92400e', display: 'block', marginBottom: '2px' }}>
                      {t.comparison.weatherRisks}:
                    </strong>
                    <span style={{ color: '#78350f' }}>{crop.weather_risks}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>Agronomic Summary:</strong> {crop.recommendation_notes}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Source Citation */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Based on ICAR Cost-of-Cultivation Studies, APMC Mandi Historical Series, and Agricultural University Crop Economics Handbooks.
      </div>
    </div>
  );
}
