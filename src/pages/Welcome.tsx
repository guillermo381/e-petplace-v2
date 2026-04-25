import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useGuest } from '../context/GuestContext';
import logoImg from '../assets/logo.png';

const Welcome: React.FC = () => {
  const history = useHistory();
  const { enterGuest } = useGuest();

  const handleGuest = () => {
    enterGuest();
    history.replace('/tienda');
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{
          background: 'var(--bg-primary)', minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px 60px',
        }}>
          {/* Logo */}
          <img
            src={logoImg}
            alt="e-PetPlace"
            style={{ width: 200, marginBottom: 28, display: 'block' }}
          />

          {/* Tagline */}
          <p style={{
            color: 'var(--text-primary)', fontWeight: 800, fontSize: 20,
            margin: '0 0 10px', textAlign: 'center', lineHeight: 1.3,
          }}>
            El ecosistema completo para tu mascota 🐾
          </p>
          <p style={{
            color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 44px',
            textAlign: 'center', lineHeight: 1.6, maxWidth: 280,
          }}>
            Nutrición, salud, servicios y adopción en un solo lugar
          </p>

          {/* Botones */}
          <div style={{
            width: '100%', maxWidth: 360,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <button
              onClick={() => history.push('/login?mode=login')}
              className="btn-brand"
              style={{
                width: '100%', padding: '16px 0', borderRadius: 12,
                fontSize: 16, boxShadow: '0 0 32px rgba(0,229,255,0.2)',
              }}
            >
              Iniciar sesión
            </button>

            <button
              onClick={() => history.push('/login?mode=register')}
              style={{
                width: '100%', padding: '15px 0', borderRadius: 12,
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
                background: 'transparent',
                border: '1.5px solid #00E5FF',
                color: '#00E5FF',
              }}
            >
              Registrarme
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <button
                onClick={handleGuest}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
                  padding: '0 16px', minHeight: 44,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                Explorar sin cuenta <span style={{ fontSize: 16 }}>→</span>
              </button>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>
                Sin tarjeta de crédito requerida
              </p>
            </div>
          </div>

          {/* Dots */}
          <div style={{ marginTop: 52, display: 'flex', gap: 6 }}>
            {(['#FF2D9B', '#00E5FF', '#FFE600'] as string[]).map((c, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: c, boxShadow: `0 0 10px ${c}`,
              }} />
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Welcome;
