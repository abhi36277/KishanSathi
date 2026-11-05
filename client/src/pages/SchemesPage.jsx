import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { Landmark, Calendar, ExternalLink, ShieldCheck, CheckCircle2, Clock, Filter, Sparkles, Check } from 'lucide-react';

export default function SchemesPage() {
  const { farmer } = useApp();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [landFilter, setLandFilter] = useState('all');

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/schemes');
        if (res.success && res.data) {
          setSchemes(res.data.schemes || []);
        }
      } catch (err) {
        console.error('Error loading schemes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  const categories = ['All', 'Direct Income Support', 'Crop Insurance', 'Subsidies & Equipment', 'Soil & Nutrient'];

  const filteredSchemes = schemes.filter(scheme => {
    if (selectedCategory !== 'All' && !scheme.category.toLowerCase().includes(selectedCategory.toLowerCase().slice(0, 6))) {
      return false;
    }
    if (landFilter === 'small' && scheme.eligibility.toLowerCase().includes('large')) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: 960, margin: '20px auto', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: '#ede7f6',
            color: '#512da8',
            padding: '6px 10px',
            borderRadius: 8,
            display: 'inline-flex'
          }}>
            <Landmark size={22} />
          </span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#311b92' }}>
            Government Agricultural Schemes Hub
          </h1>
        </div>
        <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
          Hand-verified Central & State government subsidies, application deadlines, and direct official portal links
        </p>
      </div>

      {/* Interactive Eligibility & Category Filter */}
      <div className="card" style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', fontWeight: 700, color: '#333' }}>
            <Filter size={16} /> Filter by Category:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
            <span>Farm Size Eligibility:</span>
            <select
              value={landFilter}
              onChange={(e) => setLandFilter(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.8rem' }}
            >
              <option value="all">All Farm Sizes</option>
              <option value="small">Small & Marginal (&lt; 5 Acres)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                fontSize: '0.8rem',
                padding: '6px 12px',
                borderRadius: 20,
                border: selectedCategory === cat ? '1px solid #512da8' : '1px solid #e0e0e0',
                background: selectedCategory === cat ? '#ede7f6' : '#fff',
                color: selectedCategory === cat ? '#311b92' : '#555',
                cursor: 'pointer',
                fontWeight: selectedCategory === cat ? 700 : 500
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          Loading verified government agricultural schemes...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredSchemes.map(scheme => (
            <div
              key={scheme.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 20,
                borderTop: '4px solid #512da8'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#1b5e20' }}>
                    {scheme.name}
                  </h3>
                  <span style={{ fontSize: '0.72rem', background: '#ede7f6', color: '#512da8', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                    {scheme.category}
                  </span>
                </div>

                {/* Last Date Notification Badge */}
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  marginBottom: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.82rem',
                  color: '#92400e'
                }}>
                  <Clock size={15} color="#b45309" />
                  <span><strong>Next Application Deadline:</strong> {scheme.last_date}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div>
                    <strong style={{ color: '#222' }}>Financial Benefits:</strong>
                    <p style={{ color: '#4b5563', margin: '2px 0 0 0', lineHeight: 1.4 }}>{scheme.benefits}</p>
                  </div>

                  <div>
                    <strong style={{ color: '#222' }}>Eligibility Criteria:</strong>
                    <p style={{ color: '#4b5563', margin: '2px 0 0 0', lineHeight: 1.4 }}>{scheme.eligibility}</p>
                  </div>

                  <div>
                    <strong style={{ color: '#222' }}>Required Documents:</strong>
                    <ul style={{ paddingLeft: '1.2rem', margin: '3px 0 0 0', color: '#4b5563' }}>
                      {scheme.documents_required?.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Direct Official Portal Link */}
              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #f0f0f0' }}>
                <a
                  href={scheme.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    width: '100%',
                    padding: '0.55rem',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <span>Apply on Official Portal</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
