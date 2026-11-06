import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Sprout, 
  CloudSun, 
  ClipboardList, 
  Bot, 
  Scale, 
  Wallet, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  MapPin,
  CalendarCheck,
  Radar,
  DollarSign,
  Truck,
  FileText,
  UserCheck
} from 'lucide-react';

export default function LandingPage() {
  const { farmer } = useApp();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: 1040, margin: '0 auto', padding: '0 16px' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(145deg, var(--primary-green-subtle) 0%, #ffffff 100%)',
        borderRadius: '24px',
        padding: '3rem 1.5rem',
        border: '1px solid var(--border-light)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div className="badge badge-success" style={{ marginBottom: '1.25rem', padding: '0.4rem 0.8rem' }}>
            <Sparkles size={14} />
            <span>KisanSathi AI v2.0 • Autonomous Multi-Model Agricultural Platform</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 800,
            color: 'var(--primary-green)',
            lineHeight: 1.2,
            marginBottom: '1rem'
          }}>
            Your Farm. Your Language. Your AI Partner.
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: '2rem'
          }}>
            Personalized daily farming action plans, AI disease identification, mandi price forecasts, from-start sowing & irrigation schedules, and nearby pest radar in English, Hindi, and Kannada.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {farmer ? (
              <Link to="/dashboard" className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
                <span>Go to Your Farm Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
                  <UserCheck size={18} />
                  <span>Farmer Login</span>
                </Link>

                <Link to="/register" className="btn-secondary" style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}>
                  <Sprout size={18} />
                  <span>Register New Farm Account</span>
                </Link>
              </>
            )}
          </div>

          {/* Pilot Scope Label */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)'
          }}>
            <MapPin size={15} color="var(--primary-green)" />
            <span>Verified Crop Packages: Karnataka (Rice, Maize) & Punjab/North India (Wheat) + General Guidance</span>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>
            Specialized Multi-Model Features
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Each function is powered by a dedicated agronomic ML pipeline running independently.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Feature 1: Disease ID */}
          <div className="card" style={{ borderTop: '4px solid #c62828' }}>
            <div style={{ color: '#c62828', marginBottom: '0.75rem' }}>
              <ShieldCheck size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              AI Disease Identification
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Upload a leaf photo or select symptoms. Our computer vision model identifies pathogens, organic treatments, and cultural adjustments.
            </p>
            <Link to="/disease-identification" style={{ fontSize: '0.85rem', color: '#c62828', fontWeight: 700, textDecoration: 'none' }}>
              Open Disease Scanner →
            </Link>
          </div>

          {/* Feature 2: Mandi Prices */}
          <div className="card" style={{ borderTop: '4px solid #2e7d32' }}>
            <div style={{ color: '#2e7d32', marginBottom: '0.75rem' }}>
              <DollarSign size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Mandi Prices & 7-Day ML Forecast
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Real AGMARKNET prices, modal rates, 7-day ARIMA price trajectories, and net pocket realization after deducting freight.
            </p>
            <Link to="/market-prices" style={{ fontSize: '0.85rem', color: '#2e7d32', fontWeight: 700, textDecoration: 'none' }}>
              View Mandi Rates →
            </Link>
          </div>

          {/* Feature 3: From Start Lifecycle */}
          <div className="card" style={{ borderTop: '4px solid #0284c7' }}>
            <div style={{ color: '#0284c7', marginBottom: '0.75rem' }}>
              <Sprout size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Full Lifecycle: Sowing, Irrigation, Fertilizer
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Day-by-day stage tracking from certified seed treatment and basal doses to critical irrigation windows and harvest.
            </p>
            <Link to="/crop-lifecycle" style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>
              Explore Lifecycle Guide →
            </Link>
          </div>

          {/* Feature 4: Nearby Pest Radar */}
          <div className="card" style={{ borderTop: '4px solid #e65100' }}>
            <div style={{ color: '#e65100', marginBottom: '0.75rem' }}>
              <Radar size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Nearby Pest Radar & Outbreak Map
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              GPS location-based outbreak clustering. Scans humidity & temperature to forecast fungal/pest incubation with 1-click alerts.
            </p>
            <Link to="/pest-radar" style={{ fontSize: '0.85rem', color: '#e65100', fontWeight: 700, textDecoration: 'none' }}>
              Scan Pest Radar →
            </Link>
          </div>

          {/* Feature 5: Multilingual Conversational AI */}
          <div className="card" style={{ borderTop: '4px solid #7c3aed' }}>
            <div style={{ color: '#7c3aed', marginBottom: '0.75rem' }}>
              <Bot size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Multilingual Assistant with Memory
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Speaks English, Hindi, and Kannada. Retains complete memory of your crops, sowing date, and past chats with audio synthesis.
            </p>
            <Link to="/ai-chat" style={{ fontSize: '0.85rem', color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>
              Chat with KisanSathi →
            </Link>
          </div>

          {/* Feature 6: Transport Pooling & Mandi Trips */}
          <div className="card" style={{ borderTop: '4px solid #059669' }}>
            <div style={{ color: '#059669', marginBottom: '0.75rem' }}>
              <Truck size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Transport Pooling for Mandi Trips
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Share pickup trucks, tractors, and tempos with neighboring farmers traveling to the same APMC mandi to cut freight costs.
            </p>
            <Link to="/transport" style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700, textDecoration: 'none' }}>
              Find Shared Transport →
            </Link>
          </div>

          {/* Feature 7: Hand-Verified Govt Schemes */}
          <div className="card" style={{ borderTop: '4px solid #b45309' }}>
            <div style={{ color: '#b45309', marginBottom: '0.75rem' }}>
              <FileText size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Government Schemes Hub
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Official PM-KISAN, PMFBY, and state subsidies with interactive eligibility checker, document checklist, and official portal links.
            </p>
            <Link to="/schemes" style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 700, textDecoration: 'none' }}>
              Check Scheme Eligibility →
            </Link>
          </div>

          {/* Feature 8: Community Discussion */}
          <div className="card" style={{ borderTop: '4px solid #0284c7' }}>
            <div style={{ color: '#0284c7', marginBottom: '0.75rem' }}>
              <ClipboardList size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Community Discussion Forum
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Connect with fellow farmers in your taluk. Ask questions, share equipment, discuss mandi prices, and get verified advice.
            </p>
            <Link to="/community" style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>
              Join Farmer Community →
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works Walkthrough */}
      <section style={{ background: 'white', padding: '2.5rem 1.5rem', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, textAlign: 'center', marginBottom: '2rem', color: 'var(--primary-green)' }}>
          How KisanSathi AI Works in 4 Steps
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--color-primary-light, #e8f5e9)',
              color: 'var(--primary-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              margin: '0 auto 1rem auto'
            }}>
              1
            </div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Register Farm</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Enter your crop, sowing date, and village location.</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--color-primary-light, #e8f5e9)',
              color: 'var(--primary-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              margin: '0 auto 1rem auto'
            }}>
              2
            </div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Hyperlocal Telemetry</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>We retrieve live Open-Meteo weather and active pest radar reports.</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--color-primary-light, #e8f5e9)',
              color: 'var(--primary-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              margin: '0 auto 1rem auto'
            }}>
              3
            </div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Autonomous Rules</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Deterministic agronomic rule engine generates your daily action checklist.</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--color-primary-light, #e8f5e9)',
              color: 'var(--primary-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              margin: '0 auto 1rem auto'
            }}>
              4
            </div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Your Language AI</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Speak or type in English, Hindi, or Kannada with grounded answers.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
