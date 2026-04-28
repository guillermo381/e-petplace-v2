import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';

interface Props { session: Session | null }

const WHATSAPP_NUM = '573208408790';

const FAQ_DATA = [
  {
    categoria: '📦 Pedidos',
    items: [
      { q: '¿Cuánto tarda mi pedido?', a: 'Los pedidos se entregan en 2-5 días hábiles en Quito y ciudades principales. Para otras ciudades puede tomar 5-7 días.' },
      { q: '¿Cómo hago seguimiento de mi pedido?', a: 'En "Mis Pedidos" puedes ver el estado en tiempo real. También te notificamos cuando hay cambios.' },
      { q: '¿Puedo cancelar mi pedido?', a: 'Puedes cancelar si el pedido está en estado "Confirmado". Una vez en preparación no es posible cancelar.' },
      { q: '¿Qué hago si llegó algo incorrecto?', a: 'Escríbenos por WhatsApp con foto del producto y número de orden. Lo resolvemos en menos de 24 horas.' },
    ]
  },
  {
    categoria: '🏥 Veterinarios',
    items: [
      { q: '¿Cómo agendo una cita?', a: 'Ve a la sección Veterinario, selecciona el profesional, elige fecha y hora disponible y confirma.' },
      { q: '¿Puedo cancelar una cita?', a: 'Sí, con al menos 2 horas de anticipación sin costo. Cancelaciones tardías pueden tener penalidad.' },
      { q: '¿Los veterinarios son verificados?', a: 'Todos nuestros veterinarios tienen licencia profesional verificada y evaluaciones de otros usuarios.' },
      { q: '¿Qué pasa si necesito emergencia?', a: 'En el listado encontrarás VetEmergencias Ecuador disponible 24/7. También puedes llamarnos por WhatsApp.' },
    ]
  },
  {
    categoria: '🐾 Adopción',
    items: [
      { q: '¿Cómo funciona el proceso de adopción?', a: 'Envías una solicitud, el refugio la revisa en 2-5 días y te contacta por email/teléfono para coordinar el encuentro.' },
      { q: '¿Cuánto cuesta adoptar?', a: 'La adopción es gratuita. Algunos refugios piden donación voluntaria para cubrir vacunas y esterilización.' },
      { q: '¿Puedo donar sin adoptar?', a: 'Claro, puedes donar para vacunas, esterilización o alimento de cualquier mascota desde su perfil.' },
      { q: '¿Qué pasa con mi solicitud?', a: 'El refugio te contactará en máximo 5 días. Si no recibes respuesta, escríbenos y hacemos seguimiento.' },
    ]
  },
  {
    categoria: '💳 Pagos',
    items: [
      { q: '¿Qué métodos de pago aceptan?', a: 'Aceptamos tarjeta de crédito/débito, transferencia bancaria y efectivo contra entrega.' },
      { q: '¿Es seguro pagar aquí?', a: 'Sí, procesamos pagos con encriptación SSL. No guardamos datos de tarjetas.' },
      { q: '¿Puedo pedir factura?', a: 'Sí, escríbenos por WhatsApp con tu RUC/cédula después de hacer el pedido.' },
    ]
  },
];

const Ayuda: React.FC<Props> = ({ session }) => {
  const history = useHistory();
  const [openCat, setOpenCat] = useState<string | null>('📦 Pedidos');
  const [openQ,   setOpenQ]   = useState<string | null>(null);

  const abrirWhatsApp = (msg: string) => {
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encoded}`, '_blank');
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': 'var(--bg-primary)' } as React.CSSProperties}>
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 100 }}>

          {/* Header */}
          <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => history.goBack()}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 10, width: 36, height: 36, color: 'var(--text-primary)',
                fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >‹</button>
            <div>
              <h1 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: 0 }}>Centro de ayuda</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '2px 0 0' }}>Estamos para ayudarte 🐾</p>
            </div>
          </div>

          {/* Contacto rápido */}
          <div style={{ padding: '0 20px 24px' }}>
            <div style={{
              background: 'linear-gradient(135deg,rgba(0,229,255,0.08),rgba(0,245,160,0.08))',
              border: '1px solid rgba(0,229,255,0.2)', borderRadius: 16, padding: '16px',
            }}>
              <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>
                ¿No encuentras lo que buscas?
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '0 0 14px' }}>
                Nuestro equipo responde en menos de 2 horas
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => abrirWhatsApp('Hola e-PetPlace, necesito ayuda con:')}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 12,
                    background: '#25D366', border: 'none',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >💬 WhatsApp</button>
                <button
                  onClick={() => abrirWhatsApp(`Hola e-PetPlace, quiero reportar un problema con mi pedido. Usuario: ${session?.user.email ?? 'invitado'}`)}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 12,
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >⚠️ Reportar</button>
              </div>
            </div>
          </div>

          {/* Accesos rápidos */}
          <div style={{ padding: '0 20px 24px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
              Accesos rápidos
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: '📦', label: 'Mis pedidos',    action: () => history.push('/mis-pedidos') },
                { icon: '🐾', label: 'Mis mascotas',   action: () => history.push('/mascotas') },
                { icon: '🏥', label: 'Mis citas',      action: () => history.push('/vet') },
                { icon: '❤️', label: 'Mis adopciones', action: () => abrirWhatsApp(`Hola, quiero saber el estado de mi solicitud de adopción. Email: ${session?.user.email ?? ''}`) },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  style={{
                    padding: '14px 12px', borderRadius: 14, cursor: 'pointer',
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div style={{ padding: '0 20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
              Preguntas frecuentes
            </p>

            {FAQ_DATA.map(cat => (
              <div key={cat.categoria} style={{ marginBottom: 8 }}>
                {/* Categoría */}
                <button
                  onClick={() => setOpenCat(openCat === cat.categoria ? null : cat.categoria)}
                  style={{
                    width: '100%', padding: '14px 16px',
                    borderRadius: openCat === cat.categoria ? '14px 14px 0 0' : 14,
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>{cat.categoria}</span>
                  <span style={{
                    color: 'var(--text-secondary)', fontSize: 16, transition: 'transform 0.2s',
                    display: 'inline-block',
                    transform: openCat === cat.categoria ? 'rotate(90deg)' : 'none',
                  }}>›</span>
                </button>

                {/* Preguntas */}
                {openCat === cat.categoria && (
                  <div style={{
                    background: 'var(--bg-card)', borderRadius: '0 0 14px 14px',
                    border: '1px solid var(--border-color)', borderTop: 'none',
                    overflow: 'hidden',
                  }}>
                    {cat.items.map((item, idx) => (
                      <div key={idx} style={{ borderTop: idx > 0 ? '1px solid var(--border-color)' : 'none' }}>
                        <button
                          onClick={() => setOpenQ(openQ === `${cat.categoria}-${idx}` ? null : `${cat.categoria}-${idx}`)}
                          style={{
                            width: '100%', padding: '12px 16px', background: 'transparent',
                            border: 'none', display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-start', gap: 8, cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, flex: 1 }}>
                            {item.q}
                          </span>
                          <span style={{
                            color: '#00E5FF', fontSize: 14, flexShrink: 0,
                            display: 'inline-block', transition: 'transform 0.2s',
                            transform: openQ === `${cat.categoria}-${idx}` ? 'rotate(45deg)' : 'none',
                          }}>+</span>
                        </button>
                        {openQ === `${cat.categoria}-${idx}` && (
                          <div style={{ padding: '0 16px 14px' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                              {item.a}
                            </p>
                            {(item.q.toLowerCase().includes('incorrecto') || item.q.toLowerCase().includes('problema')) && (
                              <button
                                onClick={() => abrirWhatsApp(`Hola, ${item.q}. Mi email: ${session?.user.email ?? ''}`)}
                                style={{
                                  marginTop: 10, padding: '8px 16px', borderRadius: 10,
                                  background: '#25D366', border: 'none',
                                  color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                }}
                              >Contactar por WhatsApp</button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '24px 20px 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>
              e-PetPlace · Soporte disponible Lun-Sab 8am-8pm
            </p>
            <p style={{ color: '#FF2D9B', fontSize: 12, fontWeight: 700, margin: '4px 0 0' }}>
              satorilatam@gmail.com
            </p>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Ayuda;
