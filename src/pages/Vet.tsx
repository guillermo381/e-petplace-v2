/*
-- SQL to run in Supabase SQL Editor:
CREATE TABLE citas (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id),
  mascota_id        uuid REFERENCES mascotas(id),
  veterinario_nombre text,
  clinica           text,
  fecha             date,
  hora              time,
  motivo            text,
  precio            numeric,
  estado            text DEFAULT 'pendiente',
  created_at        timestamptz DEFAULT now()
);
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own citas" ON citas USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Soporte para citas de invitados (ejecutar si aún no existe):
ALTER TABLE citas ADD COLUMN IF NOT EXISTS guest_email text;
CREATE POLICY "Guest citas insert" ON citas FOR INSERT WITH CHECK (user_id IS NULL);
*/

import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonContent, IonModal, IonSegment, IonSegmentButton,
  IonLabel, IonSelect, IonSelectOption, IonTextarea, IonLoading,
} from '@ionic/react';
import { Session } from '@supabase/supabase-js';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

/* ── Tipos ───────────────────────────────────────────────────── */
interface Vet {
  id: number; nombre: string; especialidad: string; clinica: string;
  rating: number; reviews: number; distancia: string; precio: number;
  disponible: boolean; foto: string; horario: string; especialidades: string[];
}
interface Mascota { id: string; nombre: string; especie: string }
interface Cita {
  id: string; veterinario_nombre: string; clinica: string;
  fecha: string; hora: string; motivo: string; precio: number;
  estado: string; mascota_id: string;
}
interface Props { session: Session | null }

/* ── Datos locales ───────────────────────────────────────────── */
const VETS: Vet[] = [
  { id:1, nombre:'Dr. Carlos Mendoza',  especialidad:'Medicina General',       clinica:'VetCare Quito Norte',       rating:4.9, reviews:127, distancia:'0.8 km', precio:35, disponible:true,  foto:'👨‍⚕️', horario:'Lun-Vie 8am-6pm',  especialidades:['Perros','Gatos'] },
  { id:2, nombre:'Dra. Ana Rodríguez',  especialidad:'Cirugía Veterinaria',     clinica:'Animal Health Center',      rating:4.8, reviews:89,  distancia:'1.2 km', precio:55, disponible:true,  foto:'👩‍⚕️', horario:'Lun-Sab 9am-7pm',  especialidades:['Perros','Gatos','Exóticos'] },
  { id:3, nombre:'Dr. Roberto Silva',   especialidad:'Dermatología Animal',     clinica:'PetClinic Ecuador',         rating:4.7, reviews:203, distancia:'2.1 km', precio:45, disponible:false, foto:'👨‍⚕️', horario:'Mar-Sab 8am-5pm',  especialidades:['Perros'] },
  { id:4, nombre:'Dra. María Torres',   especialidad:'Cardiología Veterinaria', clinica:'Centro Veterinario Sur',    rating:5.0, reviews:56,  distancia:'3.4 km', precio:65, disponible:true,  foto:'👩‍⚕️', horario:'Lun-Vie 10am-8pm', especialidades:['Perros','Gatos'] },
  { id:5, nombre:'Dr. Juan Pérez',      especialidad:'Medicina Exóticos',       clinica:'ExoticVet Quito',           rating:4.6, reviews:41,  distancia:'4.0 km', precio:50, disponible:true,  foto:'👨‍⚕️', horario:'Lun-Sab 9am-6pm',  especialidades:['Exóticos'] },
  { id:6, nombre:'Dra. Sofia Vega',     especialidad:'Emergencias 24/7',        clinica:'VetEmergencias Ecuador',    rating:4.9, reviews:312, distancia:'1.8 km', precio:80, disponible:true,  foto:'👩‍⚕️', horario:'24/7',              especialidades:['Perros','Gatos','Exóticos','Emergencias'] },
];

const FILTROS = ['Todos', 'Perros', 'Gatos', 'Exóticos', 'Emergencias'];
const HORARIOS = ['9:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
const MOTIVOS  = ['Consulta general', 'Vacunación', 'Control de peso', 'Síntomas específicos', 'Seguimiento'];

const ESTADO_COLOR: Record<string, string> = {
  pendiente:  '#FFE600',
  confirmada: '#00E5FF',
  completada: '#00F5A0',
  cancelada:  '#555',
};

/* ── Helpers ─────────────────────────────────────────────────── */
function getProximos7Dias() {
  const dias: { label: string; value: string }[] = [];
  const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const label = `${DIAS[d.getDay()]} ${d.getDate()}`;
    const value = d.toISOString().split('T')[0];
    dias.push({ label, value });
  }
  return dias;
}

/* ── Componentes pequeños ────────────────────────────────────── */
const Toast: React.FC<{ msg: string }> = ({ msg }) => (
  <div style={{
    position:'fixed', bottom:84, left:'50%', transform:'translateX(-50%)',
    background:'#111', border:'1px solid #333', borderRadius:12,
    padding:'12px 20px', color:'#fff', fontSize:14, fontWeight:600,
    zIndex:9999, whiteSpace:'nowrap', boxShadow:'0 4px 24px rgba(0,0,0,0.6)',
  }}>{msg}</div>
);

/* ════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════════ */
const Vet: React.FC<Props> = ({ session }) => {
  const history  = useHistory();
  const { addToCart } = useCart();
  const [filtro,       setFiltro]       = useState('Todos');
  const [busqueda,     setBusqueda]     = useState('');
  const [mascotas,     setMascotas]     = useState<Mascota[]>([]);
  const [citas,        setCitas]        = useState<Cita[]>([]);
  const [vetModal,     setVetModal]     = useState<Vet | null>(null);
  const [tab,          setTab]          = useState<'buscar' | 'citas'>('buscar');
  const [toast,        setToast]        = useState('');
  const [saving,       setSaving]       = useState(false);

  // Modal state
  const [mascotaSel,   setMascotaSel]   = useState('');
  const [fechaSel,     setFechaSel]     = useState('');
  const [horaSel,      setHoraSel]      = useState('');
  const [motivoSel,    setMotivoSel]    = useState('');
  const [notas,        setNotas]        = useState('');

  const dias = getProximos7Dias();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchData = useCallback(async () => {
    if (!session) return;
    const uid = session.user.id;
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from('mascotas').select('id,nombre,especie').eq('user_id', uid).order('nombre'),
      supabase.from('citas').select('*').eq('user_id', uid).order('fecha', { ascending: false }),
    ]);
    if (m) setMascotas(m);
    if (c) setCitas(c);
  }, [session?.user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Filtrado ──────────────────────────────────────────────── */
  const vetsFiltrados = VETS.filter(v => {
    const matchFiltro = filtro === 'Todos' || v.especialidades.includes(filtro);
    const q = busqueda.toLowerCase();
    const matchBusqueda = !q || v.nombre.toLowerCase().includes(q) ||
      v.clinica.toLowerCase().includes(q) || v.especialidad.toLowerCase().includes(q);
    return matchFiltro && matchBusqueda;
  });

  /* ── Abrir modal ───────────────────────────────────────────── */
  const abrirModal = (vet: Vet) => {
    setVetModal(vet);
    setMascotaSel(mascotas[0]?.id ?? '');
    setFechaSel(dias[0].value);
    setHoraSel('');
    setMotivoSel('');
    setNotas('');
  };

  /* ── Confirmar cita → agregar al carrito ──────────────────── */
  const confirmarCita = () => {
    if (!vetModal || !fechaSel || !horaSel || !motivoSel) {
      showToast('Completa todos los campos requeridos');
      return;
    }

    const fechaLabel = dias.find(d => d.value === fechaSel)?.label ?? fechaSel;

    addToCart({
      producto_id:  `cita-${vetModal.id}-${Date.now()}`,
      nombre:       `Cita Veterinaria — ${vetModal.nombre}`,
      precio:       vetModal.precio,
      imagen_emoji: '🗓️',
      tipo:         'cita',
      subtitulo:    `${vetModal.clinica} · ${fechaLabel} ${horaSel}`,
      metadata: {
        veterinario_nombre: vetModal.nombre,
        clinica:            vetModal.clinica,
        fecha:              fechaSel,
        hora:               horaSel,
        motivo:             motivoSel,
      },
    });

    setVetModal(null);
    showToast('¡Cita agregada al carrito! Procede al pago para confirmarla 🗓️');
  };

  /* ── Cancelar cita ─────────────────────────────────────────── */
  const cancelarCita = async (id: string) => {
    await supabase.from('citas').update({ estado: 'cancelada' }).eq('id', id);
    await fetchData();
    showToast('Cita cancelada');
  };

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <IonPage>
      <IonContent style={{ '--background': '#000' } as React.CSSProperties}>
        <div style={{ paddingBottom: 80 }}>

          {/* ── ZONA 1: HEADER ─────────────────────────────────── */}
          <div style={{ padding: '52px 20px 0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <button
                onClick={() => history.goBack()}
                style={{ background:'#111', border:'1px solid #222', borderRadius:10,
                  width:36, height:36, color:'#fff', fontSize:18, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
              >‹</button>
              <h1 style={{ color:'#fff', fontWeight:800, fontSize:22, margin:0 }}>Veterinarios</h1>
            </div>

            {/* Buscador */}
            <div style={{ position:'relative', marginBottom:16 }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                fontSize:16, color:'#555' }}>🔍</span>
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar clínica o especialidad..."
                style={{ width:'100%', boxSizing:'border-box', background:'#111',
                  border:'1px solid #222', borderRadius:12, padding:'12px 16px 12px 40px',
                  color:'#fff', fontSize:14 }}
              />
            </div>

            {/* Filtros */}
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }} className="no-scrollbar">
              {FILTROS.map(f => (
                <button key={f} onClick={() => setFiltro(f)} style={{
                  flexShrink:0, padding:'8px 16px', borderRadius:20, fontSize:13,
                  fontWeight:600, cursor:'pointer', border:'none', transition:'all 0.2s',
                  background: filtro === f
                    ? 'linear-gradient(90deg, #FF2D9B, #00E5FF)'
                    : '#111',
                  color: filtro === f ? '#000' : '#666',
                  boxShadow: filtro === f ? '0 0 12px rgba(0,229,255,0.3)' : 'none',
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* ── TABS buscar / mis citas ─────────────────────────── */}
          <div style={{ display:'flex', margin:'20px 20px 0', background:'#111',
            border:'1px solid #222', borderRadius:14, padding:4 }}>
            {(['buscar', 'citas'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex:1, padding:'10px 0', borderRadius:10, fontSize:14, fontWeight:700,
                border:'none', cursor:'pointer', transition:'all 0.2s',
                background: tab === t ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)' : 'transparent',
                color: tab === t ? '#000' : '#555',
              }}>
                {t === 'buscar' ? '🔍 Buscar' : `📅 Mis Citas${citas.length ? ` (${citas.filter(c=>c.estado!=='cancelada').length})` : ''}`}
              </button>
            ))}
          </div>

          {tab === 'buscar' ? (
            <div style={{ padding:'0 20px' }}>

              {/* ── ZONA 2: BANNER URGENCIA ──────────────────────── */}
              <div style={{
                marginTop:20, borderRadius:16, padding:'18px 20px',
                background:'linear-gradient(135deg, #FF2D9B, #00E5FF)',
                display:'flex', alignItems:'center', justifyContent:'space-between',
              }}>
                <div>
                  <p style={{ color:'#fff', fontWeight:800, fontSize:16, margin:0 }}>🚨 ¿Emergencia?</p>
                  <p style={{ color:'rgba(255,255,255,0.85)', fontSize:13, margin:'4px 0 0' }}>
                    Línea 24/7 disponible
                  </p>
                </div>
                <button style={{
                  background:'#fff', color:'#FF2D9B', fontWeight:700, fontSize:13,
                  border:'none', borderRadius:10, padding:'10px 16px', cursor:'pointer',
                  flexShrink:0,
                }}>Llamar ahora</button>
              </div>

              {/* ── ZONA 3: CARDS VETERINARIOS ───────────────────── */}
              <p style={{ color:'#555', fontSize:12, fontWeight:600, letterSpacing:'0.08em',
                textTransform:'uppercase', marginTop:24, marginBottom:12 }}>
                {vetsFiltrados.length} veterinarios encontrados
              </p>

              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {vetsFiltrados.map(vet => (
                  <div key={vet.id} style={{
                    background:'#111', borderRadius:16, padding:16,
                    border:'1px solid #1e1e1e',
                  }}>
                    <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                      {/* Avatar */}
                      <div style={{
                        width:56, height:56, borderRadius:'50%', flexShrink:0,
                        background:'linear-gradient(135deg,#FF2D9B,#00E5FF)',
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
                      }}>{vet.foto}</div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                          <p style={{ color:'#fff', fontWeight:700, fontSize:15, margin:0 }}>{vet.nombre}</p>
                          <span style={{
                            fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:20, flexShrink:0,
                            background: vet.disponible ? 'rgba(0,245,160,0.12)' : 'rgba(80,80,80,0.2)',
                            color: vet.disponible ? '#00F5A0' : '#555',
                          }}>
                            {vet.disponible ? '● Disponible hoy' : '● No disponible'}
                          </span>
                        </div>
                        <p style={{ color:'#00E5FF', fontSize:13, margin:'2px 0 0', fontWeight:600 }}>{vet.especialidad}</p>
                        <p style={{ color:'#555', fontSize:12, margin:'2px 0 0' }}>{vet.clinica}</p>

                        <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
                          <span style={{ color:'#ccc', fontSize:12 }}>⭐ {vet.rating} <span style={{ color:'#555' }}>({vet.reviews})</span></span>
                          <span style={{ color:'#ccc', fontSize:12 }}>📍 {vet.distancia}</span>
                          <span style={{ color:'#ccc', fontSize:12 }}>💰 desde ${vet.precio}</span>
                        </div>

                        <p style={{ color:'#444', fontSize:11, margin:'6px 0 0' }}>🕐 {vet.horario}</p>
                      </div>
                    </div>

                    {vet.disponible && (
                      <button
                        onClick={() => abrirModal(vet)}
                        className="btn-brand"
                        style={{
                          width:'100%', marginTop:14, padding:'12px 0',
                          borderRadius:12, fontSize:14,
                        }}
                      >
                        Agendar cita
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          ) : (

            /* ── ZONA 5: MIS CITAS ──────────────────────────────── */
            <div style={{ padding:'0 20px' }}>
              {citas.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 0', color:'#444' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
                  <p style={{ fontWeight:600, fontSize:16 }}>Sin citas agendadas</p>
                  <p style={{ fontSize:13, marginTop:4 }}>Agenda tu primera consulta veterinaria</p>
                  <button onClick={() => setTab('buscar')} className="btn-brand"
                    style={{ marginTop:20, padding:'12px 28px', borderRadius:12, fontSize:14 }}>
                    Buscar veterinario
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:20 }}>
                  {citas.map(cita => {
                    const mascota = mascotas.find(m => m.id === cita.mascota_id);
                    return (
                      <div key={cita.id} style={{
                        background:'#111', borderRadius:16, padding:16,
                        border:`1px solid ${ESTADO_COLOR[cita.estado] ?? '#222'}22`,
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                          <div>
                            <p style={{ color:'#fff', fontWeight:700, fontSize:15, margin:0 }}>
                              {cita.veterinario_nombre}
                            </p>
                            <p style={{ color:'#555', fontSize:12, margin:'2px 0 0' }}>{cita.clinica}</p>
                            {mascota && (
                              <p style={{ color:'#00E5FF', fontSize:13, margin:'4px 0 0' }}>
                                🐾 {mascota.nombre}
                              </p>
                            )}
                            <p style={{ color:'#888', fontSize:12, margin:'4px 0 0' }}>
                              📅 {new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-EC', { weekday:'short', day:'numeric', month:'short' })} · {cita.hora.slice(0,5)}
                            </p>
                            <p style={{ color:'#666', fontSize:12, margin:'2px 0 0' }}>
                              {cita.motivo} · ${cita.precio}
                            </p>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <span style={{
                              fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20,
                              background: `${ESTADO_COLOR[cita.estado]}18`,
                              color: ESTADO_COLOR[cita.estado] ?? '#888',
                            }}>
                              {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                            </span>
                            {cita.estado === 'pendiente' && (
                              <button
                                onClick={() => cancelarCita(cita.id)}
                                style={{
                                  display:'block', marginTop:8, marginLeft:'auto',
                                  background:'rgba(255,45,155,0.1)', border:'1px solid rgba(255,45,155,0.25)',
                                  borderRadius:8, color:'#FF2D9B', fontSize:12,
                                  padding:'5px 10px', cursor:'pointer',
                                }}
                              >Cancelar</button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── ZONA 4: MODAL AGENDAR ──────────────────────────────── */}
        <IonModal
          isOpen={!!vetModal}
          onDidDismiss={() => setVetModal(null)}
          breakpoints={[0, 0.9]}
          initialBreakpoint={0.9}
        >
          <div style={{ background:'#0a0a0a', height:'100%', overflow:'auto', padding:'24px 20px 40px' }}>
            {vetModal && (
              <>
                {/* Header modal */}
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
                  <div style={{
                    width:52, height:52, borderRadius:'50%', flexShrink:0,
                    background:'linear-gradient(135deg,#FF2D9B,#00E5FF)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
                  }}>{vetModal.foto}</div>
                  <div>
                    <p style={{ color:'#fff', fontWeight:700, fontSize:16, margin:0 }}>{vetModal.nombre}</p>
                    <p style={{ color:'#00E5FF', fontSize:13, margin:'2px 0 0' }}>{vetModal.especialidad}</p>
                    <p style={{ color:'#555', fontSize:12, margin:'2px 0 0' }}>{vetModal.clinica}</p>
                  </div>
                </div>

                {/* Mascota */}
                <ModalSection title="Selecciona tu mascota">
                  {mascotas.length === 0 ? (
                    <p style={{ color:'#555', fontSize:13 }}>No tienes mascotas registradas. Agrega una primero.</p>
                  ) : (
                    <IonSegment
                      value={mascotaSel}
                      onIonChange={e => setMascotaSel(e.detail.value as string)}
                      style={{ '--background': '#111' } as React.CSSProperties}
                    >
                      {mascotas.map(m => (
                        <IonSegmentButton key={m.id} value={m.id}>
                          <IonLabel style={{ fontSize:13 }}>{m.nombre}</IonLabel>
                        </IonSegmentButton>
                      ))}
                    </IonSegment>
                  )}
                </ModalSection>

                {/* Fecha */}
                <ModalSection title="Selecciona fecha">
                  <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }} className="no-scrollbar">
                    {dias.map(d => (
                      <button key={d.value} onClick={() => setFechaSel(d.value)} style={{
                        flexShrink:0, padding:'10px 14px', borderRadius:12,
                        fontSize:13, fontWeight:600, cursor:'pointer', border:'none',
                        background: fechaSel === d.value
                          ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)'
                          : '#1a1a1a',
                        color: fechaSel === d.value ? '#000' : '#888',
                      }}>{d.label}</button>
                    ))}
                  </div>
                </ModalSection>

                {/* Hora */}
                <ModalSection title="Selecciona hora">
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {HORARIOS.map(h => (
                      <button key={h} onClick={() => setHoraSel(h)} style={{
                        padding:'10px 16px', borderRadius:12, fontSize:13, fontWeight:600,
                        cursor:'pointer', border:'none',
                        background: horaSel === h
                          ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)'
                          : '#1a1a1a',
                        color: horaSel === h ? '#000' : '#888',
                      }}>{h}</button>
                    ))}
                  </div>
                </ModalSection>

                {/* Motivo */}
                <ModalSection title="Motivo de consulta">
                  <div style={{
                    background:'#111', border:'1px solid #222', borderRadius:12,
                    overflow:'hidden',
                  }}>
                    <IonSelect
                      value={motivoSel}
                      placeholder="Seleccionar motivo..."
                      onIonChange={e => setMotivoSel(e.detail.value)}
                      style={{ '--color':'#fff', '--placeholder-color':'#555', padding:'4px 0' } as React.CSSProperties}
                    >
                      {MOTIVOS.map(m => (
                        <IonSelectOption key={m} value={m}>{m}</IonSelectOption>
                      ))}
                    </IonSelect>
                  </div>
                </ModalSection>

                {/* Notas */}
                <ModalSection title="Notas adicionales (opcional)">
                  <div style={{ background:'#111', border:'1px solid #222', borderRadius:12, overflow:'hidden' }}>
                    <IonTextarea
                      value={notas}
                      onIonInput={e => setNotas(e.detail.value ?? '')}
                      placeholder="Describe los síntomas u observaciones..."
                      rows={3}
                      style={{ '--color':'#fff', '--placeholder-color':'#555', '--background':'transparent', padding:'4px 8px' } as React.CSSProperties}
                    />
                  </div>
                </ModalSection>

                {/* Confirmar */}
                <button
                  onClick={confirmarCita}
                  className="btn-brand"
                  disabled={saving}
                  style={{
                    width:'100%', marginTop:24, padding:'16px 0',
                    borderRadius:14, fontSize:16,
                    boxShadow:'0 0 30px rgba(0,229,255,0.2)',
                  }}
                >
                  Agregar al carrito — ${vetModal.precio}
                </button>
              </>
            )}
          </div>
        </IonModal>

        <IonLoading isOpen={saving} message="Agendando cita..." />

        {toast && <Toast msg={toast} />}
      </IonContent>
    </IonPage>
  );
};

/* ── Sección del modal ───────────────────────────────────────── */
const ModalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom:20 }}>
    <p style={{ color:'#888', fontSize:11, fontWeight:600, letterSpacing:'0.08em',
      textTransform:'uppercase', marginBottom:10 }}>{title}</p>
    {children}
  </div>
);

export default Vet;
