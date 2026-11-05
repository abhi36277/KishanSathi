import React from 'react';
import { useApp } from '../context/AppContext';
import { Sprout, Heart, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const { t } = useApp();

  return (
    <footer style={{
      background: 'white',
      borderTop: '1px solid var(--border-light)',
      padding: '2rem 1rem 4rem 1rem',
      marginTop: 'auto',
      fontSize: '0.85rem',
      color: 'var(--text-muted)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary-green)' }}>
            <Sprout size={20} />
            <span>{t.appName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={16} color="var(--primary-green)" />
            <span>Grounded in ICAR, UAS Bangalore & PAU Ludhiana Agricultural Packages of Practices</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f0f4f1', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div>
            Built with care for small & marginal farmers in India. Weather by Open-Meteo.
          </div>
          <div>
            Kisan Call Center: <strong>1800-180-1551</strong> (Toll Free)
          </div>
        </div>
      </div>
    </footer>
  );
}
