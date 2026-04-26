import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonToggle } from '@ionic/react';
import { Session } from '@supabase/supabase-js';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import PhoneInput, { PhoneInputValue } from '../components/PhoneInput';
import AddressInput, { AddressValue, getAliasIcon, getAliasLabel } from '../components/AddressInput';

interface Profile {
  id: string; nombre: string; email: string; avatar_url?: string;
  telefono?: string; direccion_principal?: string;
  direccion_completa?:     string;
  direccion_linea1?:       string;
  direccion_apto?:         string;
  direccion_referencias?:  string;
  direccion_ciudad?:       string;
  direccion_pais?:         string;
  direccion_guardada_como?: string;
}
interface Mascota  { id: string; nombre: string; especie: string; foto_url?: string }

interface Props { session: Session }

const ESPECIE_EMOJI: Record<string, string> = {
  perro:'🐶', gato:'🐱', ave:'🐦', pez:'🐠', otro:'🐾',
};
const AVATAR_COLORS = ['#7C3AED', '#FF2D9B', '#00E5FF', '#00F5A0'];

const Profile: React.FC<Props> = ({ session }) => {
  const [profile,      setProfile]      = useState<Profile | null>(null);
  const [mascotas,     setMascotas]     = useState<Mascota[]>([]);
  const [editing,      setEditing]      = useState(false);
  const [nombre,       setNombre]       = useState('');
  const [saving,       setSaving]       = useState(false);
  const [editTelefono,       setEditTelefono]       = useState('');
  const [editTelefonoCodigo, setEditTelefonoCodigo] = useState('');
  const [editTelefonoTipo,   setEditTelefonoTipo]   = useState<'whatsapp' | 'llamada'>('whatsapp');
  const [editDir,            setEditDir]            = useState('');
  const [editAddress,        setEditAddress]        = useState<Partial<AddressValue>>({});
  const [activeField,      setActiveField]      = useState<'telefono' | 'direccion' | null>(null);
  const [editingDireccion, setEditingDireccion] = useState(false);
  const [savingField,  setSavingField]  = useState(false);
  const [toast,        setToast]        = useState('');
  const [brokenPhotos, setBrokenPhotos] = useState<Set<string>>(new Set());
  const { isDark, toggleTheme } = useTheme();
  const history = useHistory();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  useEffect(() => {
    const fetch = async () => {
      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single();
      if (prof) {
        setProfile(prof);
        setNombre(prof.nombre ?? '');
        setEditTelefono(prof.telefono ?? '');
        setEditDir(prof.direccion_principal ?? '');
        if (prof.direccion_completa || prof.direccion_principal) {
          setEditAddress({
            completa:     prof.direccion_completa  ?? prof.direccion_principal ?? '',
            apto:         prof.direccion_apto       ?? '',
            referencias:  prof.direccion_referencias ?? '',
            ciudad:       prof.direccion_ciudad     ?? '',
            pais:         prof.direccion_pais       ?? '',
            codigoPostal: prof.direccion_codigo_postal ?? '',
            guardadoComo: (prof.direccion_guardada_como as AddressValue['guardadoComo']) ?? 'casa',
          });
        }
      } else {
        const fallback = session.user.user_metadata?.nombre ?? session.user.email?.split('@')[0] ?? 'Usuario';
        setNombre(fallback);
      }
      const { data: mascs } = await supabase
        .from('mascotas').select('id, nombre, especie, foto_url').eq('user_id', session.user.id).order('nombre');
      if (mascs) setMascotas(mascs as Mascota[]);
    };
    fetch();
  }, [session]);

  const saveProfile = async () => {
    setSaving(true);
    const { data } = await supabase
      .from('profiles')
      .upsert({ id: session.user.id, email: session.user.email!, nombre })
      .select()
      .single();
    if (data) setProfile(data);
    setSaving(false);
    setEditing(false);
  };

  const saveCampo = async (campo: 'telefono' | 'direccion') => {
    if (campo === 'direccion') {
      console.log('Guardando dirección:', editAddress);
    }
    const valor = campo === 'telefono'
      ? editTelefono.trim()
      : (editAddress.completa || editAddress.linea1 || editDir).trim();
    if (!valor) return;
    setSavingField(true);
    const updateObj: Record<string, unknown> = campo === 'telefono'
      ? { telefono: valor, telefono_codigo_pais: editTelefonoCodigo, telefono_tipo: editTelefonoTipo }
      : {
          direccion_completa:      editAddress.completa    || editAddress.linea1 || editDir.trim(),
          direccion_linea1:        editAddress.linea1      || '',
          direccion_apto:          editAddress.apto        || '',
          direccion_referencias:   editAddress.referencias || '',
          direccion_ciudad:        editAddress.ciudad      || '',
          direccion_pais:          editAddress.pais        || '',
          direccion_guardada_como: editAddress.guardadoComo || 'casa',
        };
    const { data, error } = await supabase
      .from('profiles').update(updateObj)
      .eq('id', session.user.id).select().single();
    console.log('Resultado guardar dirección:', { data: !!data, error });
    if (data) setProfile(data);
    setSavingField(false);
    setActiveField(null);
    setEditingDireccion(false);
    showToast(`¡Perfil actualizado! +15 puntos 🎉`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // App.tsx redirige via onAuthStateChange
  };

  const displayNombre = profile?.nombre ?? nombre ?? session.user.email?.split('@')[0] ?? 'Usuario';
  const initials      = displayNombre.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const colorIdx      = (session.user.email?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  const avatarColor   = AVATAR_COLORS[colorIdx];
  const joinYear      = new Date(session.user.created_at ?? Date.now()).getFullYear();

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="pb-28" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

          {/* ── Header ──────────────────────────────────────────── */}
          <div className="px-5 pt-14 pb-6 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-white">Perfil</h1>
            <button
              onClick={() => { setEditing(e => !e); if (editing) setNombre(profile?.nombre ?? ''); }}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: '#141414', color: '#7C3AED', border: '1px solid #2a2a2a' }}
            >
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {/* ── Avatar ───────────────────────────────────────────── */}
          <div className="flex flex-col items-center mb-8 px-5">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                className="w-24 h-24 rounded-full object-cover mb-3"
                style={{ border: `3px solid ${avatarColor}` }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold text-white mb-3"
                style={{
                  background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}99)`,
                  boxShadow:  `0 0 35px ${avatarColor}55`,
                }}
              >
                {initials}
              </div>
            )}

            {editing ? (
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="text-xl font-bold text-center text-white bg-transparent border-b-2 outline-none px-2 pb-1"
                style={{ borderColor: '#7C3AED', background: 'transparent', border: 'none', borderBottom: '2px solid #7C3AED' }}
              />
            ) : (
              <h2 className="text-xl font-bold text-white">{displayNombre}</h2>
            )}
            <p className="text-gray-500 text-sm mt-1">{session.user.email}</p>
          </div>

          {/* Guardar cambios */}
          {editing && (
            <div className="px-5 mb-6">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full py-3.5 rounded-xl font-semibold text-white disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                  boxShadow:  '0 0 20px rgba(124,58,237,0.35)',
                }}
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          )}

          {/* ── Completar perfil ─────────────────────────────────── */}
          {(() => {
            const faltantes: { key: string; icon: string; label: string; action: 'telefono' | 'direccion' | 'mascota' }[] = [];
            if (!profile?.telefono)                                             faltantes.push({ key:'telefono',  icon:'📱', label:'Agrega tu teléfono',  action:'telefono'  });
            if (!profile?.direccion_completa && !profile?.direccion_principal) faltantes.push({ key:'direccion', icon:'📍', label:'Agrega tu dirección', action:'direccion' });
            if (mascotas.length === 0)         faltantes.push({ key:'mascotas',  icon:'🐾', label:'Agrega tu primera mascota',  action:'mascota'   });

            if (faltantes.length === 0) return (
              <div className="px-5 mb-5">
                <div style={{
                  background:'rgba(0,245,160,0.07)', border:'1px solid rgba(0,245,160,0.25)',
                  borderRadius:16, padding:'14px 18px',
                  display:'flex', alignItems:'center', gap:12,
                }}>
                  <span style={{ fontSize:28 }}>🎉</span>
                  <div>
                    <p style={{ color:'#00F5A0', fontWeight:800, fontSize:14, margin:0 }}>¡Perfil completo!</p>
                    <p style={{ color:'#555', fontSize:12, margin:'2px 0 0' }}>Tienes acceso a todas las recomendaciones</p>
                  </div>
                </div>
              </div>
            );

            return (
              <div className="px-5 mb-5">
                <div style={{
                  background:'var(--bg-secondary)', borderRadius:16,
                  border:'1px solid rgba(0,229,255,0.2)', overflow:'hidden',
                }}>
                  {/* Cabecera */}
                  <div style={{
                    padding:'12px 16px 10px',
                    borderBottom:'1px solid var(--border-color)',
                    display:'flex', alignItems:'center', gap:10,
                  }}>
                    <div style={{
                      width:32, height:32, borderRadius:10, flexShrink:0,
                      background:'rgba(0,229,255,0.1)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
                    }}>✨</div>
                    <div style={{ flex:1 }}>
                      <p style={{ color:'var(--text-primary)', fontWeight:700, fontSize:13, margin:0 }}>
                        Completa tu perfil 🐾
                      </p>
                      <p style={{ color:'var(--text-secondary)', fontSize:11, margin:'1px 0 0' }}>
                        {faltantes.length} {faltantes.length === 1 ? 'campo pendiente' : 'campos pendientes'}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  {faltantes.map((f, i) => (
                    <div key={f.key}>
                      <div style={{
                        padding:'12px 16px',
                        borderBottom: i < faltantes.length - 1 ? '1px solid var(--border-color)' : 'none',
                      }}>
                        {/* Fila principal */}
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: activeField === f.action ? 10 : 0 }}>
                          <span style={{ fontSize:18, width:24, textAlign:'center', flexShrink:0 }}>{f.icon}</span>
                          <p style={{ flex:1, color:'var(--text-primary)', fontSize:13, fontWeight:600, margin:0 }}>
                            {f.label}
                          </p>
                          {f.action === 'mascota' ? (
                            <button
                              onClick={() => history.push('/biopet/new')}
                              style={{
                                background:'linear-gradient(90deg,#FF2D9B,#00E5FF)',
                                border:'none', borderRadius:8, padding:'6px 14px',
                                color:'#000', fontWeight:700, fontSize:12, cursor:'pointer',
                              }}
                            >Agregar +</button>
                          ) : (
                            <button
                              onClick={() => setActiveField(
                                activeField === (f.action as 'telefono' | 'direccion') ? null : (f.action as 'telefono' | 'direccion')
                              )}
                              style={{
                                background: activeField === f.action ? 'transparent' : 'linear-gradient(90deg,#FF2D9B,#00E5FF)',
                                border: activeField === f.action ? '1px solid #333' : 'none',
                                borderRadius:8, padding:'6px 14px',
                                color: activeField === f.action ? '#555' : '#000',
                                fontWeight:700, fontSize:12, cursor:'pointer',
                              }}
                            >{activeField === f.action ? 'Cancelar' : 'Agregar +'}</button>
                          )}
                        </div>

                        {/* Input inline */}
                        {activeField === f.action && f.action === 'telefono' && (
                          <div>
                            <PhoneInput
                              value={editTelefono || undefined}
                              codigoPais={editTelefonoCodigo || undefined}
                              tipo={editTelefonoTipo}
                              onChange={(v: PhoneInputValue) => {
                                setEditTelefono(v.fullNumber);
                                setEditTelefonoCodigo(v.codigoPais);
                                setEditTelefonoTipo(v.tipo);
                              }}
                              compact
                            />
                            <button
                              onClick={() => saveCampo('telefono')}
                              disabled={savingField}
                              style={{
                                marginTop:8, width:'100%',
                                background:'#00F5A0', border:'none', borderRadius:10,
                                padding:'10px 14px', color:'#000', fontWeight:800,
                                fontSize:13, cursor:'pointer',
                                opacity: savingField ? 0.6 : 1,
                              }}
                            >{savingField ? '…' : 'Guardar'}</button>
                          </div>
                        )}
                        {activeField === f.action && f.action === 'direccion' && (
                          <div>
                            <AddressInput
                              value={editAddress}
                              onChange={v => { setEditAddress(v); setEditDir(v.completa); }}
                            />
                            <button
                              onClick={() => saveCampo('direccion')}
                              disabled={savingField || !editAddress.completa}
                              style={{
                                marginTop: 8, width: '100%',
                                background: '#00F5A0', border: 'none', borderRadius: 10,
                                padding: '10px 14px', color: '#000', fontWeight: 800,
                                fontSize: 13, cursor: 'pointer',
                                opacity: savingField || !editAddress.completa ? 0.5 : 1,
                              }}
                            >{savingField ? '…' : 'Guardar'}</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Mi dirección guardada ───────────────────────────── */}
          {profile?.direccion_completa && (
            <div className="px-5 mb-5">
              <h2 className="font-semibold mb-3" style={{ color:'var(--text-primary)', fontSize:14 }}>
                Mi dirección
              </h2>

              {/* Card de la dirección guardada */}
              {!editingDireccion ? (
                <div style={{
                  background:'var(--bg-card)', borderRadius:16,
                  border:'1px solid var(--border-color)', padding:'14px 16px',
                }}>
                  {/* Cabecera: alias + botón editar */}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:8 }}>
                    <span style={{ fontSize:28, flexShrink:0 }}>
                      {getAliasIcon(profile.direccion_guardada_como)}
                    </span>
                    <div style={{ flex:1 }}>
                      <p style={{ color:'var(--text-primary)', fontWeight:700, fontSize:13, margin:'0 0 2px' }}>
                        {getAliasLabel(profile.direccion_guardada_como)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingDireccion(true);
                        setEditAddress({
                          completa:    profile.direccion_completa    || '',
                          linea1:      profile.direccion_linea1      || '',
                          apto:        profile.direccion_apto        || '',
                          referencias: profile.direccion_referencias || '',
                          ciudad:      profile.direccion_ciudad      || '',
                          pais:        profile.direccion_pais        || '',
                          guardadoComo: profile.direccion_guardada_como || 'casa',
                        });
                      }}
                      style={{
                        background:'none', border:'1px solid #333', borderRadius:8,
                        padding:'5px 12px', color:'#00E5FF', fontSize:12, cursor:'pointer', flexShrink:0,
                      }}
                    >Editar</button>
                  </div>

                  {/* Datos de la dirección */}
                  <div style={{ background:'var(--bg-secondary)', borderRadius:10, padding:12, marginBottom:8 }}>
                    <p style={{ color:'var(--text-primary)', fontSize:13, margin:'0 0 4px', lineHeight:1.5 }}>
                      {profile.direccion_completa}
                    </p>
                    {profile.direccion_apto && (
                      <p style={{ color:'var(--text-secondary)', fontSize:12, margin:'0 0 4px' }}>
                        {profile.direccion_apto}
                      </p>
                    )}
                    {profile.direccion_referencias && (
                      <p style={{ color:'#888', fontSize:11, margin:0 }}>
                        📝 {profile.direccion_referencias}
                      </p>
                    )}
                  </div>

                  {/* Botón agregar otra dirección */}
                  <button
                    onClick={() => showToast('Múltiples direcciones — próximamente 🔜')}
                    style={{
                      marginTop:12, width:'100%', background:'none',
                      border:'1px dashed #333', borderRadius:10, padding:'9px 12px',
                      color:'#444', fontSize:12, cursor:'pointer', fontWeight:600,
                    }}
                  >
                    + Agregar otra dirección
                  </button>
                </div>
              ) : (
                /* Formulario edición de dirección existente */
                <div style={{ background:'var(--bg-card)', borderRadius:16, border:'1px solid var(--border-color)', padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                    <p style={{ color:'var(--text-primary)', fontWeight:700, fontSize:13, margin:0 }}>Editar dirección</p>
                    <button
                      onClick={() => setEditingDireccion(false)}
                      style={{ background:'none', border:'none', color:'#555', fontSize:12, cursor:'pointer' }}
                    >Cancelar</button>
                  </div>
                  <AddressInput
                    value={editAddress}
                    onChange={v => { setEditAddress(v); setEditDir(v.completa); }}
                  />
                  <button
                    onClick={() => saveCampo('direccion')}
                    disabled={savingField || !editAddress.completa}
                    style={{
                      marginTop:12, width:'100%',
                      background:'#00F5A0', border:'none', borderRadius:10,
                      padding:'10px 14px', color:'#000', fontWeight:800,
                      fontSize:13, cursor:'pointer',
                      opacity: savingField || !editAddress.completa ? 0.5 : 1,
                    }}
                  >{savingField ? '…' : 'Guardar dirección'}</button>
                </div>
              )}
            </div>
          )}

          {/* ── Stats ────────────────────────────────────────────── */}
          <div className="px-5 mb-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Mascotas', val: String(mascotas.length), color: '#7C3AED' },
              { label: 'Miembro',  val: String(joinYear),         color: '#00E5FF' },
              { label: 'Estado',   val: '✓ Activo',               color: '#00F5A0' },
            ].map(s => (
              <div key={s.label} className="py-4 rounded-2xl flex flex-col items-center gap-1"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <p className="font-bold text-sm text-center leading-tight" style={{ color: s.color }}>{s.val}</p>
                <p className="text-gray-500 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Mis mascotas ─────────────────────────────────────── */}
          {mascotas.length > 0 && (
            <div className="px-5 mb-6">
              <h2 className="text-white font-semibold mb-3">Mis Mascotas</h2>
              <div className="space-y-2">
                {mascotas.map(m => (
                  <button
                    key={m.id}
                    onClick={() => history.push(`/biopet/${m.id}`)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl w-full text-left"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                  >
                    {(m.foto_url && !brokenPhotos.has(m.id)) ? (
                      <img
                        src={m.foto_url}
                        alt={m.nombre}
                        onError={() => setBrokenPhotos(prev => new Set(prev).add(m.id))}
                        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg,#FF2D9B,#00E5FF)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 800, color: '#fff',
                      }}>
                        {m.nombre.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">{m.nombre}</p>
                      <p className="text-gray-500 text-xs capitalize">{m.especie}</p>
                    </div>
                    <span style={{ color: '#444', fontSize: 16, marginLeft: 'auto' }}>›</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Info app ─────────────────────────────────────────── */}
          <div className="px-5 mb-6">
            <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Aplicación</h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              {/* Toggle tema */}
              <div
                className="w-full flex items-center gap-3 px-4 py-4"
                style={{
                  background:   'var(--bg-card)',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span className="text-lg">{isDark ? '🌙' : '☀️'}</span>
                <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                  {isDark ? 'Modo oscuro' : 'Modo claro'}
                </span>
                <IonToggle
                  checked={isDark}
                  onIonChange={toggleTheme}
                  style={{ '--track-background-checked': '#00E5FF', '--handle-background-checked': '#000' } as React.CSSProperties}
                />
              </div>

              {[
                { icon: '🌟', label: 'e-PetPlace',        val: 'v1.0.0',  ruta: null },
                { icon: '🍪', label: 'Política de Cookies', val: '›',      ruta: '/cookies' },
                { icon: '🔒', label: 'Política de Privacidad', val: '›',   ruta: '/privacidad' },
                { icon: '📋', label: 'Términos de Uso',    val: '›',       ruta: '/terminos' },
                { icon: '💬', label: 'Soporte',            val: '›',       ruta: null },
              ].map((item, i, arr) => (
                <button
                  key={item.label}
                  onClick={() => item.ruta && history.push(item.ruta)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left"
                  style={{
                    background:   'var(--bg-card)',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none',
                    cursor:       item.ruta ? 'pointer' : 'default',
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                  <span className="text-sm" style={{ color: item.ruta ? '#00E5FF' : 'var(--text-secondary)' }}>{item.val}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Logout ───────────────────────────────────────────── */}
          <div className="px-5">
            <button
              onClick={handleLogout}
              className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
              style={{
                background: 'rgba(255,45,155,0.08)',
                color:       '#FF2D9B',
                border:      '1px solid rgba(255,45,155,0.22)',
                boxShadow:   '0 0 20px rgba(255,45,155,0.1)',
              }}
            >
              Cerrar sesión 👋
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            position:'fixed', bottom:84, left:'50%', transform:'translateX(-50%)',
            background:'linear-gradient(90deg,#FF2D9B,#00E5FF)',
            borderRadius:14, padding:'12px 22px',
            color:'#000', fontSize:14, fontWeight:800,
            zIndex:9999, whiteSpace:'nowrap',
            boxShadow:'0 4px 30px rgba(0,229,255,0.35)',
          }}>{toast}</div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Profile;
