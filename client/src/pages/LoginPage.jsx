import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sprout, Lock, Phone, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, t } = useApp();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      setErrorMessage('Please enter both mobile number and PIN/password');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const res = await login(phone, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(res.error || 'Invalid credentials');
    }
  };

  const fillQuick = (quickPhone, quickPass) => {
    setPhone(quickPhone);
    setPassword(quickPass);
    setErrorMessage('');
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px' }}>
      <div className="card" style={{ padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--color-primary-light, #e8f5e9)',
            color: 'var(--color-primary, #2e7d32)',
            marginBottom: 12
          }}>
            <Sprout size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 6px 0', color: '#1b5e20' }}>
            Farmer Login
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
            Access your personalized daily farming plan & farm records
          </p>
        </div>

        {errorMessage && (
          <div style={{
            padding: '12px 16px',
            background: '#ffebee',
            color: '#c62828',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: '0.88rem'
          }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#333' }}>
              Mobile Number (10 Digits)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: 12, color: '#888' }}>
                <Phone size={18} />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#333' }}>
              Password / Security PIN
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: 12, color: '#888' }}>
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {loading ? 'Logging in...' : (
              <>
                Login to Your Farm <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#666' }}>
            New farmer?
          </p>
          <Link
            to="/register"
            className="btn"
            style={{
              display: 'block',
              width: '100%',
              padding: '10px',
              textAlign: 'center',
              background: '#f1f8e9',
              color: '#2e7d32',
              fontWeight: 600,
              border: '1px solid #c8e6c9',
              borderRadius: 8,
              textDecoration: 'none',
              boxSizing: 'border-box'
            }}
          >
            Register New Farm Account
          </Link>
        </div>

        {/* Instant test account selector */}
        <div style={{ marginTop: 24, background: '#fafafa', border: '1px dashed #ddd', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#666', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <UserCheck size={14} /> Quick-fill Sample Registered Farmers:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fillQuick('9876543210', '1234')}
              style={{
                fontSize: '0.78rem',
                padding: '4px 8px',
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              🌾 Ramesh Gowda (Mandya)
            </button>
            <button
              type="button"
              onClick={() => fillQuick('9812345678', '1234')}
              style={{
                fontSize: '0.78rem',
                padding: '4px 8px',
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              🌾 Gurpreet Singh (Ludhiana)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
