import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonContent, IonActionSheet, IonAlert, IonToggle, IonInput,
} from '@ionic/react';
import { useIonViewWillEnter } from '@ionic/react';
import { Session } from '@supabase/supabase-js';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import PhoneInput, { PhoneInputValue } from '../components/PhoneInput';
import AddressInput, { AddressValue, getAliasIcon, getAliasLabel } from '../components/AddressInput';
import { PAISES_SOPORTADOS } from '../data/paises';
import { validarEmailReal, MSG_EMAIL_REAL } from '../lib/validaciones';

/* ── Tipos ───────────────────────────────────────────────────── */
interface Profile {
  id: string; nombre: string; email: string; avatar_url?: string;
  telefono?: string; telefono_codigo_pais?: string; telefono_tipo?: string;
  ciudad?: string; pais_codigo?: string;
  direccion_completa?: string; direccion_linea1?: string; direccion_apto?: string;
  direccion_referencias?: string; direccion_ciudad?: string; direccion_pais?: string;
  direccion_guardada_como?: string; onboarding_completo?: boolean;
}
interface Mascota { id: string; nombre: string; especie: string; foto_url?: string }
interface UltimoPedido { id: string; numero_orden: string; estado: string; created_at: string }
interface ProximaCita { id: string; veterinario_nombre: string; fecha: string; hora: string }

type CampoEditable = 'nombre' | 'email' | 'password' | 'telefono' | 'direccion' | 'ubicacion' | null;

interface Props { session: Session }

/* ── Helpers ─────────────────────────────────────────────────── */
const ESPECIE_EMOJI: Record<string, string> = {
  perro: '🐶', gato: '🐱', ave: '🐦', pez: '🐠', otro: '🐾',
};

const maskEmail = (email: string) => {
  const [user, domain] = email.split('@');
  return `${user[0]}***@${domain}`;
};

const maskPhone = (tel: string) => {
  if (!tel || tel.length < 4) return tel;
  return `${tel.slice(0, Math.max(4, tel.length - 4))}***${tel.slice(-2)}`;
};

const nivelPerfil = (mascotas: number): { label: string; color: string; bg: string } => {
  if (mascotas >= 4) return { label: 'Pet Expert 🏆', color: '#FFE600', bg: 'rgba(255,230,0,0.12)' };
  if (mascotas >= 2) return { label: 'Multi-Pet Pro ⭐', color: '#00E5FF', bg: 'rgba(0,229,255,0.1)' };
  return { label: 'Pet Parent 🐾', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' };
};

const progresoPerfil = (p: Profile | null, mascotas: number) => {
  if (!p) return 0;
  const campos = [p.nombre, p.telefono, p.ciudad, p.direccion_completa, mascotas > 0 ? 'ok' : ''];
  const llenos = campos.filter(Boolean).length;
  return Math.round((llenos / campos.length) * 100);
};

const fortalezaPassword = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { nivel: 'Débil', color: '#FF2D9B', pct: 20 };
  if (score <= 3) return { nivel: 'Media', color: '#FFE600', pct: 60 };
  return { nivel: 'Fuerte', color: '#00F5A0', pct: 100 };
};

/* ── Subcomponente teléfono con estado local (evita re-render) ── */
interface EditTelefonoProps {
  telefonoActual?: string;
  email?: string;
  onSave: (tel: string, codPais: string) => Promise<void>;
  saving: boolean;
}
const EditTelefono: React.FC<EditTelefonoProps> = ({ telefonoActual, email, onSave, saving }) => {
  const [codPais, setCodPais] = useState('+593');
  const [numero,  setNumero]  = useState('');
  const [step,    setStep]    = useState<'input' | 'code'>('input');
  const [codigo,  setCodigo]  = useState('');
  const [sending, setSending] = useState(false);

  const telCompleto = `${codPais}${numero}`;
  const isValid     = numero.length >= 7;

  const sTelRow: React.CSSProperties = { flex: 1, padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid #333', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none' };
  const sBtn2 = (bg: string): React.CSSProperties => ({ padding: '10px', borderRadius: 10, border: 'none', background: bg, color: '#000', fontWeight: 800, fontSize: 13, cursor: 'pointer', width: '100%' });

  const TelRow = () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <select value={codPais} onChange={e => setCodPais(e.target.value)}
        style={{ background: 'var(--bg-card)', border: '1px solid #333', borderRadius: 8, color: 'var(--text-primary)', padding: '10px 8px', fontSize: 13, cursor: 'pointer' }}>
        <option value="+593">🇪🇨 +593</option>
        <option value="+57">🇨🇴 +57</option>
        <option value="+51">🇵🇪 +51</option>
        <option value="+52">🇲🇽 +52</option>
        <option value="+54">🇦🇷 +54</option>
        <option value="+56">🇨🇱 +56</option>
      </select>
      <input type="tel" value={numero} onChange={e => setNumero(e.target.value)}
        placeholder="999 999 999" autoFocus style={sTelRow} />
    </div>
  );

  // Primera vez — sin verificación
  if (!telefonoActual) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
      <div style={{ background: 'rgba(255,230,0,0.08)', border: '1px solid rgba(255,230,0,0.25)', borderRadius: 10, padding: '10px 12px' }}>
        <p style={{ margin: 0, fontSize: 12, color: '#FFE600', lineHeight: 1.5 }}>
          📱 Tu número es importante para confirmar citas, recibir actualizaciones de pedidos y recuperar tu cuenta
        </p>
      </div>
      <TelRow />
      <button onClick={() => onSave(telCompleto, codPais)} disabled={saving || !isValid}
        style={{ ...sBtn2('#00F5A0'), opacity: saving || !isValid ? 0.6 : 1 }}>
        {saving ? '…' : 'Guardar número'}
      </button>
    </div>
  );

  // Cambiar número — paso ingreso
  if (step === 'input') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
      <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
        Número actual: <span style={{ color: 'var(--text-primary)' }}>{telefonoActual}</span>
      </p>
      <TelRow />
      <button
        onClick={async () => { setSending(true); await new Promise(r => setTimeout(r, 2000)); setSending(false); setStep('code'); }}
        disabled={sending || !isValid}
        style={{ ...sBtn2('#00E5FF'), opacity: sending || !isValid ? 0.6 : 1 }}>
        {sending ? '⏳ Enviando…' : 'Enviar código de verificación'}
      </button>
    </div>
  );

  // Cambiar número — paso código
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
      <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
        Código enviado por WhatsApp 💬 al <span style={{ color: '#00E5FF' }}>{telCompleto}</span>
      </p>
      <input type="tel" value={codigo} onChange={e => setCodigo(e.target.value.slice(0, 6))}
        placeholder="000000" maxLength={6} autoFocus
        style={{ padding: '12px', background: 'var(--bg-secondary)', border: '1px solid #333', borderRadius: 10, color: 'var(--text-primary)', fontSize: 28, letterSpacing: 8, textAlign: 'center', fontWeight: 700, outline: 'none', width: '100%', boxSizing: 'border-box' }}
      />
      <button onClick={() => { if (codigo.length === 6) onSave(telCompleto, codPais); }}
        disabled={saving || codigo.length !== 6}
        style={{ ...sBtn2('#00F5A0'), opacity: saving || codigo.length !== 6 ? 0.5 : 1 }}>
        {saving ? '…' : 'Confirmar código'}
      </button>
      <button onClick={() => setStep('input')}
        style={{ background: 'none', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
        ← Cambiar número
      </button>
      {email
        ? <p style={{ fontSize: 11, color: '#555', margin: 0 }}>¿No tienes acceso? Te enviamos el código a <span style={{ color: '#888' }}>{email[0]}***@{email.split('@')[1]}</span></p>
        : <p style={{ fontSize: 11, color: '#555', margin: 0 }}>¿No tienes acceso? Contacta a <span style={{ color: '#00E5FF' }}>soporte@epetplace.com</span></p>
      }
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════ */
const Profile: React.FC<Props> = ({ session }) => {
  const [profile,       setProfile]       = useState<Profile | null>(null);
  const [mascotas,      setMascotas]      = useState<Mascota[]>([]);
  const [ultimoPedido,  setUltimoPedido]  = useState<UltimoPedido | null>(null);
  const [proximaCita,   setProximaCita]   = useState<ProximaCita | null>(null);
  const [editando,      setEditando]      = useState<CampoEditable>(null);
  const [saving,        setSaving]        = useState(false);
  const [toast,         setToast]         = useState('');
  const [showLogout,    setShowLogout]    = useState(false);
  const [showAvatar,    setShowAvatar]    = useState(false);
  const [brokenPhotos,  setBrokenPhotos]  = useState<Set<string>>(new Set());
  const { isDark, toggleTheme } = useTheme();
  const { clearCart } = useCart();
  const history = useHistory();

  /* Campos de edición */
  const [editNombre,   setEditNombre]   = useState('');
  const [editEmail,    setEditEmail]    = useState('');
  const [emailStep,    setEmailStep]    = useState<'input' | 'code'>('input');
  const [emailCodigo,  setEmailCodigo]  = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [errorEmail,   setErrorEmail]   = useState('');
  const [pwdActual,    setPwdActual]    = useState('');
  const [pwdNueva,     setPwdNueva]     = useState('');
  const [pwdConfirm,   setPwdConfirm]   = useState('');
  const [showPwd,      setShowPwd]      = useState({ actual: false, nueva: false, confirm: false });
  const [telSaving,    setTelSaving]    = useState(false);
  const [editAddress,  setEditAddress]  = useState<Partial<AddressValue>>({});
  const [editPais,     setEditPais]     = useState('EC');
  const [editCiudad,   setEditCiudad]   = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ── Fetch datos ─────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    const uid = session.user.id;
    const [{ data: prof }, { data: mascs }, { data: pedido }, { data: cita }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('mascotas').select('id,nombre,especie,foto_url').eq('user_id', uid).order('nombre'),
      supabase.from('pedidos').select('id,numero_orden,estado,created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('citas').select('id,veterinario_nombre,fecha,hora').eq('user_id', uid).gte('fecha', new Date().toISOString().split('T')[0]).order('fecha', { ascending: true }).limit(1).maybeSingle(),
    ]);
    if (prof) {
      setProfile(prof);
      setEditNombre(prof.nombre ?? '');
      setEditPais(prof.pais_codigo ?? 'EC');
      setEditCiudad(prof.ciudad ?? '');
      setEditAddress({
        completa:    prof.direccion_completa    ?? '',
        linea1:      prof.direccion_linea1      ?? '',
        apto:        prof.direccion_apto        ?? '',
        referencias: prof.direccion_referencias ?? '',
        ciudad:      prof.direccion_ciudad      ?? '',
        pais:        prof.direccion_pais        ?? '',
        guardadoComo: prof.direccion_guardada_como ?? 'casa',
      });
    }
    if (mascs) setMascotas(mascs as Mascota[]);
    if (pedido) setUltimoPedido(pedido as UltimoPedido);
    if (cita)   setProximaCita(cita  as ProximaCita);
  }, [session.user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useIonViewWillEnter(() => { fetchData(); });

  /* ── Guardar campo ───────────────────────────────────────────── */
  const guardar = async (campo: CampoEditable, datos: Record<string, unknown>) => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update(datos).eq('id', session.user.id);
    if (!error) {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) setProfile(data);
      showToast('¡Guardado! +15 puntos 🎉');
      setEditando(null);
    } else {
      showToast('❌ Error al guardar');
    }
    setSaving(false);
  };

  /* ── Cerrar sesión ───────────────────────────────────────────── */
  const handleLogout = async () => {
    clearCart();
    await supabase.auth.signOut();
    localStorage.clear();
  };

  /* ── Avatar ──────────────────────────────────────────────────── */
  const displayNombre = profile?.nombre ?? session.user.email?.split('@')[0] ?? 'Usuario';
  const initials = displayNombre.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const joinYear  = new Date(session.user.created_at ?? Date.now()).getFullYear();
  const nivel     = nivelPerfil(mascotas.length);
  const progreso  = progresoPerfil(profile, mascotas.length);

  /* ── País seleccionado ───────────────────────────────────────── */
  const paisObj   = PAISES_SOPORTADOS.find(p => p.codigo === editPais) ?? PAISES_SOPORTADOS[0];
  const ciudades  = paisObj.ciudades;

  /* ── UI helpers ──────────────────────────────────────────────── */
  const abrirEdicion = (campo: CampoEditable) => {
    setEditando(prev => prev === campo ? null : campo);
    // Reset estados internos al abrir
    if (campo === 'email')    { setEditEmail(''); }
    if (campo === 'password') { setPwdActual(''); setPwdNueva(''); setPwdConfirm(''); }
  };

  const sInputBase: React.CSSProperties = {
    width: '100%', padding: '12px', boxSizing: 'border-box',
    background: 'var(--bg-secondary)', border: '1px solid #333',
    borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none',
  };
  const sBtn = (color: string): React.CSSProperties => ({
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: color, color: '#000', fontWeight: 800, fontSize: 13, cursor: 'pointer',
  });

  /* ════════════════════════════════════════════════════════════════
     RENDER CAMPOS EDITABLES
  ═══════════════════════════════════════════════════════════════ */

  const renderEditorNombre = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
      <IonInput value={editNombre} onIonChange={e => setEditNombre(e.detail.value || '')}
        autofocus placeholder="Tu nombre completo"
        style={{ background: 'var(--bg-secondary)', border: '1px solid #333', borderRadius: 10, padding: '0 12px', color: 'var(--text-primary)', fontSize: 14 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => guardar('nombre', { nombre: editNombre.trim() })}
          disabled={saving || !editNombre.trim()} style={{ ...sBtn('#00F5A0'), flex: 1, opacity: saving ? 0.6 : 1 }}>
          {saving ? '…' : 'Guardar'}
        </button>
        <button onClick={() => setEditando(null)}
          style={{ ...sBtn('#222'), flex: 1, color: '#888', border: '1px solid #333' }}>
          Cancelar
        </button>
      </div>
    </div>
  );

  const renderEditorEmail = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
      <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
        Email actual: <span style={{ color: 'var(--text-primary)' }}>{maskEmail(session.user.email ?? '')}</span>
      </p>
      <IonInput value={editEmail}
        onIonChange={e => { setEditEmail(e.detail.value || ''); setErrorEmail(''); }}
        type="email" autofocus placeholder="Nuevo email"
        style={{ background: 'var(--bg-secondary)', border: `1px solid ${errorEmail ? '#FF2D9B' : '#333'}`, borderRadius: 10, padding: '0 12px', color: 'var(--text-primary)', fontSize: 14 }}
      />
      {errorEmail && (
        <p style={{ color: '#FF2D9B', fontSize: 12, margin: '-4px 0 0' }}>⚠️ {errorEmail}</p>
      )}
      <p style={{ margin: 0, fontSize: 11, color: '#555' }}>
        Recibirás un link en el nuevo email para confirmar el cambio.
      </p>
      <button
        onClick={async () => {
          const nuevoEmail = editEmail.trim();
          setErrorEmail('');
          if (!nuevoEmail) return;
          if (nuevoEmail === session.user.email) { setErrorEmail('El email nuevo debe ser diferente al actual'); return; }
          const emailErr = validarEmailReal(nuevoEmail);
          if (emailErr) {
            setErrorEmail(emailErr + ' — ' + MSG_EMAIL_REAL);
            return;
          }
          setEmailSending(true);
          const { error } = await supabase.auth.updateUser({ email: nuevoEmail });
          setEmailSending(false);
          if (error) {
            console.log('Error completo:', error.status, error.message, error.code);
            if (error.message.includes('invalid') || error.message.includes('email_address_invalid')) {
              setErrorEmail('Email inválido — ' + MSG_EMAIL_REAL);
            } else {
              setErrorEmail('❌ ' + error.message);
            }
            return;
          }
          showToast(`✅ Link enviado a ${nuevoEmail}. Haz click en él para completar el cambio. No será efectivo hasta que confirmes desde tu nuevo email.`);
          setEditando(null);
        }}
        disabled={emailSending || !editEmail.trim()}
        style={{ ...sBtn('#00E5FF'), opacity: emailSending || !editEmail.trim() ? 0.6 : 1 }}>
        {emailSending ? '⏳ Enviando…' : 'Cambiar email'}
      </button>
    </div>
  );

  const renderEditorPassword = () => {
    const fort = fortalezaPassword(pwdNueva);
    const valida = pwdNueva.length >= 8 && pwdNueva === pwdConfirm;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {(['actual', 'nueva', 'confirm'] as const).map((k, i) => (
          <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <IonInput
              type={showPwd[k] ? 'text' : 'password'}
              value={k === 'actual' ? pwdActual : k === 'nueva' ? pwdNueva : pwdConfirm}
              onIonChange={e => {
                const v = e.detail.value || '';
                if (k === 'actual')  setPwdActual(v);
                if (k === 'nueva')   setPwdNueva(v);
                if (k === 'confirm') setPwdConfirm(v);
              }}
              autofocus={i === 0}
              placeholder={k === 'actual' ? 'Contraseña actual' : k === 'nueva' ? 'Nueva contraseña' : 'Confirmar contraseña'}
              style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid #333', borderRadius: 10, padding: '0 12px', color: 'var(--text-primary)', fontSize: 14 }}
            />
            <button type="button" onClick={() => setShowPwd(p => ({ ...p, [k]: !p[k] }))}
              style={{ background: 'none', border: '1px solid #333', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
              {showPwd[k] ? '🙈' : '👁️'}
            </button>
          </div>
        ))}
        {/* Barra fortaleza */}
        {pwdNueva.length > 0 && (
          <div>
            <div style={{ height: 4, borderRadius: 2, background: '#222', overflow: 'hidden' }}>
              <div style={{ width: `${fort.pct}%`, height: '100%', background: fort.color, transition: 'width 0.3s, background 0.3s' }} />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: fort.color }}>{fort.nivel}</p>
          </div>
        )}
        {pwdNueva !== pwdConfirm && pwdConfirm.length > 0 && (
          <p style={{ fontSize: 12, color: '#FF2D9B', margin: 0 }}>Las contraseñas no coinciden</p>
        )}
        <button
          onClick={async () => {
            if (!valida) return;
            setSaving(true);
            const { error } = await supabase.auth.updateUser({ password: pwdNueva });
            setSaving(false);
            if (error) { showToast('❌ ' + error.message); }
            else { showToast('✅ Contraseña actualizada'); setEditando(null); }
          }}
          disabled={saving || !valida}
          style={{ ...sBtn('#00F5A0'), opacity: saving || !valida ? 0.5 : 1 }}>
          {saving ? '…' : 'Actualizar contraseña'}
        </button>
      </div>
    );
  };

  const renderEditorTelefono = () => (
    <EditTelefono
      telefonoActual={profile?.telefono}
      email={session.user.email ?? undefined}
      saving={telSaving}
      onSave={async (tel, codPais) => {
        setTelSaving(true);
        await guardar('telefono', { telefono: tel, telefono_codigo_pais: codPais, telefono_tipo: 'whatsapp' });
        setTelSaving(false);
      }}
    />
  );

  const handleAddressChange = useCallback((addr: AddressValue) => {
    setEditAddress(addr);
  }, []);

  const renderEditorDireccion = () => (
    <div style={{ marginTop: 12 }}>
      <AddressInput
        value={editAddress}
        onChange={handleAddressChange}
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault(); e.stopPropagation();
          guardar('direccion', {
            direccion_completa:      editAddress.completa    || '',
            direccion_linea1:        editAddress.linea1      || '',
            direccion_apto:          editAddress.apto        || '',
            direccion_referencias:   editAddress.referencias || '',
            direccion_ciudad:        editAddress.ciudad      || '',
            direccion_pais:          editAddress.pais        || '',
            direccion_guardada_como: editAddress.guardadoComo || 'casa',
          });
        }}
        disabled={saving}
        style={{ ...sBtn('#00F5A0'), width: '100%', marginTop: 12, opacity: saving ? 0.6 : 1 }}>
        {saving ? '…' : 'Guardar dirección'}
      </button>
    </div>
  );

  const renderEditorUbicacion = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
      <div>
        <p style={{ margin: '0 0 6px', fontSize: 12, color: '#888' }}>País</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PAISES_SOPORTADOS.map(p => (
            <button key={p.codigo} type="button" onClick={() => { setEditPais(p.codigo); setEditCiudad(''); }}
              style={{
                padding: '6px 12px', borderRadius: 8, border: `1px solid ${editPais === p.codigo ? '#00E5FF' : '#333'}`,
                background: editPais === p.codigo ? '#0d1a2b' : 'var(--bg-card)',
                color: editPais === p.codigo ? '#00E5FF' : '#888',
                fontSize: 12, cursor: 'pointer', fontWeight: editPais === p.codigo ? 700 : 400,
              }}>
              {p.bandera} {p.nombre}
            </button>
          ))}
        </div>
      </div>
      {ciudades.length > 0 && (
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: '#888' }}>Ciudad</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ciudades.map(c => (
              <button key={c} type="button" onClick={() => setEditCiudad(c)}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: `1px solid ${editCiudad === c ? '#00E5FF' : '#333'}`,
                  background: editCiudad === c ? '#0d1a2b' : 'var(--bg-card)',
                  color: editCiudad === c ? '#00E5FF' : '#888', fontSize: 12, cursor: 'pointer',
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      <button onClick={() => guardar('ubicacion', { pais_codigo: editPais, ciudad: editCiudad })}
        disabled={saving} style={{ ...sBtn('#00F5A0'), opacity: saving ? 0.6 : 1 }}>
        {saving ? '…' : 'Guardar ubicación'}
      </button>
    </div>
  );

  /* ── Card de dato editable ───────────────────────────────────── */
  const DataCard = ({
    campo, icono, color, label, valor, editor,
  }: {
    campo: CampoEditable; icono: string; color: string;
    label: string; valor: string; editor: React.ReactNode;
  }) => (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 14,
      border: `1px solid ${editando === campo ? color + '44' : 'var(--border-color)'}`,
      padding: '14px 16px', transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
          {icono}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>{label}</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {valor || <span style={{ color: '#444' }}>Sin configurar</span>}
          </p>
        </div>
        <button type="button" onClick={() => abrirEdicion(editando === campo ? null : campo)}
          style={{ background: 'none', border: '1px solid #333', borderRadius: 8, padding: '5px 10px', color: editando === campo ? color : '#555', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
          {editando === campo ? 'Cerrar' : '✏️'}
        </button>
      </div>
      {editando === campo && editor}
    </div>
  );

  /* ════════════════════════════════════════════════════════════════
     RENDER PRINCIPAL
  ═══════════════════════════════════════════════════════════════ */
  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="pb-28" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

          {/* ══ ZONA 1: HERO ══════════════════════════════════════ */}
          <div style={{
            background: 'linear-gradient(180deg, #1a0a1a 0%, var(--bg-primary) 100%)',
            padding: '56px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar"
                  style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid transparent', backgroundImage: 'linear-gradient(#000,#000), linear-gradient(135deg,#FF2D9B,#00E5FF)', backgroundOrigin: 'border-box', backgroundClip: 'content-box, border-box' }}
                />
              ) : (
                <div style={{
                  width: 90, height: 90, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF2D9B, #00E5FF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, fontWeight: 900, color: '#fff',
                  boxShadow: '0 0 40px rgba(255,45,155,0.3)',
                  transition: 'transform 0.2s',
                }}>
                  {initials}
                </div>
              )}
              <button type="button" onClick={() => setShowAvatar(true)}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#111', border: '2px solid #333',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, cursor: 'pointer',
                }}>
                📷
              </button>
            </div>

            {/* Nombre + email */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' }}>{displayNombre}</h2>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>{session.user.email}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#444' }}>Miembro desde {joinYear}</p>
            </div>

            {/* Badge de nivel */}
            <div style={{ background: nivel.bg, border: `1px solid ${nivel.color}44`, borderRadius: 20, padding: '5px 14px' }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: nivel.color }}>{nivel.label}</p>
            </div>

            {/* Barra de progreso */}
            {progreso < 100 && (
              <div style={{ width: '100%', maxWidth: 300 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Perfil al {progreso}% completo</p>
                  <button type="button" onClick={() => setEditando('nombre')}
                    style={{ background: 'none', border: 'none', color: '#00E5FF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Completar →
                  </button>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#222', overflow: 'hidden' }}>
                  <div style={{ width: `${progreso}%`, height: '100%', background: 'linear-gradient(90deg,#FF2D9B,#00E5FF)', transition: 'width 0.5s' }} />
                </div>
              </div>
            )}
          </div>

          {/* ══ ZONA 2: MIS MASCOTAS ══════════════════════════════ */}
          <div className="px-5 mb-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Mis compañeros <span style={{ color: '#555', fontWeight: 400 }}>({mascotas.length})</span>
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {mascotas.map(m => (
                <button key={m.id} type="button" onClick={() => history.push(`/biopet/${m.id}`)}
                  style={{ flexShrink: 0, width: 80, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  {(m.foto_url && !brokenPhotos.has(m.id)) ? (
                    <img src={m.foto_url} alt={m.nombre} onError={() => setBrokenPhotos(p => new Set(p).add(m.id))}
                      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#FF2D9B,#00E5FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>
                      {m.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-primary)', fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{m.nombre}</p>
                  <span style={{ fontSize: 14 }}>{ESPECIE_EMOJI[m.especie] || '🐾'}</span>
                </button>
              ))}
              {/* Card + */}
              <button type="button" onClick={() => history.push('/biopet/new')}
                style={{ flexShrink: 0, width: 80, background: 'var(--bg-card)', border: '1px dashed #333', borderRadius: 14, padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#444' }}>+</div>
                <p style={{ margin: 0, fontSize: 11, color: '#444' }}>Agregar</p>
              </button>
            </div>
          </div>

          {/* ══ ZONA 3: MIS DATOS ════════════════════════════════ */}
          <div className="px-5 mb-6">
            <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Mis datos ✏️
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <DataCard campo="nombre"    icono="👤" color="#A78BFA" label="Nombre completo" valor={profile?.nombre ?? ''} editor={renderEditorNombre()} />
              <DataCard campo="email"     icono="📧" color="#00E5FF" label="Email"           valor={session.user.email ?? ''} editor={renderEditorEmail()} />
              <DataCard campo="password"  icono="🔒" color="#FF6B35" label="Contraseña"      valor="••••••••" editor={renderEditorPassword()} />
              <DataCard campo="telefono"  icono="📱" color="#00F5A0" label="Teléfono"
                valor={profile?.telefono ?? ''}
                editor={renderEditorTelefono()}
              />
              <DataCard campo="direccion" icono="📍" color="#FF2D9B" label="Dirección principal"
                valor={profile?.direccion_completa ? `${getAliasIcon(profile.direccion_guardada_como)} ${profile.direccion_completa.split(',').slice(0,2).join(',')}` : ''}
                editor={renderEditorDireccion()}
              />
              <DataCard campo="ubicacion" icono="🌍" color="#FFE600" label="País y ciudad"
                valor={[PAISES_SOPORTADOS.find(p => p.codigo === profile?.pais_codigo)?.bandera, PAISES_SOPORTADOS.find(p => p.codigo === profile?.pais_codigo)?.nombre, profile?.ciudad].filter(Boolean).join(' · ')}
                editor={renderEditorUbicacion()}
              />
            </div>
          </div>

          {/* ══ ZONA 4: ACTIVIDAD RECIENTE ══════════════════════ */}
          <div className="px-5 mb-6">
            <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Actividad reciente
            </h2>
            {!ultimoPedido && !proximaCita ? (
              <p style={{ color: '#444', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                Aún no tienes actividad reciente
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ultimoPedido && (
                  <button type="button" onClick={() => history.push('/mis-pedidos')}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                    <span style={{ fontSize: 22 }}>📦</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        Pedido #{ultimoPedido.numero_orden}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#888', textTransform: 'capitalize' }}>
                        {ultimoPedido.estado} · {new Date(ultimoPedido.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span style={{ color: '#444' }}>›</span>
                  </button>
                )}
                {proximaCita && (
                  <button type="button" onClick={() => history.push('/vet')}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                    <span style={{ fontSize: 22 }}>🗓️</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        Cita con {proximaCita.veterinario_nombre}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#888' }}>
                        {new Date(proximaCita.fecha + 'T00:00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })} · {proximaCita.hora}
                      </p>
                    </div>
                    <span style={{ color: '#444' }}>›</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ══ ZONA 5: CONFIGURACIÓN ════════════════════════════ */}
          <div className="px-5 mb-6">
            <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Configuración
            </h2>
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              {/* Tema */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 20 }}>{isDark ? '🌙' : '☀️'}</span>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{isDark ? 'Modo oscuro' : 'Modo claro'}</span>
                <IonToggle checked={isDark} onIonChange={toggleTheme}
                  style={{ '--track-background-checked': '#00E5FF', '--handle-background-checked': '#000' } as React.CSSProperties} />
              </div>
              {/* Notificaciones */}
              <button type="button" onClick={() => showToast('Notificaciones — próximamente 🔜')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 20 }}>🔔</span>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>Notificaciones</span>
                <span style={{ color: '#444', fontSize: 12 }}>Pronto</span>
              </button>
              {/* Idioma */}
              <button type="button" onClick={() => showToast('Multi-idioma — próximamente 🔜')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 20 }}>🌍</span>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>Idioma</span>
                <span style={{ color: '#444', fontSize: 12 }}>Español</span>
              </button>
            </div>
          </div>

          {/* ══ ZONA 6: LEGAL Y SOPORTE ══════════════════════════ */}
          <div className="px-5 mb-6">
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              {[
                { icon: '🌟', label: 'e-PetPlace',               val: 'v1.0.0',  ruta: null,         action: null },
                { icon: '📄', label: 'Términos de uso',          val: '›',       ruta: '/terminos',  action: null },
                { icon: '🔒', label: 'Política de privacidad',   val: '›',       ruta: '/privacidad', action: null },
                { icon: '🍪', label: 'Política de cookies',      val: '›',       ruta: '/cookies',   action: null },
                { icon: '💬', label: 'Centro de ayuda',           val: '›',       ruta: '/ayuda',     action: null },
              ].map((item, i, arr) => (
                <button key={item.label} type="button"
                  onClick={() => item.ruta ? history.push(item.ruta) : (item.action as (() => void) | null)?.(  )}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none', cursor: item.ruta || item.action ? 'pointer' : 'default', textAlign: 'left' }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: item.ruta || item.action ? '#00E5FF' : 'var(--text-secondary)' }}>{item.val}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ══ ZONA 7: CERRAR SESIÓN ════════════════════════════ */}
          <div className="px-5 pb-4">
            <button type="button" onClick={() => setShowLogout(true)}
              style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'rgba(255,45,155,0.08)', border: '1px solid rgba(255,45,155,0.22)', color: '#FF2D9B', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 0 20px rgba(255,45,155,0.1)' }}>
              Cerrar sesión 👋
            </button>
          </div>
        </div>

        {/* ── Toast ──────────────────────────────────────────────── */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(90deg,#FF2D9B,#00E5FF)', borderRadius: 14,
            padding: '12px 22px', color: '#000', fontSize: 14, fontWeight: 800,
            zIndex: 9999, whiteSpace: 'nowrap', boxShadow: '0 4px 30px rgba(0,229,255,0.35)',
            maxWidth: '90vw', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{toast}</div>
        )}

        {/* ── IonActionSheet — cambiar avatar ────────────────────── */}
        <IonActionSheet
          isOpen={showAvatar}
          onDidDismiss={() => setShowAvatar(false)}
          header="Foto de perfil"
          buttons={[
            { text: 'Tomar foto 📷', handler: () => showToast('Cámara — próximamente 📷') },
            { text: 'Elegir de galería 🖼️', handler: () => showToast('Galería — próximamente 🖼️') },
            { text: 'Cancelar', role: 'cancel' },
          ]}
        />

        {/* ── IonAlert — confirmar logout ──────────────────────────── */}
        <IonAlert
          isOpen={showLogout}
          onDidDismiss={() => setShowLogout(false)}
          header="¿Cerrar sesión?"
          message="¿Seguro que quieres salir de tu cuenta?"
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Salir', role: 'destructive', handler: handleLogout },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
