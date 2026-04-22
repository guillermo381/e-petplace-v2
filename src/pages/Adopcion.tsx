/*
-- SQL to run in Supabase SQL Editor:
CREATE TABLE solicitudes_adopcion (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid REFERENCES auth.users(id),
  mascota_nombre      text,
  refugio             text,
  nombre_solicitante  text,
  email               text,
  telefono            text,
  tiene_mascotas      boolean,
  espacio_exterior    boolean,
  motivo              text,
  created_at          timestamptz DEFAULT now()
);
ALTER TABLE solicitudes_adopcion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own solicitudes" ON solicitudes_adopcion
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
*/

import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonContent, IonModal, IonSegment, IonSegmentButton,
  IonLabel, IonTextarea, IonLoading,
} from '@ionic/react';
import { Session } from '@supabase/supabase-js';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/* ── Tipos ───────────────────────────────────────────────────── */
interface PetAdopcion {
  id: number; nombre: string; especie: string; raza: string; edad: string;
  sexo: string; tamaño: string; foto: string; descripcion: string;
  vacunada: boolean; esterilizada: boolean; refugio: string;
  urgente: boolean; color: string;
}

interface Props { session: Session }

/* ── Datos ───────────────────────────────────────────────────── */
const MASCOTAS: PetAdopcion[] = [
  { id:1,  nombre:'Luna',   especie:'Perro',   raza:'Labrador Mix',        edad:'2 años',   sexo:'Hembra', tamaño:'Grande',  foto:'🐕', descripcion:'Luna es una perrita dulce y juguetona que ama a los niños. Fue rescatada de la calle y está lista para encontrar su hogar forever.',                                 vacunada:true,  esterilizada:true,  refugio:'Refugio Patitas Quito',       urgente:false, color:'#FF2D9B' },
  { id:2,  nombre:'Max',    especie:'Perro',   raza:'Beagle Mix',           edad:'1 año',    sexo:'Macho',  tamaño:'Mediano', foto:'🐶', descripcion:'Max es un cachorro lleno de energía que busca una familia activa. Le encanta jugar y aprender trucos nuevos.',                                                    vacunada:true,  esterilizada:false, refugio:'Hogar Animal Ecuador',        urgente:true,  color:'#00E5FF' },
  { id:3,  nombre:'Michi',  especie:'Gato',    raza:'Doméstico',            edad:'3 años',   sexo:'Macho',  tamaño:'Mediano', foto:'🐱', descripcion:'Michi es un gato tranquilo y cariñoso, perfecto para apartamentos. Se lleva bien con otros gatos.',                                                               vacunada:true,  esterilizada:true,  refugio:'Refugio Felino Quito',        urgente:false, color:'#7C3AED' },
  { id:4,  nombre:'Bella',  especie:'Perro',   raza:'Golden Mix',           edad:'4 años',   sexo:'Hembra', tamaño:'Grande',  foto:'🦮', descripcion:'Bella es una perra adulta, muy tranquila y entrenada. Ideal para familias con experiencia.',                                                                    vacunada:true,  esterilizada:true,  refugio:'Refugio Patitas Quito',       urgente:false, color:'#FFE600' },
  { id:5,  nombre:'Simba',  especie:'Gato',    raza:'Naranja Doméstico',    edad:'6 meses',  sexo:'Macho',  tamaño:'Pequeño', foto:'😺', descripcion:'Simba es un gatito bebé, curioso y juguetón. Necesita hogar urgente junto a su hermana Nala.',                                                                  vacunada:false, esterilizada:false, refugio:'Hogar Animal Ecuador',        urgente:true,  color:'#FF2D9B' },
  { id:6,  nombre:'Nala',   especie:'Gato',    raza:'Carey Doméstica',      edad:'6 meses',  sexo:'Hembra', tamaño:'Pequeño', foto:'🐈', descripcion:'Nala es la hermana de Simba. Son inseparables y se busca hogar que pueda adoptarlos juntos.',                                                                    vacunada:false, esterilizada:false, refugio:'Hogar Animal Ecuador',        urgente:true,  color:'#00E5FF' },
  { id:7,  nombre:'Rocky',  especie:'Perro',   raza:'Bulldog Mix',          edad:'5 años',   sexo:'Macho',  tamaño:'Mediano', foto:'🐾', descripcion:'Rocky es un perro senior muy noble. Ha esperado 2 años en el refugio su oportunidad de tener familia.',                                                          vacunada:true,  esterilizada:true,  refugio:'Refugio Segunda Oportunidad', urgente:true,  color:'#FFE600' },
  { id:8,  nombre:'Cleo',   especie:'Gato',    raza:'Siamés Mix',           edad:'2 años',   sexo:'Hembra', tamaño:'Mediano', foto:'😸', descripcion:'Cleo es una gata elegante y curiosa. Le encanta mirar por la ventana y jugar con plumas.',                                                                       vacunada:true,  esterilizada:true,  refugio:'Refugio Felino Quito',        urgente:false, color:'#7C3AED' },
  { id:9,  nombre:'Thor',   especie:'Perro',   raza:'Husky Mix',            edad:'1 año',    sexo:'Macho',  tamaño:'Grande',  foto:'🐺', descripcion:'Thor (no confundir con el tuyo!) es un husky hermoso que necesita espacio y ejercicio diario.',                                                                  vacunada:true,  esterilizada:false, refugio:'Refugio Patitas Quito',       urgente:false, color:'#00E5FF' },
  { id:10, nombre:'Canela', especie:'Perro',   raza:'Salchicha Mix',        edad:'3 años',   sexo:'Hembra', tamaño:'Pequeño', foto:'🌭', descripcion:'Canela es pequeña pero con una personalidad enorme. Perfecta para apartamento y adora los mimos.',                                                               vacunada:true,  esterilizada:true,  refugio:'Hogar Animal Ecuador',        urgente:false, color:'#FF2D9B' },
  { id:11, nombre:'Pelusa', especie:'Conejo',  raza:'Angora',               edad:'1 año',    sexo:'Hembra', tamaño:'Pequeño', foto:'🐰', descripcion:'Pelusa es una conejita muy suave y tranquila. Ideal para niños. Come poco y es muy limpia.',                                                                      vacunada:true,  esterilizada:false, refugio:'Refugio Animales Exóticos',   urgente:false, color:'#FFE600' },
  { id:12, nombre:'Pico',   especie:'Ave',     raza:'Periquito',            edad:'2 años',   sexo:'Macho',  tamaño:'Pequeño', foto:'🦜', descripcion:'Pico habla y canta todo el día. Busca familia paciente que disfrute de su compañía musical.',                                                                     vacunada:false, esterilizada:false, refugio:'Refugio Animales Exóticos',   urgente:false, color:'#00E5FF' },
];

const FILTROS = ['Todos','Perros','Gatos','Aves','Conejos','Urgente ❤️‍🔥'];

/* ── Sub-componentes ─────────────────────────────────────────── */
const Toast: React.FC<{ msg: string }> = ({ msg }) => (
  <div style={{
    position:'fixed', bottom:84, left:'50%', transform:'translateX(-50%)',
    background:'#111', border:'1px solid #333', borderRadius:12,
    padding:'12px 20px', color:'#fff', fontSize:14, fontWeight:600,
    zIndex:9999, whiteSpace:'nowrap', boxShadow:'0 4px 24px rgba(0,0,0,0.6)',
  }}>{msg}</div>
);

const Chip: React.FC<{ label: string; color?: string }> = ({ label, color = '#333' }) => (
  <span style={{
    fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20,
    background:`${color}22`, color, border:`1px solid ${color}44`,
  }}>{label}</span>
);

/* ════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════════ */
const Adopcion: React.FC<Props> = ({ session }) => {
  const history = useHistory();
  const [filtro,       setFiltro]       = useState('Todos');
  const [petModal,     setPetModal]     = useState<PetAdopcion | null>(null);
  const [formModal,    setFormModal]    = useState<PetAdopcion | null>(null);
  const [toast,        setToast]        = useState('');
  const [saving,       setSaving]       = useState(false);

  // Perfil pre-llenado
  const [nombreForm,   setNombreForm]   = useState('');
  const [emailForm,    setEmailForm]    = useState('');
  const [telForm,      setTelForm]      = useState('');
  const [tieneMasc,    setTieneMasc]    = useState<'si'|'no'>('no');
  const [cualesMasc,   setCualesMasc]   = useState('');
  const [patio,        setPatio]        = useState<'si'|'no'>('no');
  const [motivoForm,   setMotivoForm]   = useState('');
  const [acuerdo,      setAcuerdo]      = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  useEffect(() => {
    const uid = session.user.id;
    supabase.from('profiles').select('nombre,email').eq('id', uid).single()
      .then(({ data }) => {
        if (data) {
          setNombreForm(data.nombre ?? '');
          setEmailForm(data.email ?? session.user.email ?? '');
        } else {
          setEmailForm(session.user.email ?? '');
        }
      });
  }, [session]);

  /* ── Filtrado ──────────────────────────────────────────────── */
  const filtradas = MASCOTAS.filter(m => {
    if (filtro === 'Todos')           return true;
    if (filtro === 'Perros')          return m.especie === 'Perro';
    if (filtro === 'Gatos')           return m.especie === 'Gato';
    if (filtro === 'Aves')            return m.especie === 'Ave';
    if (filtro === 'Conejos')         return m.especie === 'Conejo';
    if (filtro === 'Urgente ❤️‍🔥')    return m.urgente;
    return true;
  });

  const hayUrgentes = filtradas.some(m => m.urgente);

  /* ── Abrir formulario ──────────────────────────────────────── */
  const abrirFormulario = (pet: PetAdopcion) => {
    setFormModal(pet);
    setMotivoForm('');
    setAcuerdo(false);
    setTieneMasc('no');
    setCualesMasc('');
    setPatio('no');
    setTelForm('');
  };

  /* ── Enviar solicitud ──────────────────────────────────────── */
  const enviarSolicitud = async () => {
    if (!formModal || !motivoForm.trim() || !acuerdo) {
      showToast('Completa todos los campos requeridos');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('solicitudes_adopcion').insert({
      user_id:            session.user.id,
      mascota_nombre:     formModal.nombre,
      refugio:            formModal.refugio,
      nombre_solicitante: nombreForm,
      email:              emailForm,
      telefono:           telForm,
      tiene_mascotas:     tieneMasc === 'si',
      espacio_exterior:   patio === 'si',
      motivo:             motivoForm,
    });
    setSaving(false);
    if (error) { showToast('Error: ' + error.message); return; }
    setFormModal(null);
    setPetModal(null);
    showToast('¡Solicitud enviada! El refugio te contactará pronto 🐾💜');
  };

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <IonPage>
      <IonContent style={{ '--background': '#000' } as React.CSSProperties}>
        <div style={{ paddingBottom: 80 }}>

          {/* ── ZONA 1: HEADER EMOCIONAL ─────────────────────── */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(255,45,155,0.18) 0%, #000 100%)',
            padding: '52px 20px 24px',
          }}>
            <button
              onClick={() => history.goBack()}
              style={{ background:'#111', border:'1px solid #222', borderRadius:10,
                width:36, height:36, color:'#fff', fontSize:18, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}
            >‹</button>

            <h1 style={{ color:'#fff', fontWeight:800, fontSize:26, margin:'0 0 6px', lineHeight:1.2 }}>
              Encuentra tu<br />compañero 🐾
            </h1>
            <p style={{ color:'#555', fontSize:14, margin:'0 0 10px' }}>
              Estos angelitos esperan por ti
            </p>
            <span style={{ color:'#00E5FF', fontSize:13, fontWeight:700 }}>
              {MASCOTAS.length} mascotas buscan hogar
            </span>
          </div>

          {/* ── ZONA 2: FILTROS ──────────────────────────────── */}
          <div style={{ padding:'0 20px 16px', overflowX:'auto' }}>
            <div style={{ display:'flex', gap:8 }} className="no-scrollbar">
              {FILTROS.map(f => (
                <button key={f} onClick={() => setFiltro(f)} style={{
                  flexShrink:0, padding:'8px 16px', borderRadius:20,
                  fontSize:13, fontWeight:600, cursor:'pointer', border:'none',
                  background: filtro === f
                    ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)'
                    : '#111',
                  color: filtro === f ? '#000' : '#666',
                  boxShadow: filtro === f ? '0 0 12px rgba(0,229,255,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* ── ZONA 3: BANNER URGENTE ───────────────────────── */}
          {hayUrgentes && (
            <div style={{
              margin:'0 20px 16px',
              background:'rgba(255,45,155,0.08)',
              border:'1px solid rgba(255,45,155,0.3)',
              borderRadius:14, padding:'12px 16px',
            }}>
              <p style={{ color:'#FF2D9B', fontWeight:700, fontSize:13, margin:0 }}>
                ❤️‍🔥 Adopción urgente — estos bebés necesitan hogar YA
              </p>
            </div>
          )}

          {/* ── ZONA 4: GRID DE MASCOTAS ─────────────────────── */}
          <div style={{
            display:'grid', gridTemplateColumns:'1fr 1fr',
            gap:12, padding:'0 20px',
          }}>
            {filtradas.map(pet => (
              <div key={pet.id} style={{
                background:'#111', borderRadius:16, padding:14,
                border:'1px solid #1e1e1e', position:'relative',
                display:'flex', flexDirection:'column', gap:8,
              }}>
                {/* Badge urgente */}
                {pet.urgente && (
                  <div style={{
                    position:'absolute', top:10, right:10,
                    background:'rgba(255,45,155,0.15)', border:'1px solid rgba(255,45,155,0.4)',
                    borderRadius:8, padding:'2px 6px', fontSize:10, fontWeight:700, color:'#FF2D9B',
                  }}>URGENTE 🔥</div>
                )}

                {/* Avatar */}
                <div style={{
                  width:64, height:64, borderRadius:'50%',
                  background:`${pet.color}33`,
                  border:`2px solid ${pet.color}55`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:32, margin:'4px auto 0',
                }}>{pet.foto}</div>

                {/* Info */}
                <p style={{ color:'#fff', fontWeight:800, fontSize:15, margin:0, textAlign:'center' }}>
                  {pet.nombre}
                </p>
                <p style={{ color:'#666', fontSize:11, margin:0, textAlign:'center', lineHeight:1.3 }}>
                  {pet.raza}<br />{pet.edad}
                </p>

                {/* Chips */}
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', justifyContent:'center' }}>
                  <Chip label={pet.sexo}  color={pet.sexo === 'Macho' ? '#00E5FF' : '#FF2D9B'} />
                  <Chip label={pet.tamaño} color='#888' />
                </div>

                {/* Vacuna / esterilizada */}
                <div style={{ display:'flex', justifyContent:'center', gap:10 }}>
                  <span style={{ fontSize:11, color: pet.vacunada    ? '#00F5A0' : '#444' }}>
                    💉 {pet.vacunada    ? 'Vacunado' : 'Sin vacuna'}
                  </span>
                  <span style={{ fontSize:11, color: pet.esterilizada ? '#00F5A0' : '#444' }}>
                    ✂️ {pet.esterilizada ? 'Esteril.' : 'No ester.'}
                  </span>
                </div>

                {/* Refugio */}
                <p style={{ color:'#00E5FF', fontSize:10, margin:0, textAlign:'center',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {pet.refugio}
                </p>

                {/* Botón */}
                <button
                  onClick={() => setPetModal(pet)}
                  style={{
                    marginTop:4, padding:'10px 0', borderRadius:10,
                    fontSize:12, fontWeight:700, cursor:'pointer',
                    background: 'linear-gradient(#111,#111) padding-box, linear-gradient(90deg,#FF2D9B,#00E5FF) border-box',
                    border: '1.5px solid transparent',
                    color: '#fff',
                  }}
                >Ver historia</button>
              </div>
            ))}
          </div>

          {/* ── ZONA 7: DONAR ────────────────────────────────── */}
          <div style={{
            margin:'32px 20px 0',
            borderRadius:20, padding:24,
            background:'linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(255,45,155,0.15) 100%)',
            border:'1px solid rgba(124,58,237,0.3)',
          }}>
            <p style={{ color:'#fff', fontWeight:800, fontSize:17, margin:'0 0 6px' }}>
              ❤️ ¿No puedes adoptar ahora?
            </p>
            <p style={{ color:'#aaa', fontSize:13, margin:'0 0 18px', lineHeight:1.5 }}>
              Ayuda a costear alimento y cuidados médicos de estos angelitos
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {['Donar $5', 'Donar $10', 'Donar $20', 'Otro monto'].map(label => (
                <button
                  key={label}
                  onClick={() => showToast('¡Gracias por tu donación! 💜 (Simulado)')}
                  style={{
                    padding:'12px 0', borderRadius:12, fontSize:13,
                    fontWeight:700, cursor:'pointer',
                    background: label === 'Otro monto'
                      ? 'transparent'
                      : 'linear-gradient(90deg,#FF2D9B,#7C3AED)',
                    border: label === 'Otro monto'
                      ? '1px solid rgba(124,58,237,0.5)'
                      : 'none',
                    color: label === 'Otro monto' ? '#aaa' : '#fff',
                  }}
                >{label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            ZONA 5: MODAL PERFIL MASCOTA
        ══════════════════════════════════════════════════════ */}
        <IonModal
          isOpen={!!petModal}
          onDidDismiss={() => setPetModal(null)}
          breakpoints={[0, 0.95]}
          initialBreakpoint={0.95}
        >
          <div style={{ background:'#0a0a0a', height:'100%', overflow:'auto', padding:'28px 20px 48px' }}>
            {petModal && (
              <>
                {/* Header */}
                <div style={{ textAlign:'center', marginBottom:24 }}>
                  <div style={{
                    width:96, height:96, borderRadius:'50%', margin:'0 auto 14px',
                    background:`${petModal.color}33`, border:`3px solid ${petModal.color}66`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:48,
                  }}>{petModal.foto}</div>

                  {petModal.urgente && (
                    <span style={{
                      display:'inline-block', marginBottom:8,
                      background:'rgba(255,45,155,0.15)', border:'1px solid rgba(255,45,155,0.4)',
                      borderRadius:10, padding:'3px 10px', fontSize:11, fontWeight:700, color:'#FF2D9B',
                    }}>URGENTE 🔥</span>
                  )}

                  <h2 style={{ color:'#fff', fontWeight:800, fontSize:26, margin:'0 0 4px' }}>
                    {petModal.nombre}
                  </h2>
                  <p style={{ color:'#666', fontSize:14, margin:0 }}>
                    {petModal.raza} · {petModal.edad}
                  </p>
                </div>

                {/* Descripción */}
                <div style={{
                  background:'#111', borderRadius:14, padding:16, marginBottom:20,
                  border:'1px solid #1e1e1e',
                }}>
                  <p style={{ color:'#ccc', fontSize:14, lineHeight:1.6, margin:0 }}>
                    "{petModal.descripcion}"
                  </p>
                </div>

                {/* Grid características */}
                <p style={{ color:'#555', fontSize:11, fontWeight:600,
                  letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>
                  Características
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
                  {[
                    { label:'Especie',     value: petModal.especie },
                    { label:'Sexo',        value: petModal.sexo },
                    { label:'Tamaño',      value: petModal.tamaño },
                    { label:'Vacunado',    value: petModal.vacunada ? '✅ Sí' : '❌ No' },
                    { label:'Esterilizado',value: petModal.esterilizada ? '✅ Sí' : '❌ No' },
                    { label:'Refugio',     value: petModal.refugio },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      background:'#111', borderRadius:12, padding:'12px 14px',
                      border:'1px solid #1e1e1e',
                    }}>
                      <p style={{ color:'#555', fontSize:10, fontWeight:600,
                        textTransform:'uppercase', margin:'0 0 4px' }}>{label}</p>
                      <p style={{ color:'#fff', fontSize:13, fontWeight:600, margin:0 }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* ¿Por qué adoptarme? */}
                <p style={{ color:'#555', fontSize:11, fontWeight:600,
                  letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>
                  ¿Por qué adoptarme?
                </p>
                <div style={{
                  background:'#111', borderRadius:14, padding:16, marginBottom:24,
                  border:'1px solid #1e1e1e',
                }}>
                  {buildBullets(petModal).map((b, i) => (
                    <div key={i} style={{ display:'flex', gap:10, marginBottom: i < 2 ? 10 : 0 }}>
                      <span style={{ color:'#00E5FF', fontSize:16, flexShrink:0 }}>•</span>
                      <p style={{ color:'#ccc', fontSize:13, lineHeight:1.5, margin:0 }}>{b}</p>
                    </div>
                  ))}
                </div>

                {/* Botones */}
                <button
                  onClick={() => { abrirFormulario(petModal); }}
                  className="btn-brand"
                  style={{
                    width:'100%', padding:'16px 0', borderRadius:14,
                    fontSize:16, marginBottom:12,
                    boxShadow:'0 0 30px rgba(255,45,155,0.3)',
                  }}
                >
                  💜 Quiero adoptarlo
                </button>
                <button
                  onClick={() => showToast('Enlace copiado al portapapeles 📋')}
                  style={{
                    width:'100%', padding:'14px 0', borderRadius:14,
                    fontSize:14, fontWeight:700, cursor:'pointer',
                    background:'transparent',
                    border:'1px solid #333', color:'#888',
                  }}
                >
                  Compartir
                </button>
              </>
            )}
          </div>
        </IonModal>

        {/* ══════════════════════════════════════════════════════
            ZONA 6: MODAL FORMULARIO ADOPCIÓN
        ══════════════════════════════════════════════════════ */}
        <IonModal
          isOpen={!!formModal}
          onDidDismiss={() => setFormModal(null)}
          breakpoints={[0, 0.97]}
          initialBreakpoint={0.97}
        >
          <div style={{ background:'#0a0a0a', height:'100%', overflow:'auto', padding:'28px 20px 48px' }}>
            {formModal && (
              <>
                {/* Header */}
                <div style={{ textAlign:'center', marginBottom:24 }}>
                  <div style={{
                    width:64, height:64, borderRadius:'50%', margin:'0 auto 12px',
                    background:`${formModal.color}33`, border:`2px solid ${formModal.color}55`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:32,
                  }}>{formModal.foto}</div>
                  <h2 style={{ color:'#fff', fontWeight:800, fontSize:18, margin:0 }}>
                    Solicitud de adopción
                  </h2>
                  <p style={{ color:'#00E5FF', fontSize:14, margin:'4px 0 0' }}>
                    para {formModal.nombre}
                  </p>
                </div>

                <FormField label="Tu nombre completo">
                  <input value={nombreForm} onChange={e => setNombreForm(e.target.value)}
                    placeholder="Nombre completo" style={inputStyle} />
                </FormField>

                <FormField label="Tu email">
                  <input value={emailForm} onChange={e => setEmailForm(e.target.value)}
                    type="email" placeholder="tu@email.com" style={inputStyle} />
                </FormField>

                <FormField label="Tu teléfono">
                  <input value={telForm} onChange={e => setTelForm(e.target.value)}
                    type="tel" placeholder="+593 99 000 0000" style={inputStyle} />
                </FormField>

                <FormField label="¿Tienes mascotas actualmente?">
                  <IonSegment value={tieneMasc}
                    onIonChange={e => setTieneMasc(e.detail.value as 'si'|'no')}
                    style={{ '--background':'#111' } as React.CSSProperties}>
                    <IonSegmentButton value="si"><IonLabel>Sí</IonLabel></IonSegmentButton>
                    <IonSegmentButton value="no"><IonLabel>No</IonLabel></IonSegmentButton>
                  </IonSegment>
                </FormField>

                {tieneMasc === 'si' && (
                  <FormField label="¿Cuántas y de qué tipo?">
                    <input value={cualesMasc} onChange={e => setCualesMasc(e.target.value)}
                      placeholder="Ej: 1 perro adulto, 2 gatos" style={inputStyle} />
                  </FormField>
                )}

                <FormField label="¿Tienes espacio exterior (patio/jardín)?">
                  <IonSegment value={patio}
                    onIonChange={e => setPatio(e.detail.value as 'si'|'no')}
                    style={{ '--background':'#111' } as React.CSSProperties}>
                    <IonSegmentButton value="si"><IonLabel>Sí</IonLabel></IonSegmentButton>
                    <IonSegmentButton value="no"><IonLabel>No</IonLabel></IonSegmentButton>
                  </IonSegment>
                </FormField>

                <FormField label={`¿Por qué quieres adoptar a ${formModal.nombre}? *`}>
                  <div style={{ background:'#111', border:'1px solid #222', borderRadius:12, overflow:'hidden' }}>
                    <IonTextarea
                      value={motivoForm}
                      onIonInput={e => setMotivoForm(e.detail.value ?? '')}
                      placeholder="Cuéntanos sobre ti y tu hogar..."
                      rows={4}
                      style={{ '--color':'#fff', '--placeholder-color':'#555',
                        '--background':'transparent', padding:'4px 8px' } as React.CSSProperties}
                    />
                  </div>
                </FormField>

                {/* Checkbox acuerdo */}
                <div
                  onClick={() => setAcuerdo(a => !a)}
                  style={{
                    display:'flex', gap:12, alignItems:'flex-start',
                    marginBottom:24, cursor:'pointer', padding:'14px 16px',
                    background:'#111', borderRadius:12,
                    border:`1px solid ${acuerdo ? 'rgba(0,229,255,0.3)' : '#222'}`,
                  }}
                >
                  <div style={{
                    width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1,
                    background: acuerdo ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)' : '#222',
                    border: acuerdo ? 'none' : '1px solid #444',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#000', fontSize:12, fontWeight:700,
                  }}>{acuerdo ? '✓' : ''}</div>
                  <p style={{ color:'#888', fontSize:13, margin:0, lineHeight:1.5 }}>
                    Todos en mi hogar están de acuerdo con la adopción
                  </p>
                </div>

                <button
                  onClick={enviarSolicitud}
                  disabled={saving}
                  className="btn-brand"
                  style={{
                    width:'100%', padding:'16px 0', borderRadius:14, fontSize:16,
                    boxShadow:'0 0 30px rgba(255,45,155,0.3)',
                  }}
                >
                  Enviar solicitud 🐾
                </button>
              </>
            )}
          </div>
        </IonModal>

        <IonLoading isOpen={saving} message="Enviando solicitud..." />
        {toast && <Toast msg={toast} />}
      </IonContent>
    </IonPage>
  );
};

/* ── Helpers ─────────────────────────────────────────────────── */
function buildBullets(pet: PetAdopcion): string[] {
  const bullets: string[] = [];
  if (pet.vacunada && pet.esterilizada)
    bullets.push('Estoy al día con vacunas y ya fui esterilizado/a — sin gastos médicos urgentes.');
  else if (pet.vacunada)
    bullets.push('Tengo todas mis vacunas en regla y estoy listo/a para mi nuevo hogar.');
  else
    bullets.push('Seré tu proyecto de amor — solo necesito mis vacunas y ya estaré al 100%.');

  if (pet.tamaño === 'Pequeño')
    bullets.push('Mi tamaño pequeño me hace perfecto/a para apartamentos o casas sin patio.');
  else if (pet.tamaño === 'Grande')
    bullets.push('Soy grande y lleno de energía — ideal para una familia activa con espacio.');
  else
    bullets.push('Mi tamaño es ideal — no demasiado grande ni demasiado pequeño.');

  if (pet.urgente)
    bullets.push(`Llevo tiempo esperando en ${pet.refugio}. Cada día que pasa en el refugio es un día lejos de mi hogar. 🙏`);
  else
    bullets.push(`El equipo de ${pet.refugio} me conoce bien y puede contarte todo sobre mi personalidad.`);

  return bullets;
}

/* ── Estilos ─────────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width:'100%', boxSizing:'border-box',
  background:'#111', border:'1px solid #222', borderRadius:12,
  padding:'13px 16px', color:'#fff', fontSize:14,
};

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom:16 }}>
    <p style={{ color:'#666', fontSize:11, fontWeight:600,
      letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>{label}</p>
    {children}
  </div>
);

export default Adopcion;
