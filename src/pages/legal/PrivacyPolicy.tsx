import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';

const UPDATED = '25 de abril de 2026';

const Section: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div style={{
    background: 'var(--bg-card)', borderRadius: 14,
    border: '1px solid var(--border-color)', padding: '18px 18px 16px',
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <div style={{
        flexShrink: 0, width: 26, height: 26, borderRadius: 8,
        background: 'linear-gradient(135deg,#FF2D9B,#00E5FF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 900, color: '#000',
      }}>{n}</div>
      <h2 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{title}</h2>
    </div>
    <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, paddingLeft: 36 }}>
      {children}
    </div>
  </div>
);

const PrivacyPolicy: React.FC = () => {
  const history = useHistory();

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
                Política de Privacidad
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 11, margin: '2px 0 0' }}>
                Última actualización: {UPDATED}
              </p>
            </div>
          </div>

          <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Intro */}
            <div style={{
              background: 'rgba(0,229,255,0.06)', borderRadius: 12,
              border: '1px solid rgba(0,229,255,0.2)', padding: '14px 16px',
            }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
                En <strong style={{ color: '#00E5FF' }}>e-PetPlace</strong> valoramos tu privacidad.
                Esta política explica cómo recopilamos, usamos y protegemos tu información personal,
                en cumplimiento con la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador</strong>.
              </p>
            </div>

            <Section n={1} title="Responsable del Tratamiento">
              <p style={{ margin: 0 }}>
                <strong style={{ color: 'var(--text-primary)' }}>e-PetPlace</strong> es el responsable del tratamiento
                de tus datos personales. Para cualquier consulta relacionada con esta política puedes contactarnos en:
              </p>
              <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                <p style={{ margin: '2px 0' }}>📧 <strong>privacidad@epetplace.com</strong></p>
                <p style={{ margin: '2px 0' }}>🌐 e-PetPlace App — Ecuador</p>
              </div>
            </Section>

            <Section n={2} title="Datos que Recopilamos">
              {[
                { icon: '👤', label: 'Datos de cuenta', desc: 'Nombre, dirección de correo electrónico y contraseña cifrada.' },
                { icon: '🐾', label: 'Datos de mascotas', desc: 'Nombre, especie, raza, fecha de nacimiento, foto, vacunas y citas veterinarias.' },
                { icon: '🛒', label: 'Historial de compras', desc: 'Productos adquiridos, montos, fechas y estado de pedidos.' },
                { icon: '📍', label: 'Ubicación', desc: 'Solo cuando es necesario para servicios de veterinaria o adopción cercana, previa autorización.' },
                { icon: '📊', label: 'Datos de uso', desc: 'Interacciones con la app, preferencias y configuración.' },
                { icon: '🔐', label: 'Datos técnicos', desc: 'Dirección IP (hash), tipo de dispositivo y sistema operativo.' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  <span><strong style={{ color: 'var(--text-primary)' }}>{item.label}:</strong> {item.desc}</span>
                </div>
              ))}
            </Section>

            <Section n={3} title="Finalidad del Tratamiento">
              <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                <li style={{ marginBottom: 6 }}>Gestionar tu cuenta y prestarte los servicios de la plataforma.</li>
                <li style={{ marginBottom: 6 }}>Personalizar recomendaciones de productos y servicios para tus mascotas.</li>
                <li style={{ marginBottom: 6 }}>Procesar compras, pagos y coordinar envíos.</li>
                <li style={{ marginBottom: 6 }}>Enviar comunicaciones de servicio (confirmaciones, recordatorios de vacunas).</li>
                <li style={{ marginBottom: 6 }}>Comunicaciones de marketing, <strong>únicamente con tu consentimiento explícito</strong>.</li>
                <li style={{ marginBottom: 6 }}>Mejorar la plataforma mediante análisis agregados y anónimos.</li>
                <li>Cumplir obligaciones legales aplicables.</li>
              </ul>
            </Section>

            <Section n={4} title="Derechos ARCO">
              <p style={{ margin: '0 0 10px' }}>
                Bajo la LOPDP tienes los siguientes derechos sobre tus datos:
              </p>
              {[
                { letra: 'A', nombre: 'Acceso', desc: 'Conocer qué datos tuyos tratamos.' },
                { letra: 'R', nombre: 'Rectificación', desc: 'Corregir datos inexactos o incompletos.' },
                { letra: 'C', nombre: 'Cancelación', desc: 'Solicitar la eliminación de tus datos.' },
                { letra: 'O', nombre: 'Oposición', desc: 'Oponerte al tratamiento para ciertos fines, incluyendo marketing.' },
              ].map(d => (
                <div key={d.letra} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  marginBottom: 8, padding: '8px 12px',
                  background: 'var(--bg-secondary)', borderRadius: 8,
                }}>
                  <div style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                    background: 'rgba(255,45,155,0.15)', border: '1px solid rgba(255,45,155,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900, color: '#FF2D9B',
                  }}>{d.letra}</div>
                  <span><strong style={{ color: 'var(--text-primary)' }}>{d.nombre}:</strong> {d.desc}</span>
                </div>
              ))}
              <p style={{ margin: '10px 0 0' }}>
                Para ejercer estos derechos escríbenos a <strong style={{ color: '#00E5FF' }}>privacidad@epetplace.com</strong>.
                Responderemos en un plazo máximo de 15 días hábiles.
              </p>
            </Section>

            <Section n={5} title="Cookies y Tecnologías Similares">
              <p style={{ margin: '0 0 8px' }}>Usamos las siguientes cookies y almacenamiento local:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { tipo: 'Sesión', desc: 'Mantienen tu sesión activa de forma segura.', necesaria: true },
                  { tipo: 'Preferencias', desc: 'Guardan tu tema (claro/oscuro) y configuración de la app.', necesaria: true },
                  { tipo: 'Carrito', desc: 'Persisten los items de tu carrito de compras.', necesaria: true },
                  { tipo: 'Analytics', desc: 'Datos anónimos de uso para mejorar la app.', necesaria: false },
                ].map(c => (
                  <div key={c.tipo} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8,
                  }}>
                    <div>
                      <p style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700, margin: 0 }}>{c.tipo}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 11, margin: '2px 0 0' }}>{c.desc}</p>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, flexShrink: 0, marginLeft: 8,
                      background: c.necesaria ? 'rgba(0,245,160,0.1)' : 'rgba(255,230,0,0.1)',
                      color: c.necesaria ? '#00F5A0' : '#FFE600',
                      border: `1px solid ${c.necesaria ? 'rgba(0,245,160,0.25)' : 'rgba(255,230,0,0.25)'}`,
                    }}>{c.necesaria ? 'Necesaria' : 'Opcional'}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section n={6} title="Transferencia Internacional de Datos">
              <p style={{ margin: '0 0 10px' }}>
                Utilizamos <strong style={{ color: 'var(--text-primary)' }}>Supabase</strong> como proveedor de base de datos
                e infraestructura, con servidores ubicados en <strong>Estados Unidos</strong>.
                Esta transferencia está amparada en cláusulas contractuales estándar y el proveedor
                cumple con normativas internacionales de protección de datos (SOC 2 Type II).
              </p>
              <p style={{ margin: 0 }}>
                No compartimos tus datos con terceros con fines comerciales sin tu consentimiento expreso.
              </p>
            </Section>

            <Section n={7} title="Conservación de Datos">
              <p style={{ margin: '0 0 8px' }}>
                Conservamos tus datos mientras mantengas una cuenta activa en e-PetPlace.
                Al eliminar tu cuenta, borraremos o anonimizaremos tus datos personales en un plazo
                máximo de <strong style={{ color: 'var(--text-primary)' }}>30 días</strong>, salvo que
                exista obligación legal de conservarlos por más tiempo.
              </p>
            </Section>

            <Section n={8} title="Seguridad">
              <p style={{ margin: 0 }}>
                Implementamos medidas técnicas y organizativas adecuadas: cifrado en tránsito (TLS),
                contraseñas almacenadas con hash bcrypt, autenticación de dos factores disponible,
                y acceso restringido mediante Row Level Security (RLS) en nuestra base de datos.
              </p>
            </Section>

            <Section n={9} title="Actualizaciones de esta Política">
              <p style={{ margin: 0 }}>
                Podemos actualizar esta política periódicamente. Te notificaremos de cambios significativos
                mediante una notificación en la app o por correo electrónico. La fecha de la última
                modificación siempre estará visible al inicio de este documento.
              </p>
            </Section>

            <Section n={10} title="Contacto">
              <p style={{ margin: '0 0 10px' }}>Para cualquier consulta sobre privacidad:</p>
              <div style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                <p style={{ margin: '3px 0', color: 'var(--text-primary)', fontSize: 13 }}>
                  📧 <strong>privacidad@epetplace.com</strong>
                </p>
                <p style={{ margin: '3px 0', color: 'var(--text-secondary)', fontSize: 12 }}>
                  Tiempo de respuesta: hasta 15 días hábiles
                </p>
              </div>
            </Section>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PrivacyPolicy;
