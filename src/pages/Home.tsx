import React, { useState, useEffect, useCallback } from 'react';
import logoImg from '../assets/logo.jpg';
import { useCart } from '../context/CartContext';
import {
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
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

type AlertKind = 'urgente' | 'warning' | 'info';
interface SmartAlert { kind: AlertKind; title: string; sub: string }

interface Props { session: Session }

/* ── Constantes ──────────────────────────────────────────────── */
const ESPECIE_EMOJI: Record<string, string> = {
  perro:'🐶', gato:'🐱', ave:'🐦', pez:'🐠', otro:'🐾',
};

const SERVICES = [
  { icon:'🛒', name:'Nutrición',   path:'/tienda',    available:true  },
  { icon:'🏥', name:'Veterinario', path:'/vet',       available:true  },
  { icon:'🏠', name:'Guardería',   path:'/guarderia', available:false },
  { icon:'🚶', name:'Paseos',      path:'/paseos',    available:false },
  { icon:'✂️', name:'Grooming',    path:'/grooming',  available:false },
  { icon:'🐾', name:'Adopción',    path:'/adopcion',  available:true  },
] as const;

const ALERT_COLOR: Record<AlertKind, string> = {
  urgente: '#FF2D9B',
  warning: '#FFE600',
  info:    '#00E5FF',
};
const ALERT_BG: Record<AlertKind, string> = {
  urgente: 'rgba(255,45,155,0.07)',
  warning: 'rgba(255,230,0,0.06)',
  info:    'rgba(0,229,255,0.06)',
};
const ALERT_ICON: Record<AlertKind, string> = {
  urgente:'🚨', warning:'⚠️', info:'💡',
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
        alerts.push({ kind:'urgente', title:`Vacuna vencida de ${m.nombre}`, sub:`${v.nombre} · Requiere atención inmediata` });
      } else if (f <= en7) {
        const d = Math.ceil((f.getTime() - hoy.getTime()) / 86_400_000);
        alerts.push({ kind:'warning', title:`${v.nombre} de ${m.nombre}`, sub:`Vence en ${d} día${d !== 1 ? 's' : ''}` });
      } else if (f <= en30) {
        const d = Math.ceil((f.getTime() - hoy.getTime()) / 86_400_000);
        alerts.push({ kind:'info', title:`${v.nombre} de ${m.nombre}`, sub:`Próxima en ${d} días` });
      }
    });
  });

  // Sugerencias IA si no hay alertas reales
  if (alerts.length === 0 && mascotas.length > 0) {
    alerts.push({
      kind: 'info',
      title: `Registra el peso mensual de ${mascotas[0].nombre}`,
      sub: 'Sugerencia IA · Seguimiento de salud',
    });
    if (mascotas.length > 1) {
      alerts.push({
        kind: 'info',
        title: `¿Ya revisaste a ${mascotas[1].nombre} este mes?`,
        sub: 'Sugerencia IA · Control preventivo',
      });
    }
  }

  return alerts;
};


/* ════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════════ */
const Home: React.FC<Props> = ({ session }) => {
  const { totalItems } = useCart();
  const [loading,   setLoading]   = useState(true);
  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [mascotas,  setMascotas]  = useState<Mascota[]>([]);
  const [alertas,   setAlertas]   = useState<SmartAlert[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [toast,     setToast]     = useState('');
  const history = useHistory();

  /* ── Fetch ───────────────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);

    // Perfil
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

    // Mascotas + vacunas
    const { data: mascs } = await supabase
      .from('mascotas').select('*, vacunas(*)')
      .eq('user_id', session.user.id).order('nombre');

    if (mascs) {
      setMascotas(mascs as Mascota[]);
      setAlertas(buildAlertas(mascs as Mascota[]));

      const especies = [...new Set((mascs as Mascota[]).map(m => m.especie))];
      const { data: prods } = await supabase
        .from('productos').select('*')
        .in('para_especie', [...especies, 'todos']).limit(4);
      if (prods) setProductos(prods as Producto[]);
    } else {
      setAlertas(buildAlertas([]));
    }

    setLoading(false);
  }, [session]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = async (e: CustomEvent<RefresherEventDetail>) => {
    await fetchAll();
    e.detail.complete();
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  };

  const handleService = (path: string, available: boolean) => {
    if (available) history.push(path);
    else showToast('Próximamente 🚀');
  };

  const nombre = profile?.nombre
    ?? session.user.user_metadata?.nombre
    ?? session.user.email?.split('@')[0]
    ?? 'Usuario';

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ background:'#000', minHeight:'100vh', paddingBottom:100 }}>

          {/* ════════════════════════════════════════════════════════
              ZONA 1 – HEADER
          ════════════════════════════════════════════════════════ */}
          <div style={{
            padding: '52px 20px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {/* Logo + saludo */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <img src={logoImg} alt="e-PetPlace" style={{ height: 40, width: 'auto', display: 'block' }} />
              <div>
                <p style={{ color:'#888', fontSize:12, margin:0 }}>Buenos días,</p>
                {loading ? (
                  <IonSkeletonText animated style={{ width:90, height:16, borderRadius:6, marginTop:3 } as React.CSSProperties} />
                ) : (
                  <p style={{ color:'#fff', fontSize:17, fontWeight:800, margin:0, lineHeight:1.1 }}>{nombre}</p>
                )}
              </div>
            </div>

            {/* Carrito + Campana */}
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {/* Carrito */}
              <div style={{ position:'relative' }}>
                <button
                  onClick={() => history.push('/carrito')}
                  style={{
                    width:40, height:40, borderRadius:12,
                    background:'#111', border:'1px solid #222',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:18, cursor:'pointer',
                  }}>🛒</button>
                {totalItems > 0 && (
                  <div style={{
                    position:'absolute', top:-5, right:-5,
                    width:18, height:18, borderRadius:'50%',
                    background:'linear-gradient(135deg,#FF2D9B,#00E5FF)',
                    color:'#000', fontSize:9, fontWeight:900,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>{totalItems > 9 ? '9+' : totalItems}</div>
                )}
              </div>

              {/* Campana */}
              <div style={{ position:'relative' }}>
                <button style={{
                  width:40, height:40, borderRadius:12,
                  background:'#111', border:'1px solid #222',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:18, cursor:'pointer',
                }}>🔔</button>
                <div style={{
                  position:'absolute', top:-5, right:-5,
                  width:18, height:18, borderRadius:'50%',
                  background:'#FF2D9B', color:'#fff',
                  fontSize:10, fontWeight:800,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 0 8px rgba(255,45,155,0.6)',
                }}>2</div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════
              ZONA 2 – CARRUSEL DE MASCOTAS
          ════════════════════════════════════════════════════════ */}
          <Zone
            title="Mis Mascotas"
            action={{ label:'+', onClick:() => history.push('/biopet/new') }}
          >
            {loading ? (
              /* Skeleton */
              <div style={{ display:'flex', gap:12, overflowX:'auto' }} className="no-scrollbar">
                {[1,2].map(k => (
                  <div key={k} style={{
                    flexShrink:0, width:148, borderRadius:20,
                    background:'#111', border:'1px solid #1a1a1a',
                    padding:'20px 12px', display:'flex',
                    flexDirection:'column', alignItems:'center', gap:10,
                  }}>
                    <IonSkeletonText animated style={{ width:60, height:60, borderRadius:'50%' } as React.CSSProperties} />
                    <IonSkeletonText animated style={{ width:70, height:13, borderRadius:6 } as React.CSSProperties} />
                    <IonSkeletonText animated style={{ width:50, height:10, borderRadius:6 } as React.CSSProperties} />
                  </div>
                ))}
              </div>
            ) : mascotas.length === 0 ? (
              /* Estado vacío */
              <button
                onClick={() => history.push('/biopet/new')}
                style={{
                  width:'100%', padding:'28px 0', borderRadius:18,
                  background:'#111', border:'2px dashed #2a2a2a',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:10,
                  cursor:'pointer',
                }}
              >
                <span style={{ fontSize:40 }}>🐾</span>
                <p style={{ color:'#555', fontSize:13, margin:0 }}>Agrega a tu primera mascota</p>
                <div style={{
                  width:32, height:32, borderRadius:8,
                  background:'linear-gradient(90deg,#FF2D9B,#00E5FF)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#000', fontSize:20, fontWeight:800,
                }}>+</div>
              </button>
            ) : (
              /* Cards de mascotas */
              <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4 }} className="no-scrollbar">
                {mascotas.map(m => <PetCard key={m.id} m={m} onClick={() => history.push(`/biopet/${m.id}`)} />)}
                {/* Añadir mascota */}
                <button
                  onClick={() => history.push('/biopet/new')}
                  style={{
                    flexShrink:0, width:80, borderRadius:20,
                    background:'#111', border:'2px dashed #2a2a2a',
                    display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center', gap:6,
                    cursor:'pointer',
                  }}
                >
                  <span style={{ fontSize:22, color:'#333' }}>+</span>
                  <span style={{ color:'#444', fontSize:10 }}>Agregar</span>
                </button>
              </div>
            )}
          </Zone>

          {/* ════════════════════════════════════════════════════════
              ZONA 3 – ALERTAS INTELIGENTES
          ════════════════════════════════════════════════════════ */}
          <Zone
            title="⚡ Alertas"
            badge={loading ? undefined : alertas.length > 0 ? String(alertas.length) : undefined}
          >
            {loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[1,2].map(k => (
                  <div key={k} style={{ display:'flex', borderRadius:12, overflow:'hidden', border:'1px solid #1a1a1a' }}>
                    <div style={{ width:3, background:'#1a1a1a', flexShrink:0 }} />
                    <div style={{ flex:1, padding:'12px 14px', background:'#111', display:'flex', gap:10, alignItems:'center' }}>
                      <IonSkeletonText animated style={{ width:32, height:32, borderRadius:8 } as React.CSSProperties} />
                      <div style={{ flex:1 }}>
                        <IonSkeletonText animated style={{ width:'70%', height:13, borderRadius:5, marginBottom:6 } as React.CSSProperties} />
                        <IonSkeletonText animated style={{ width:'45%', height:10, borderRadius:5 } as React.CSSProperties} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : alertas.length === 0 ? (
              <div style={{
                padding:'20px 16px', borderRadius:14,
                background:'#0d1a0d', border:'1px solid rgba(0,245,100,0.15)',
                display:'flex', alignItems:'center', gap:12,
              }}>
                <span style={{ fontSize:28 }}>🎉</span>
                <div>
                  <p style={{ color:'#4ade80', fontSize:14, fontWeight:700, margin:0 }}>Todo en orden</p>
                  <p style={{ color:'#555', fontSize:12, margin:'2px 0 0' }}>Sin alertas pendientes</p>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {alertas.map((a, i) => {
                  const c = ALERT_COLOR[a.kind];
                  return (
                    <div key={i} style={{ display:'flex', borderRadius:12, overflow:'hidden', border:`1px solid ${c}18` }}>
                      {/* Barra lateral de color */}
                      <div style={{ width:3, background:c, flexShrink:0 }} />
                      <div style={{
                        flex:1, padding:'12px 14px',
                        background: ALERT_BG[a.kind],
                        display:'flex', alignItems:'center', gap:12,
                      }}>
                        <div style={{
                          width:34, height:34, borderRadius:9, flexShrink:0,
                          background:`${c}15`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:16,
                        }}>
                          {ALERT_ICON[a.kind]}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ color:'#fff', fontSize:13, fontWeight:600, margin:0,
                            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {a.title}
                          </p>
                          <p style={{ color:'#666', fontSize:11, margin:'3px 0 0' }}>{a.sub}</p>
                        </div>
                        <div style={{ color:c, fontSize:11, fontWeight:700, flexShrink:0 }}>›</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Zone>

          {/* ════════════════════════════════════════════════════════
              ZONA 4 – SERVICIOS
          ════════════════════════════════════════════════════════ */}
          <Zone title="Servicios">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {SERVICES.map(s => (
                <button
                  key={s.name}
                  onClick={() => handleService(s.path, s.available)}
                  style={{
                    padding:'16px 8px 12px',
                    borderRadius:16,
                    background:'#111',
                    border:'1px solid #1e1e1e',
                    display:'flex', flexDirection:'column',
                    alignItems:'center', gap:6,
                    cursor:'pointer',
                    position:'relative',
                    opacity: s.available ? 1 : 0.75,
                  }}
                >
                  <span style={{ fontSize:26, lineHeight:1 }}>{s.icon}</span>
                  <span style={{ color: s.available ? '#ddd' : '#777', fontSize:11, fontWeight:600 }}>
                    {s.name}
                  </span>
                  {!s.available && (
                    <span style={{
                      position:'absolute', top:6, right:6,
                      fontSize:8, fontWeight:700, padding:'2px 5px', borderRadius:6,
                      background:'rgba(255,230,0,0.12)', color:'#FFE600',
                      border:'1px solid rgba(255,230,0,0.2)',
                    }}>
                      PRONTO
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Zone>

          {/* ════════════════════════════════════════════════════════
              ZONA 5 – SUGERIDO POR IA
          ════════════════════════════════════════════════════════ */}
          <Zone
            title="✨ Para ti"
            badge="IA"
            action={{ label:'Ver tienda →', onClick:() => history.push('/tienda') }}
          >
            {loading ? (
              <div style={{ display:'flex', gap:12, overflowX:'auto' }} className="no-scrollbar">
                {[1,2,3].map(k => (
                  <div key={k} style={{
                    flexShrink:0, width:148, borderRadius:16,
                    background:'#111', border:'1px solid #1a1a1a', overflow:'hidden',
                  }}>
                    <IonSkeletonText animated style={{ width:'100%', height:104 } as React.CSSProperties} />
                    <div style={{ padding:'10px 12px' }}>
                      <IonSkeletonText animated style={{ width:'80%', height:12, borderRadius:5, marginBottom:6 } as React.CSSProperties} />
                      <IonSkeletonText animated style={{ width:'40%', height:14, borderRadius:5 } as React.CSSProperties} />
                    </div>
                  </div>
                ))}
              </div>
            ) : productos.length === 0 ? (
              <button
                onClick={() => history.push('/tienda')}
                style={{
                  width:'100%', padding:'24px 0', borderRadius:16,
                  background:'#111', border:'1px solid #1e1e1e',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                  cursor:'pointer',
                }}
              >
                <span style={{ fontSize:32 }}>🛍️</span>
                <span style={{ color:'#555', fontSize:13 }}>Explora la tienda</span>
              </button>
            ) : (
              <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4 }} className="no-scrollbar">
                {productos.map(p => <ProductCard key={p.id} p={p} onView={() => history.push('/tienda')} />)}
              </div>
            )}
          </Zone>

          {/* Línea decorativa de marca */}
          <div style={{ padding:'4px 20px 0', display:'flex', gap:4 }}>
            {['#FF2D9B','#00E5FF','#FFE600'].map((c, i) => (
              <div key={i} style={{
                height:2, flex: i===1 ? 2 : 1,
                background:c, borderRadius:2, opacity:0.3,
              }} />
            ))}
          </div>
        </div>

        {/* ── Toast "Próximamente" ──────────────────────────────── */}
        {toast && (
          <div style={{
            position:'fixed', bottom:84, left:'50%', transform:'translateX(-50%)',
            padding:'10px 22px', borderRadius:24,
            background:'linear-gradient(90deg,#FF2D9B,#00E5FF)',
            color:'#000', fontWeight:800, fontSize:13,
            boxShadow:'0 0 30px rgba(0,229,255,0.4)',
            zIndex:9999, whiteSpace:'nowrap',
            pointerEvents:'none',
          }}>
            {toast}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

/* ════════════════════════════════════════════════════════════════
   SUBCOMPONENTES
════════════════════════════════════════════════════════════════ */

/* ── Zone wrapper ────────────────────────────────────────────── */
const Zone: React.FC<{
  title: string;
  badge?: string;
  action?: { label:string; onClick:()=>void };
  children: React.ReactNode;
}> = ({ title, badge, action, children }) => (
  <div style={{ padding:'0 20px 26px' }}>
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <h2 style={{ color:'#fff', fontSize:16, fontWeight:700, margin:0 }}>{title}</h2>
        {badge && (
          <span style={{
            fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20,
            background:'rgba(0,229,255,0.1)', color:'#00E5FF',
            border:'1px solid rgba(0,229,255,0.22)',
          }}>
            {badge}
          </span>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            fontSize:13, fontWeight:700, padding:'4px 12px', borderRadius:20,
            background:'rgba(0,229,255,0.08)', color:'#00E5FF',
            border:'1px solid rgba(0,229,255,0.2)', cursor:'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
    {children}
  </div>
);

/* ── Pet Card ────────────────────────────────────────────────── */
const PetCard: React.FC<{ m: Mascota; onClick: () => void }> = ({ m, onClick }) => {
  const edad = m.fecha_nacimiento ? calcEdad(m.fecha_nacimiento) : null;
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink:0, width:148,
        borderRadius:20, padding:'18px 14px 14px',
        /* Truco CSS: borde con gradiente */
        background:'linear-gradient(#111,#111) padding-box, linear-gradient(135deg,#FF2D9B,#00E5FF,#FFE600) border-box',
        border:'2px solid transparent',
        display:'flex', flexDirection:'column', alignItems:'center', gap:9,
        cursor:'pointer',
      }}
    >
      {/* Avatar circular */}
      {m.foto_url ? (
        <img
          src={m.foto_url}
          alt={m.nombre}
          style={{ width:60, height:60, borderRadius:'50%', objectFit:'cover' }}
        />
      ) : (
        <div style={{
          width:60, height:60, borderRadius:'50%',
          background:'linear-gradient(135deg,#FF2D9B55,#00E5FF55)',
          border:'2px solid rgba(0,229,255,0.3)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
        }}>
          {ESPECIE_EMOJI[m.especie] ?? '🐾'}
        </div>
      )}

      {/* Info */}
      <div style={{ width:'100%', textAlign:'center' }}>
        <p style={{ color:'#fff', fontSize:14, fontWeight:700, margin:0,
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {m.nombre}
        </p>
        <p style={{ color:'#888', fontSize:11, margin:'3px 0 0', textTransform:'capitalize' }}>
          {m.especie}{m.raza ? ` · ${m.raza}` : ''}
        </p>
        {edad && (
          <p style={{ color:'#00E5FF', fontSize:11, margin:'2px 0 0', fontWeight:600 }}>{edad}</p>
        )}
      </div>

      {/* Indicador de salud */}
      <div style={{
        display:'flex', alignItems:'center', gap:4,
        padding:'3px 10px', borderRadius:20,
        background:'rgba(0,245,80,0.1)', border:'1px solid rgba(0,245,80,0.2)',
      }}>
        <div style={{
          width:6, height:6, borderRadius:'50%',
          background:'#4ade80',
          boxShadow:'0 0 6px rgba(74,222,128,0.8)',
        }} />
        <span style={{ color:'#4ade80', fontSize:10, fontWeight:600 }}>Saludable</span>
      </div>
    </button>
  );
};

/* ── Product Card ────────────────────────────────────────────── */
const ProductCard: React.FC<{ p: Producto; onView: () => void }> = ({ p, onView }) => (
  <button
    onClick={onView}
    style={{
      flexShrink:0, width:148, borderRadius:16, overflow:'hidden',
      background:'#111', border:'1px solid #222',
      textAlign:'left', cursor:'pointer',
    }}
  >
    {p.imagen_url ? (
      <img src={p.imagen_url} alt={p.nombre}
        style={{ width:'100%', height:100, objectFit:'cover' }} />
    ) : (
      /* Placeholder con gradiente de marca */
      <div style={{
        width:'100%', height:100,
        background:'linear-gradient(135deg,#FF2D9B22,#00E5FF22,#FFE60022)',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:34,
      }}>
        🛍️
      </div>
    )}
    <div style={{ padding:'10px 12px 12px' }}>
      <p style={{
        color:'#ddd', fontSize:12, fontWeight:500, margin:0,
        overflow:'hidden', display:'-webkit-box',
        WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const,
      }}>
        {p.nombre}
      </p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <p style={{ color:'#00E5FF', fontSize:14, fontWeight:800, margin:0 }}>
          ${p.precio.toFixed(2)}
        </p>
        <span style={{
          fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:8,
          background:'rgba(0,229,255,0.1)', color:'#00E5FF',
          border:'1px solid rgba(0,229,255,0.2)',
        }}>
          Ver
        </span>
      </div>
    </div>
  </button>
);

export default Home;
