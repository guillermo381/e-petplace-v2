import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { useCart } from '../context/CartContext';

interface Props { session: Session | null }

const Cart: React.FC<Props> = ({ session }) => {
  const history = useHistory();
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  return (
    <IonPage>
      <IonContent style={{ '--background': '#000' } as React.CSSProperties}>
        <div style={{ paddingBottom: items.length ? 200 : 80 }}>

          {/* ── BANNER INVITADO ─────────────────────────────────── */}
          {!session && (
            <div style={{
              margin: '0 0 0 0',
              padding: '12px 20px',
              background: 'rgba(0,229,255,0.06)',
              borderBottom: '1px solid rgba(0,229,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <p style={{ color: '#00E5FF', fontSize: 12, margin: 0, fontWeight: 500 }}>
                🔐 Inicia sesión para guardar tu carrito y ver historial de pedidos
              </p>
              <button
                onClick={() => history.replace('/')}
                style={{
                  background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)',
                  borderRadius: 8, color: '#00E5FF', fontSize: 11, fontWeight: 700,
                  padding: '5px 10px', cursor: 'pointer', flexShrink: 0,
                }}
              >
                Entrar
              </button>
            </div>
          )}

          {/* ── ZONA 1: HEADER ─────────────────────────────────── */}
          <div style={{
            padding: '52px 20px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => history.goBack()}
                style={{ background:'#111', border:'1px solid #222', borderRadius:10,
                  width:36, height:36, color:'#fff', fontSize:18, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center' }}
              >‹</button>
              <div>
                <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 20, margin: 0 }}>
                  Mi Carrito 🛒
                </h1>
                {totalItems > 0 && (
                  <p style={{ color: '#555', fontSize: 12, margin: 0 }}>
                    {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
                  </p>
                )}
              </div>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                style={{ background: 'rgba(255,45,155,0.1)', border: '1px solid rgba(255,45,155,0.25)',
                  borderRadius: 10, color: '#FF2D9B', fontSize: 13, fontWeight: 700,
                  padding: '8px 14px', cursor: 'pointer' }}
              >
                Vaciar
              </button>
            )}
          </div>

          {/* ── ZONA 2: LISTA ──────────────────────────────────── */}
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 72, marginBottom: 16 }}>🛒</div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>
                Tu carrito está vacío
              </p>
              <p style={{ color: '#555', fontSize: 14, margin: '0 0 28px' }}>
                Agrega productos desde la tienda
              </p>
              <button
                onClick={() => history.push('/tienda')}
                className="btn-brand"
                style={{ padding: '14px 32px', borderRadius: 14, fontSize: 15 }}
              >
                Ir a la tienda
              </button>
            </div>
          ) : (
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map(item => {
                const esCita = item.tipo === 'cita';
                return (
                <div key={item.producto_id} style={{
                  background: '#111', borderRadius: 16, padding: 16,
                  border: `1px solid ${esCita ? 'rgba(0,229,255,0.2)' : '#1e1e1e'}`,
                }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                      background: esCita
                        ? 'linear-gradient(135deg,rgba(0,229,255,0.15),rgba(0,229,255,0.05))'
                        : 'linear-gradient(135deg,#FF2D9B22,#00E5FF22)',
                      border: `1px solid ${esCita ? 'rgba(0,229,255,0.3)' : '#2a2a2a'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                    }}>{esCita ? '🗓️' : item.imagen_emoji}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.nombre}
                      </p>
                      {esCita && item.subtitulo && (
                        <p style={{ color: '#00E5FF', fontSize: 11, fontWeight: 500, margin: '2px 0 0',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.subtitulo}
                        </p>
                      )}
                      <p style={{ color: esCita ? '#00F5A0' : '#00E5FF', fontSize: 13, fontWeight: 600, margin: '3px 0 0' }}>
                        ${item.precio.toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.producto_id)}
                      style={{ background: 'rgba(255,45,155,0.1)', border: '1px solid rgba(255,45,155,0.2)',
                        borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >🗑️</button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                    {esCita ? (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8,
                        background: 'rgba(0,229,255,0.1)', color: '#00E5FF',
                        border: '1px solid rgba(0,229,255,0.2)',
                      }}>1 cita</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0,
                        background: '#1a1a1a', borderRadius: 12, overflow: 'hidden',
                        border: '1px solid #2a2a2a' }}>
                        <button
                          onClick={() => item.cantidad > 1
                            ? updateQuantity(item.producto_id, item.cantidad - 1)
                            : removeFromCart(item.producto_id)}
                          style={{ width: 36, height: 36, border: 'none', background: 'transparent',
                            color: '#fff', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}
                        >−</button>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15,
                          minWidth: 32, textAlign: 'center' }}>{item.cantidad}</span>
                        <button
                          onClick={() => updateQuantity(item.producto_id, item.cantidad + 1)}
                          style={{ width: 36, height: 36, border: 'none', background: 'transparent',
                            color: '#00E5FF', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}
                        >+</button>
                      </div>
                    )}
                    <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, margin: 0 }}>
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </p>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── ZONA 3: RESUMEN FIJO AL FONDO ──────────────────────── */}
        {items.length > 0 && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: '#0d0d0d', borderTop: '1px solid #1e1e1e',
            padding: '16px 20px 36px',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
          }}>
            <p style={{ color: '#555', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>
              Resumen del pedido
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
              <Row label="Subtotal"        value={`$${totalPrice.toFixed(2)}`} />
              <Row label="Envío"           value="Gratis 🎉" valueColor="#00F5A0" />
              <Row label="Descuento Prime" value="-$0.00"    valueColor="#444" />
            </div>

            <div style={{ borderTop: '1px solid #222', paddingTop: 12, marginBottom: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Total</span>
              <span style={{ color: '#00E5FF', fontWeight: 900, fontSize: 22 }}>
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => history.push('/checkout')}
              className="btn-brand"
              style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 16,
                boxShadow: '0 0 30px rgba(0,229,255,0.2)' }}
            >
              Proceder al pago →
            </button>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

const Row: React.FC<{ label: string; value: string; valueColor?: string }> = ({ label, value, valueColor = '#fff' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ color: '#666', fontSize: 13 }}>{label}</span>
    <span style={{ color: valueColor, fontSize: 13, fontWeight: 600 }}>{value}</span>
  </div>
);

export default Cart;
