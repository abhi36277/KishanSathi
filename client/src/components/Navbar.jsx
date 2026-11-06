import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Sprout,
  CloudSun,
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
  ChevronDown,
  Layers,
  Sparkles,
  MapPin,
  Compass,
  ArrowRight,
  TrendingUp,
  User,
  ShieldAlert
} from 'lucide-react';

export default function Navbar() {
  const { language, changeLanguage, t, farmer, activeCrop, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const desktopMoreRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDesktopMoreOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close desktop dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (desktopMoreRef.current && !desktopMoreRef.current.contains(event.target)) {
        setDesktopMoreOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDesktopMoreOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  // Primary desktop navigation links
  const primaryLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Sprout },
    { path: '/planner', label: 'Daily Planner', icon: Calendar },
    { path: '/crops', label: 'Plots & Crops', icon: Layers },
    { path: '/market-prices', label: 'Mandi Rates', icon: DollarSign }
  ];

  // Secondary features for "More" dropdown
  const secondaryLinks = [
    {
      category: 'AI Diagnostics & Intelligence',
      items: [
        { path: '/disease-identification', label: 'Disease ID Scan', desc: 'Instant leaf symptom vision analyzer', icon: ShieldCheck, color: '#c62828' },
        { path: '/crop-lifecycle', label: 'Crop Lifecycle Engine', desc: 'Stage-by-stage agronomic advice', icon: Sprout, color: '#0284c7' },
        { path: '/pest-radar', label: 'Nearby Pest Radar', desc: 'Community GPS outbreak map', icon: Radar, color: '#e65100' },
        { path: '/ai-chat', label: 'AI Voice Assistant', desc: 'Chat in Hindi, Kannada or English', icon: Bot, color: '#2e7d32' }
      ]
    },
    {
      category: 'Services, Welfare & Operations',
      items: [
        { path: '/schemes', label: 'Govt Schemes Hub', desc: 'Subsidies matched to your crop', icon: Landmark, color: '#512da8' },
        { path: '/weather', label: 'Weather Telemetry', desc: 'Live Open-Meteo rain & humidity', icon: CloudSun, color: '#0284c7' },
        { path: '/transport', label: 'Transport Pool', desc: 'Shared freight to regional Mandis', icon: Truck, color: '#00796b' },
        { path: '/community', label: 'Kisan Community', desc: 'Peer farmer advice and discussions', icon: Users, color: '#689f38' },
        { path: '/crop-decider', label: 'Crop Comparison', desc: 'ROI benchmark and cost calculator', icon: Scale, color: '#455a64' }
      ]
    }
  ];

  // Flat list of all features for search / mobile menu
  const allNavItems = [
    ...primaryLinks,
    ...secondaryLinks[0].items,
    ...secondaryLinks[1].items
  ];

  const isSecondaryActive = secondaryLinks.some(group =>
    group.items.some(item => item.path === location.pathname)
  );

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main Navigation">
        <div className="navbar-inner">
          {/* 1. Brand Logo */}
          <Link to="/" className="logo-area" aria-label="KisanSathi AI Home">
            <div className="logo-icon-box">
              <Sprout size={22} />
            </div>
            <div>
              <div className="logo-text-title">KisanSathi AI</div>
              <div className="logo-text-subtitle">Your AI Farm Partner</div>
            </div>
          </Link>

          {/* 2. Desktop Navigation Bar (Visible on >= 992px) */}
          <div className="nav-links">
            {primaryLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Desktop "Explore Features" Dropdown Popover */}
            <div style={{ position: 'relative' }} ref={desktopMoreRef}>
              <button
                type="button"
                onClick={() => setDesktopMoreOpen(!desktopMoreOpen)}
                className={`nav-dropdown-btn ${isSecondaryActive ? 'active' : ''}`}
                aria-expanded={desktopMoreOpen}
                aria-haspopup="true"
              >
                <Sparkles size={14} />
                <span>All Features</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: desktopMoreOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>

              {desktopMoreOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: 580,
                    background: '#ffffff',
                    borderRadius: 14,
                    border: '1px solid var(--border-light)',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
                    padding: '1rem',
                    zIndex: 110,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    animation: 'fadeIn 0.15s ease-out'
                  }}
                >
                  {secondaryLinks.map((section, idx) => (
                    <div key={idx}>
                      <div style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-muted)',
                        paddingBottom: '0.4rem',
                        marginBottom: '0.4rem',
                        borderBottom: '1px solid #f0f0f0'
                      }}>
                        {section.category}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.path;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setDesktopMoreOpen(false)}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.6rem',
                                padding: '0.5rem 0.6rem',
                                borderRadius: 8,
                                background: isActive ? 'var(--primary-green-subtle)' : 'transparent',
                                color: isActive ? 'var(--primary-green)' : 'var(--text-dark)',
                                textDecoration: 'none',
                                transition: 'background 0.15s ease'
                              }}
                              onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = '#f7faf7')}
                              onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{
                                color: item.color,
                                background: `${item.color}15`,
                                padding: 5,
                                borderRadius: 6,
                                flexShrink: 0,
                                marginTop: 2
                              }}>
                                <Icon size={16} />
                              </div>
                              <div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 700, lineHeight: 1.2 }}>
                                  {item.label}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                  {item.desc}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Right Action Bar (Language + Auth + Hamburger) */}
          <div className="nav-actions">
            {/* Language Selector (Full on desktop, compact pill on mobile) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#eef5ef',
              borderRadius: '8px',
              padding: '3px 8px',
              border: '1px solid rgba(46, 125, 50, 0.15)'
            }}>
              <Globe size={14} style={{ marginRight: '4px', color: 'var(--primary-green)', flexShrink: 0 }} />
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontWeight: 700,
                  color: 'var(--text-dark)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  outline: 'none',
                  padding: 0
                }}
                aria-label="Language selection"
              >
                <option value="en">English (EN)</option>
                <option value="hi">हिंदी (HI)</option>
                <option value="kn">ಕನ್ನಡ (KN)</option>
              </select>
            </div>

            {/* Farmer Authentication State */}
            {farmer ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  title={`${farmer.name} (${farmer.district || 'Karnataka'})`}
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#1b5e20',
                    background: '#e8f5e9',
                    padding: '4px 8px',
                    borderRadius: 6,
                    maxWidth: 100,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'inline-block'
                  }}
                >
                  🌾 {farmer.name.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-outline hide-on-mobile-xs"
                  style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 3 }}
                  title="Logout"
                >
                  <LogOut size={12} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Link
                  to="/login"
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', textDecoration: 'none' }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary hide-on-mobile-xs"
                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', textDecoration: 'none' }}
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile / Universal Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: mobileMenuOpen ? 'var(--primary-green-subtle)' : '#f4faf5',
                padding: '7px',
                borderRadius: '8px',
                border: '1px solid rgba(46, 125, 50, 0.2)',
                color: 'var(--primary-green)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              title="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* 4. Full Mobile Slide-in Drawer with Backdrop Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="mobile-drawer-overlay"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content sheet */}
          <div className="mobile-drawer-content" role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu">
            {/* Drawer Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderBottom: '1px solid var(--border-light)',
              background: '#f9fbf9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  background: 'var(--primary-green-subtle)',
                  color: 'var(--primary-green)',
                  borderRadius: 8,
                  padding: 6
                }}>
                  <Sprout size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary-green)', lineHeight: 1.1 }}>
                    KisanSathi AI
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Agricultural OS
                  </div>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 6,
                  color: '#666',
                  cursor: 'pointer'
                }}
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Farmer Profile Status Card inside Drawer */}
            <div style={{ padding: '0.85rem 1rem', background: '#f4faf5', borderBottom: '1px solid var(--border-light)' }}>
              {farmer ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                        {farmer.name[0]?.toUpperCase() || 'F'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-dark)' }}>
                          {farmer.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {farmer.district || 'Mandya'}, {farmer.state || 'Karnataka'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #c8e6c9',
                        color: '#d32f2f',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <LogOut size={12} />
                      <span>Logout</span>
                    </button>
                  </div>

                  {activeCrop && (
                    <div style={{ marginTop: 8, fontSize: '0.75rem', background: '#ffffff', padding: '4px 8px', borderRadius: 6, display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                      <span>Active: <strong style={{ color: 'var(--primary-green)' }}>{activeCrop.crop_name}</strong></span>
                      <span>{activeCrop.area_acres || 2.5} Acres</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-secondary"
                    style={{ flex: 1, textAlign: 'center', padding: '0.45rem', fontSize: '0.82rem' }}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary"
                    style={{ flex: 1, textAlign: 'center', padding: '0.45rem', fontSize: '0.82rem' }}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Language Selector Bar inside Drawer */}
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Globe size={12} /> Select Language:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {[
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'हिंदी' },
                  { code: 'kn', label: 'ಕನ್ನಡ' }
                ].map((langItem) => (
                  <button
                    key={langItem.code}
                    onClick={() => changeLanguage(langItem.code)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      fontWeight: language === langItem.code ? 800 : 500,
                      background: language === langItem.code ? 'var(--primary-green)' : '#f5f5f5',
                      color: language === langItem.code ? 'white' : 'var(--text-dark)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {langItem.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grouped Feature Links in Drawer */}
            <div style={{ padding: '0.75rem 1rem', flex: 1, overflowY: 'auto' }}>
              {/* Group 1: Core Operations */}
              <div style={{ marginBottom: '1.2rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Core Farm Operations
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { path: '/dashboard', label: 'Dashboard', icon: Sprout },
                    { path: '/planner', label: 'Daily Planner & Tracker', icon: Calendar },
                    { path: '/crops', label: 'Plots & Crop Protocols', icon: Layers },
                    { path: '/market-prices', label: 'Mandi Prices & 7-Day ML Forecast', icon: DollarSign }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '0.55rem 0.75rem',
                          borderRadius: 8,
                          background: isActive ? 'var(--primary-green-subtle)' : 'transparent',
                          color: isActive ? 'var(--primary-green)' : 'var(--text-dark)',
                          fontWeight: isActive ? 700 : 600,
                          fontSize: '0.88rem',
                          textDecoration: 'none'
                        }}
                      >
                        <Icon size={18} color={isActive ? 'var(--primary-green)' : 'var(--text-muted)'} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: AI Vision & Agronomic Models */}
              <div style={{ marginBottom: '1.2rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 6 }}>
                  AI Diagnostics & Tools
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { path: '/disease-identification', label: 'Disease ID & Vision Scan', icon: ShieldCheck, color: '#c62828' },
                    { path: '/crop-lifecycle', label: 'Full Crop Lifecycle Engine', icon: Sprout, color: '#0284c7' },
                    { path: '/pest-radar', label: 'Regional Pest Outbreak Radar', icon: Radar, color: '#e65100' },
                    { path: '/ai-chat', label: 'Multilingual AI Voice Assistant', icon: Bot, color: '#2e7d32' }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '0.55rem 0.75rem',
                          borderRadius: 8,
                          background: isActive ? 'var(--primary-green-subtle)' : 'transparent',
                          color: isActive ? 'var(--primary-green)' : 'var(--text-dark)',
                          fontWeight: isActive ? 700 : 600,
                          fontSize: '0.88rem',
                          textDecoration: 'none'
                        }}
                      >
                        <Icon size={18} color={item.color} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Group 3: Services & Welfare */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Services, Welfare & Market
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { path: '/schemes', label: 'Government Schemes Hub', icon: Landmark, color: '#512da8' },
                    { path: '/weather', label: 'Live Weather Telemetry', icon: CloudSun, color: '#0284c7' },
                    { path: '/transport', label: 'Mandi Transport Pool', icon: Truck, color: '#00796b' },
                    { path: '/community', label: 'Kisan Community Forum', icon: Users, color: '#689f38' },
                    { path: '/crop-decider', label: 'Crop ROI Decider', icon: Scale, color: '#455a64' }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '0.55rem 0.75rem',
                          borderRadius: 8,
                          background: isActive ? 'var(--primary-green-subtle)' : 'transparent',
                          color: isActive ? 'var(--primary-green)' : 'var(--text-dark)',
                          fontWeight: isActive ? 700 : 600,
                          fontSize: '0.88rem',
                          textDecoration: 'none'
                        }}
                      >
                        <Icon size={18} color={item.color} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-light)', background: '#fafafa', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              KisanSathi AI &bull; Version 2.0 &bull; ICAR Grounded
            </div>
          </div>
        </>
      )}
    </>
  );
}
