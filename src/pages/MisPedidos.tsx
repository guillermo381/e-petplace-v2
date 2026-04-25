/*
-- SQL para ejecutar en Supabase (campos preparados para VTEX y Seller Portal):
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS vtex_order_id text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tracking_code text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS courier text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS estado text DEFAULT 'confirmado';
*/

import React, { useState, useEffect, useCallback } from 'react';
import { IonPage, IonContent, IonModal, IonLoading } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { Session, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/* ── Tipos ───────────────────────────────────────────────────── */
interface PedidoItem {
  producto_id: string;
  nombre:      string;
  imagen_emoji: string;
  precio:      number;
  cantidad:    number;
  tipo?:       string;
  subtitulo?:  string;
  metadata?: {
    veterinario_nombre?: string;
    clinica?: string;
    fecha?: string;
    hora?: string;
    motivo?: string;
    cita_id?: string;
  };
}

interface Pedido {
  id:           string;
  numero_orden: string;
  items:        PedidoItem[];
  total:        number;
  estado:       string;
  created_at:   string;
  direccion?:   string;
  ciudad?:      string;
  metodo_pago?: string;
  guest_email?: string;
  // Preparado para VTEX — NULL hasta integración
  vtex_order_id?: string;
  tracking_code?: string;
  courier?:       string;
}

interface Props { session: Session }

/* ── Mapa de estados (preparado para VTEX / Seller Portal) ───── */
const ESTADOS: Record<string, { label: string; color: string; icon: string; descripcion: string }> = {
  confirmado:  { label: 'Confirmado',       color: '#00E5FF', icon: '📦', descripcion: 'Pedido recibido' },
  preparando:  { label: 'En preparación',   color: '#FFE600', icon: '🔄', descripcion: 'El vendedor está preparando tu pedido' },
  listo_envio: { label: 'Listo para envío', color: '#A78BFA', icon: '📬', descripcion: 'Listo para ser recogido por el courier' },
  en_camino:   { label: 'En camino',        color: '#FF6B35', icon: '🚚', descripcion: 'Tu pedido está en camino' },
  entregado:   { label: 'Entregado',        color: '#00F5A0', icon: '✅', descripcion: 'Pedido entregado exitosamente' },
  cancelado:   { label: 'Cancelado',        color: '#FF2D9B', icon: '❌', descripcion: 'Pedido cancelado' },
};

const TIMELINE_STEPS = ['confirmado', 'preparando', 'listo_envio', 'en_camino', 'entregado'];
const FILTROS = ['Todos', 'Activos', 'Entregados', 'Cancelados'] as const;
type Filtro = typeof FILTROS[number];

const METODO_LABEL: Record<string, string> = {
  tarjeta:       '💳 Tarjeta',
  transferencia: '📱 Transferencia',
  efectivo:      '💵 Efectivo',
};

/* ── Helpers ─────────────────────────────────────────────────── */
function formatFechaOrden(fecha: string): string {
  const hoy  = new Date();
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
  const d    = new Date(fecha);
  if (d.toDateString() === hoy.toDateString())  return 'Hoy';
  if (d.toDateString() === ayer.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
}

function esActivo(estado: string) {
  return !['entregado', 'cancelado'].includes(estado);
}

/* ════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════════ */
const MisPedidos: React.FC<Props> = ({ session }) => {
  const history = useHistory();
  const [pedidos,       setPedidos]       = useState<Pedido[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filtro,        setFiltro]        = useState<Filtro>('Todos');
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [toast,         setToast]         = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ── Fetch pedidos ─────────────────────────────────────────── */
  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pedidos')
      .select('id,numero_orden,items,total,estado,created_at,direccion,ciudad,metodo_pago,vtex_order_id,tracking_code,courier')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (data) setPedidos(data as Pedido[]);
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  /* ── Supabase Realtime: actualizar estado en vivo ──────────── */
  // Preparado para Seller Portal — el vendedor cambia el estado y el cliente lo ve en tiempo real
  useEffect(() => {
    if (!selectedPedido) return;
    const channel: RealtimeChannel = supabase
      .channel(`pedido-${selectedPedido.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${selectedPedido.id}` },
        (payload) => {
          const updated = payload.new as Pedido;
          setPedidos(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
          setSelectedPedido(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedPedido?.id]);

  /* ── Filtrado ──────────────────────────────────────────────── */
  const filtrados = pedidos.filter(p => {
    if (filtro === 'Activos')    return esActivo(p.estado ?? 'confirmado');
    if (filtro === 'Entregados') return p.estado === 'entregado';
    if (filtro === 'Cancelados') return p.estado === 'cancelado';
    return true;
  });

  const activos = pedidos.filter(p => esActivo(p.estado ?? 'confirmado')).length;

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <IonPage>
      <IonContent style={{ '--background': '#000' } as React.CSSProperties}>
        <div style={{ paddingBottom: 100 }}>

          {/* ── ZONA 1: HEADER ─────────────────────────────────── */}
          <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: 0 }}>Mis Pedidos</h1>
              {activos > 0 && (
                <p style={{ color: '#00E5FF', fontSize: 12, margin: '4px 0 0', fontWeight: 600 }}>
                  {activos} pedido{activos !== 1 ? 's' : ''} activo{activos !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button
              onClick={() => history.goBack()}
              style={{ background: '#111', border: '1px solid #222', borderRadius: 10,
                width: 36, height: 36, color: '#fff', fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >‹</button>
          </div>

          {/* ── ZONA 2: FILTROS ────────────────────────────────── */}
          <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8, overflowX: 'auto' }} className="no-scrollbar">
            {FILTROS.map(f => (
              <button key={f} onClick={() => setFiltro(f)} style={{
                flexShrink: 0, padding: '8px 18px', borderRadius: 20,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: filtro === f ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)' : '#111',
                color: filtro === f ? '#000' : '#666',
                boxShadow: filtro === f ? '0 0 12px rgba(0,229,255,0.3)' : 'none',
              }}>{f}</button>
            ))}
          </div>

          {/* ── ZONA 3: LISTA ──────────────────────────────────── */}
          {loading ? (
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(k => <PedidoCardSkeleton key={k} />)}
            </div>
          ) : filtrados.length === 0 ? (
            <EmptyState filtro={filtro} onTienda={() => history.push('/tienda')} />
          ) : (
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtrados.map(pedido => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onDetalle={() => setSelectedPedido(pedido)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── ZONA 4: MODAL DETALLE ──────────────────────────────── */}
        <IonModal
          isOpen={!!selectedPedido}
          onDidDismiss={() => setSelectedPedido(null)}
          breakpoints={[0, 0.98]}
          initialBreakpoint={0.98}
        >
          <div style={{ background: '#0a0a0a', height: '100%', overflowY: 'auto', paddingBottom: 48 }}>
            {selectedPedido && (
              <DetalleModal
                pedido={selectedPedido}
                onClose={() => setSelectedPedido(null)}
                onAyuda={() => showToast('Soporte disponible próximamente 🐾')}
              />
            )}
          </div>
        </IonModal>

        <IonLoading isOpen={loading} message="Cargando pedidos..." />

        {toast && (
          <div style={{
            position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
            background: '#111', border: '1px solid #333', borderRadius: 12,
            padding: '12px 20px', color: '#fff', fontSize: 14, fontWeight: 600,
            zIndex: 9999, whiteSpace: 'nowrap', boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
          }}>{toast}</div>
        )}
      </IonContent>
    </IonPage>
  );
};

/* ════════════════════════════════════════════════════════════════
   CARD DE PEDIDO
════════════════════════════════════════════════════════════════ */
const PedidoCard: React.FC<{ pedido: Pedido; onDetalle: () => void }> = ({ pedido, onDetalle }) => {
  const estado  = ESTADOS[pedido.estado] ?? ESTADOS['confirmado'];
  const hasCitas = pedido.items.some(i => i.tipo === 'cita');

  return (
    <div style={{
      background: '#111', borderRadius: 16, overflow: 'hidden',
      border: `1px solid ${estado.color}22`,
    }}>
      {/* Acento superior */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${estado.color}, transparent)` }} />

      <div style={{ padding: '14px 16px' }}>
        {/* Header card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ color: '#00E5FF', fontWeight: 800, fontSize: 14, margin: 0 }}>
              #{pedido.numero_orden}
            </p>
            <p style={{ color: '#444', fontSize: 11, margin: '3px 0 0' }}>
              {formatFechaOrden(pedido.created_at)}
            </p>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
            background: `${estado.color}18`, color: estado.color,
            border: `1px solid ${estado.color}33`,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {estado.icon} {estado.label}
          </span>
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {pedido.items.slice(0, 3).map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.imagen_emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#ccc', fontSize: 13, fontWeight: 500, margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.nombre}
                </p>
                {item.tipo === 'cita' && item.metadata?.fecha && (
                  <p style={{ color: '#00E5FF', fontSize: 11, margin: '2px 0 0' }}>
                    📅 {item.metadata.fecha} · {item.metadata.hora?.slice(0, 5)}
                  </p>
                )}
              </div>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0, flexShrink: 0 }}>
                x{item.cantidad}
              </p>
            </div>
          ))}
          {pedido.items.length > 3 && (
            <p style={{ color: '#555', fontSize: 12, margin: 0 }}>
              +{pedido.items.length - 3} producto{pedido.items.length - 3 !== 1 ? 's' : ''} más
            </p>
          )}
        </div>

        {/* Badge citas incluidas */}
        {hasCitas && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 8, marginBottom: 12,
            background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
          }}>
            <span style={{ fontSize: 13 }}>🗓️</span>
            <span style={{ color: '#00E5FF', fontSize: 11, fontWeight: 600 }}>Citas incluidas</span>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e1e1e', paddingTop: 12 }}>
          <span style={{ color: '#00E5FF', fontWeight: 900, fontSize: 18 }}>
            ${pedido.total.toFixed(2)}
          </span>
          <button
            onClick={onDetalle}
            style={{
              background: 'transparent', border: '1px solid rgba(0,229,255,0.35)',
              borderRadius: 10, color: '#00E5FF', fontSize: 13, fontWeight: 700,
              padding: '8px 16px', cursor: 'pointer',
            }}
          >
            Ver detalle →
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MODAL DETALLE
════════════════════════════════════════════════════════════════ */
const DetalleModal: React.FC<{
  pedido: Pedido;
  onClose: () => void;
  onAyuda: () => void;
}> = ({ pedido, onClose, onAyuda }) => {
  const estado   = ESTADOS[pedido.estado] ?? ESTADOS['confirmado'];
  const hasCitas = pedido.items.some(i => i.tipo === 'cita');
  const stepIdx  = TIMELINE_STEPS.indexOf(pedido.estado);

  return (
    <div style={{ padding: '28px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <p style={{ color: '#555', fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', margin: '0 0 4px' }}>Número de orden</p>
          <p style={{ color: '#00E5FF', fontWeight: 900, fontSize: 18, margin: 0 }}>#{pedido.numero_orden}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
            background: `${estado.color}18`, color: estado.color,
            border: `1px solid ${estado.color}33`,
          }}>
            {estado.icon} {estado.label}
          </span>
          <button onClick={onClose} style={{
            background: '#1a1a1a', border: '1px solid #333', borderRadius: 8,
            width: 32, height: 32, color: '#888', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
      </div>

      {/* VTEX tracking — visible cuando existan los campos */}
      {(pedido.tracking_code || pedido.vtex_order_id) && (
        <div style={{
          padding: '12px 16px', borderRadius: 12, marginBottom: 20,
          background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.3)',
        }}>
          <p style={{ color: '#FF6B35', fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>
            🚚 Rastreo de envío
          </p>
          {pedido.courier && (
            <p style={{ color: '#888', fontSize: 12, margin: 0 }}>Courier: {pedido.courier}</p>
          )}
          {pedido.tracking_code && (
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: '4px 0 0' }}>
              Código: {pedido.tracking_code}
            </p>
          )}
        </div>
      )}

      {/* Timeline de estados */}
      {pedido.estado !== 'cancelado' && (
        <Section title="Estado del pedido">
          <div style={{ padding: '4px 0' }}>
            {TIMELINE_STEPS.map((step, idx) => {
              const cfg       = ESTADOS[step];
              const done      = idx < stepIdx;
              const current   = idx === stepIdx;
              const future    = idx > stepIdx;
              const isLast    = idx === TIMELINE_STEPS.length - 1;
              return (
                <div key={step} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                  {/* Línea vertical */}
                  {!isLast && (
                    <div style={{
                      position: 'absolute', left: 11, top: 28, width: 2, height: 'calc(100% - 8px)',
                      background: done ? cfg.color : '#222',
                    }} />
                  )}
                  {/* Punto */}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    background: done ? '#00F5A0' : current ? cfg.color : '#1a1a1a',
                    border: `2px solid ${done ? '#00F5A0' : current ? cfg.color : '#333'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900, color: '#000',
                    boxShadow: current ? `0 0 10px ${cfg.color}66` : 'none',
                    position: 'relative', zIndex: 1,
                  }}>
                    {done ? '✓' : current ? '●' : ''}
                  </div>
                  {/* Texto */}
                  <div style={{ paddingBottom: isLast ? 0 : 20 }}>
                    <p style={{
                      color: done ? '#00F5A0' : current ? '#fff' : '#444',
                      fontSize: 13, fontWeight: current ? 700 : 500, margin: 0,
                    }}>
                      {cfg.icon} {cfg.label}
                    </p>
                    {current && (
                      <p style={{ color: '#555', fontSize: 11, margin: '3px 0 0' }}>{cfg.descripcion}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Productos */}
      <Section title="Productos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pedido.items.filter(i => i.tipo !== 'cita').map((item, idx) => (
            <ItemRow key={idx} item={item} />
          ))}
        </div>
      </Section>

      {/* Citas */}
      {hasCitas && (
        <Section title="🗓️ Citas veterinarias">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pedido.items.filter(i => i.tipo === 'cita').map((item, idx) => (
              <div key={idx} style={{
                background: 'rgba(0,229,255,0.06)', borderRadius: 12,
                border: '1px solid rgba(0,229,255,0.2)', padding: '12px 14px',
              }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>
                  {item.nombre}
                </p>
                {item.metadata?.veterinario_nombre && (
                  <p style={{ color: '#00E5FF', fontSize: 12, margin: '0 0 2px' }}>
                    👨‍⚕️ {item.metadata.veterinario_nombre}
                  </p>
                )}
                {item.metadata?.clinica && (
                  <p style={{ color: '#555', fontSize: 12, margin: '0 0 2px' }}>{item.metadata.clinica}</p>
                )}
                {item.metadata?.fecha && (
                  <p style={{ color: '#888', fontSize: 12, margin: 0 }}>
                    📅 {item.metadata.fecha} · {item.metadata.hora?.slice(0, 5)}
                  </p>
                )}
                <p style={{ color: '#00F5A0', fontWeight: 700, fontSize: 13, margin: '6px 0 0' }}>
                  ${item.precio.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Info de envío */}
      {(pedido.direccion || pedido.metodo_pago) && (
        <Section title="Información de envío">
          {pedido.direccion && (
            <InfoRow label="Dirección" value={`${pedido.direccion}${pedido.ciudad ? `, ${pedido.ciudad}` : ''}`} />
          )}
          {pedido.metodo_pago && (
            <InfoRow label="Método de pago" value={METODO_LABEL[pedido.metodo_pago] ?? pedido.metodo_pago} />
          )}
          <InfoRow label="Fecha" value={new Date(pedido.created_at).toLocaleString('es-EC', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })} />
        </Section>
      )}

      {/* Resumen */}
      <Section title="Resumen">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ResuRow label="Subtotal" value={`$${pedido.total.toFixed(2)}`} />
          <ResuRow label="Envío"    value="Gratis 🎉" color="#00F5A0" />
          <div style={{ borderTop: '1px solid #222', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Total</span>
            <span style={{ color: '#00E5FF', fontWeight: 900, fontSize: 18 }}>${pedido.total.toFixed(2)}</span>
          </div>
        </div>
      </Section>

      {/* Botón ayuda */}
      <button
        onClick={onAyuda}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 14,
          background: 'transparent', border: '1px solid #333', color: '#888',
          cursor: 'pointer', fontWeight: 600, marginTop: 8,
        }}
      >
        🐾 Necesito ayuda
      </button>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   ESTADO VACÍO
════════════════════════════════════════════════════════════════ */
const EmptyState: React.FC<{ filtro: Filtro; onTienda: () => void }> = ({ filtro, onTienda }) => (
  <div style={{ textAlign: 'center', padding: '80px 20px' }}>
    <div style={{ fontSize: 72, marginBottom: 16 }}>📦</div>
    <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>
      {filtro === 'Todos' ? 'Aún no tienes pedidos' : `Sin pedidos ${filtro.toLowerCase()}`}
    </p>
    <p style={{ color: '#555', fontSize: 14, margin: '0 0 28px' }}>
      {filtro === 'Todos'
        ? 'Explora nuestra tienda y haz tu primer pedido'
        : 'Cuando tengas pedidos aparecerán aquí'}
    </p>
    {filtro === 'Todos' && (
      <button onClick={onTienda} className="btn-brand"
        style={{ padding: '14px 32px', borderRadius: 14, fontSize: 15 }}>
        Ir a la tienda
      </button>
    )}
  </div>
);

/* ════════════════════════════════════════════════════════════════
   HELPERS INTERNOS
════════════════════════════════════════════════════════════════ */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <p style={{ color: '#555', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
      textTransform: 'uppercase', margin: '0 0 12px' }}>{title}</p>
    <div style={{ background: '#111', borderRadius: 14, padding: 14, border: '1px solid #1e1e1e' }}>
      {children}
    </div>
  </div>
);

const ItemRow: React.FC<{ item: PedidoItem }> = ({ item }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <span style={{ fontSize: 22, flexShrink: 0 }}>{item.imagen_emoji}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ color: '#ccc', fontSize: 13, fontWeight: 500, margin: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.nombre}
      </p>
      <p style={{ color: '#555', fontSize: 11, margin: '2px 0 0' }}>Cantidad: {item.cantidad}</p>
    </div>
    <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0, flexShrink: 0 }}>
      ${(item.precio * item.cantidad).toFixed(2)}
    </p>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 8 }}>
    <span style={{ color: '#555', fontSize: 12, flexShrink: 0 }}>{label}</span>
    <span style={{ color: '#ccc', fontSize: 12, textAlign: 'right' }}>{value}</span>
  </div>
);

const ResuRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = '#fff' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ color: '#666', fontSize: 13 }}>{label}</span>
    <span style={{ color, fontSize: 13, fontWeight: 600 }}>{value}</span>
  </div>
);

const PedidoCardSkeleton: React.FC = () => (
  <div style={{ background: '#111', borderRadius: 16, padding: 16, border: '1px solid #1e1e1e' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ width: 120, height: 16, borderRadius: 6, background: '#1e1e1e' }} />
      <div style={{ width: 80, height: 22, borderRadius: 20, background: '#1e1e1e' }} />
    </div>
    {[1, 2].map(k => (
      <div key={k} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: '#1e1e1e', flexShrink: 0 }} />
        <div style={{ flex: 1, height: 14, borderRadius: 6, background: '#1e1e1e' }} />
      </div>
    ))}
  </div>
);

export default MisPedidos;
