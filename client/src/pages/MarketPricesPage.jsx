import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { TrendingUp, TrendingDown, Minus, Truck, MapPin, Calendar, DollarSign, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';

export default function MarketPricesPage() {
  const { farmer, activeCrop } = useApp();
  const navigate = useNavigate();

  const [state, setState] = useState(farmer?.state || 'Karnataka');
  const [crop, setCrop] = useState(activeCrop?.crop_name || 'Rice (Paddy)');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get(`/prices/mandi?state=${encodeURIComponent(state)}&crop=${encodeURIComponent(crop)}`);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to fetch mandi prices');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to market price service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [state, crop]);

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
              <DollarSign size={22} />
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#1b5e20' }}>
              APMC Mandi Prices & 7-Day ML Forecast
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
            Separate ML Price Trend Model: Real AGMARKNET prices, arrival volumes & net profit rankings
          </p>
        </div>

        <button
          onClick={fetchPrices}
          className="btn btn-secondary"
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh Prices
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
            State Market
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
          >
            <option value="Karnataka">Karnataka</option>
            <option value="Punjab">Punjab</option>
            <option value="Haryana">Haryana</option>
            <option value="Maharashtra">Maharashtra</option>
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
            Crop Variety
          </label>
          <select
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
          >
            <option value="Rice (Paddy)">Rice / Paddy (ಭತ್ತ / धान)</option>
            <option value="Wheat">Wheat (ಗೋಧಿ / गेहूं)</option>
            <option value="Maize">Maize (ಮೆಕ್ಕೆಜೋಳ / मक्का)</option>
            <option value="Tomatoes">Tomatoes (ಟೊಮ್ಯಾಟೊ / टमाटर)</option>
            <option value="Chillies">Chillies (ಮೆಣಸಿನಕಾಯಿ / मिर्च)</option>
            <option value="Onions">Onions (ಈರುಳ್ಳಿ / प्याज)</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#ffebee', color: '#c62828', borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
          <RefreshCw size={32} className="spin" style={{ color: '#2e7d32', marginBottom: 12 }} />
          <div>Retrieving live APMC prices and calculating 7-day predictive trends...</div>
        </div>
      ) : data?.selected_summary ? (
        <div>
          {/* Main Price Card */}
          <div className="card" style={{ padding: 22, marginBottom: 20, borderLeft: '5px solid #2e7d32' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>
                  Primary Mandi Yard • {data.selected_summary.state}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 2px 0', color: '#1b5e20' }}>
                  {data.selected_summary.mandi}
                </h2>
                <div style={{ fontSize: '0.88rem', color: '#444' }}>
                  Crop: <strong>{data.selected_summary.crop}</strong> | Daily Arrival: <strong>{data.selected_summary.arrival_volume}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#2e7d32' }}>
                  {data.selected_summary.current_modal_price}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#777' }}>
                  Spread: {data.selected_summary.min_max_spread}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 6,
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: data.selected_summary.trend === 'Bullish' ? '#e8f5e9' : data.selected_summary.trend === 'Bearish' ? '#ffebee' : '#ede7f6',
                  color: data.selected_summary.trend === 'Bullish' ? '#2e7d32' : data.selected_summary.trend === 'Bearish' ? '#c62828' : '#512da8'
                }}>
                  {data.selected_summary.trend === 'Bullish' ? <TrendingUp size={14} /> : data.selected_summary.trend === 'Bearish' ? <TrendingDown size={14} /> : <Minus size={14} />}
                  {data.selected_summary.trend} Trend
                </div>
              </div>
            </div>

            {/* AI Action Advisory */}
            <div style={{ marginTop: 16, background: '#f9fbf9', padding: '12px 14px', borderRadius: 8, border: '1px solid #e8f5e9' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2e7d32', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> AI Recommendation for Farmer:
              </div>
              <div style={{ fontSize: '0.88rem', color: '#333' }}>
                {data.selected_summary.recommendation}
              </div>
            </div>
          </div>

          {/* 7-Day ML Forecast Carousel / Grid */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#333', marginBottom: 12 }}>
              7-Day ML Price Forecast (Predicted Modal Rate)
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))',
              gap: 10
            }}>
              {data.forecast_7_days.map((fc, i) => (
                <div key={i} className="card" style={{ padding: 12, textAlign: 'center', background: i === 0 ? '#f1f8e9' : '#fff' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#777' }}>
                    {fc.day}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#999', marginBottom: 6 }}>
                    {fc.date}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2e7d32' }}>
                    ₹{fc.predicted_modal}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#888', marginTop: 4 }}>
                    {fc.expected_range}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best Mandi Net Realization Table & Transport Pooling */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#333' }}>
                  Compare Nearby Mandis & Net Realization
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#777' }}>
                  Ranked by actual pocket money left after deducting distance freight costs
                </p>
              </div>

              <button
                onClick={() => navigate('/transport')}
                className="btn btn-primary"
                style={{ fontSize: '0.82rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Truck size={16} /> Pool Transport to Mandi <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '10px 12px' }}>Mandi Yard</th>
                    <th style={{ padding: '10px 12px' }}>Distance</th>
                    <th style={{ padding: '10px 12px' }}>Modal Price</th>
                    <th style={{ padding: '10px 12px' }}>Freight Est.</th>
                    <th style={{ padding: '10px 12px' }}>Net Pocket Realization</th>
                    <th style={{ padding: '10px 12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.all_mandis.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee', background: idx === 0 ? '#f9fbf9' : '#fff' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                        {m.mandi_name} {idx === 0 && <span style={{ fontSize: '0.7rem', color: '#2e7d32', background: '#e8f5e9', padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>Best Profit</span>}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#666' }}>{m.distance_km} km</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>₹{m.modal_price}/qtl</td>
                      <td style={{ padding: '10px 12px', color: '#c62828' }}>- {m.freight_cost_est_per_qtl}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 800, color: '#2e7d32' }}>
                        {m.net_realized_price_per_qtl} / qtl
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          onClick={() => navigate('/transport')}
                          style={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            background: '#e8f5e9',
                            color: '#2e7d32',
                            border: '1px solid #c8e6c9',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Find Pool
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: 14 }}>
              Source: {data.official_source} • Time: {new Date(data.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
