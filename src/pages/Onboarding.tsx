/*
-- SQL requerido (ejecutar en Supabase SQL Editor):
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nombre text;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completo boolean DEFAULT false;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ciudad text;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pais text;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tipo_mascotas text[];
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefono text;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS direccion_principal text;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS foto_url text;
--
-- STORAGE — crear bucket en Supabase Dashboard → Storage → New bucket:
--   Nombre: mascotas   Public: ✅
-- Luego ejecutar:
--   CREATE POLICY "upload_pet_photos" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'mascotas' AND auth.role() = 'authenticated');
--   CREATE POLICY "read_pet_photos" ON storage.objects
--     FOR SELECT USING (bucket_id = 'mascotas');
*/

import React, { useState, useRef } from 'react';
import { IonPage, IonContent, IonModal } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import logoImg from '../assets/logo.png';
import { RAZAS, TITULO_ESPECIE, RazaInput } from './BioPet';
import { PAISES_SOPORTADOS } from '../data/paises';

interface Props { session: Session }

const TIPOS_MASCOTA = [
  { id: 'perro',  emoji: '🐕', label: 'Perro'  },
  { id: 'gato',   emoji: '🐈', label: 'Gato'   },
  { id: 'ave',    emoji: '🦜', label: 'Ave'    },
  { id: 'conejo', emoji: '🐇', label: 'Conejo' },
  { id: 'pez',    emoji: '🐠', label: 'Pez'    },
  { id: 'reptil', emoji: '🦎', label: 'Reptil' },
  { id: 'otro',   emoji: '🐾', label: 'Otro'   },
];


const selectStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#111', border: '1px solid #222', borderRadius: 12,
  padding: '13px 40px 13px 16px', color: '#fff',
  fontSize: 14, appearance: 'none', WebkitAppearance: 'none',
};

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#111', border: '1px solid #222', borderRadius: 12,
  padding: '13px 16px', color: '#fff', fontSize: 14, outline: 'none',
};

const labelStyle: React.CSSProperties = {
  color: '#444', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  margin: '0 0 8px', display: 'block',
};

const errorStyle: React.CSSProperties = {
  color: '#FF2D9B', fontSize: 13, marginTop: 6, fontWeight: 500,
};

const skipBtnStyle: React.CSSProperties = {
  width: '100%', padding: '12px 0', background: 'none', border: 'none',
  color: '#aaaaaa', fontSize: 14, cursor: 'pointer', marginTop: 10, fontWeight: 500,
};

const uploadPetPhoto = async (file: File, petId: string): Promise<string | null> => {
  const ext  = file.name.split('.').pop() ?? 'jpg';
  const path = `${petId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from('mascotas')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) { console.error('[Storage] error en onboarding:', error.message); return null; }
  const { data } = supabase.storage.from('mascotas').getPublicUrl(path);
  return data.publicUrl;
};

const Onboarding: React.FC<Props> = ({ session }) => {
  const history  = useHistory();
  const location = useLocation();
  const fileRef  = useRef<HTMLInputElement>(null);

  // Si viene con ?step=ciudad, saltar directo al paso 2 sin modal ni paso 1
  const stepParam = new URLSearchParams(location.search).get('step');
  const esSoloCiudad = stepParam === 'ciudad';

  // ── Welcome modal ────────────────────────────────────────────
  const [showWelcome, setShowWelcome] = useState(!esSoloCiudad);

  // ── Navegación ───────────────────────────────────────────────
  const [paso, setPaso] = useState<1 | 2>(esSoloCiudad ? 2 : 1);

  // ── Formulario mascota ───────────────────────────────────────
  const [especie,         setEspecie]         = useState('');
  const [nombreMascota,   setNombreMascota]   = useState('');
  const [raza,            setRaza]            = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo,            setSexo]            = useState('');
  const [peso,            setPeso]            = useState('');
  const [photoFile,       setPhotoFile]       = useState<File | null>(null);
  const [photoPreview,    setPhotoPreview]    = useState<string | null>(null);

  // ── Errores mascota ──────────────────────────────────────────
  const [errEspecie, setErrEspecie] = useState('');
  const [errNombre,  setErrNombre]  = useState('');
  const [errFecha,   setErrFecha]   = useState('');
  const [errSexo,    setErrSexo]    = useState('');
  const [errPeso,    setErrPeso]    = useState('');

  // ── Ubicación ────────────────────────────────────────────────
  const [paisCodigo,  setPaisCodigo]  = useState('');
  const [ciudad,      setCiudad]      = useState('');
  const [ciudadTexto, setCiudadTexto] = useState('');
  const [errPais,     setErrPais]     = useState('');
  const [errCiudad,   setErrCiudad]   = useState('');
  const [saving,      setSaving]      = useState(false);

  const progreso    = paso === 1 ? 50 : 100;
  const paisData    = PAISES_SOPORTADOS.find(p => p.codigo === paisCodigo) ?? null;
  const ciudades    = paisData?.ciudades ?? [];
  const ciudadFinal = ciudad === 'Otra' ? ciudadTexto.trim() : ciudad;
  const ubicValida  = !!(paisCodigo && ciudadFinal);
  const tituloPet   = especie
    ? (TITULO_ESPECIE[especie] ?? '🐾 Tu Mascota')
    : '🐾 Cuéntanos sobre tu mascota';

  // ── Foto ─────────────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // ── Validar fecha ─────────────────────────────────────────────
  const validarFecha = (val: string): string => {
    if (!val) return '⚠️ La fecha de nacimiento es obligatoria';
    const d   = new Date(val);
    const now = new Date();
    const min = new Date(); min.setFullYear(min.getFullYear() - 30);
    if (d > now) return '⚠️ Verifica la fecha de nacimiento 📅 — no puede ser futura';
    if (d < min) return '⚠️ Verifica la fecha de nacimiento 📅 — no puede ser más de 30 años';
    return '';
  };

  // ── Validar paso 1 ────────────────────────────────────────────
  const validarPaso1 = (): boolean => {
    const ee = especie         ? '' : '⚠️ Selecciona la especie de tu mascota';
    const en = nombreMascota.trim() ? '' : '⚠️ El nombre de tu mascota es obligatorio';
    const ef = validarFecha(fechaNacimiento);
    const es = (especie === 'pez' || especie === 'ave')
      ? ''
      : (sexo ? '' : '⚠️ Selecciona el sexo de tu mascota');
    const ep = peso
      ? ((parseFloat(peso) >= 0.1 && parseFloat(peso) <= 200) ? '' : '⚠️ El peso debe estar entre 0.1 y 200 kg')
      : '';

    setErrEspecie(ee);
    setErrNombre(en);
    setErrFecha(ef);
    setErrSexo(es);
    setErrPeso(ep);

    return !ee && !en && !ef && !es && !ep;
  };

  const intentarPaso2 = () => {
    if (validarPaso1()) setPaso(2);
  };

  // ── País ──────────────────────────────────────────────────────
  const handlePaisChange = (val: string) => {
    setPaisCodigo(val);
    setCiudad('');
    setCiudadTexto('');
    if (val) setErrPais('');
  };

  // ── Guardar todo y finalizar ──────────────────────────────────
  const completarOnboarding = async (skipLocation = false) => {
    if (!skipLocation) {
      const ep = paisCodigo  ? '' : '⚠️ Selecciona tu país para continuar';
      const ec = ciudadFinal ? '' : '⚠️ Selecciona tu ciudad para continuar';
      setErrPais(ep);
      setErrCiudad(ec);
      if (ep || ec) return;
    }

    setSaving(true);

    // Actualizar perfil
    const updateData: Record<string, unknown> = { onboarding_completo: true };
    if (!skipLocation) {
      if (ciudadFinal) updateData.ciudad       = ciudadFinal;
      if (paisData) {
        updateData.pais       = paisData.nombre;
        updateData.pais_codigo = paisData.codigo;
      }
      if (especie)     updateData.tipo_mascotas = [especie];
    }
    const { error: profErr } = await supabase
      .from('profiles').update(updateData).eq('id', session.user.id);
    console.log('Onboarding profile:', profErr ?? 'OK');

    localStorage.setItem(`onboarding_done_${session.user.id}`, 'true');

    // Crear mascota si el usuario llenó los datos mínimos en paso 1
    if (especie && nombreMascota.trim() && fechaNacimiento) {
      const mascPayload: Record<string, unknown> = {
        user_id:          session.user.id,
        nombre:           nombreMascota.trim(),
        especie,
        raza:             raza || null,
        fecha_nacimiento: fechaNacimiento,
        sexo:             sexo || null,
        peso:             peso ? parseFloat(peso) : null,
      };
      const { data: mascData, error: mascErr } = await supabase
        .from('mascotas').insert(mascPayload).select('id').single();
      console.log('Onboarding mascota:', mascErr ?? 'OK', mascData?.id);

      if (!mascErr && mascData?.id && photoFile) {
        const url = await uploadPetPhoto(photoFile, mascData.id);
        if (url) await supabase.from('mascotas').update({ foto_url: url }).eq('id', mascData.id);
      }
    }

    setSaving(false);
    history.replace('/home');
  };

  // ── Postergar onboarding desde welcome modal ──────────────────
  const postergarOnboarding = () => {
    localStorage.setItem('onboarding_postponed', 'true');
    localStorage.setItem(`onboarding_done_${session.user.id}`, 'true');
    supabase.from('profiles')
      .update({ onboarding_completo: true })
      .eq('id', session.user.id)
      .then(({ error }) => console.log('Postpone profile:', error ?? 'OK'));
    history.replace('/home');
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': '#000' } as React.CSSProperties}>
        <div style={{ background: '#000', minHeight: '100vh', padding: '56px 24px 48px' }}>

          {/* ── Barra de progreso ──────────────────────────────── */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: '#444', fontSize: 12, fontWeight: 600 }}>Paso {paso} de 2</span>
              <span style={{
                background: 'linear-gradient(90deg,#FF2D9B,#00E5FF)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontSize: 12, fontWeight: 800,
              }}>{progreso}%</span>
            </div>
            <div style={{ height: 4, background: '#1a1a1a', borderRadius: 4 }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: 'linear-gradient(90deg,#FF2D9B,#00E5FF)',
                width: `${progreso}%`,
                transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>

          {/* ════════════════════════════════════════════════════
              PASO 1 — Datos de la mascota
          ════════════════════════════════════════════════════ */}
          {paso === 1 && (
            <>
              <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 22, margin: '0 0 6px', lineHeight: 1.3 }}>
                {tituloPet}
              </h2>
              <p style={{ color: '#555', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
                Personaliza su cuidado con estos datos básicos
              </p>

              {/* Foto (opcional) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 22 }}>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: 88, height: 88, borderRadius: '50%', cursor: 'pointer',
                    background: photoPreview ? 'none' : 'linear-gradient(135deg,#FF2D9B,#00E5FF)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', position: 'relative',
                    boxShadow: '0 0 20px rgba(0,229,255,0.2)',
                  }}
                >
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 32 }}>📷</span>}
                  {photoPreview && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ color: '#fff', fontSize: 18 }}>✎</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                <p style={{ color: '#555', fontSize: 12, margin: 0 }}>
                  Foto <span style={{ color: '#333' }}>(opcional)</span>
                </p>
              </div>

              {/* Especie * */}
              <div style={{ marginBottom: 20 }}>
                <p style={labelStyle}>Especie *</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {TIPOS_MASCOTA.map(t => {
                    const sel = especie === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setEspecie(t.id); setRaza(''); setSexo(''); setErrEspecie(''); }}
                        style={{
                          background: sel ? 'rgba(0,229,255,0.08)' : '#111',
                          border: `2px solid ${sel ? '#00E5FF' : errEspecie ? '#FF2D9B44' : '#1e1e1e'}`,
                          borderRadius: 16, padding: '14px 4px 10px',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', gap: 6, cursor: 'pointer',
                          transition: 'all 0.18s',
                          boxShadow: sel ? '0 0 18px rgba(0,229,255,0.12)' : 'none',
                          position: 'relative',
                        }}
                      >
                        {sel && (
                          <div style={{
                            position: 'absolute', top: 6, right: 6,
                            width: 14, height: 14, borderRadius: '50%',
                            background: 'linear-gradient(135deg,#FF2D9B,#00E5FF)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, color: '#000', fontWeight: 900,
                          }}>✓</div>
                        )}
                        <span style={{ fontSize: 28, lineHeight: 1 }}>{t.emoji}</span>
                        <span style={{ color: sel ? '#00E5FF' : '#666', fontSize: 11, fontWeight: 700 }}>
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errEspecie && <p style={errorStyle}>{errEspecie}</p>}
              </div>

              {/* Nombre * */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Nombre *</label>
                <input
                  type="text"
                  value={nombreMascota}
                  onChange={e => { setNombreMascota(e.target.value); if (e.target.value.trim()) setErrNombre(''); }}
                  placeholder="Ej: Max, Luna, Simba…"
                  style={{ ...inputStyle, border: `1px solid ${errNombre ? '#FF2D9B' : '#222'}` }}
                />
                {errNombre && <p style={errorStyle}>{errNombre}</p>}
              </div>

              {/* Raza — autocomplete (opcional) */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  Raza{' '}
                  <span style={{ color: '#333', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
                </label>
                <RazaInput value={raza} onChange={setRaza} especie={especie} />
              </div>

              {/* Fecha de nacimiento * */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Fecha de nacimiento *</label>
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={e => { setFechaNacimiento(e.target.value); setErrFecha(validarFecha(e.target.value)); }}
                  max={new Date().toISOString().split('T')[0]}
                  style={{
                    ...inputStyle,
                    border: `1px solid ${errFecha ? '#FF2D9B' : '#222'}`,
                    colorScheme: 'dark',
                  }}
                />
                {errFecha && <p style={errorStyle}>{errFecha}</p>}
              </div>

              {/* Sexo — condicional por especie */}
              {especie !== 'pez' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>
                    Sexo{' '}
                    {especie === 'ave'
                      ? <span style={{ color: '#333', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
                      : '*'}
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[
                      { val: 'Macho',  icon: '♂' },
                      { val: 'Hembra', icon: '♀' },
                      ...(especie === 'ave' ? [{ val: 'No sé', icon: '?' }] : []),
                    ].map(s => (
                      <button
                        key={s.val}
                        type="button"
                        onClick={() => { setSexo(sexo === s.val ? '' : s.val); setErrSexo(''); }}
                        style={{
                          flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                          background: sexo === s.val ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)' : '#111',
                          color: sexo === s.val ? '#000' : '#666',
                          border: sexo === s.val ? 'none' : errSexo ? '1px solid #FF2D9B44' : '1px solid #222',
                          fontWeight: 800, fontSize: 14, transition: 'all 0.15s',
                        }}
                      >
                        {s.icon} {s.val}
                      </button>
                    ))}
                  </div>
                  {errSexo && <p style={errorStyle}>{errSexo}</p>}
                </div>
              )}

              {/* Peso (opcional) */}
              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>
                  Peso{' '}
                  <span style={{ color: '#333', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={peso}
                    onChange={e => { setPeso(e.target.value); setErrPeso(''); }}
                    placeholder="0.0"
                    min="0.1" max="200" step="0.1"
                    style={{ ...inputStyle, border: `1px solid ${errPeso ? '#FF2D9B' : '#222'}`, paddingRight: 50 }}
                  />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 13, fontWeight: 600, pointerEvents: 'none' }}>kg</span>
                </div>
                {errPeso
                  ? <p style={errorStyle}>{errPeso}</p>
                  : <p style={{ color: '#888888', fontSize: 12, marginTop: 6, lineHeight: 1.6 }}>
                      💡 El peso nos ayuda a calcular porciones de alimento y detectar cambios en su salud. Puedes actualizarlo después.
                    </p>}
              </div>

              <button
                onClick={intentarPaso2}
                className="btn-brand"
                style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 16, boxShadow: '0 0 30px rgba(0,229,255,0.15)' }}
              >
                Continuar →
              </button>
              <button type="button" onClick={() => setPaso(2)} style={skipBtnStyle}>
                Omitir este paso →
              </button>
            </>
          )}

          {/* ════════════════════════════════════════════════════
              PASO 2 — Ubicación
          ════════════════════════════════════════════════════ */}
          {paso === 2 && (
            <>
              <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 24, margin: '0 0 8px' }}>
                ¿Dónde estás? 📍
              </h2>
              <p style={{ color: '#555', fontSize: 14, margin: '0 0 32px', lineHeight: 1.6 }}>
                Para mostrarte veterinarios y servicios cercanos
              </p>

              {/* País */}
              <div style={{ marginBottom: 18 }}>
                <p style={labelStyle}>País *</p>
                <div style={{ position: 'relative' }}>
                  <select
                    value={paisCodigo}
                    onChange={e => handlePaisChange(e.target.value)}
                    style={{ ...selectStyle, color: paisCodigo ? '#fff' : '#444' }}
                  >
                    <option value="">Selecciona tu país</option>
                    {PAISES_SOPORTADOS.map(p => (
                      <option key={p.codigo} value={p.codigo}>
                        {p.bandera} {p.nombre}
                      </option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#444', fontSize: 12, pointerEvents: 'none' }}>▾</span>
                </div>
                {errPais && <p style={errorStyle}>{errPais}</p>}
              </div>

              {/* Ciudad */}
              <div style={{ marginBottom: 36 }}>
                <p style={labelStyle}>Ciudad *</p>
                <div style={{ position: 'relative' }}>
                  <select
                    value={ciudad}
                    onChange={e => { setCiudad(e.target.value); setCiudadTexto(''); if (e.target.value) setErrCiudad(''); }}
                    disabled={!paisCodigo}
                    style={{ ...selectStyle, color: ciudad ? '#fff' : '#444', opacity: !paisCodigo ? 0.4 : 1 }}
                  >
                    <option value="">{paisCodigo ? 'Selecciona tu ciudad' : 'Primero elige un país'}</option>
                    {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#444', fontSize: 12, pointerEvents: 'none' }}>▾</span>
                </div>
                {ciudad === 'Otra' && (
                  <input
                    type="text"
                    value={ciudadTexto}
                    onChange={e => { setCiudadTexto(e.target.value); if (e.target.value.trim()) setErrCiudad(''); }}
                    placeholder="Escribe tu ciudad"
                    style={{ ...inputStyle, border: `1px solid ${errCiudad ? '#FF2D9B' : '#222'}`, marginTop: 10 }}
                  />
                )}
                {errCiudad && <p style={errorStyle}>{errCiudad}</p>}
              </div>

              <button
                onClick={() => completarOnboarding(false)}
                disabled={saving}
                className="btn-brand"
                style={{
                  width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 16,
                  boxShadow: ubicValida && !saving ? '0 0 30px rgba(0,229,255,0.15)' : 'none',
                  opacity: ubicValida && !saving ? 1 : 0.4,
                  cursor: ubicValida && !saving ? 'pointer' : 'not-allowed',
                  transition: 'opacity 0.2s',
                }}
              >
                {saving ? 'Guardando…' : '¡Empezar! 🚀'}
              </button>
              <button type="button" onClick={() => completarOnboarding(true)} disabled={saving} style={skipBtnStyle}>
                Omitir este paso →
              </button>
            </>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════
            MODAL DE BIENVENIDA (se muestra primero, siempre)
        ════════════════════════════════════════════════════════ */}
        <IonModal
          isOpen={showWelcome}
          backdropDismiss={false}
          style={({ '--background': 'transparent', '--box-shadow': 'none' }) as React.CSSProperties}
        >
          <div style={{
            background: '#000', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '48px 32px 40px',
          }}>
            {/* Logo */}
            <img
              src={logoImg}
              alt="e-PetPlace"
              style={{ width: 130, height: 'auto', marginBottom: 36, display: 'block' }}
            />

            <h2 style={{
              color: '#fff', fontWeight: 900, fontSize: 22,
              textAlign: 'center', margin: '0 0 18px', lineHeight: 1.35,
            }}>
              El único ecosistema digital para el cuidado integral de tus mascotas 🐾
            </h2>

            <p style={{
              color: '#666', fontSize: 15,
              textAlign: 'center', margin: '0 0 44px', lineHeight: 1.75,
            }}>
              Para personalizar tu experiencia, recomendarte los mejores productos y recordarte las vacunas a tiempo, necesitamos conocer a tus compañeros.
            </p>

            <button
              type="button"
              onClick={() => setShowWelcome(false)}
              className="btn-brand"
              style={{
                width: '100%', padding: '16px 0', borderRadius: 14,
                fontSize: 16, marginBottom: 14,
                boxShadow: '0 0 30px rgba(0,229,255,0.2)',
              }}
            >
              ¡Empezar ahora! 🚀
            </button>

            <button
              type="button"
              onClick={postergarOnboarding}
              style={{
                width: '100%', padding: '14px 0',
                background: 'none', border: 'none',
                color: '#aaaaaa', fontSize: 15,
                cursor: 'pointer', fontWeight: 500,
              }}
            >
              Lo haré después
            </button>
          </div>
        </IonModal>

      </IonContent>
    </IonPage>
  );
};

export default Onboarding;
