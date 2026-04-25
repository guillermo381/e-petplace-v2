import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const CONSENT_KEY = 'epetplace_consent';

export const hasConsent = (): boolean => {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    return JSON.parse(raw)?.accepted === true;
  } catch {
    return false;
  }
};

const saveConsent = () => {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }));
};

const ConsentBanner: React.FC = () => {
  const history = useHistory();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasConsent()) setVisible(true);
  }, []);

  const accept = () => {
    saveConsent();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay suave */}
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 10000, pointerEvents: 'none',
      }} />

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 10001,
        background: 'var(--bg-secondary)',
        borderRadius: '20px 20px 0 0',
        border: '1px solid var(--border-color)',
        borderBottom: 'none',
        padding: '20px 20px 40px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--border-color)',
          margin: '0 auto 18px',
        }} />

        {/* Ícono */}
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'linear-gradient(135deg,#FF2D9B22,#00E5FF22)',
          border: '1px solid rgba(0,229,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, marginBottom: 14,
        }}>🍪</div>

        <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800, margin: '0 0 8px' }}>
          Tu privacidad importa
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: '0 0 18px' }}>
          Usamos cookies para mejorar tu experiencia. Al continuar aceptas nuestra{' '}
          <button
            onClick={() => history.push('/privacidad')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00E5FF', fontSize: 13, padding: 0, fontWeight: 600 }}
          >
            Política de Privacidad
          </button>
          {' '}y{' '}
          <button
            onClick={() => history.push('/terminos')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00E5FF', fontSize: 13, padding: 0, fontWeight: 600 }}
          >
            Términos de Uso
          </button>
          .
        </p>

        {/* Botones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={accept}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 14,
              background: 'linear-gradient(90deg,#FF2D9B,#00E5FF)',
              border: 'none', color: '#000', fontSize: 15, fontWeight: 800,
              cursor: 'pointer', boxShadow: '0 0 30px rgba(0,229,255,0.2)',
            }}
          >
            Aceptar todo ✓
          </button>

          <button
            onClick={() => history.push('/privacidad')}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 14,
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ver opciones
          </button>
        </div>
      </div>
    </>
  );
};

export default ConsentBanner;
