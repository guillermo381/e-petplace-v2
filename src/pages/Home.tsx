import React, { useState, useEffect, useCallback } from 'react';
import logoImg from '../assets/logo.png';
import { useCart } from '../context/CartContext';
import ServicesGrid from '../components/ServicesGrid';
import {
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  useIonViewWillEnter,
} from '@ionic/react';
import { RefresherEventDetail } from '@ionic/core';
import { Session } from '@supabase/supabase-js';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/* ── Tipos ───────────────────────────────────────────────────── */
interface Profile  { id: string; nombre: string; email: string }
interface Vacuna   { id: string; nombre: string; fecha_proxima: string }
interface Mascota  {
  id: string; nombre: string; especie: string; raza?: string;
  foto_url?: string; fecha_nacimiento?: string; vacunas: Vacuna[];
}
interface Producto { id: string; nombre: string; precio: number; imagen_url?: string }

interface PedidoActivo {
  id: string;
  estado: string;
  total: number;
  created_at: string;
}

type AlertKind = 'urgente' | 'warning' | 'info';
interface SmartAlert { kind: AlertKind; title: string; sub: string; mascotaId?: string }

interface Props { session: Session }

/* ── Constantes ──────────────────────────────────────────────── */
const ESPECIE_EMOJI: Record<string, string> = {
  perro:'🐶', gato:'🐱', ave:'🐦', pez:'🐠', conejo:'🐰', otro:'🐾',
};


/* ── Helpers ─────────────────────────────────────────────────── */
const calcEdad = (fecha: string): string => {
  const ms    = Date.now() - new Date(fecha).getTime();
  const years = Math.floor(ms / (365.25 * 86_400_000));
  const months= Math.floor(ms / (30.44  * 86_400_000));
  if (years  >= 1) return `${years} año${years  !== 1 ? 's' : ''}`;
  if (months >= 1) return `${months} mes${months !== 1 ? 'es' : ''}`;
  return '< 1 mes';
};

const buildAlertas = (mascotas: Mascota[]): SmartAlert[] => {
  const alerts: SmartAlert[] = [];
  const hoy  = new Date();
  const en7  = new Date(hoy.getTime() + 7  * 86_400_000);
  const en30 = new Date(hoy.getTime() + 30 * 86_400_000);

  mascotas.forEach(m => {
    (m.vacunas ?? []).forEach(v => {
      if (!v.fecha_proxima) return;
      const f = new Date(v.fecha_proxima);
      if (f < hoy) {
        alerts.push({ kind:'urgente', title:`Vacuna vencida de ${m.nombre}`, sub:`${v.nombre} · Requiere atención inmediata`, mascotaId: m.id });
      } else if (f <= en7) {
        const d = Math.ceil((f.getTime() - hoy.getTime()) / 86_400_000);
        alerts.push({ kind:'warning', title:`${v.nombre} de ${m.nombre}`, sub:`Vence en ${d} día${d !== 1 ? 's' : ''}`, mascotaId: m.id });
      } else if (f <= en30) {
        const d = Math.ceil((f.getTime() - hoy.getTime()) / 86_400_000);
        alerts.push({ kind:'info', title:`${v.nombre} de ${m.nombre}`, sub:`Próxima en ${d} días`, mascotaId: m.id });
      }
    });
  });

  if (alerts.length === 0 && mascotas.length > 0) {
    alerts.push({ kind:'info', title:`Registra el peso mensual de ${mascotas[0].nombre}`, sub:'Sugerencia IA · Seguimiento de salud' });
    if (mascotas.length > 1)
      alerts.push({ kind:'info', title:`¿Ya revisaste a ${mascotas[1].nombre} este mes?`, sub:'Sugerencia IA · Control preventivo' });
  }

  return alerts;
};

const petHasAlert = (mascota: Mascota): boolean => {
  const hoy = new Date();
  const en7 = new Date(hoy.getTime() + 7 * 86_400_000);
  return (mascota.vacunas ?? []).some(v => {
    if (!v.fecha_proxima) return false;
    return new Date(v.fecha_proxima) <= en7;
  });
};

/* ════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════════ */
const Home: React.FC<Props> = ({ session }) => {
  const { totalItems } = useCart();
  const [loading,        setLoading]        = useState(true);
  const [profile,        setProfile]        = useState<Profile | null>(null);
  const [mascotas,       setMascotas]       = useState<Mascota[]>([]);
  const [alertas,        setAlertas]        = useState<SmartAlert[]>([]);
  const [productos,      setProductos]      = useState<Producto[]>([]);
  const [pedidoActivo,   setPedidoActivo]   = useState<PedidoActivo | null>(null);
  const [toast,          setToast]          = useState('');
  const history = useHistory();

  /* ── Fetch ───────────────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);

    const { data: prof } = await supabase
      .from('profiles').select('*').eq('id', session.user.id).single();
    if (prof) {
      setProfile(prof);
    } else {
      const nombre = session.user.user_metadata?.nombre
        ?? session.user.email?.split('@')[0] ?? 'Usuario';
      const p = { id: session.user.id, email: session.user.email!, nombre };
      await supabase.from('profiles').upsert(p);
      setProfile(p);
    }

    const { data: mascs } = await supabase
      .from('mascotas').select('*, vacunas(*)')
      .eq('user_id', session.user.id).order('nombre');

    if (mascs) {
      setMascotas(mascs as Mascota[]);
      setAlertas(buildAlertas(mascs as Mascota[]));
      const especies = [...new Set((mascs as Mascota[]).map(m => m.especie))];
      const { data: prods } = await supabase
        .from('productos').select('*')
        .in('para_especie', [...especies, 'todos']).limit(6);
      if (prods) setProductos(prods as Producto[]);
    } else {
      setAlertas(buildAlertas([]));
    }

    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('id, estado, total, created_at')
      .eq('user_id', session.user.id)
      .not('estado', 'in', '("entregado","cancelado")')
      .order('created_at', { ascending: false })
      .limit(1);
    setPedidoActivo(pedidos?.[0] ?? null);

    setLoading(false);
  }, [session]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Recarga mascotas cada vez que el usuario navega de vuelta al Home
  useIonViewWillEnter(() => { fetchAll(); });

  const onRefresh = async (e: CustomEvent<RefresherEventDetail>) => {
    await fetchAll();
    e.detail.complete();
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2400); };
  const handleService = (ruta: string, disponible: boolean) => {
    if (disponible) history.push(ruta);
    else showToast('Próximamente 🚀');
  };

  const nombre = profile?.nombre
    ?? session.user.user_metadata?.nombre
    ?? session.user.email?.split('@')[0]
    ?? 'Usuario';

  const alertaUrgente = alertas.find(a => a.kind === 'urgente') ?? alertas.find(a => a.kind === 'warning');

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ background:'var(--bg-primary)', minHeight:'100vh', paddingBottom:100 }}>

          {/* ════════════════════════════════════════════════════════
              ZONA 1 – HEADER
          ════════════════════════════════════════════════════════ */}
          <div style={{
            padding:'52px 20px 20px',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            {/* Logo + saludo */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <img src={logoImg} alt="e-PetPlace" style={{ height:36, width:'auto', display:'block' }} />
              <div>
                <p style={{ color:'#666', fontSize:11, margin:0, letterSpacing:'0.03em' }}>Buenos días,</p>
                {loading ? (
                  <IonSkeletonText animated style={{ width:88, height:15, borderRadius:6, marginTop:3 } as React.CSSProperties} />
                ) : (
                  <p style={{ color:'#fff', fontSize:16, fontWeight:800, margin:0, lineHeight:1.1 }}>{nombre}</p>
                )}
              </div>
            </div>

            {/* Carrito + Campana */}
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ position:'relative' }}>
                <button onClick={() => history.push('/carrito')} style={iconBtn}>🛒</button>
                {totalItems > 0 && (
                  <Badge label={totalItems > 9 ? '9+' : String(totalItems)} />
                )}
              </div>
              <div style={{ position:'relative' }}>
                <button style={iconBtn}>🔔</button>
                <Badge label="2" />
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════
              ZONA 2 – MIS MASCOTAS
          ════════════════════════════════════════════════════════ */}
          <section style={{ padding:'0 20px 24px' }}>
            <SectionHeader
              title="Mis mascotas"
              action={{ label:'+ Agregar', onClick:() => history.push('/biopet/new'), color:'#00E5FF' }}
            />

            {loading ? (
              <div style={{ display:'flex', gap:12, overflowX:'auto' }} className="no-scrollbar">
                {[1,2].map(k => <PetCardSkeleton key={k} />)}
              </div>
            ) : mascotas.length === 0 ? (
              <button onClick={() => history.push('/biopet/new')} style={{
                width:'100%', padding:'28px 0', borderRadius:18,
                background:'var(--bg-secondary)', border:'2px dashed var(--border-color)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:10, cursor:'pointer',
              }}>
                <span style={{ fontSize:38 }}>🐾</span>
                <p style={{ color:'#444', fontSize:13, margin:0 }}>Agrega a tu primera mascota</p>
                <div style={{
                  width:30, height:30, borderRadius:8,
                  background:'linear-gradient(90deg,#FF2D9B,#00E5FF)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#000', fontSize:18, fontWeight:800,
                }}>+</div>
              </button>
            ) : (
              <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4 }} className="no-scrollbar">
                {mascotas.map(m => (
                  <PetCard
                    key={m.id} m={m}
                    hasAlert={petHasAlert(m)}
                    onClick={() => history.push(`/biopet/${m.id}`)}
                  />
                ))}
                {/* Card "+" */}
                <button onClick={() => history.push('/biopet/new')} style={{
                  flexShrink:0, width:76, minHeight:160, borderRadius:18,
                  background:'var(--bg-secondary)', border:'2px dashed var(--border-color)',
                  display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer',
                }}>
                  <span style={{ fontSize:22, color:'#333' }}>+</span>
                  <span style={{ color:'#3a3a3a', fontSize:10, fontWeight:600 }}>Agregar</span>
                </button>
              </div>
            )}
          </section>

          {/* ════════════════════════════════════════════════════════
              ZONA 3 – ALERTA URGENTE
          ════════════════════════════════════════════════════════ */}
          {!loading && alertaUrgente && (
            <section style={{ padding:'0 20px 24px' }}>
              <div style={{
                display:'flex', borderRadius:14, overflow:'hidden',
                border:'1px solid rgba(255,45,155,0.25)',
              }}>
                {/* Borde izquierdo rosa */}
                <div style={{ width:4, background:'#FF2D9B', flexShrink:0 }} />
                <div style={{
                  flex:1, background:'#1a0a0a',
                  padding:'14px 16px',
                  display:'flex', alignItems:'center', gap:12,
                }}>
                  <div style={{
                    width:36, height:36, borderRadius:10, flexShrink:0,
                    background:'rgba(255,45,155,0.12)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
                  }}>
                    {alertaUrgente.kind === 'urgente' ? '🚨' : '⚠️'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ color:'#fff', fontSize:13, fontWeight:700, margin:0,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {alertaUrgente.title}
                    </p>
                    <p style={{ color:'#886', fontSize:11, margin:'3px 0 0' }}>
                      {alertaUrgente.sub}
                    </p>
                  </div>
                  <button
                    onClick={() => alertaUrgente.mascotaId
                      ? history.push(`/biopet/${alertaUrgente.mascotaId}`)
                      : history.push('/mascotas')}
                    style={{
                      background:'#FF2D9B', color:'#fff', border:'none',
                      borderRadius:8, padding:'6px 14px', fontSize:12,
                      fontWeight:700, cursor:'pointer', flexShrink:0,
                    }}
                  >Ver</button>
                </div>
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════════════════════
              ZONA 3b – PEDIDO ACTIVO
          ════════════════════════════════════════════════════════ */}
          {!loading && pedidoActivo && (
            <section style={{ padding:'0 20px 24px' }}>
              <ActiveOrderCard pedido={pedidoActivo} onPress={() => history.push('/mis-pedidos')} />
            </section>
          )}

          {/* ════════════════════════════════════════════════════════
              ZONA 4 – SERVICIOS (grid 2 columnas)
          ════════════════════════════════════════════════════════ */}
          <section style={{ padding:'0 20px 24px' }}>
            <SectionHeader title="Servicios" />
            <ServicesGrid onServiceClick={handleService} />
          </section>

          {/* ════════════════════════════════════════════════════════
              ZONA 5 – PARA TI (IA)
          ════════════════════════════════════════════════════════ */}
          <section style={{ padding:'0 20px 28px' }}>
            <SectionHeader
              title="Para ti"
              badge={{ label:'IA', color:'#A78BFA', bg:'rgba(167,139,250,0.12)', border:'rgba(167,139,250,0.25)' }}
              action={{ label:'Ver tienda →', onClick:() => history.push('/tienda'), color:'#00E5FF' }}
            />

            {loading ? (
              <div style={{ display:'flex', gap:12, overflowX:'auto' }} className="no-scrollbar">
                {[1,2,3].map(k => (
                  <div key={k} style={{
                    flexShrink:0, width:148, borderRadius:16,
                    background:'#111', border:'1px solid #1a1a1a', overflow:'hidden',
                  }}>
                    <IonSkeletonText animated style={{ width:'100%', height:100 } as React.CSSProperties} />
                    <div style={{ padding:'10px 12px' }}>
                      <IonSkeletonText animated style={{ width:'80%', height:12, borderRadius:5, marginBottom:6 } as React.CSSProperties} />
                      <IonSkeletonText animated style={{ width:'40%', height:14, borderRadius:5 } as React.CSSProperties} />
                    </div>
                  </div>
                ))}
              </div>
            ) : productos.length === 0 ? (
              <button onClick={() => history.push('/tienda')} style={{
                width:'100%', padding:'24px 0', borderRadius:16,
                background:'var(--bg-card)', border:'1px solid var(--border-color)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:8, cursor:'pointer',
              }}>
                <span style={{ fontSize:32 }}>🛍️</span>
                <span style={{ color:'#444', fontSize:13 }}>Explora la tienda</span>
              </button>
            ) : (
              <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4 }} className="no-scrollbar">
                {productos.map(p => <ProductCard key={p.id} p={p} onView={() => history.push('/tienda')} />)}
              </div>
            )}
          </section>

          {/* Línea decorativa */}
          <div style={{ padding:'0 20px 8px', display:'flex', gap:4 }}>
            {['#FF2D9B','#00E5FF','#FFE600'].map((c, i) => (
              <div key={i} style={{ height:2, flex: i===1 ? 2 : 1, background:c, borderRadius:2, opacity:0.2 }} />
            ))}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            position:'fixed', bottom:84, left:'50%', transform:'translateX(-50%)',
            padding:'10px 22px', borderRadius:24,
            background:'linear-gradient(90deg,#FF2D9B,#00E5FF)',
            color:'#000', fontWeight:800, fontSize:13,
            boxShadow:'0 0 30px rgba(0,229,255,0.4)',
            zIndex:9999, whiteSpace:'nowrap', pointerEvents:'none',
          }}>{toast}</div>
        )}
      </IonContent>
    </IonPage>
  );
};

/* ════════════════════════════════════════════════════════════════
   SUBCOMPONENTES
════════════════════════════════════════════════════════════════ */

/* ── Estilos compartidos ─────────────────────────────────────── */
const iconBtn: React.CSSProperties = {
  width:40, height:40, borderRadius:12,
  background:'var(--bg-secondary)', border:'1px solid var(--border-color)',
  display:'flex', alignItems:'center', justifyContent:'center',
  fontSize:18, cursor:'pointer',
};

/* ── Badge de notificación ───────────────────────────────────── */
const Badge: React.FC<{ label: string }> = ({ label }) => (
  <div style={{
    position:'absolute', top:-5, right:-5,
    minWidth:18, height:18, borderRadius:9,
    background:'#FF2D9B', color:'#fff',
    fontSize:9, fontWeight:900, padding:'0 3px',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 0 8px rgba(255,45,155,0.6)',
  }}>{label}</div>
);

/* ── Section header ──────────────────────────────────────────── */
interface BadgeProps { label: string; color: string; bg: string; border: string }
const SectionHeader: React.FC<{
  title: string;
  badge?: BadgeProps;
  action?: { label: string; onClick: () => void; color: string };
}> = ({ title, badge, action }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <h2 style={{ color:'#fff', fontSize:16, fontWeight:700, margin:0 }}>{title}</h2>
      {badge && (
        <span style={{
          fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20,
          background: badge.bg, color: badge.color, border:`1px solid ${badge.border}`,
        }}>{badge.label}</span>
      )}
    </div>
    {action && (
      <button onClick={action.onClick} style={{
        fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20,
        background:'transparent', color: action.color,
        border:`1px solid ${action.color}33`, cursor:'pointer',
      }}>{action.label}</button>
    )}
  </div>
);

/* ── Pet card skeleton ───────────────────────────────────────── */
const PetCardSkeleton: React.FC = () => (
  <div style={{
    flexShrink:0, width:148, borderRadius:18,
    background:'var(--bg-card)', border:'1px solid var(--border-color)',
    padding:'20px 12px', display:'flex', flexDirection:'column', alignItems:'center', gap:10,
  }}>
    <IonSkeletonText animated style={{ width:60, height:60, borderRadius:'50%' } as React.CSSProperties} />
    <IonSkeletonText animated style={{ width:70, height:13, borderRadius:6 } as React.CSSProperties} />
    <IonSkeletonText animated style={{ width:50, height:10, borderRadius:6 } as React.CSSProperties} />
  </div>
);

/* ── Pet card ────────────────────────────────────────────────── */
const PetCard: React.FC<{ m: Mascota; hasAlert: boolean; onClick: () => void }> = ({ m, hasAlert, onClick }) => {
  const edad = m.fecha_nacimiento ? calcEdad(m.fecha_nacimiento) : null;
  return (
    <button onClick={onClick} style={{
      flexShrink:0, width:148,
      borderRadius:18, padding:'18px 14px 14px',
      background:'linear-gradient(#111,#111) padding-box, linear-gradient(135deg,#FF2D9B,#00E5FF,#FFE600) border-box',
      border:'2px solid transparent',
      display:'flex', flexDirection:'column', alignItems:'center', gap:9,
      cursor:'pointer',
    }}>
      {/* Avatar */}
      {m.foto_url ? (
        <img src={m.foto_url} alt={m.nombre}
          style={{ width:60, height:60, borderRadius:'50%', objectFit:'cover' }} />
      ) : (
        <div style={{
          width:60, height:60, borderRadius:'50%',
          background:'linear-gradient(135deg,#FF2D9B44,#00E5FF44)',
          border:'2px solid rgba(0,229,255,0.25)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
        }}>
          {ESPECIE_EMOJI[m.especie] ?? '🐾'}
        </div>
      )}

      {/* Nombre + especie + edad */}
      <div style={{ width:'100%', textAlign:'center' }}>
        <p style={{ color:'#fff', fontSize:14, fontWeight:700, margin:0,
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {m.nombre}
        </p>
        <p style={{ color:'#666', fontSize:11, margin:'3px 0 0', textTransform:'capitalize' }}>
          {m.especie}{m.raza ? ` · ${m.raza}` : ''}
        </p>
        {edad && <p style={{ color:'#00E5FF', fontSize:11, margin:'2px 0 0', fontWeight:600 }}>{edad}</p>}
      </div>

      {/* Indicador salud */}
      <div style={{
        display:'flex', alignItems:'center', gap:4,
        padding:'3px 10px', borderRadius:20,
        background: hasAlert ? 'rgba(255,230,0,0.1)' : 'rgba(0,245,80,0.1)',
        border: hasAlert ? '1px solid rgba(255,230,0,0.22)' : '1px solid rgba(0,245,80,0.2)',
      }}>
        <div style={{
          width:6, height:6, borderRadius:'50%',
          background: hasAlert ? '#FFE600' : '#4ade80',
          boxShadow: hasAlert ? '0 0 6px rgba(255,230,0,0.8)' : '0 0 6px rgba(74,222,128,0.8)',
        }} />
        <span style={{ color: hasAlert ? '#FFE600' : '#4ade80', fontSize:10, fontWeight:600 }}>
          {hasAlert ? 'Alerta' : 'Saludable'}
        </span>
      </div>
    </button>
  );
};

/* ── Product card ────────────────────────────────────────────── */
const ProductCard: React.FC<{ p: Producto; onView: () => void }> = ({ p, onView }) => (
  <button onClick={onView} style={{
    flexShrink:0, width:148, borderRadius:16, overflow:'hidden',
    background:'var(--bg-card)', border:'1px solid var(--border-color)',
    textAlign:'left', cursor:'pointer',
  }}>
    {p.imagen_url ? (
      <img src={p.imagen_url} alt={p.nombre} style={{ width:'100%', height:100, objectFit:'cover' }} />
    ) : (
      <div style={{
        width:'100%', height:100,
        background:'linear-gradient(135deg,#FF2D9B15,#00E5FF15,#FFE60015)',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:34,
      }}>🛍️</div>
    )}
    <div style={{ padding:'10px 12px 12px' }}>
      <p style={{
        color:'#ccc', fontSize:12, fontWeight:500, margin:0,
        overflow:'hidden', display:'-webkit-box',
        WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const,
      }}>{p.nombre}</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <p style={{ color:'#00E5FF', fontSize:14, fontWeight:800, margin:0 }}>${p.precio.toFixed(2)}</p>
        <span style={{
          fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:8,
          background:'rgba(167,139,250,0.12)', color:'#A78BFA',
          border:'1px solid rgba(167,139,250,0.25)',
        }}>Ver</span>
      </div>
    </div>
  </button>
);

/* ── Active order card ───────────────────────────────────────── */
const ESTADO_LABEL: Record<string, { label: string; color: string; icon: string }> = {
  confirmado:   { label: 'Confirmado',      color: '#00E5FF', icon: '✅' },
  preparando:   { label: 'Preparando',      color: '#FFE600', icon: '📦' },
  listo_envio:  { label: 'Listo p/ envío',  color: '#A78BFA', icon: '🏷️' },
  en_camino:    { label: 'En camino',        color: '#00F5A0', icon: '🚚' },
};

const ActiveOrderCard: React.FC<{ pedido: PedidoActivo; onPress: () => void }> = ({ pedido, onPress }) => {
  const meta = ESTADO_LABEL[pedido.estado] ?? { label: pedido.estado, color: '#00E5FF', icon: '📋' };
  return (
    <div style={{
      display:'flex', borderRadius:14, overflow:'hidden',
      border:`1px solid ${meta.color}33`,
    }}>
      <div style={{ width:4, background:meta.color, flexShrink:0 }} />
      <div style={{
        flex:1, background:'#0a0a14',
        padding:'14px 16px',
        display:'flex', alignItems:'center', gap:12,
      }}>
        <div style={{
          width:36, height:36, borderRadius:10, flexShrink:0,
          background:`${meta.color}18`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
        }}>
          {meta.icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ color:'#fff', fontSize:13, fontWeight:700, margin:0 }}>
            Pedido en curso
          </p>
          <p style={{ color: meta.color, fontSize:11, margin:'3px 0 0', fontWeight:600 }}>
            {meta.label}
          </p>
        </div>
        <button
          onClick={onPress}
          style={{
            background: meta.color, color:'#000', border:'none',
            borderRadius:8, padding:'6px 14px', fontSize:12,
            fontWeight:700, cursor:'pointer', flexShrink:0,
          }}
        >Ver pedido</button>
      </div>
    </div>
  );
};

export default Home;
