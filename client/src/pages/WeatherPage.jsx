import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { 
  CloudSun, 
  CloudRain, 
  Wind, 
  Droplets, 
  Thermometer, 
  ShieldAlert, 
  RefreshCw, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function WeatherPage() {
  const { farmer, t } = useApp();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    if (!farmer) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/weather?lat=${farmer.latitude}&lon=${farmer.longitude}`);
      if (res.success && res.data) {
        setWeather(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch weather forecast');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [farmer]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="card" style={{ borderTop: '4px solid #0284c7' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CloudSun size={24} color="#0284c7" /> {t.weather.title}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Location: {farmer?.village ? `${farmer.village}, ` : ''}{farmer?.district}, {farmer?.state} ({farmer?.latitude}°N, {farmer?.longitude}°E)
            </p>
          </div>

          <button
            onClick={fetchWeather}
            disabled={loading}
            className="btn-outline"
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {weather && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>Source: <strong>{weather.source}</strong></span>
            {weather.fetchedAt && (
              <span>Last Retrieved: <strong>{new Date(weather.fetchedAt).toLocaleString()}</strong></span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Retrieving real-time meteorology from Open-Meteo...
        </div>
      ) : error ? (
        <div className="card" style={{ borderLeft: '4px solid var(--danger-red)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger-red)', fontWeight: 700, marginBottom: '0.5rem' }}>
            <AlertCircle size={20} /> Connection Error
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-dark)', marginBottom: '1rem' }}>
            {error}
          </p>
          <button onClick={fetchWeather} className="btn-primary" style={{ fontSize: '0.85rem' }}>
            Retry Connection
          </button>
        </div>
      ) : weather ? (
        <>
          {/* Current Conditions Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0369a1', fontSize: '0.85rem', fontWeight: 600 }}>
                <Thermometer size={18} /> {t.weather.currentTemp}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0c4a6e', marginTop: '0.3rem' }}>
                {weather.current?.temperature}°C
              </div>
              <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 600 }}>
                {weather.current?.condition}
              </div>
            </div>

            <div className="card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-green)', fontSize: '0.85rem', fontWeight: 600 }}>
                <Droplets size={18} /> {t.weather.humidity}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-green)', marginTop: '0.3rem' }}>
                {weather.current?.humidity}%
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Relative Atmospheric Humidity
              </div>
            </div>

            <div className="card" style={{ background: '#faf5ff', borderColor: '#e9d5ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7e22ce', fontSize: '0.85rem', fontWeight: 600 }}>
                <Wind size={18} /> {t.weather.windSpeed}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#581c87', marginTop: '0.3rem' }}>
                {weather.current?.wind_speed} <span style={{ fontSize: '1rem' }}>km/h</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                10-Meter Wind Velocity
              </div>
            </div>

            <div className="card" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b45309', fontSize: '0.85rem', fontWeight: 600 }}>
                <CloudRain size={18} /> {t.weather.rainChance}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#78350f', marginTop: '0.3rem' }}>
                {weather.forecast?.[0]?.precipitation_probability ?? 0}%
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Precipitation Probability (24h)
              </div>
            </div>
          </div>

          {/* Agricultural Safety Advisory */}
          <div className="card" style={{ background: '#fffbeb', borderLeft: '5px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <ShieldAlert size={24} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#92400e', marginBottom: '0.3rem' }}>
                  {t.weather.advisoryTitle}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#78350f', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                  {weather.advisory}
                </p>
                <p style={{ fontSize: '0.78rem', color: '#b45309', fontStyle: 'italic' }}>
                  {t.weather.disclaimer}
                </p>
              </div>
            </div>
          </div>

          {/* 3-Day Forecast Table */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-dark)' }}>
              {t.weather.forecast3Day}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {weather.forecast?.map((day, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    padding: '1rem',
                    background: idx === 0 ? '#f6faf7' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      {idx === 0 ? 'Today' : new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                      {day.condition}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                    {day.temp_max}°C <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {day.temp_min}°C</span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span>Rain Probability: <strong>{day.precipitation_probability}%</strong></span>
                    <span>Total Rainfall: <strong>{day.rain_sum} mm</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
