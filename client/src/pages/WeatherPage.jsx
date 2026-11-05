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
  AlertCircle,
  MapPin,
  Search,
  Compass
} from 'lucide-react';

export default function WeatherPage() {
  const { farmer, t } = useApp();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // All-India Location State
  const [locationInput, setLocationInput] = useState(farmer?.pincode || farmer?.district || '571401');
  const [locationSearching, setLocationSearching] = useState(false);
  const [activeLoc, setActiveLoc] = useState({
    city: farmer?.village || 'Mandya',
    district: farmer?.district || 'Mandya',
    state: farmer?.state || 'Karnataka',
    pincode: farmer?.pincode || '571401',
    latitude: farmer?.latitude || 12.5238,
    longitude: farmer?.longitude || 76.8967,
    place_name: farmer?.district ? `${farmer.district}, ${farmer.state}` : 'Mandya, Karnataka, India'
  });

  const fetchWeather = async (lat, lon) => {
    const useLat = lat ?? activeLoc.latitude;
    const useLon = lon ?? activeLoc.longitude;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/weather?lat=${useLat}&lon=${useLon}`);
      if (res && res.success && res.data) {
        setWeather(res.data);
      } else {
        setError(res?.error || 'Failed to fetch weather forecast');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch weather forecast');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(activeLoc.latitude, activeLoc.longitude);
  }, [activeLoc.latitude, activeLoc.longitude]);

  const handleLocationSearch = async (e) => {
    if (e) e.preventDefault();
    if (!locationInput.trim()) return;

    try {
      setLocationSearching(true);
      setError(null);
      const isPin = /^\d{6}$/.test(locationInput.trim());
      const queryParam = isPin ? `pincode=${encodeURIComponent(locationInput.trim())}` : `query=${encodeURIComponent(locationInput.trim())}`;
      const res = await apiClient.get(`/location/lookup?${queryParam}`);

      if (res && res.success && res.data) {
        const d = res.data;
        setActiveLoc({
          city: d.city || locationInput,
          district: d.district || '',
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
      setError('Could not locate that pincode or city. Please check spelling.');
    } finally {
      setLocationSearching(false);
    }
  };

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
            setActiveLoc({
              city: d.city || 'Detected Location',
              district: d.district || '',
              state: d.state || 'India',
              pincode: d.pincode || '',
              latitude,
              longitude,
              place_name: d.place_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
            setLocationInput(d.pincode || d.city || '');
          }
        } catch (e) {
          setActiveLoc(prev => ({ ...prev, latitude, longitude }));
        } finally {
          setLocationSearching(false);
        }
      },
      (err) => {
        alert('Could not obtain GPS location: ' + err.message);
        setLocationSearching(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header & All-India Location Selector */}
      <div className="card" style={{ borderTop: '4px solid #0284c7' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 4px 0' }}>
              <CloudSun size={24} color="#0284c7" /> Live Agro-Weather & Telemetry
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Location: <strong>{activeLoc.city ? `${activeLoc.city}, ` : ''}{activeLoc.district}, {activeLoc.state}</strong> {activeLoc.pincode ? `(PIN: ${activeLoc.pincode})` : ''} • ({activeLoc.latitude.toFixed(2)}°N, {activeLoc.longitude.toFixed(2)}°E)
            </p>
          </div>

          <button
            onClick={() => fetchWeather(activeLoc.latitude, activeLoc.longitude)}
            disabled={loading}
            className="btn-outline"
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Weather
          </button>
        </div>

        {/* Pincode & City Search Bar across India */}
        <form onSubmit={handleLocationSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', background: '#f0f9ff', padding: 10, borderRadius: 8, border: '1px solid #bae6fd' }}>
          <MapPin size={16} style={{ color: '#0284c7' }} />
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="Type any PIN code (e.g. 571401, 110001, 141001) or City/Town across India..."
            style={{ flex: '1 1 240px', padding: '6px 10px', borderRadius: 6, border: '1px solid #7dd3fc', fontSize: '0.85rem' }}
          />
          <button
            type="submit"
            disabled={locationSearching}
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.82rem', background: '#0284c7', borderColor: '#0284c7' }}
          >
            <Search size={13} /> {locationSearching ? 'Locating...' : 'Check Weather'}
          </button>
          <button
            type="button"
            onClick={handleGPSDetect}
            disabled={locationSearching}
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.82rem' }}
          >
            <Compass size={13} /> My GPS
          </button>
        </form>

        {weather && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>Source: <strong>{weather.source} (Open-Meteo High-Resolution Model)</strong></span>
            {weather.fetchedAt && (
              <span>Last Retrieved: <strong>{new Date(weather.fetchedAt).toLocaleTimeString()}</strong></span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
          <p>Retrieving high-precision atmospheric telemetry...</p>
        </div>
      ) : weather ? (
        <>
          {/* Current Conditions Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: '#e0f2fe', borderRadius: '10px', color: '#0369a1' }}>
                <Thermometer size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Temperature</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{weather.current?.temperature}°C</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Condition: {weather.current?.condition}</span>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '10px', color: '#15803d' }}>
                <Droplets size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Relative Humidity</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{weather.current?.humidity}%</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Foliar transpiration rate</span>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '10px', color: '#b45309' }}>
                <Wind size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Wind Speed</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{weather.current?.wind_speed} km/h</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Spray drift safety limit: 15 km/h</span>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: '#fee2e2', borderRadius: '10px', color: '#b91c1c' }}>
                <CloudRain size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Precipitation</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{weather.current?.precipitation || 0} mm</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Soil moisture saturation</span>
              </div>
            </div>
          </div>

          {/* Agronomic Spray & Irrigation Advisory */}
          {weather.advisory && (
            <div className="card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ShieldAlert size={18} /> Agronomic Spray & Irrigation Advisory ({activeLoc.city})
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>
                {weather.advisory}
              </p>
            </div>
          )}

          {/* 7-Day Precision Forecast */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} /> 7-Day Agricultural Forecast for {activeLoc.city || activeLoc.district}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {weather.forecast?.map((day, idx) => (
                <div key={idx} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <span>{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span style={{ color: '#0284c7' }}>{day.condition}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span>Temp: {day.min_temp}°C - {day.max_temp}°C</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Rain Prob: {day.precipitation_probability}%</span>
                    <span>Rain: {day.precipitation_sum} mm</span>
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
