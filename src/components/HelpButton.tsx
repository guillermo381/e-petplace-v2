import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

interface Props {
  session: Session | null;
  mascotasNombres?: string;
  pedidosActivos?: string;
}

interface Msg { role: 'user' | 'assistant'; content: string }

const PAGINA_LABEL: Record<string, string> = {
  '/home':        'Inicio',
  '/mascotas':    'Mis mascotas',
  '/tienda':      'Tienda',
  '/mis-pedidos': 'Mis pedidos',
  '/perfil':      'Perfil',
  '/vet':         'Veterinarios',
  '/adopcion':    'Adopción',
  '/carrito':     'Carrito',
  '/checkout':    'Checkout',
  '/ayuda':       'Centro de ayuda',
};

const SUGERENCIAS: Record<string, string[]> = {
  '/mis-pedidos': ['¿Cuándo llega mi pedido?', '¿Cómo cancelo un pedido?', 'Llegó algo incorrecto'],
  '/mascotas':    ['¿Cómo agrego vacunas?', '¿Cómo escaneo el carnet?', '¿Para qué sirve el índice de salud?'],
  '/vet':         ['¿Cómo agendo una cita?', '¿Puedo cancelar mi cita?', '¿Los vets son verificados?'],
  '/tienda':      ['¿Cuánto tarda el envío?', '¿Qué métodos de pago aceptan?', '¿Puedo pedir factura?'],
  '/adopcion':    ['¿Cómo funciona la adopción?', '¿Puedo donar sin adoptar?', '¿Cuándo me contactan?'],
  '/carrito':     ['¿Cómo aplico un cupón?', '¿Es seguro pagar aquí?', '¿Puedo cambiar la dirección?'],
};

const DEFAULT_SUGERENCIAS = ['¿Cómo funciona e-PetPlace?', '¿Cómo agrego mi mascota?', '¿Cuáles son los servicios disponibles?'];

const HelpButton: React.FC<Props> = ({ session, mascotasNombres = '', pedidosActivos = '' }) => {
  const location = useLocation();
  const { totalItems } = useCart();
  const cartVisible = totalItems > 0 &&
    !['/carrito', '/checkout', '/login', '/welcome', '/reset-password']
      .some(p => location.pathname.startsWith(p));

  const [open,    setOpen]    = useState(false);
  const [view,    setView]    = useState<'menu' | 'chat'>('menu');
  const [msgs,    setMsgs]    = useState<Msg[]>([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const pagina      = PAGINA_LABEL[location.pathname] ?? 'App';
  const sugerencias = SUGERENCIAS[location.pathname] ?? DEFAULT_SUGERENCIAS;

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const cerrar = () => { setOpen(false); setTimeout(() => { setView('menu'); }, 300); };

  const enviar = async (texto: string) => {
    if (!texto.trim() || loading) return;
    const userMsg: Msg = { role: 'user', content: texto };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-ayuda', {
        body: {
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          contexto: {
            pagina,
            email:          session?.user.email ?? 'invitado',
            mascotas:       mascotasNombres || 'ninguna',
            pedidosActivos: pedidosActivos  || 'ninguno',
          },
        },
      });
      const respuesta = error ? 'Lo siento, hubo un error. Intenta de nuevo.' : (data?.text ?? 'Sin respuesta.');
      setMsgs(prev => [...prev, { role: 'assistant', content: respuesta }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Intenta de nuevo.' }]);
    }
    setLoading(false);
  };

  const abrirWhatsApp = () => {
    const msg = encodeURIComponent(`Hola e-PetPlace, necesito ayuda. Estoy en: ${pagina}. Usuario: ${session?.user.email ?? 'invitado'}`);
    window.open(`https://wa.me/573208408790?text=${msg}`, '_blank');
  };

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: cartVisible ? 148 : 84, right: 20, zIndex: 8000,
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg,#FF2D9B,#A855F7)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 20px rgba(255,45,155,0.45)',
          }}
        >🐾</button>
      )}

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 8001,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
        }}>
          {/* Overlay */}
          <div
            onClick={cerrar}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
          />

          {/* Panel container */}
          <div style={{
            position: 'relative', zIndex: 1,
            width: '92%', maxWidth: 380,
            maxHeight: '75vh',
            background: 'var(--bg-primary)',
            borderRadius: '20px 20px 0 0',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 -4px 40px rgba(0,0,0,0.4)',
            margin: '0 0 0 auto',
          }}>

            {/* Header */}
            <div style={{
              padding: '16px 20px 12px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--bg-primary)',
            }}>
              {view === 'chat' && (
                <button onClick={() => setView('menu')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 20, cursor: 'pointer', padding: 0 }}>
                  ‹
                </button>
              )}
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg,#FF2D9B,#A855F7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
              }}>🐾</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: 0 }}>
                  {view === 'chat' ? 'Chat con PetBot' : 'Ayuda e-PetPlace'}
                </p>
                <p style={{ color: '#00F5A0', fontSize: 11, margin: 0 }}>● En línea · {pagina}</p>
              </div>
              <button onClick={cerrar}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 20, cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {/* ── VISTA MENÚ ── */}
            {view === 'menu' && (
              <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px 20px' }}>

                {/* Chat IA */}
                <button
                  onClick={() => setView('chat')}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                    background: 'linear-gradient(135deg,rgba(255,45,155,0.1),rgba(168,85,247,0.1))',
                    border: '1px solid rgba(255,45,155,0.25)',
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 24 }}>🤖</span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, margin: 0 }}>Chat con PetBot IA</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 11, margin: '2px 0 0' }}>Respuestas instantáneas 24/7</p>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }}>›</span>
                </button>

                {/* Sugerencias contextuales */}
                <p style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                  Preguntas frecuentes · {pagina}
                </p>
                {sugerencias.map(s => (
                  <button key={s}
                    onClick={() => { setView('chat'); setTimeout(() => enviar(s), 100); }}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{s}</span>
                    <span style={{ color: '#A855F7', fontSize: 12 }}>›</span>
                  </button>
                ))}

                {/* WhatsApp */}
                <button onClick={abrirWhatsApp}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                    background: '#25D366', border: 'none',
                    color: '#fff', fontSize: 13, fontWeight: 700, marginTop: 8,
                  }}
                >💬 Hablar con persona real · WhatsApp</button>
              </div>
            )}

            {/* ── VISTA CHAT ── */}
            {view === 'chat' && (
              <>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>

                  {/* Mensaje bienvenida */}
                  {msgs.length === 0 && (
                    <div style={{
                      background: 'var(--bg-card)', borderRadius: '4px 14px 14px 14px',
                      padding: '10px 14px', marginBottom: 10, maxWidth: '85%',
                      border: '1px solid var(--border-color)',
                    }}>
                      <p style={{ color: 'var(--text-primary)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                        ¡Hola! 🐾 Soy PetBot, el asistente de e-PetPlace. Estoy aquí para ayudarte con {pagina.toLowerCase()}. ¿En qué puedo ayudarte?
                      </p>
                    </div>
                  )}

                  {msgs.map((m, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: 8,
                    }}>
                      <div style={{
                        maxWidth: '85%', padding: '10px 14px',
                        borderRadius: m.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                        background: m.role === 'user'
                          ? 'linear-gradient(135deg,#FF2D9B,#A855F7)'
                          : 'var(--bg-card)',
                        border: m.role === 'user' ? 'none' : '1px solid var(--border-color)',
                      }}>
                        <p style={{
                          color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                          fontSize: 13, margin: 0, lineHeight: 1.5,
                        }}>{m.content}</p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div style={{
                      background: 'var(--bg-card)', borderRadius: '4px 14px 14px 14px',
                      padding: '10px 14px', maxWidth: '85%',
                      border: '1px solid var(--border-color)', display: 'inline-block',
                    }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>PetBot está escribiendo…</p>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div style={{
                  padding: '10px 16px 20px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex', gap: 8,
                  background: 'var(--bg-primary)',
                }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') enviar(input); }}
                    placeholder="Escribe tu pregunta…"
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 20,
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => enviar(input)}
                    disabled={!input.trim() || loading}
                    style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: input.trim() ? 'linear-gradient(135deg,#FF2D9B,#A855F7)' : 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: input.trim() ? '#fff' : 'var(--text-secondary)',
                      fontSize: 16, cursor: input.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >↑</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default HelpButton;
