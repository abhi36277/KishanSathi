import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Sprout, 
  CloudSun, 
  ClipboardList, 
  Bot, 
  Scale, 
  Wallet, 
  ShieldAlert, 
  Landmark, 
  Truck, 
  Users, 
  Menu, 
  X,
  Globe,
  Sparkles,
  Database
} from 'lucide-react';

export default function Navbar() {
  const { language, changeLanguage, t, isDemo, farmer, startDemoMode, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: t.nav.dashboard, icon: Sprout },
    { path: '/action-plan', label: t.nav.actionPlan, icon: ClipboardList },
    { path: '/weather', label: t.nav.weather, icon: CloudSun },
    { path: '/ai-chat', label: t.nav.aiChat, icon: Bot },
    { path: '/database', label: 'Database', icon: Database },
    { path: '/crop-decider', label: t.nav.compareCrops, icon: Scale },
    { path: '/expenses', label: t.nav.expenses, icon: Wallet },
    { path: '/field-monitor', label: t.nav.fieldMonitor, icon: ShieldAlert },
    { path: '/schemes', label: t.nav.schemes, icon: Landmark },
    { path: '/transport', label: t.nav.transport, icon: Truck },
    { path: '/community', label: t.nav.community, icon: Users }
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
            <div style={{ lineHeight: 1.1 }}>{t.appName}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {t.tagline}
            </div>
          </div>
        </Link>

        {/* Desktop Nav Items */}
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

        {/* Right Action Bar: Language Selector & Demo Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

          {/* Demo Mode Toggle / Status */}
          {isDemo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                <Sparkles size={12} /> {t.nav.demoMode}
              </span>
              <button 
                onClick={logout} 
                className="btn-outline" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                title="Exit Demo Mode"
              >
                {t.nav.logout}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => startDemoMode('karnataka')} 
              className="btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
            >
              <Sparkles size={14} /> {t.nav.demoMode}
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              padding: '6px',
              color: 'var(--text-dark)',
              display: 'flex',
              alignItems: 'center'
            }}
            aria-label="Open navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Expanded Mobile / Desktop Flyout Menu */}
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
                    fontSize: '0.88rem'
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Pilot Regions: Karnataka (Rice, Maize) & Punjab (Wheat)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => { startDemoMode('karnataka'); setMobileMenuOpen(false); }} className="btn-outline" style={{ fontSize: '0.75rem' }}>
                Mandya Rice Demo
              </button>
              <button onClick={() => { startDemoMode('punjab'); setMobileMenuOpen(false); }} className="btn-outline" style={{ fontSize: '0.75rem' }}>
                Punjab Wheat Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
