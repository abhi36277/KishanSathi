import React from 'react';
import { useApp } from '../context/AppContext';
import { CloudRain, Wind, Droplets, Thermometer, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function WeatherCard({ weather, loading }) {
  const { t } = useApp();

  if (loading) {
    return (
      <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Fetching live agrometeorological data...</div>
      </div>
    );
  }

  if (!weather || !weather.current) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--warning-amber)' }}>
        <p style={{ fontWeight: 600 }}>Weather service currently offline</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Regional seasonal baseline is being utilized for agronomic rules.
        </p>
      </div>
    );
  }

  const { current, forecast, advisory, source, fetchedAt, isFallback } = weather;
  const todayForecast = forecast?.[0] || {};

  return (
    <div className="card" style={{ borderTop: '4px solid var(--primary-green)' }}>
      {/* Header with Source & Timestamp */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-green)' }}>
            {t.weather.title}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Source: {source} {fetchedAt && `• Fetched ${new Date(fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        {isFallback && (
          <span className="badge badge-medium">Offline Fallback</span>
        )}
      </div>

      {/* Main Meteorological Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div style={{ background: '#f4faf5', padding: '0.75rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <Thermometer size={16} />
            <span>{t.weather.currentTemp}</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--text-dark)' }}>
            {current.temperature ?? '--'}°C
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary-green)', fontWeight: 600 }}>
            {current.condition}
          </div>
        </div>

        <div style={{ background: '#f4faf5', padding: '0.75rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <Droplets size={16} />
            <span>{t.weather.humidity}</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--text-dark)' }}>
            {current.humidity ?? '--'}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Relative RH</div>
        </div>

        <div style={{ background: '#f4faf5', padding: '0.75rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <CloudRain size={16} />
            <span>{t.weather.rainChance}</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--text-dark)' }}>
            {todayForecast.precipitation_probability ?? 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {todayForecast.rain_sum ? `${todayForecast.rain_sum} mm rain` : 'No rain predicted'}
          </div>
        </div>

        <div style={{ background: '#f4faf5', padding: '0.75rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <Wind size={16} />
            <span>{t.weather.windSpeed}</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--text-dark)' }}>
            {current.wind_speed ?? '--'} <span style={{ fontSize: '0.85rem' }}>km/h</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Surface Velocity</div>
        </div>
      </div>

      {/* Grounded Agricultural Safety Advisory */}
      {advisory && (
        <div style={{
          background: '#fffbeb',
          borderLeft: '4px solid #f59e0b',
          borderRadius: '0 8px 8px 0',
          padding: '0.75rem 1rem',
          fontSize: '0.86rem',
          display: 'flex',
          gap: '0.6rem',
          alignItems: 'flex-start'
        }}>
          <ShieldAlert size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#92400e', display: 'block', marginBottom: '2px' }}>
              {t.weather.advisoryTitle}
            </strong>
            <span style={{ color: '#78350f' }}>{advisory}</span>
          </div>
        </div>
      )}
    </div>
  );
}
