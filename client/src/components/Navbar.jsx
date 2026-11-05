import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Sprout, 
  CloudSun, 
  ClipboardList, 
  Calendar,
  Bot, 
  Scale, 
  ShieldCheck, 
  Landmark, 
  Truck, 
  Users, 
  Menu, 
  X,
  Globe,
  Radar,
  DollarSign,
  LogOut,
  UserCheck
} from 'lucide-react';

export default function Navbar() {
  const { language, changeLanguage, t, farmer, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Sprout },
    { path: '/planner', label: 'Daily Planner', icon: Calendar },
    { path: '/disease-identification', label: 'Disease ID', icon: ShieldCheck },
    { path: '/market-prices', label: 'Mandi Prices', icon: DollarSign },
    { path: '/crop-lifecycle', label: 'Lifecycle', icon: Sprout },
    { path: '/pest-radar', label: 'Pest Radar', icon: Radar },
    { path: '/ai-chat', label: 'AI Assistant', icon: Bot },
    { path: '/weather', label: 'Weather', icon: CloudSun },
    { path: '/schemes', label: 'Govt Schemes', icon: Landmark },
    { path: '/transport', label: 'Transport Pool', icon: Truck },
    { path: '/community', label: 'Community', icon: Users }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="logo-area">
          <div style={{
            background: 'var(--primary-green-subtle)',
            borderRadius: '10px',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--primary-green)'
          }}>
            <Sprout size={24} />
          </div>
          <div>
            <div style={{ lineHeight: 1.1, fontWeight: 800 }}>KisanSathi AI</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Your Farm. Your Language. Your AI Partner.
            </div>
          </div>
        </Link>

        {/* Desktop Quick Nav Links */}
        <div className="nav-links">
          {navItems.slice(0, 5).map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Always Visible Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#eef5ef', borderRadius: '8px', padding: '2px 6px' }}>
            <Globe size={15} style={{ marginRight: '4px', color: 'var(--primary-green)' }} />
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                fontWeight: 600,
                color: 'var(--text-dark)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none'
              }}
              aria-label="Language selection"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>

          {/* Farmer Auth Status */}
          {farmer ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#1b5e20',
                background: '#e8f5e9',
                padding: '4px 8px',
                borderRadius: 6,
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                🌾 {farmer.name.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="btn-outline"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                title="Logout"
              >
                <LogOut size={13} /> Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <Link
                to="/login"
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none' }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none' }}
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              padding: '6px',
              border: 'none',
              color: 'var(--text-dark)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            aria-label="Open navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Expanded Flyout Menu for all features */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          borderBottom: '2px solid var(--border-light)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
          padding: '1rem',
          zIndex: 99
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '0.75rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '8px',
                    background: location.pathname === item.path ? 'var(--primary-green-subtle)' : '#fafbfa',
                    color: location.pathname === item.path ? 'var(--primary-green)' : 'var(--text-dark)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    textDecoration: 'none'
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
