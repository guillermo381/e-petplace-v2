import React, { useState, useEffect, useCallback } from 'react';
import { IonPage, IonContent, IonModal, IonTextarea, IonLoading } from '@ionic/react';
import { Session } from '@supabase/supabase-js';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

/* ── Tipos ───────────────────────────────────────────────────── */
interface PetAdopcion {
  id: string; nombre: string; especie: string; raza: string; edad: string;
  sexo: string; tamanio: string; foto: string; descripcion: string;
  vacunada: boolean; esterilizada: boolean; refugio: string;
  urgente: boolean; color: string;
  costo_vacunas: number; costo_esteril: number;
}

interface Props { session: Session | null }

const FILTROS = ['Todos','Perros','Gatos','Aves','Conejos','Urgente ❤️‍🔥'];

/* ── Helpers ─────────────────────────────────────────────────── */
const Toast: React.FC<{ msg: string }> = ({ msg }) => msg ? (
  <div style={{
    position:'fixed', bottom:84, left:'50%', transform:'translateX(-50%)',
    background:'linear-gradient(90deg,#FF2D9B,#00E5FF)', borderRadius:12,
    padding:'12px 20px', color:'#000', fontSize:14, fontWeight:700,
    zIndex:9999, whiteSpace:'nowrap', boxShadow:'0 4px 24px rgba(0,0,0,0.4)',
  }}>{msg}</div>
) : null;

const Chip: React.FC<{ label: string; color?: string }> = ({ label, color = '#888' }) => (
  <span style={{
    fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20,
    background:`${color}22`, color, border:`1px solid ${color}44`,
  }}>{label}</span>
);

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom:16 }}>
    <p style={{ color:'var(--text-secondary)', fontSize:11, fontWeight:600,
      letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>{label}</p>
    {children}
  </div>
);

const iStyle: React.CSSProperties = {
  width:'100%', boxSizing:'border-box',
  background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:12,
  padding:'13px 16px', color:'var(--text-primary)', fontSize:14,
};

/* ════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════════ */
const Adopcion: React.FC<Props> = ({ session }) => {
  const history  = useHistory();
  const { addToCart } = useCart();

  const [mascotas,    setMascotas]    = useState<PetAdopcion[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filtro,      setFiltro]      = useState('Todos');
  const [petModal,    setPetModal]    = useState<PetAdopcion | null>(null);
  const [formModal,   setFormModal]   = useState<PetAdopcion | null>(null);
  const [donModal,    setDonModal]    = useState<PetAdopcion | null>(null);
  const [authWall,    setAuthWall]    = useState(false);
  const [toast,       setToast]       = useState('');
  const [saving,      setSaving]      = useState(false);

  // Formulario solicitud
  const [nombreForm,  setNombreForm]  = useState('');
  const [emailForm,   setEmailForm]   = useState('');
  const [telForm,     setTelForm]     = useState('');
  const [tieneMasc,   setTieneMasc]   = useState<'si'|'no'>('no');
  const [cualesMasc,  setCualesMasc]  = useState('');
  const [patio,       setPatio]       = useState<'si'|'no'>('no');
  const [motivoForm,  setMotivoForm]  = useState('');
  const [acuerdo,     setAcuerdo]     = useState(false);

  // Donación
  const [montoCustom, setMontoCustom] = useState('');
  const [montoSel,    setMontoSel]    = useState(0);
  const [mensajeDon,  setMensajeDon]  = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  /* ── Cargar mascotas desde Supabase ──────────────────────────── */
  const fetchMascotas = useCallback(async () => {
    const { data } = await supabase
      .from('mascotas_adopcion')
      .select('*')
      .eq('activa', true)
      .order('urgente', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setMascotas(data as PetAdopcion[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMascotas(); }, [fetchMascotas]);

  /* ── Pre-llenar perfil ───────────────────────────────────────── */
  useEffect(() => {
    if (!session) return;
    supabase.from('profiles').select('nombre,email,telefono').eq('id', session.user.id).single()
      .then(({ data }) => {
        if (data) {
          setNombreForm(data.nombre ?? '');
          setEmailForm(data.email ?? session.user.email ?? '');
          setTelForm(data.telefono ?? '');
        } else {
          setEmailForm(session.user.email ?? '');
        }
      });
  }, [session]);

  /* ── Filtrado ────────────────────────────────────────────────── */
  const filtradas = mascotas.filter(m => {
    if (filtro === 'Todos')        return true;
    if (filtro === 'Perros')       return m.especie === 'Perro';
    if (filtro === 'Gatos')        return m.especie === 'Gato';
    if (filtro === 'Aves')         return m.especie === 'Ave';
    if (filtro === 'Conejos')      return m.especie === 'Conejo';
    if (filtro === 'Urgente ❤️‍🔥') return m.urgente;
    return true;
  });

  /* ── Abrir formulario adopción ───────────────────────────────── */
  const abrirFormulario = (pet: PetAdopcion) => {
    if (!session) { setAuthWall(true); return; }
    setPetModal(null);
    setFormModal(pet);
    setMotivoForm(''); setAcuerdo(false);
    setTieneMasc('no'); setCualesMasc(''); setPatio('no');
  };

  /* ── Abrir modal donación ────────────────────────────────────── */
  const abrirDonacion = (pet: PetAdopcion) => {
    setDonModal(pet);
    setMontoSel(0);
    setMontoCustom('');
    setMensajeDon('');
    setPetModal(null);
  };

  /* ── Enviar solicitud adopción ───────────────────────────────── */
  const enviarSolicitud = async () => {
    if (!session || !formModal) return;
    if (!nombreForm.trim() || !emailForm.trim()) {
      showToast('⚠️ Nombre y email son obligatorios'); return;
    }
    if (!motivoForm.trim() || motivoForm.length < 20) {
      showToast('⚠️ Cuéntanos más sobre ti (mínimo 20 caracteres)'); return;
    }
    if (!acuerdo) {
      showToast('⚠️ Confirma que todos en tu hogar están de acuerdo'); return;
    }
    setSaving(true);
    const { error } = await supabase.from('solicitudes_adopcion').insert({
      user_id:            session.user.id,
      mascota_nombre:     formModal.nombre,
      refugio:            formModal.refugio,
      nombre_solicitante: nombreForm.trim(),
      email:              emailForm.trim(),
      telefono:           telForm.trim(),
      tiene_mascotas:     tieneMasc === 'si',
      espacio_exterior:   patio === 'si',
      motivo:             motivoForm.trim(),
    });
    setSaving(false);
    if (error) { showToast('❌ Error al enviar. Intenta de nuevo.'); return; }
    setFormModal(null);
    showToast(`🐾 ¡Solicitud enviada! ${formModal.refugio} te contactará pronto.`);
  };

  /* ── Agregar donación al carrito ─────────────────────────────── */
  const agregarDonacion = () => {
    if (!donModal) return;
    const monto = montoSel > 0 ? montoSel : parseFloat(montoCustom);
    if (!monto || monto < 1) { showToast('⚠️ Ingresa un monto válido'); return; }

    addToCart({
      producto_id:   `donacion-${donModal.id}-${Date.now()}`,
      nombre:        `Donación para ${donModal.nombre} 🐾`,
      precio:        monto,
      imagen_emoji:  '❤️',
      tipo:          'donacion',
      subtitulo:     `${donModal.refugio}`,
      metadata:      {
        mascota_id:  donModal.id,
        refugio:     donModal.refugio,
        mensaje:     mensajeDon,
      },
    });
    setDonModal(null);
    showToast(`❤️ $${monto} para ${donModal.nombre} — ¡gracias!`);
  };

  /* ── Montos sugeridos de donación ────────────────────────────── */
  const montosParaMascota = (pet: PetAdopcion): { monto: number; label: string }[] => {
    const opts = [];
    if (pet.costo_vacunas > 0) opts.push({ monto: pet.costo_vacunas, label: `💉 Vacunas ($${pet.costo_vacunas})` });
    if (pet.costo_esteril > 0) opts.push({ monto: pet.costo_esteril, label: `✂️ Esterilización ($${pet.costo_esteril})` });
    opts.push({ monto: 10, label: '🍖 Alimento ($10)' });
    opts.push({ monto: 25, label: '🏥 Chequeo ($25)' });
    return opts;
  };

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': 'var(--bg-primary)' } as React.CSSProperties}>
        <div style={{ background:'var(--bg-primary)', minHeight:'100vh', paddingBottom:100 }}>

          {/* ── Header ────────────────────────────────────────── */}
          <div style={{ padding:'52px 20px 8px' }}>
            <h1 style={{ color:'var(--text-primary)', fontSize:24, fontWeight:800, margin:'0 0 4px' }}>
              Adopción 🐾
            </h1>
            <p style={{ color:'var(--text-secondary)', fontSize:13, margin:'0 0 16px' }}>
              {loading ? '...' : `${mascotas.length} mascotas esperan un hogar`}
            </p>

            {/* Banner donación */}
            <div style={{
              background:'linear-gradient(135deg,rgba(255,45,155,0.12),rgba(124,58,237,0.12))',
              border:'1px solid rgba(255,45,155,0.25)', borderRadius:16,
              padding:'14px 16px', marginBottom:16,
              display:'flex', alignItems:'center', gap:12,
            }}>
              <span style={{ fontSize:28, flexShrink:0 }}>❤️</span>
              <div style={{ flex:1 }}>
                <p style={{ color:'var(--text-primary)', fontWeight:700, fontSize:13, margin:'0 0 2px' }}>
                  ¿No puedes adoptar ahora?
                </p>
                <p style={{ color:'var(--text-secondary)', fontSize:12, margin:0 }}>
                  Dona su alimento, vacunas o esterilización
                </p>
              </div>
              <button
                onClick={() => { const urgente = mascotas.find(m => m.urgente); if (urgente) abrirDonacion(urgente); }}
                style={{
                  background:'linear-gradient(90deg,#FF2D9B,#A855F7)',
                  border:'none', borderRadius:10, padding:'8px 14px',
                  color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0,
                }}
              >Donar ❤️</button>
            </div>
          </div>

          {/* ── Filtros ───────────────────────────────────────── */}
          <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'0 20px 16px' }} className="no-scrollbar">
            {FILTROS.map(f => (
              <button key={f} onClick={() => setFiltro(f)}
                style={{
                  flexShrink:0, padding:'8px 16px', borderRadius:20, cursor:'pointer',
                  fontSize:13, fontWeight:600,
                  background: filtro === f ? 'linear-gradient(90deg,#FF2D9B,#A855F7)' : 'var(--bg-card)',
                  color: filtro === f ? '#fff' : 'var(--text-secondary)',
                  border: filtro === f ? 'none' : '1px solid var(--border-color)',
                }}
              >{f}</button>
            ))}
          </div>

          {/* ── Grid mascotas ─────────────────────────────────── */}
          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'0 20px' }}>
              {[1,2,3,4].map(k => (
                <div key={k} style={{ background:'var(--bg-card)', borderRadius:16, height:200,
                  border:'1px solid var(--border-color)', opacity:0.5 }} />
              ))}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'0 20px' }}>
              {filtradas.map(pet => (
                <button key={pet.id} onClick={() => setPetModal(pet)}
                  style={{
                    background:'var(--bg-card)', border:'1px solid var(--border-color)',
                    borderRadius:16, overflow:'hidden', cursor:'pointer',
                    display:'flex', flexDirection:'column', textAlign:'left', padding:0,
                  }}
                >
                  {/* Foto */}
                  <div style={{
                    width:'100%', height:100,
                    background:`linear-gradient(135deg,${pet.color}22,${pet.color}44)`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:48, position:'relative',
                  }}>
                    {pet.foto}
                    {pet.urgente && (
                      <span style={{
                        position:'absolute', top:8, right:8,
                        fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:10,
                        background:'#FF2D9B', color:'#fff',
                      }}>URGENTE</span>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding:'10px 12px 12px' }}>
                    <p style={{ color:'var(--text-primary)', fontSize:14, fontWeight:700, margin:'0 0 3px' }}>
                      {pet.nombre}
                    </p>
                    <p style={{ color:'var(--text-secondary)', fontSize:11, margin:'0 0 8px' }}>
                      {pet.raza} · {pet.edad}
                    </p>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {pet.vacunada && <Chip label="Vacunada" color="#00F5A0" />}
                      {pet.esterilizada && <Chip label="Esterilizada" color="#00E5FF" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ── Modal detalle mascota ──────────────────────────── */}
          <IonModal isOpen={!!petModal} onDidDismiss={() => setPetModal(null)}
            breakpoints={[0,0.92]} initialBreakpoint={0.92}>
            {petModal && (
              <div style={{ background:'var(--bg-primary)', height:'100%', overflowY:'auto', paddingBottom:40 }}>

                {/* Hero */}
                <div style={{
                  height:160, background:`linear-gradient(135deg,${petModal.color}33,${petModal.color}66)`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:80, position:'relative',
                }}>
                  {petModal.foto}
                  {petModal.urgente && (
                    <div style={{
                      position:'absolute', bottom:12, left:16,
                      background:'#FF2D9B', color:'#fff', fontSize:11,
                      fontWeight:700, padding:'4px 12px', borderRadius:20,
                    }}>❤️‍🔥 Necesita hogar urgente</div>
                  )}
                </div>

                <div style={{ padding:'20px 20px 0' }}>
                  <h2 style={{ color:'var(--text-primary)', fontSize:22, fontWeight:800, margin:'0 0 4px' }}>
                    {petModal.nombre}
                  </h2>
                  <p style={{ color:'var(--text-secondary)', fontSize:13, margin:'0 0 12px' }}>
                    {petModal.especie} · {petModal.raza} · {petModal.edad} · {petModal.sexo}
                  </p>

                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
                    {petModal.vacunada     && <Chip label="✓ Vacunada"     color="#00F5A0" />}
                    {petModal.esterilizada && <Chip label="✓ Esterilizada" color="#00E5FF" />}
                    <Chip label={petModal.tamanio} color={petModal.color} />
                    <Chip label={petModal.refugio} color="#888" />
                  </div>

                  <p style={{ color:'var(--text-primary)', fontSize:14, lineHeight:1.6, margin:'0 0 20px' }}>
                    {petModal.descripcion}
                  </p>

                  {/* Necesidades económicas */}
                  {(petModal.costo_vacunas > 0 || petModal.costo_esteril > 0) && (
                    <div style={{
                      background:'rgba(255,45,155,0.06)', border:'1px solid rgba(255,45,155,0.2)',
                      borderRadius:14, padding:'14px 16px', marginBottom:20,
                    }}>
                      <p style={{ color:'#FF2D9B', fontWeight:700, fontSize:13, margin:'0 0 8px' }}>
                        💝 {petModal.nombre} necesita ayuda
                      </p>
                      {petModal.costo_vacunas > 0 && (
                        <p style={{ color:'var(--text-secondary)', fontSize:12, margin:'0 0 4px' }}>
                          💉 Vacunas pendientes: <strong style={{ color:'var(--text-primary)' }}>${petModal.costo_vacunas}</strong>
                        </p>
                      )}
                      {petModal.costo_esteril > 0 && (
                        <p style={{ color:'var(--text-secondary)', fontSize:12, margin:0 }}>
                          ✂️ Esterilización: <strong style={{ color:'var(--text-primary)' }}>${petModal.costo_esteril}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Botones acción */}
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <button onClick={() => abrirFormulario(petModal)}
                      style={{
                        padding:'15px 0', borderRadius:14,
                        background:'linear-gradient(90deg,#FF2D9B,#A855F7)',
                        color:'#fff', fontWeight:800, fontSize:15,
                        border:'none', cursor:'pointer',
                      }}
                    >🐾 Quiero adoptarlo</button>
                    <button onClick={() => abrirDonacion(petModal)}
                      style={{
                        padding:'13px 0', borderRadius:14,
                        background:'var(--bg-card)', border:'1px solid rgba(255,45,155,0.3)',
                        color:'#FF2D9B', fontWeight:700, fontSize:14, cursor:'pointer',
                      }}
                    >❤️ Donar para {petModal.nombre}</button>
                  </div>
                </div>
              </div>
            )}
          </IonModal>

          {/* ── Modal formulario adopción ──────────────────────── */}
          <IonModal isOpen={!!formModal} onDidDismiss={() => setFormModal(null)}
            breakpoints={[0,1]} initialBreakpoint={1}>
            {formModal && (
              <div style={{ background:'var(--bg-primary)', height:'100%', overflowY:'auto', padding:'52px 20px 60px' }}>
                <button onClick={() => setFormModal(null)}
                  style={{ background:'none', border:'none', color:'var(--text-secondary)', fontSize:14, cursor:'pointer', marginBottom:16 }}>
                  ← Volver
                </button>
                <h2 style={{ color:'var(--text-primary)', fontSize:20, fontWeight:800, margin:'0 0 4px' }}>
                  Adoptar a {formModal.nombre} {formModal.foto}
                </h2>
                <p style={{ color:'var(--text-secondary)', fontSize:13, margin:'0 0 24px' }}>
                  {formModal.refugio}
                </p>

                <FormField label="Tu nombre completo *">
                  <input style={iStyle} value={nombreForm} onChange={e => setNombreForm(e.target.value)} placeholder="Nombre completo" />
                </FormField>
                <FormField label="Email *">
                  <input style={iStyle} type="email" value={emailForm} onChange={e => setEmailForm(e.target.value)} placeholder="tu@email.com" />
                </FormField>
                <FormField label="Teléfono / WhatsApp">
                  <input style={iStyle} value={telForm} onChange={e => setTelForm(e.target.value)} placeholder="+593 99 000 0000" />
                </FormField>

                <FormField label="¿Tienes otras mascotas?">
                  <div style={{ display:'flex', gap:10 }}>
                    {(['si','no'] as const).map(v => (
                      <button key={v} type="button" onClick={() => setTieneMasc(v)}
                        style={{
                          flex:1, padding:'12px 0', borderRadius:12, cursor:'pointer', fontWeight:700, fontSize:14,
                          background: tieneMasc === v ? 'rgba(0,229,255,0.1)' : 'var(--bg-card)',
                          border: `1px solid ${tieneMasc === v ? '#00E5FF' : 'var(--border-color)'}`,
                          color: tieneMasc === v ? '#00E5FF' : 'var(--text-secondary)',
                        }}
                      >{v === 'si' ? '🐾 Sí' : '✗ No'}</button>
                    ))}
                  </div>
                </FormField>

                {tieneMasc === 'si' && (
                  <FormField label="¿Cuáles?">
                    <input style={iStyle} value={cualesMasc} onChange={e => setCualesMasc(e.target.value)} placeholder="Ej: 1 perro adulto, 2 gatos" />
                  </FormField>
                )}

                <FormField label="¿Tienes patio o espacio exterior?">
                  <div style={{ display:'flex', gap:10 }}>
                    {(['si','no'] as const).map(v => (
                      <button key={v} type="button" onClick={() => setPatio(v)}
                        style={{
                          flex:1, padding:'12px 0', borderRadius:12, cursor:'pointer', fontWeight:700, fontSize:14,
                          background: patio === v ? 'rgba(0,229,255,0.1)' : 'var(--bg-card)',
                          border: `1px solid ${patio === v ? '#00E5FF' : 'var(--border-color)'}`,
                          color: patio === v ? '#00E5FF' : 'var(--text-secondary)',
                        }}
                      >{v === 'si' ? '🏡 Sí' : '🏢 No'}</button>
                    ))}
                  </div>
                </FormField>

                <FormField label={`¿Por qué quieres adoptar a ${formModal.nombre}? *`}>
                  <IonTextarea
                    value={motivoForm}
                    onIonInput={e => setMotivoForm(e.detail.value ?? '')}
                    placeholder="Cuéntanos sobre ti, tu hogar y por qué quieres adoptarlo..."
                    rows={4}
                    style={{ '--color':'var(--text-primary)', '--placeholder-color':'var(--text-secondary)',
                      '--background':'var(--bg-card)', borderRadius:'12px',
                      border:'1px solid var(--border-color)', padding:'4px 8px' } as React.CSSProperties}
                  />
                </FormField>

                <div onClick={() => setAcuerdo(a => !a)}
                  style={{
                    display:'flex', gap:12, alignItems:'flex-start',
                    marginBottom:24, cursor:'pointer', padding:'14px 16px',
                    background:'var(--bg-card)', borderRadius:12,
                    border:`1px solid ${acuerdo ? 'rgba(0,229,255,0.3)' : 'var(--border-color)'}`,
                  }}
                >
                  <div style={{
                    width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1,
                    background: acuerdo ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)' : 'var(--bg-secondary)',
                    border: acuerdo ? 'none' : '1px solid var(--border-color)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#000', fontSize:12, fontWeight:700,
                  }}>{acuerdo ? '✓' : ''}</div>
                  <p style={{ color:'var(--text-secondary)', fontSize:13, margin:0, lineHeight:1.5 }}>
                    Todos en mi hogar están de acuerdo con la adopción y me comprometo a cuidar a {formModal.nombre} de por vida.
                  </p>
                </div>

                <button onClick={enviarSolicitud} disabled={saving}
                  style={{
                    width:'100%', padding:'16px 0', borderRadius:14, fontSize:16, fontWeight:800,
                    background:'linear-gradient(90deg,#FF2D9B,#A855F7)',
                    color:'#fff', border:'none', cursor:'pointer',
                    opacity: saving ? 0.5 : 1,
                  }}
                >Enviar solicitud 🐾</button>
              </div>
            )}
          </IonModal>

          {/* ── Modal donación ─────────────────────────────────── */}
          <IonModal isOpen={!!donModal} onDidDismiss={() => setDonModal(null)}
            breakpoints={[0,0.85]} initialBreakpoint={0.85}>
            {donModal && (
              <div style={{ background:'var(--bg-primary)', height:'100%', padding:'32px 20px 48px', overflowY:'auto' }}>

                <div style={{ textAlign:'center', marginBottom:20 }}>
                  <span style={{ fontSize:48 }}>{donModal.foto}</span>
                  <h3 style={{ color:'var(--text-primary)', fontWeight:800, fontSize:18, margin:'8px 0 4px' }}>
                    Ayuda a {donModal.nombre}
                  </h3>
                  <p style={{ color:'var(--text-secondary)', fontSize:13, margin:0 }}>
                    {donModal.refugio}
                  </p>
                </div>

                {/* Montos sugeridos */}
                <p style={{ color:'var(--text-secondary)', fontSize:11, fontWeight:600,
                  textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
                  ¿En qué quieres ayudar?
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                  {montosParaMascota(donModal).map(opt => (
                    <button key={opt.monto} type="button"
                      onClick={() => { setMontoSel(opt.monto); setMontoCustom(''); }}
                      style={{
                        padding:'13px 16px', borderRadius:12, cursor:'pointer', textAlign:'left',
                        background: montoSel === opt.monto ? 'rgba(255,45,155,0.1)' : 'var(--bg-card)',
                        border: `1px solid ${montoSel === opt.monto ? '#FF2D9B' : 'var(--border-color)'}`,
                        color:'var(--text-primary)', fontSize:14, fontWeight:600,
                      }}
                    >
                      <span>{opt.label}</span>
                      {montoSel === opt.monto && <span style={{ float:'right', color:'#FF2D9B' }}>✓</span>}
                    </button>
                  ))}
                </div>

                {/* Monto personalizado */}
                <p style={{ color:'var(--text-secondary)', fontSize:11, fontWeight:600,
                  textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
                  O ingresa otro monto
                </p>
                <div style={{ position:'relative', marginBottom:16 }}>
                  <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                    color:'var(--text-secondary)', fontSize:16, fontWeight:600 }}>$</span>
                  <input
                    type="number" min="1" placeholder="0.00"
                    value={montoCustom}
                    onChange={e => { setMontoCustom(e.target.value); setMontoSel(0); }}
                    style={{ ...iStyle, paddingLeft:30 }}
                  />
                </div>

                {/* Mensaje opcional */}
                <p style={{ color:'var(--text-secondary)', fontSize:11, fontWeight:600,
                  textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
                  Mensaje para el refugio (opcional)
                </p>
                <input
                  placeholder={`Ej: Espero que ${donModal.nombre} encuentre su hogar pronto`}
                  value={mensajeDon}
                  onChange={e => setMensajeDon(e.target.value)}
                  style={{ ...iStyle, marginBottom:20 }}
                />

                <button onClick={agregarDonacion}
                  style={{
                    width:'100%', padding:'15px 0', borderRadius:14, fontSize:15, fontWeight:800,
                    background:'linear-gradient(90deg,#FF2D9B,#A855F7)',
                    color:'#fff', border:'none', cursor:'pointer',
                  }}
                >
                  ❤️ Agregar al carrito — ${montoSel > 0 ? montoSel : (parseFloat(montoCustom) || 0)}
                </button>

                <p style={{ color:'var(--text-secondary)', fontSize:11, textAlign:'center', marginTop:12 }}>
                  Tu donación llega directamente al refugio · 100% transparente
                </p>
              </div>
            )}
          </IonModal>

          {/* ── Auth wall ─────────────────────────────────────── */}
          <IonModal isOpen={authWall} onDidDismiss={() => setAuthWall(false)}
            breakpoints={[0,0.45]} initialBreakpoint={0.45}>
            <div style={{ background:'var(--bg-primary)', height:'100%', padding:'32px 24px 48px',
              display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
              <div style={{
                width:64, height:64, borderRadius:'50%', marginBottom:16,
                background:'linear-gradient(135deg,rgba(255,45,155,0.2),rgba(124,58,237,0.2))',
                border:'1px solid rgba(255,45,155,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
              }}>🐾</div>
              <h3 style={{ color:'var(--text-primary)', fontWeight:800, fontSize:18, margin:'0 0 8px' }}>
                Necesitas una cuenta
              </h3>
              <p style={{ color:'var(--text-secondary)', fontSize:14, margin:'0 0 28px', lineHeight:1.5 }}>
                Para enviar una solicitud de adopción necesitamos verificar tu identidad y contactarte.
              </p>
              <button onClick={() => { setAuthWall(false); history.push('/login?mode=register'); }}
                style={{
                  width:'100%', padding:'14px 0', borderRadius:12, fontSize:15, fontWeight:800,
                  background:'linear-gradient(90deg,#FF2D9B,#A855F7)',
                  color:'#fff', border:'none', cursor:'pointer', marginBottom:12,
                }}
              >Crear cuenta gratis</button>
              <button onClick={() => { setAuthWall(false); history.push('/login?mode=login'); }}
                style={{
                  width:'100%', padding:'13px 0', borderRadius:12, fontSize:14,
                  background:'transparent', border:'1px solid var(--border-color)',
                  color:'var(--text-secondary)', cursor:'pointer',
                }}
              >Ya tengo cuenta</button>
            </div>
          </IonModal>

          <IonLoading isOpen={saving} message="Enviando solicitud..." />
          {toast && <Toast msg={toast} />}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Adopcion;
