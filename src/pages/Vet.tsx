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
-- Soporte para citas de invitados y reserva temporal:
ALTER TABLE citas ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS estado_reserva text DEFAULT 'confirmada';
ALTER TABLE citas ADD COLUMN IF NOT EXISTS expira_en timestamptz;
CREATE POLICY "Guest citas insert" ON citas FOR INSERT WITH CHECK (user_id IS NULL);
CREATE POLICY "Guest citas update" ON citas FOR UPDATE USING (user_id IS NULL);
*/

import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonContent, IonModal, IonSegment, IonSegmentButton,
  IonLabel, IonSelect, IonSelectOption, IonTextarea, IonLoading,
  IonAlert, IonToast,
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
  estado_reserva?: string; expira_en?: string;
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
  confirmada:      '#00E5FF',
  completada:      '#00F5A0',
  cancelada:       '#555',
  pendiente_pago:  '#FFE600',
  expirada:        '#444',
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

function formatearFechaInteligente(fecha: string): string {
  const DIAS_ES   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const MESES_ES  = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const hoy       = new Date(); hoy.setHours(0,0,0,0);
  const manana    = new Date(hoy); manana.setDate(hoy.getDate() + 1);
  const finSemana = new Date(hoy); finSemana.setDate(hoy.getDate() + 6);
  // Parse as local date (avoid UTC shift)
  const [y, m, d] = fecha.split('-').map(Number);
  const target    = new Date(y, m - 1, d);
  if (target.getTime() === hoy.getTime())    return 'hoy';
  if (target.getTime() === manana.getTime()) return 'mañana';
  if (target <= finSemana)                   return `este ${DIAS_ES[target.getDay()]}`;
  return `${target.getDate()} de ${MESES_ES[target.getMonth()]}`;
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
  const history = useHistory();
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
  const [errores,      setErrores]      = useState<Record<string, string>>({});
  const [shake,        setShake]        = useState(false);
  const [alertaHoy,    setAlertaHoy]    = useState(false);
  const [toastCita,    setToastCita]    = useState({ open: false, msg: '' });
  const [ahora,        setAhora]        = useState(() => Date.now());
  const [authWall,     setAuthWall]     = useState(false);
  const [perfilTelefono, setPerfilTelefono] = useState('');
  const [telefonoInput,  setTelefonoInput]  = useState('');

  const dias = getProximos7Dias();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchData = useCallback(async () => {
    if (!session) return;
    const uid = session.user.id;
    const [{ data: m }, { data: c }, { data: prof }] = await Promise.all([
      supabase.from('mascotas').select('id,nombre,especie').eq('user_id', uid).order('nombre'),
      supabase.from('citas').select('*').eq('user_id', uid).order('fecha', { ascending: false }),
      supabase.from('profiles').select('telefono').eq('id', uid).single(),
    ]);
    if (m)    setMascotas(m);
    if (c)    setCitas(c);
    if (prof?.telefono) setPerfilTelefono(prof.telefono);
  }, [session?.user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Actualizar ahora cada 60s para recalcular tiempo restante
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

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
    if (!session) { setAuthWall(true); return; }
    setVetModal(vet);
    setMascotaSel(mascotas[0]?.id ?? '');
    setFechaSel(dias[0].value);
    setHoraSel('');
    setMotivoSel('');
    setNotas('');
    setErrores({});
  };

  /* ── Ejecutar el add al carrito (tras validar y/o confirmar) ── */
  const ejecutarAddCita = async () => {
    if (!vetModal) return;

    const expira_en = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const [hh, mm]  = horaSel.split(':');
    const horaFmt   = `${(hh ?? '00').padStart(2, '0')}:${(mm ?? '00').padStart(2, '0')}:00`;

    // Solo usuarios autenticados llegan aquí (guests son bloqueados en abrirModal)
    const { data: citaData } = await supabase
      .from('citas')
      .insert({
        user_id:            session!.user.id,
        veterinario_nombre: vetModal.nombre,
        clinica:            vetModal.clinica,
        fecha:              fechaSel,
        hora:               horaFmt,
        motivo:             motivoSel,
        precio:             vetModal.precio,
        estado:             'pendiente',
        estado_reserva:     'pendiente_pago',
        expira_en,
      })
      .select('id')
      .single();
    const cita_id = citaData?.id ?? '';

    // Guardar teléfono en profile si fue ingresado ahora
    if (!perfilTelefono && telefonoInput.trim() && session) {
      await supabase.from('profiles').update({ telefono: telefonoInput.trim() }).eq('id', session.user.id);
      setPerfilTelefono(telefonoInput.trim());
    }

    fetchData();

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
        ...(cita_id ? { cita_id } : {}),
      },
    });

    const fechaInteligente = formatearFechaInteligente(fechaSel);
    setToastCita({ open: true, msg: `🗓️ Cita agendada para ${fechaInteligente} a las ${horaSel} con ${vetModal.nombre}` });
    setVetModal(null);
  };

  /* ── Confirmar cita → validar → carrito ───────────────────── */
  const confirmarCita = () => {
    const nuevosErrores: Record<string, string> = {};
    if (!fechaSel)  nuevosErrores.fecha  = 'Selecciona una fecha';
    if (!horaSel)   nuevosErrores.hora   = 'Selecciona un horario';
    if (!motivoSel) nuevosErrores.motivo = 'Selecciona el motivo de consulta';
    if (!perfilTelefono && !telefonoInput.trim()) nuevosErrores.telefono = 'Ingresa tu teléfono para confirmar la cita';

    // Validar hora pasada si la fecha es hoy
    if (fechaSel && horaSel) {
      const hoyStr = new Date().toISOString().split('T')[0];
      if (fechaSel === hoyStr) {
        const [hh, mm] = horaSel.split(':').map(Number);
        const ahora     = new Date();
        const citaMs    = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), hh, mm).getTime();
        const limiteMs  = ahora.getTime() + 60 * 60 * 1000; // +1 hora
        if (citaMs < limiteMs) {
          nuevosErrores.hora = 'Este horario ya pasó, selecciona otro';
        }
      }
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setErrores({});

    // Si la fecha es hoy y la hora es válida → pedir confirmación
    const hoyStr = new Date().toISOString().split('T')[0];
    if (fechaSel === hoyStr) {
      setAlertaHoy(true);
      return;
    }

    ejecutarAddCita();
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
      <style>{`
        @keyframes vet-shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        .vet-shake { animation: vet-shake 0.45s ease; }
      `}</style>
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
              {!session ? (
                <AuthWallInline onLogin={() => history.push('/login?mode=register')} />
              ) : citas.length === 0 ? (
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

                    // Calcular estado efectivo y tiempo restante
                    const minRestantes = cita.expira_en
                      ? Math.floor((new Date(cita.expira_en).getTime() - ahora) / 60_000)
                      : null;
                    const efectivoReserva =
                      cita.estado_reserva === 'pendiente_pago' && minRestantes !== null && minRestantes <= 0
                        ? 'expirada'
                        : (cita.estado_reserva ?? cita.estado);

                    const badgeCfg: Record<string, { color: string; label: string }> = {
                      pendiente_pago: { color: '#FFE600', label: '⏳ Pendiente de pago' },
                      confirmada:     { color: '#00F5A0', label: '✅ Confirmada' },
                      expirada:       { color: '#555',    label: '❌ Expirada' },
                      completada:     { color: '#00E5FF', label: '✓ Completada' },
                      cancelada:      { color: '#444',    label: 'Cancelada' },
                    };
                    const badge = badgeCfg[efectivoReserva] ?? { color: '#888', label: efectivoReserva };

                    return (
                      <div key={cita.id} style={{
                        background:'#111', borderRadius:16, padding:16,
                        border:`1px solid ${badge.color}22`,
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                          <div style={{ flex:1, minWidth:0 }}>
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

                            {/* Tiempo restante para pendiente_pago */}
                            {efectivoReserva === 'pendiente_pago' && minRestantes !== null && minRestantes > 0 && (
                              <p style={{
                                fontSize:11, fontWeight:600, margin:'6px 0 0',
                                color: minRestantes < 10 ? '#FF453A' : '#888',
                              }}>
                                🕐 Expira en {minRestantes} {minRestantes === 1 ? 'minuto' : 'minutos'}
                              </p>
                            )}
                          </div>

                          <div style={{ textAlign:'right', flexShrink:0, marginLeft:12 }}>
                            <span style={{
                              fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20,
                              background: `${badge.color}18`, color: badge.color,
                              whiteSpace:'nowrap',
                            }}>
                              {badge.label}
                            </span>

                            {efectivoReserva === 'pendiente_pago' && (
                              <button
                                onClick={() => history.push('/carrito')}
                                style={{
                                  display:'block', marginTop:8, marginLeft:'auto',
                                  background:'rgba(255,230,0,0.12)', border:'1px solid rgba(255,230,0,0.3)',
                                  borderRadius:8, color:'#FFE600', fontSize:12, fontWeight:700,
                                  padding:'5px 12px', cursor:'pointer', whiteSpace:'nowrap',
                                }}
                              >Pagar ahora →</button>
                            )}

                            {cita.estado === 'pendiente' && !cita.estado_reserva && (
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
                      <button key={d.value} onClick={() => { setFechaSel(d.value); setErrores(e => ({ ...e, fecha: '' })); }} style={{
                        flexShrink:0, padding:'10px 14px', borderRadius:12,
                        fontSize:13, fontWeight:600, cursor:'pointer',
                        border: errores.fecha ? '1px solid rgba(255,69,58,0.5)' : 'none',
                        background: fechaSel === d.value
                          ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)'
                          : '#1a1a1a',
                        color: fechaSel === d.value ? '#000' : '#888',
                      }}>{d.label}</button>
                    ))}
                  </div>
                  {errores.fecha && (
                    <p style={{ color:'#FF453A', fontSize:12, margin:'6px 0 0', fontWeight:500 }}>⚠️ {errores.fecha}</p>
                  )}
                </ModalSection>

                {/* Hora */}
                <ModalSection title="Selecciona hora">
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {HORARIOS.map(h => (
                      <button key={h} onClick={() => { setHoraSel(h); setErrores(e => ({ ...e, hora: '' })); }} style={{
                        padding:'10px 16px', borderRadius:12, fontSize:13, fontWeight:600,
                        cursor:'pointer',
                        border: errores.hora ? '1px solid rgba(255,69,58,0.5)' : 'none',
                        background: horaSel === h
                          ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)'
                          : '#1a1a1a',
                        color: horaSel === h ? '#000' : '#888',
                      }}>{h}</button>
                    ))}
                  </div>
                  {errores.hora && (
                    <p style={{ color:'#FF453A', fontSize:12, margin:'6px 0 0', fontWeight:500 }}>⚠️ {errores.hora}</p>
                  )}
                </ModalSection>

                {/* Motivo */}
                <ModalSection title="Motivo de consulta">
                  <div style={{
                    background:'#111',
                    border: errores.motivo ? '1px solid rgba(255,69,58,0.5)' : '1px solid #222',
                    borderRadius:12, overflow:'hidden',
                  }}>
                    <IonSelect
                      value={motivoSel}
                      placeholder="Seleccionar motivo..."
                      onIonChange={e => { setMotivoSel(e.detail.value); setErrores(err => ({ ...err, motivo: '' })); }}
                      style={{ '--color':'#fff', '--placeholder-color':'#555', padding:'4px 0' } as React.CSSProperties}
                    >
                      {MOTIVOS.map(m => (
                        <IonSelectOption key={m} value={m}>{m}</IonSelectOption>
                      ))}
                    </IonSelect>
                  </div>
                  {errores.motivo && (
                    <p style={{ color:'#FF453A', fontSize:12, margin:'6px 0 0', fontWeight:500 }}>⚠️ {errores.motivo}</p>
                  )}
                </ModalSection>

                {/* Teléfono — solo si no está en el perfil */}
                {!perfilTelefono && (
                  <ModalSection title="Tu teléfono 📱">
                    <p style={{ color:'#555', fontSize:12, margin:'0 0 8px' }}>
                      Para confirmarte la cita necesitamos tu teléfono
                    </p>
                    <input
                      type="tel"
                      value={telefonoInput}
                      onChange={e => { setTelefonoInput(e.target.value); setErrores(err => ({ ...err, telefono: '' })); }}
                      placeholder="+593 99 000 0000"
                      style={{
                        width:'100%', boxSizing:'border-box',
                        background:'#111', border: errores.telefono ? '1px solid rgba(255,69,58,0.5)' : '1px solid #222',
                        borderRadius:12, padding:'12px 16px', color:'#fff', fontSize:14,
                      }}
                    />
                    {errores.telefono && (
                      <p style={{ color:'#FF453A', fontSize:12, margin:'6px 0 0', fontWeight:500 }}>⚠️ {errores.telefono}</p>
                    )}
                  </ModalSection>
                )}

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
                  className={`btn-brand${shake ? ' vet-shake' : ''}`}
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

        {/* Auth wall para invitados que intentan agendar */}
        <IonModal
          isOpen={authWall}
          onDidDismiss={() => setAuthWall(false)}
          breakpoints={[0, 0.45]}
          initialBreakpoint={0.45}
        >
          <div style={{ background:'#0d0d0d', height:'100%', padding:'32px 24px 48px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
            <div style={{
              width:64, height:64, borderRadius:'50%', marginBottom:16,
              background:'linear-gradient(135deg,rgba(255,45,155,0.2),rgba(0,229,255,0.2))',
              border:'1px solid rgba(0,229,255,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
            }}>🔐</div>
            <h3 style={{ color:'#fff', fontWeight:800, fontSize:18, margin:'0 0 8px' }}>
              Necesitas una cuenta
            </h3>
            <p style={{ color:'#555', fontSize:14, margin:'0 0 28px', lineHeight:1.5 }}>
              Las citas veterinarias requieren una cuenta para gestionar tu historial y recibir recordatorios.
            </p>
            <button
              onClick={() => { setAuthWall(false); history.push('/login?mode=register'); }}
              className="btn-brand"
              style={{ width:'100%', padding:'14px 0', borderRadius:12, fontSize:15, marginBottom:12 }}
            >
              Crear cuenta gratis
            </button>
            <button
              onClick={() => { setAuthWall(false); history.push('/login?mode=login'); }}
              style={{
                width:'100%', padding:'13px 0', borderRadius:12, fontSize:14,
                background:'transparent', border:'1px solid #333', color:'#888', cursor:'pointer',
              }}
            >
              Ya tengo cuenta
            </button>
          </div>
        </IonModal>

        {/* Alerta confirmación cita de hoy */}
        <IonAlert
          isOpen={alertaHoy}
          onDidDismiss={() => setAlertaHoy(false)}
          header="Cita para hoy"
          message={vetModal ? `Estás agendando una cita para HOY a las ${horaSel} con ${vetModal.nombre}. ¿Confirmas?` : ''}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Sí, confirmar', handler: () => { ejecutarAddCita(); } },
          ]}
        />

        {/* Toast inteligente de cita agregada */}
        <IonToast
          isOpen={toastCita.open}
          onDidDismiss={() => setToastCita({ open: false, msg: '' })}
          message={toastCita.msg}
          duration={4000}
          position="top"
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

/* ── Auth wall inline (tab Mis Citas para invitados) ─────────── */
const AuthWallInline: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <div style={{ textAlign:'center', padding:'60px 20px', display:'flex', flexDirection:'column', alignItems:'center' }}>
    <div style={{
      width:72, height:72, borderRadius:'50%', marginBottom:20,
      background:'linear-gradient(135deg,rgba(255,45,155,0.15),rgba(0,229,255,0.15))',
      border:'1px solid rgba(0,229,255,0.25)',
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:32,
    }}>🔐</div>
    <p style={{ color:'#fff', fontWeight:700, fontSize:17, margin:'0 0 8px' }}>
      Crea una cuenta para ver tus citas
    </p>
    <p style={{ color:'#555', fontSize:13, margin:'0 0 28px', lineHeight:1.5, maxWidth:260 }}>
      Con tu cuenta puedes gestionar citas, recibir recordatorios y ver el historial veterinario de tus mascotas.
    </p>
    <button onClick={onLogin} className="btn-brand"
      style={{ padding:'13px 32px', borderRadius:12, fontSize:14 }}>
      Crear cuenta gratis
    </button>
  </div>
);

/* ── Sección del modal ───────────────────────────────────────── */
const ModalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom:20 }}>
    <p style={{ color:'#888', fontSize:11, fontWeight:600, letterSpacing:'0.08em',
      textTransform:'uppercase', marginBottom:10 }}>{title}</p>
    {children}
  </div>
);

export default Vet;
