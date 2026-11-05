import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { Landmark, Calendar, ExternalLink, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export default function SchemesPage() {
  const { t } = useApp();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="card" style={{ borderTop: '4px solid #4f46e5' }}>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Landmark size={24} color="#4f46e5" /> {t.schemes.title}
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {t.schemes.subtitle}
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading verified government agricultural schemes...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {schemes.map(scheme => (
            <div
              key={scheme.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                marginBottom: 0
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-green)' }}>
                    {scheme.name}
                  </h3>
                  <span className="badge badge-medium" style={{ fontSize: '0.7rem' }}>
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
                  <span><strong>{t.schemes.lastDate}:</strong> {scheme.last_date}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div>
                    <strong style={{ color: 'var(--text-dark)' }}>{t.schemes.benefits}:</strong>
                    <p style={{ color: '#4b5563', marginTop: '2px', lineHeight: 1.4 }}>{scheme.benefits}</p>
                  </div>

                  <div>
                    <strong style={{ color: 'var(--text-dark)' }}>{t.schemes.eligibility}:</strong>
                    <p style={{ color: '#4b5563', marginTop: '2px', lineHeight: 1.4 }}>{scheme.eligibility}</p>
                  </div>

                  <div>
                    <strong style={{ color: 'var(--text-dark)' }}>{t.schemes.documents}:</strong>
                    <ul style={{ paddingLeft: '1.2rem', marginTop: '3px', color: '#4b5563' }}>
                      {scheme.documents_required?.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Verified: {scheme.last_reviewed}
                </span>

                <a
                  href={scheme.official_portal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
                >
                  <span>Apply on Official Portal</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
