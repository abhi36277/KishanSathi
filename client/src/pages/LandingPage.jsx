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
  CalendarCheck
} from 'lucide-react';

export default function LandingPage() {
  const { t, startDemoMode } = useApp();
  const navigate = useNavigate();

  const handleDemoClick = (region) => {
    startDemoMode(region);
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(145deg, #eaf5ec 0%, #ffffff 100%)',
        borderRadius: '24px',
        padding: '3rem 1.5rem',
        border: '1px solid var(--border-light)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div className="badge badge-success" style={{ marginBottom: '1.25rem', padding: '0.4rem 0.8rem' }}>
            <Sparkles size={14} />
            <span>{t.hero.badge}</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 800,
            color: 'var(--primary-green)',
            lineHeight: 1.2,
            marginBottom: '1rem'
          }}>
            {t.hero.title}
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: '2rem'
          }}>
            {t.hero.subtitle}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <Link to="/register" className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              <span>{t.hero.getStarted}</span>
              <ArrowRight size={18} />
            </Link>

            <button 
              onClick={() => handleDemoClick('karnataka')} 
              className="btn-secondary"
              style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}
            >
              <Sparkles size={18} />
              <span>{t.hero.exploreDemo}</span>
            </button>
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
            <span>{t.hero.pilotNotice}</span>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>
            Why KisanSathi AI is Different
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Not just a general chatbot. Grounded agricultural workflows engineered for actual farm operations.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Feature 1 */}
          <div className="card" style={{ borderTop: '4px solid var(--primary-green)' }}>
            <div style={{ color: 'var(--primary-green)', marginBottom: '0.75rem' }}>
              <ClipboardList size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              {t.features.actionPlanTitle}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {t.features.actionPlanDesc}
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card" style={{ borderTop: '4px solid #0284c7' }}>
            <div style={{ color: '#0284c7', marginBottom: '0.75rem' }}>
              <CloudSun size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              {t.features.weatherTitle}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {t.features.weatherDesc}
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card" style={{ borderTop: '4px solid #7c3aed' }}>
            <div style={{ color: '#7c3aed', marginBottom: '0.75rem' }}>
              <Bot size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              {t.features.aiTitle}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {t.features.aiDesc}
            </p>
          </div>

          {/* Feature 4 */}
          <div className="card" style={{ borderTop: '4px solid #d97706' }}>
            <div style={{ color: '#d97706', marginBottom: '0.75rem' }}>
              <CalendarCheck size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              {t.features.adaptiveTitle}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {t.features.adaptiveDesc}
            </p>
          </div>

          {/* Feature 5 */}
          <div className="card" style={{ borderTop: '4px solid #059669' }}>
            <div style={{ color: '#059669', marginBottom: '0.75rem' }}>
              <Scale size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              {t.features.comparisonTitle}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {t.features.comparisonDesc}
            </p>
          </div>

          {/* Feature 6 */}
          <div className="card" style={{ borderTop: '4px solid #b45309' }}>
            <div style={{ color: '#b45309', marginBottom: '0.75rem' }}>
              <Wallet size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              {t.features.expenseTitle}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {t.features.expenseDesc}
            </p>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--primary-green)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              marginBottom: '0.75rem'
            }}>1</div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Profile & Crop Setup</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Enter your village, district, crop type (Rice, Wheat, Maize) and sowing date.
            </p>
          </div>

          <div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--primary-green)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              marginBottom: '0.75rem'
            }}>2</div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Stage & Weather Sync</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Engine calculates exact growth stage (e.g. CRI or Tillering) and pulls Open-Meteo forecasts.
            </p>
          </div>

          <div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--primary-green)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              marginBottom: '0.75rem'
            }}>3</div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Daily Action Plan</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Receive what to do today, why, and the ICAR citation. Adaptive recalculation if missed.
            </p>
          </div>

          <div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--primary-green)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              marginBottom: '0.75rem'
            }}>4</div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Ask in Your Language</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Speak or type in Kannada, Hindi, or English. Gemini AI replies using your real farm context.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
