import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { Truck, Plus, Calendar, MapPin, Phone, Users, Weight } from 'lucide-react';

export default function TransportPoolPage() {
  const { farmer, t } = useApp();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newPool, setNewPool] = useState({
    origin: '',
    destination_mandi: 'APMC Yard Mandya',
    departure_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    total_capacity_kg: '2000',
    available_capacity_kg: '1000',
    cost_per_kg: '1.5',
    vehicle_type: 'Tata Ace (Chota Hathi)',
    contact_phone: ''
  });

  const fetchPools = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/transport-pools');
      if (res.success && res.data) {
        setPools(res.data);
      }
    } catch (err) {
      console.error('Error fetching transport pools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
    if (farmer) {
      setNewPool(prev => ({
        ...prev,
        origin: `${farmer.village || 'Village'}, ${farmer.district}`,
        contact_phone: farmer.phone || '+91 9876543210'
      }));
    }
  }, [farmer]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!farmer) return;
    try {
      const res = await apiClient.post('/transport-pools', {
        farmerId: farmer.id,
        ...newPool
      });
      if (res.success) {
        setShowAdd(false);
        fetchPools();
      }
    } catch (err) {
      alert(`Could not create pool: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="card" style={{ borderTop: '4px solid #0891b2' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={24} color="#0891b2" /> Transport & Freight Pooling for Farmers
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Share tractor trolleys and tempos to APMC Mandis to cut harvest transport costs in half
            </p>
          </div>

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="btn-primary"
            style={{ fontSize: '0.85rem', background: '#0891b2' }}
          >
            <Plus size={16} /> Offer Vehicle Space
          </button>
        </div>
      </div>

      {/* Offer Form */}
      {showAdd && (
        <div className="card" style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#0f766e' }}>
            List Your Shared Trip to Mandi
          </h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Pickup Location</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newPool.origin}
                  onChange={(e) => setNewPool({ ...newPool, origin: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Destination Mandi</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newPool.destination_mandi}
                  onChange={(e) => setNewPool({ ...newPool, destination_mandi: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Departure Date</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={newPool.departure_date}
                  onChange={(e) => setNewPool({ ...newPool, departure_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Available Capacity (Kg)</label>
                <input
                  type="number"
                  required
                  className="form-input"
                  value={newPool.available_capacity_kg}
                  onChange={(e) => setNewPool({ ...newPool, available_capacity_kg: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cost per Kg (₹)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="form-input"
                  value={newPool.cost_per_kg}
                  onChange={(e) => setNewPool({ ...newPool, cost_per_kg: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPool.vehicle_type}
                  onChange={(e) => setNewPool({ ...newPool, vehicle_type: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ background: '#0891b2', fontSize: '0.85rem' }}>
                Publish Shared Trip
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-outline" style={{ fontSize: '0.85rem' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Available Shared Rides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {pools.map(pool => (
          <div key={pool.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginBottom: 0 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span className="badge badge-success" style={{ background: '#ccfbf1', color: '#0f766e' }}>
                  {pool.vehicle_type}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0891b2' }}>
                  ₹{pool.cost_per_kg} / kg
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.4rem' }}>
                {pool.origin} ➔ {pool.destination_mandi}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={15} />
                  <span>Departure: <strong>{pool.departure_date}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Weight size={15} />
                  <span>Available Space: <strong>{pool.available_capacity_kg} kg</strong> (Total {pool.total_capacity_kg} kg)</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Driver Contact: {pool.contact_phone}
              </span>
              <a
                href={`tel:${pool.contact_phone}`}
                className="btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: '#0891b2' }}
              >
                <Phone size={13} /> Call to Book Space
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
