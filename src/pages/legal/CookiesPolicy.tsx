import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';

const UPDATED = '25 de abril de 2026';

const CookiesPolicy: React.FC = () => {
  const history = useHistory();

  const cookies = [
    {
      nombre: 'Sesión de usuario',
      clave: 'sb-* (Supabase)',
      tipo: 'Esencial',
      color: '#00F5A0',
      duracion: 'Sesión / 1 semana',
      desc: 'Mantiene tu sesión autenticada en la app. Sin esta cookie no puedes iniciar sesión.',
    },
    {
      nombre: 'Tema visual',
      clave: 'epetplace_theme',
      tipo: 'Preferencias',
      color: '#A78BFA',
      duracion: 'Permanente',
      desc: 'Guarda tu preferencia de modo claro u oscuro.',
    },
    {
      nombre: 'Consentimiento',
      clave: 'epetplace_consent',
      tipo: 'Esencial',
      color: '#00F5A0',
      duracion: 'Permanente',
      desc: 'Registra que has aceptado nuestra política de cookies.',
    },
    {
      nombre: 'Carrito de compras',
      clave: 'epetplace_cart',
      tipo: 'Funcional',
      color: '#00E5FF',
      duracion: 'Sesión',
      desc: 'Persiste los artículos añadidos al carrito.',
    },
    {
      nombre: 'Google OAuth',
      clave: 'g_state, GCLB',
      tipo: 'Terceros',
      color: '#FFE600',
      duracion: 'Variable',
      desc: 'Usadas por Google al iniciar sesión con tu cuenta de Google.',
    },
  ];

  return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 80 }}>

          {/* Header */}
          <div style={{
            padding: '52px 20px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: '1px solid var(--border-color)',
          }}>
            <button onClick={() => history.goBack()} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 10, width: 36, height: 36, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: 'var(--text-primary)', flexShrink: 0,
            }}>←</button>
            <div>
              <h1 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 800, margin: 0 }}>
                Política de Cookies
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 11, margin: '2px 0 0' }}>
                Última actualización: {UPDATED}
              </p>
            </div>
          </div>

          <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
              e-PetPlace usa cookies y almacenamiento local del dispositivo para que la app funcione correctamente
              y para mejorar tu experiencia. Esta política explica qué usamos y por qué.
            </p>

            {/* ¿Qué son las cookies? */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-color)', padding: '16px 18px' }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, margin: '0 0 10px' }}>
                🍪 ¿Qué son las cookies?
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo.
                En aplicaciones móviles, usamos principalmente <strong style={{ color: 'var(--text-primary)' }}>localStorage</strong> y
                tokens de sesión seguros, que cumplen la misma función.
              </p>
            </div>

            {/* Tabla de cookies */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-color)', padding: '16px 18px' }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>
                📋 Cookies que usamos
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cookies.map(c => (
                  <div key={c.nombre} style={{
                    background: 'var(--bg-secondary)', borderRadius: 10,
                    border: '1px solid var(--border-color)', padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, margin: 0 }}>{c.nombre}</p>
                        <code style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{c.clave}</code>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                        background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}30`,
                        flexShrink: 0, marginLeft: 8,
                      }}>{c.tipo}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '4px 0 0', lineHeight: 1.5 }}>{c.desc}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 11, margin: '4px 0 0', opacity: 0.7 }}>
                      ⏱ Duración: {c.duracion}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cómo desactivarlas */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-color)', padding: '16px 18px' }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, margin: '0 0 10px' }}>
                🔧 Cómo desactivarlas
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, margin: '0 0 10px' }}>
                Las cookies esenciales no pueden desactivarse ya que son necesarias para el funcionamiento básico.
                Para las demás, puedes:
              </p>
              <ul style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, margin: 0, padding: '0 0 0 16px' }}>
                <li style={{ marginBottom: 6 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>En iOS/Android:</strong> Ve a Configuración → Privacidad →
                  Borrar datos del sitio para esta app.
                </li>
                <li style={{ marginBottom: 6 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Google Analytics:</strong> Instala el complemento de
                  inhabilitación de Google Analytics para navegadores.
                </li>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>Cerrar sesión:</strong> Al cerrar sesión,
                  eliminamos automáticamente los tokens de autenticación.
                </li>
              </ul>
            </div>

            {/* Terceros */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-color)', padding: '16px 18px' }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, margin: '0 0 10px' }}>
                🔗 Cookies de terceros
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { nombre: 'Supabase', url: 'supabase.com/privacy', desc: 'Gestión de autenticación y base de datos.' },
                  { nombre: 'Google OAuth', url: 'policies.google.com/privacy', desc: 'Inicio de sesión opcional con cuenta Google.' },
                ].map(t => (
                  <div key={t.nombre} style={{
                    padding: '10px 12px', background: 'var(--bg-secondary)',
                    borderRadius: 8, border: '1px solid var(--border-color)',
                  }}>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, margin: 0 }}>{t.nombre}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '3px 0 0' }}>{t.desc}</p>
                    <p style={{ color: '#00E5FF', fontSize: 11, margin: '3px 0 0', opacity: 0.8 }}>{t.url}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contacto */}
            <div style={{ padding: '14px 16px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                ¿Preguntas sobre cookies? Escríbenos a{' '}
                <strong style={{ color: '#00E5FF' }}>privacidad@epetplace.com</strong>
              </p>
            </div>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CookiesPolicy;
