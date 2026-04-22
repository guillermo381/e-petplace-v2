/*
-- SQL to run in Supabase SQL Editor:
CREATE TABLE pedidos (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id),
  items        jsonb,
  total        numeric,
  direccion    text,
  ciudad       text,
  metodo_pago  text,
  numero_orden text,
  estado       text DEFAULT 'confirmado',
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pedidos" ON pedidos
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
*/

import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonLoading } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

interface Props { session: Session }

type Step = 1 | 2 | 3 | 4;
type MetodoPago = 'tarjeta' | 'transferencia' | 'efectivo';

const CIUDADES = ['Quito', 'Guayaquil', 'Cuenca', 'Otra'];
const STEP_LABELS = ['Resumen', 'Envío', 'Pago', '¡Listo!'];

/* ── Barra de progreso ───────────────────────────────────────── */
const StepBar: React.FC<{ step: Step }> = ({ step }) => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', marginBottom: 28 }}>
    {STEP_LABELS.map((label, idx) => {
      const n = (idx + 1) as Step;
      const done    = n < step;
      const current = n === step;
      return (
        <React.Fragment key={label}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: done ? '#00F5A0' : current ? 'linear-gradient(135deg,#FF2D9B,#00E5FF)' : '#1a1a1a',
              border: done || current ? 'none' : '1px solid #333',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800,
              color: done ? '#000' : current ? '#000' : '#444',
            }}>
              {done ? '✓' : n}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: current ? '#00E5FF' : done ? '#00F5A0' : '#444' }}>
              {label}
            </span>
          </div>
          {idx < STEP_LABELS.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: '0 6px', marginBottom: 16,
              background: done ? '#00F5A0' : '#1a1a1a',
              borderRadius: 2,
            }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ── Input helper ────────────────────────────────────────────── */
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <p style={{ color: '#666', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>{label}</p>
    {children}
  </div>
);

const iStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#111', border: '1px solid #222', borderRadius: 12,
  padding: '13px 16px', color: '#fff', fontSize: 14,
};

/* ════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════════ */
const Checkout: React.FC<Props> = ({ session }) => {
  const history  = useHistory();
  const { items, totalPrice, clearCart } = useCart();
  const [step,    setStep]    = useState<Step>(1);
  const [saving,  setSaving]  = useState(false);

  // Envío
  const [nombre,   setNombre]   = useState('');
  const [email,    setEmail]    = useState('');
  const [telefono, setTelefono] = useState('');
  const [dir,      setDir]      = useState('');
  const [ciudad,   setCiudad]   = useState('Quito');
  const [refs,     setRefs]     = useState('');

  // Pago
  const [metodo,   setMetodo]   = useState<MetodoPago>('tarjeta');
  const [cardNum,  setCardNum]  = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp,  setCardExp]  = useState('');
  const [cardCvv,  setCardCvv]  = useState('');
  const [showCvv,  setShowCvv]  = useState(false);
  const [saveCard, setSaveCard] = useState(false);

  // Confirmación
  const [numOrden, setNumOrden] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('nombre,email').eq('id', session.user.id).single()
      .then(({ data }) => {
        if (data) { setNombre(data.nombre ?? ''); setEmail(data.email ?? session.user.email ?? ''); }
        else setEmail(session.user.email ?? '');
      });
  }, [session]);

  // Formato número tarjeta
  const formatCard = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const confirmarPago = async () => {
    setSaving(true);
    const orden = `EPP-${Math.floor(100000 + Math.random() * 900000)}`;
    const { error } = await supabase.from('pedidos').insert({
      user_id:     session.user.id,
      items:       items,
      total:       totalPrice,
      direccion:   dir,
      ciudad,
      metodo_pago: metodo,
      numero_orden: orden,
      estado:      'confirmado',
    });
    setSaving(false);
    if (error) { console.error(error); }
    setNumOrden(orden);
    setStep(4);
  };

  const volverInicio = () => {
    clearCart();
    history.push('/home');
  };

  /* ── PASO 1: RESUMEN ────────────────────────────────────────── */
  if (step === 1) return (
    <IonPage>
      <IonContent style={{ '--background': '#000' } as React.CSSProperties}>
        <div style={{ padding: '52px 20px 40px' }}>
          <BackBtn onClick={() => history.goBack()} />
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 20, margin: '0 0 24px' }}>
            Confirmar pedido
          </h2>
          <StepBar step={1} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {items.map(item => (
              <div key={item.producto_id} style={{
                display: 'flex', gap: 12, alignItems: 'center',
                background: '#111', borderRadius: 14, padding: '12px 14px',
                border: '1px solid #1e1e1e',
              }}>
                <span style={{ fontSize: 24 }}>{item.imagen_emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, margin: 0 }}>{item.nombre}</p>
                  <p style={{ color: '#555', fontSize: 12, margin: '2px 0 0' }}>x{item.cantidad}</p>
                </div>
                <p style={{ color: '#00E5FF', fontWeight: 700, fontSize: 14, margin: 0 }}>
                  ${(item.precio * item.cantidad).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div style={{ background: '#111', borderRadius: 16, padding: 16, marginBottom: 24,
            border: '1px solid #1e1e1e' }}>
            <SummaryRow label="Subtotal" value={`$${totalPrice.toFixed(2)}`} />
            <SummaryRow label="Envío" value="Gratis 🎉" color="#00F5A0" />
            <div style={{ borderTop: '1px solid #222', marginTop: 10, paddingTop: 10,
              display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontWeight: 700 }}>Total</span>
              <span style={{ color: '#00E5FF', fontWeight: 900, fontSize: 20 }}>
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <button onClick={() => setStep(2)} className="btn-brand"
            style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 16 }}>
            Continuar →
          </button>
        </div>
      </IonContent>
    </IonPage>
  );

  /* ── PASO 2: ENVÍO ──────────────────────────────────────────── */
  if (step === 2) return (
    <IonPage>
      <IonContent style={{ '--background': '#000' } as React.CSSProperties}>
        <div style={{ padding: '52px 20px 40px' }}>
          <BackBtn onClick={() => setStep(1)} />
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 20, margin: '0 0 24px' }}>
            Datos de envío
          </h2>
          <StepBar step={2} />

          <Field label="Nombre completo">
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" style={iStyle} />
          </Field>
          <Field label="Email">
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="tu@email.com" style={iStyle} />
          </Field>
          <Field label="Teléfono">
            <input value={telefono} onChange={e => setTelefono(e.target.value)} type="tel" placeholder="+593 99 000 0000" style={iStyle} />
          </Field>
          <Field label="Dirección principal">
            <input value={dir} onChange={e => setDir(e.target.value)} placeholder="Calle, número, sector" style={iStyle} />
          </Field>
          <Field label="Ciudad">
            <select value={ciudad} onChange={e => setCiudad(e.target.value)}
              style={{ ...iStyle, appearance: 'none', WebkitAppearance: 'none' }}>
              {CIUDADES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Referencias adicionales (opcional)">
            <input value={refs} onChange={e => setRefs(e.target.value)} placeholder="Ej: Frente al parque, piso 3" style={iStyle} />
          </Field>

          <button onClick={() => setStep(3)} className="btn-brand"
            style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 16, marginTop: 8 }}>
            Continuar →
          </button>
        </div>
      </IonContent>
    </IonPage>
  );

  /* ── PASO 3: PAGO ───────────────────────────────────────────── */
  if (step === 3) return (
    <IonPage>
      <IonContent style={{ '--background': '#000' } as React.CSSProperties}>
        <div style={{ padding: '52px 20px 40px' }}>
          <BackBtn onClick={() => setStep(2)} />
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 20, margin: '0 0 24px' }}>
            Método de pago
          </h2>
          <StepBar step={3} />

          {/* Radio métodos */}
          {([
            { value: 'tarjeta',       label: '💳 Tarjeta de crédito/débito' },
            { value: 'transferencia', label: '📱 Transferencia bancaria' },
            { value: 'efectivo',      label: '💵 Efectivo contra entrega' },
          ] as { value: MetodoPago; label: string }[]).map(opt => (
            <div key={opt.value}
              onClick={() => setMetodo(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: metodo === opt.value ? 'rgba(0,229,255,0.06)' : '#111',
                border: `1px solid ${metodo === opt.value ? 'rgba(0,229,255,0.3)' : '#222'}`,
                borderRadius: 14, padding: '14px 16px', marginBottom: 10, cursor: 'pointer',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${metodo === opt.value ? '#00E5FF' : '#444'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {metodo === opt.value && (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00E5FF' }} />
                )}
              </div>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{opt.label}</span>
            </div>
          ))}

          {/* Campos tarjeta */}
          {metodo === 'tarjeta' && (
            <div style={{ marginTop: 20, background: '#111', borderRadius: 16, padding: 16,
              border: '1px solid #1e1e1e' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 14 }}>
                <span style={{ fontSize: 20 }}>💳</span>
                <span style={{ fontSize: 13, color: '#555', fontWeight: 700 }}>VISA</span>
                <span style={{ fontSize: 13, color: '#555', fontWeight: 700 }}>MC</span>
              </div>

              <Field label="Número de tarjeta">
                <input
                  value={cardNum}
                  onChange={e => setCardNum(formatCard(e.target.value))}
                  placeholder="•••• •••• •••• ####"
                  maxLength={19}
                  style={{ ...iStyle, letterSpacing: '0.1em' }}
                />
              </Field>
              <Field label="Nombre en tarjeta">
                <input value={cardName} onChange={e => setCardName(e.target.value)}
                  placeholder="NOMBRE APELLIDO" style={{ ...iStyle, textTransform: 'uppercase' }} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Vencimiento">
                  <input value={cardExp} onChange={e => setCardExp(e.target.value)}
                    placeholder="MM/AA" maxLength={5} style={iStyle} />
                </Field>
                <Field label="CVV">
                  <div style={{ position: 'relative' }}>
                    <input
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value.slice(0, 3))}
                      type={showCvv ? 'text' : 'password'}
                      placeholder="•••"
                      maxLength={3}
                      style={{ ...iStyle, paddingRight: 40 }}
                    />
                    <button
                      onClick={() => setShowCvv(s => !s)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#555' }}
                    >{showCvv ? '🙈' : '👁️'}</button>
                  </div>
                </Field>
              </div>

              <div
                onClick={() => setSaveCard(s => !s)}
                style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', marginTop: 4 }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  background: saveCard ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)' : '#222',
                  border: saveCard ? 'none' : '1px solid #444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#000',
                }}>{saveCard ? '✓' : ''}</div>
                <span style={{ color: '#666', fontSize: 13 }}>Guardar tarjeta para próximas compras</span>
              </div>
            </div>
          )}

          <button
            onClick={confirmarPago}
            className="btn-brand"
            style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 16, marginTop: 24,
              boxShadow: '0 0 30px rgba(0,229,255,0.2)' }}
          >
            Pagar ${totalPrice.toFixed(2)}
          </button>
        </div>
        <IonLoading isOpen={saving} message="Procesando pago..." />
      </IonContent>
    </IonPage>
  );

  /* ── PASO 4: CONFIRMACIÓN ───────────────────────────────────── */
  return (
    <IonPage>
      <IonContent style={{ '--background': '#000' } as React.CSSProperties}>
        <div style={{ padding: '52px 20px 48px', textAlign: 'center' }}>
          <StepBar step={4} />

          {/* Círculo éxito */}
          <div style={{
            width: 100, height: 100, borderRadius: '50%', margin: '0 auto 24px',
            background: 'linear-gradient(135deg,#00F5A0,#00E5FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 48, boxShadow: '0 0 60px rgba(0,245,160,0.4)',
          }}>✓</div>

          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 24, margin: '0 0 8px' }}>
            ¡Pedido confirmado! 🎉
          </h1>
          <p style={{ color: '#555', fontSize: 14, margin: '0 0 24px' }}>
            Gracias por tu compra en e-PetPlace
          </p>

          {/* Número de orden */}
          <div style={{ background: '#111', borderRadius: 14, padding: '12px 20px',
            border: '1px solid #1e1e1e', display: 'inline-block', marginBottom: 24 }}>
            <p style={{ color: '#555', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
              Número de orden
            </p>
            <p style={{ color: '#00E5FF', fontWeight: 900, fontSize: 18, margin: 0 }}>
              #{numOrden}
            </p>
          </div>

          {/* Resumen */}
          <div style={{ background: '#111', borderRadius: 16, padding: 16,
            border: '1px solid #1e1e1e', textAlign: 'left', marginBottom: 16 }}>
            <p style={{ color: '#555', fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
              Tu pedido
            </p>
            {items.map(item => (
              <div key={item.producto_id} style={{ display: 'flex', justifyContent: 'space-between',
                marginBottom: 6 }}>
                <span style={{ color: '#888', fontSize: 13 }}>{item.imagen_emoji} {item.nombre} x{item.cantidad}</span>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                  ${(item.precio * item.cantidad).toFixed(2)}
                </span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #222', paddingTop: 10, marginTop: 10,
              display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontWeight: 700 }}>Total</span>
              <span style={{ color: '#00E5FF', fontWeight: 900 }}>${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Dirección + tiempo */}
          {dir && (
            <div style={{ background: '#111', borderRadius: 14, padding: 14,
              border: '1px solid #1e1e1e', textAlign: 'left', marginBottom: 16 }}>
              <p style={{ color: '#555', fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', margin: '0 0 6px' }}>Enviar a</p>
              <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>{dir}, {ciudad}</p>
            </div>
          )}

          <div style={{ background: 'rgba(0,245,160,0.08)', borderRadius: 14, padding: 14,
            border: '1px solid rgba(0,245,160,0.2)', marginBottom: 24 }}>
            <p style={{ color: '#00F5A0', fontWeight: 700, fontSize: 14, margin: 0 }}>
              📦 Preparando tu pedido
            </p>
            <p style={{ color: '#555', fontSize: 12, margin: '4px 0 0' }}>
              Tiempo estimado de entrega: 2-3 días hábiles
            </p>
          </div>

          <button
            onClick={volverInicio}
            className="btn-brand"
            style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 16,
              boxShadow: '0 0 30px rgba(0,229,255,0.2)' }}
          >
            Volver al inicio
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

/* ── Helpers internos ────────────────────────────────────────── */
const BackBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} style={{
    background:'#111', border:'1px solid #222', borderRadius:10,
    width:36, height:36, color:'#fff', fontSize:18, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20,
  }}>‹</button>
);

const SummaryRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = '#fff' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
    <span style={{ color: '#666', fontSize: 13 }}>{label}</span>
    <span style={{ color, fontSize: 13, fontWeight: 600 }}>{value}</span>
  </div>
);

export default Checkout;
