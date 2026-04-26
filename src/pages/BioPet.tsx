/*
 * ──────────────────────────────────────────────────────────────
 * SUPABASE STORAGE – configuración requerida antes de usar fotos
 * ──────────────────────────────────────────────────────────────
 * 1. Dashboard → Storage → "New bucket"
 *    Nombre: mascotas | Public: ✅ activado
 *
 * 2. SQL Editor → ejecutar:
 *    CREATE POLICY "upload_pet_photos" ON storage.objects
 *    FOR INSERT WITH CHECK (
 *      bucket_id = 'mascotas' AND auth.role() = 'authenticated'
 *    );
 *    CREATE POLICY "read_pet_photos" ON storage.objects
 *    FOR SELECT USING (bucket_id = 'mascotas');
 *
 * 3. Para el campo sexo, ejecutar en SQL Editor:
 *    ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS sexo text;
 * ──────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IonContent, IonPage, IonLoading, IonSkeletonText,
} from '@ionic/react';
import { Session } from '@supabase/supabase-js';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/* ── Tipos ───────────────────────────────────────────────────── */
interface MascotaDB {
  id:               string;
  user_id:          string;
  nombre:           string;
  especie:          string;
  raza?:            string;
  fecha_nacimiento?:string;
  sexo?:            string;
  peso?:            number;
  foto_url?:        string;
  notas?:           string;
}
interface Vacuna {
  id:              string;
  mascota_id:      string;
  nombre:          string;
  fecha_aplicada?: string;
  fecha_proxima?:  string;
  veterinario?:    string;
}
interface MascotaConVacunas extends MascotaDB { vacunas: Vacuna[] }

interface Props { session: Session }

/* ── Constantes ──────────────────────────────────────────────── */
const ESPECIES = [
  { key:'perro',  label:'Perro',  emoji:'🐕' },
  { key:'gato',   label:'Gato',   emoji:'🐈' },
  { key:'ave',    label:'Ave',    emoji:'🦜' },
  { key:'conejo', label:'Conejo', emoji:'🐇' },
  { key:'pez',    label:'Pez',    emoji:'🐠' },
  { key:'reptil', label:'Reptil', emoji:'🦎' },
  { key:'otro',   label:'Otro',   emoji:'🐾' },
];

export const RAZAS: Record<string, string[]> = {
  perro:  ['Labrador','Golden Retriever','Bulldog','Poodle','Beagle','Pastor Alemán','Chihuahua',
            'Dachshund','Boxer','Rottweiler','Shih Tzu','Yorkshire','Bichon Frise','Schnauzer',
            'American Bully','Bulldog Inglés','Husky Siberiano','Mix/Mestizo'],
  gato:   ['Siamés','Persa','Maine Coon','Ragdoll','Bengalí','Sphynx','British Shorthair',
            'Scottish Fold','Doméstico','Mix/Mestizo'],
  ave:    ['Periquito','Canario','Loro','Cacatúa','Agaporni','Ninfa','Cotorra','Otro'],
  conejo: ['Holandés enano','Angora','Rex','Belier','Nueva Zelanda','Mix/Mestizo'],
  pez:    ['Goldfish','Betta','Guppy','Neon','Oscar','Disco','Otro'],
  reptil: ['Iguana','Gecko','Tortuga','Camaleón','Otro'],
  otro:   ['Mix/Mestizo','Otro'],
};

export const TITULO_ESPECIE: Record<string, string> = {
  perro:  '🐕 Cuéntanos sobre tu compañero canino',
  gato:   '🐈 Cuéntanos sobre tu amigo felino',
  ave:    '🦜 Cuéntanos sobre tu amigo emplumado',
  conejo: '🐇 Cuéntanos sobre tu conejito',
  pez:    '🐠 Cuéntanos sobre tu compañero acuático',
  reptil: '🦎 Cuéntanos sobre tu reptil',
  otro:   '🐾 Cuéntanos sobre tu mascota especial',
};

/* ── Helpers ─────────────────────────────────────────────────── */
const calcEdad = (fecha: string): string => {
  const ms     = Date.now() - new Date(fecha).getTime();
  const years  = Math.floor(ms / (365.25 * 86_400_000));
  const months = Math.floor(ms / (30.44  * 86_400_000));
  if (years  >= 1) return `${years} año${years  !== 1 ? 's' : ''}`;
  if (months >= 1) return `${months} mes${months !== 1 ? 'es' : ''}`;
  return '< 1 mes';
};

const fmtDate = (d?: string): string =>
  d ? new Date(d).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const diasRestantes = (fecha?: string): number | null => {
  if (!fecha) return null;
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000);
};

/* ── Supabase Storage: subir foto ────────────────────────────── */
const uploadPetPhoto = async (file: File, petId: string): Promise<string | null> => {
  const ext      = file.name.split('.').pop() ?? 'jpg';
  const filePath = `${petId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('mascotas')
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (error) {
    console.error('[Storage] error — verifica bucket "mascotas" Public:true y policies INSERT/SELECT:', error.message);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('mascotas')
    .getPublicUrl(filePath);

  console.log('[Storage] publicUrl guardado:', publicUrl);
  return publicUrl;
};

/* ── Avatar con iniciales ────────────────────────────────────── */
const PetAvatar: React.FC<{ nombre: string; foto_url?: string; size?: number }> = ({
  nombre, foto_url, size = 56,
}) => {
  const [broken, setBroken] = useState(false);

  if (foto_url && !broken) {
    return (
      <img
        src={foto_url}
        alt={nombre}
        onError={() => setBroken(true)}
        style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}
      />
    );
  }
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:'linear-gradient(135deg,#FF2D9B,#00E5FF)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size * 0.38, fontWeight:800, color:'#fff',
    }}>
      {nombre.charAt(0).toUpperCase()}
    </div>
  );
};

/* ── Toast flotante ──────────────────────────────────────────── */
const Toast: React.FC<{ msg: string }> = ({ msg }) =>
  msg ? (
    <div style={{
      position:'fixed', bottom:88, left:'50%', transform:'translateX(-50%)',
      padding:'10px 22px', borderRadius:24,
      background:'linear-gradient(90deg,#FF2D9B,#00E5FF)',
      color:'#000', fontWeight:800, fontSize:13,
      boxShadow:'0 0 30px rgba(0,229,255,0.4)',
      zIndex:9999, whiteSpace:'nowrap', pointerEvents:'none',
    }}>
      {msg}
    </div>
  ) : null;

/* ── BackButton ──────────────────────────────────────────────── */
const BackBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      width:38, height:38, borderRadius:11, flexShrink:0,
      background:'#111', border:'1px solid #222',
      color:'#fff', fontSize:20, cursor:'pointer',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}
  >‹</button>
);

/* ════════════════════════════════════════════════════════════════
   COMPONENTE 1 – LISTA DE MASCOTAS  (/mascotas)
════════════════════════════════════════════════════════════════ */
const BioPet: React.FC<Props> = ({ session }) => {
  const [mascotas, setMascotas] = useState<MascotaDB[]>([]);
  const [loading,  setLoading]  = useState(true);
  const history = useHistory();

  useEffect(() => {
    supabase
      .from('mascotas').select('*')
      .eq('user_id', session.user.id)
      .order('nombre')
      .then(({ data }) => {
        if (data) setMascotas(data as MascotaDB[]);
        setLoading(false);
      });
  }, [session]);

  return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{ background:'#000', minHeight:'100vh', paddingBottom:100 }}>

          {/* Header */}
          <div style={{ padding:'52px 20px 24px' }}>
            <h1 style={{ color:'#fff', fontSize:24, fontWeight:800, margin:0 }}>Mis Mascotas</h1>
            {!loading && (
              <p style={{ color:'#888', fontSize:13, margin:'4px 0 0' }}>
                {mascotas.length} mascota{mascotas.length !== 1 ? 's' : ''} registrada{mascotas.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Content */}
          <div style={{ padding:'0 20px' }}>
            {loading ? (
              [1,2,3].map(k => (
                <div key={k} style={{
                  display:'flex', alignItems:'center', gap:14,
                  padding:'14px 16px', borderRadius:16, marginBottom:10,
                  background:'#111', border:'1px solid #1a1a1a',
                }}>
                  <IonSkeletonText animated style={{ width:56, height:56, borderRadius:'50%' } as React.CSSProperties} />
                  <div style={{ flex:1 }}>
                    <IonSkeletonText animated style={{ width:'55%', height:14, borderRadius:5, marginBottom:8 } as React.CSSProperties} />
                    <IonSkeletonText animated style={{ width:'35%', height:11, borderRadius:5 } as React.CSSProperties} />
                  </div>
                </div>
              ))
            ) : mascotas.length === 0 ? (
              <div style={{
                marginTop:20, padding:'40px 20px', borderRadius:20,
                background:'#111', border:'2px dashed #2a2a2a',
                display:'flex', flexDirection:'column', alignItems:'center', gap:12, textAlign:'center',
              }}>
                <span style={{ fontSize:52 }}>🐾</span>
                <p style={{ color:'#fff', fontSize:16, fontWeight:700, margin:0 }}>Aún no tienes mascotas</p>
                <p style={{ color:'#666', fontSize:13, margin:0 }}>Registra a tus compañeros y cuida su salud</p>
                <button
                  onClick={() => history.push('/biopet/new')}
                  style={{
                    marginTop:8, padding:'12px 28px', borderRadius:12,
                    background:'linear-gradient(90deg,#FF2D9B,#00E5FF)',
                    color:'#000', fontWeight:800, fontSize:14, border:'none', cursor:'pointer',
                  }}
                >
                  + Agregar primera mascota
                </button>
              </div>
            ) : (
              mascotas.map(m => (
                <button
                  key={m.id}
                  onClick={() => history.push(`/biopet/${m.id}`)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', gap:14,
                    padding:'14px 16px', borderRadius:16, marginBottom:10,
                    background:'linear-gradient(#111,#111) padding-box, linear-gradient(90deg,#FF2D9B,#00E5FF,#FFE600) border-box',
                    border:'2px solid transparent', cursor:'pointer', textAlign:'left',
                  }}
                >
                  <PetAvatar nombre={m.nombre} foto_url={m.foto_url} size={56} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ color:'#fff', fontSize:15, fontWeight:700, margin:0 }}>{m.nombre}</p>
                    <p style={{ color:'#888', fontSize:12, margin:'3px 0 0', textTransform:'capitalize' }}>
                      {m.especie}{m.raza ? ` · ${m.raza}` : ''}
                    </p>
                    {m.fecha_nacimiento && (
                      <p style={{ color:'#00E5FF', fontSize:11, margin:'2px 0 0', fontWeight:600 }}>
                        {calcEdad(m.fecha_nacimiento)}
                      </p>
                    )}
                  </div>
                  <span style={{ color:'#444', fontSize:18 }}>›</span>
                </button>
              ))
            )}
          </div>

          {/* FAB */}
          <button
            onClick={() => history.push('/biopet/new')}
            style={{
              position:'fixed', bottom:84, right:20,
              width:56, height:56, borderRadius:'50%',
              background:'linear-gradient(135deg,#FF2D9B,#00E5FF)',
              color:'#000', fontSize:28, fontWeight:800,
              border:'none', cursor:'pointer',
              boxShadow:'0 0 30px rgba(255,45,155,0.5)',
              display:'flex', alignItems:'center', justifyContent:'center',
              zIndex:100,
            }}
          >+</button>
        </div>
      </IonContent>
    </IonPage>
  );
};

/* ════════════════════════════════════════════════════════════════
   COMPONENTE 2 – FORMULARIO NUEVA MASCOTA  (/biopet/new)
════════════════════════════════════════════════════════════════ */
const EMPTY_FORM = {
  nombre:'', especie:'', raza:'', fecha_nacimiento:'',
  sexo:'', peso:'', notas:'', foto_url:'',
};

const validarFechaMascota = (val: string): string => {
  if (!val) return '⚠️ La fecha de nacimiento es obligatoria';
  const d   = new Date(val);
  const now = new Date();
  const min = new Date(); min.setFullYear(min.getFullYear() - 30);
  if (d > now) return '⚠️ Verifica la fecha de nacimiento 📅 — no puede ser futura';
  if (d < min) return '⚠️ Verifica la fecha de nacimiento 📅 — no puede ser más de 30 años';
  return '';
};

/* ── Autocomplete de razas ───────────────────────────────────── */
export const RazaInput: React.FC<{
  value: string; onChange: (v: string) => void; especie: string; hasError?: boolean;
}> = ({ value, onChange, especie, hasError }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const lista = RAZAS[especie] ?? [];
  const filtradas = value.trim()
    ? lista.filter(r => r.toLowerCase().includes(value.toLowerCase()))
    : lista;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Ej: Labrador, Mestizo…"
        style={{
          width:'100%', background:'#111',
          border:`1px solid ${hasError ? '#FF2D9B' : '#2a2a2a'}`,
          borderRadius:12, padding:'13px 14px', color:'#fff',
          fontSize:14, boxSizing:'border-box', outline:'none',
        }}
      />
      {open && filtradas.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0, zIndex:200,
          background:'#111', border:'1px solid #2a2a2a', borderRadius:12,
          marginTop:4, maxHeight:200, overflowY:'auto',
          boxShadow:'0 8px 32px rgba(0,0,0,0.8)',
        }}>
          {filtradas.map(raza => (
            <button
              key={raza}
              type="button"
              onMouseDown={() => { onChange(raza); setOpen(false); }}
              style={{
                display:'block', width:'100%', textAlign:'left',
                padding:'10px 14px', background:'none', border:'none',
                borderBottom:'1px solid #1a1a1a', color:'#ddd',
                fontSize:14, cursor:'pointer',
              }}
            >
              {raza}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const BioPetNew: React.FC<Props> = ({ session }) => {
  const [form,         setForm]         = useState({ ...EMPTY_FORM });
  const [errors,       setErrors]       = useState<Record<string,string>>({});
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const history = useHistory();

  const setField = (key: string, val: string) => {
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === 'especie') next.raza = '';
      return next;
    });
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const errs: Record<string,string> = {};

    if (!form.nombre.trim())
      errs.nombre = '⚠️ El nombre de tu mascota es obligatorio';

    if (!form.especie)
      errs.especie = '⚠️ Selecciona la especie de tu mascota';

    if (!form.raza.trim())
      errs.raza = '⚠️ La raza es obligatoria — si es mestizo selecciona Mix/Mestizo';

    const errFecha = validarFechaMascota(form.fecha_nacimiento);
    if (errFecha) errs.fecha_nacimiento = errFecha;

    // Sexo: obligatorio para todos excepto Pez; opcional para Ave
    if (form.especie !== 'pez' && form.especie !== 'ave' && !form.sexo)
      errs.sexo = '⚠️ Selecciona el sexo de tu mascota';

    if (form.peso) {
      const n = parseFloat(form.peso);
      if (isNaN(n) || n < 0.1 || n > 200)
        errs.peso = '⚠️ El peso debe estar entre 0.1 y 200 kg';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const payload: Record<string, unknown> = {
      user_id:          session.user.id,
      nombre:           form.nombre.trim(),
      especie:          form.especie,
      raza:             form.raza             || null,
      fecha_nacimiento: form.fecha_nacimiento  || null,
      sexo:             form.sexo              || null,
      peso:             form.peso ? parseFloat(form.peso) : null,
      notas:            form.notas             || null,
    };

    let savedId: string | null = null;
    const { data, error } = await supabase
      .from('mascotas').insert(payload).select('id').single();

    if (error) {
      if (error.message?.includes('sexo')) {
        const payloadSinSexo = { ...payload }; delete payloadSinSexo.sexo;
        const retry = await supabase.from('mascotas').insert(payloadSinSexo).select('id').single();
        if (retry.error) {
          showToast(retry.error.code === '42501'
            ? 'Sin permisos (RLS). Ejecuta security.sql en Supabase.'
            : `Error: ${retry.error.message}`);
          setSaving(false); return;
        }
        savedId = retry.data?.id ?? null;
      } else {
        showToast(error.code === '42501'
          ? 'Sin permisos (RLS). Ejecuta security.sql en Supabase.'
          : `Error: ${error.message}`);
        setSaving(false); return;
      }
    } else {
      savedId = data?.id ?? null;
    }

    if (!savedId) { showToast('Error: no se recibió ID'); setSaving(false); return; }

    if (photoFile) {
      const url = await uploadPetPhoto(photoFile, savedId);
      console.log('URL foto guardada:', url);
      if (url) {
        const { data: updData, error: updErr } = await supabase
          .from('mascotas').update({ foto_url: url }).eq('id', savedId).select('id, foto_url').single();
        console.log('Update mascota resultado:', { data: updData, error: updErr });
      }
    }

    setSaving(false);
    history.replace('/mascotas');
  };

  const hayErrores = Object.keys(errors).length > 0;
  const titulo = form.especie ? TITULO_ESPECIE[form.especie] : '🐾 Nueva Mascota';

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonLoading isOpen={saving} message="Guardando mascota…" />

        <div style={{ background:'#000', minHeight:'100vh', paddingBottom:120 }}>

          {/* Header */}
          <div style={{ padding:'52px 20px 16px', display:'flex', alignItems:'center', gap:12 }}>
            <BackBtn onClick={() => history.goBack()} />
            <h1 style={{ color:'#fff', fontSize:18, fontWeight:800, margin:0, lineHeight:1.3 }}>{titulo}</h1>
          </div>

          <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:20 }}>

            {/* ── Foto ─────────────────────────────────────────── */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  width:100, height:100, borderRadius:'50%', cursor:'pointer',
                  background: photoPreview ? 'none' : 'linear-gradient(135deg,#FF2D9B,#00E5FF)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 0 30px rgba(0,229,255,0.3)',
                  overflow:'hidden', position:'relative',
                }}
              >
                {photoPreview
                  ? <img src={photoPreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:36 }}>📷</span>}
                <div style={{
                  position:'absolute', inset:0, background:'rgba(0,0,0,0.3)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  opacity: photoPreview ? 1 : 0,
                }}>
                  <span style={{ color:'#fff', fontSize:20 }}>✎</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoChange} />
              <p style={{ color:'#555', fontSize:12, margin:0 }}>
                Foto <span style={{ color:'#444' }}>(opcional, recomendado)</span>
              </p>
              <p style={{ color:'#555', fontSize:12, margin:0, textAlign:'center', lineHeight:1.5, maxWidth:260 }}>
                Una foto nos ayuda a identificar a tu compañero fácilmente y personalizar su perfil. ¡También es para recordar lo bonito que es! 📸
              </p>
            </div>

            {/* ── Especie ──────────────────────────────────────── */}
            <div>
              <label style={{
                display:'block', marginBottom:8,
                color:'#666', fontSize:11, fontWeight:700,
                letterSpacing:'0.1em', textTransform:'uppercase',
              }}>
                Especie *
              </label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {ESPECIES.map(e => {
                  const sel = form.especie === e.key;
                  return (
                    <button
                      key={e.key}
                      onClick={() => setField('especie', e.key)}
                      style={{
                        padding:'12px 0 10px', borderRadius:14,
                        background: sel ? 'linear-gradient(135deg,#FF2D9B22,#00E5FF22)' : '#111',
                        border: sel ? '2px solid #00E5FF' : errors.especie ? '1px solid #FF2D9B44' : '1px solid #222',
                        display:'flex', flexDirection:'column',
                        alignItems:'center', gap:5, cursor:'pointer',
                        transition:'all 0.15s', position:'relative',
                      }}
                    >
                      {sel && (
                        <div style={{
                          position:'absolute', top:5, right:5,
                          width:13, height:13, borderRadius:'50%',
                          background:'linear-gradient(135deg,#FF2D9B,#00E5FF)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:8, color:'#000', fontWeight:900,
                        }}>✓</div>
                      )}
                      <span style={{ fontSize:22 }}>{e.emoji}</span>
                      <span style={{ fontSize:10, color: sel ? '#00E5FF' : '#666', fontWeight:700 }}>{e.label}</span>
                    </button>
                  );
                })}
              </div>
              {errors.especie
                ? <p style={{ color:'#FF2D9B', fontSize:13, marginTop:6, fontWeight:500 }}>{errors.especie}</p>
                : <p style={{ color:'#555', fontSize:12, marginTop:8, lineHeight:1.5 }}>Define qué servicios, productos y veterinarios son los más adecuados para tu compañero</p>
              }
            </div>

            {/* ── Nombre ───────────────────────────────────────── */}
            <div>
              <label style={{ display:'block', marginBottom:8, color:'#666', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                Nombre *
              </label>
              <TextInput
                value={form.nombre}
                onChange={v => setField('nombre', v)}
                placeholder="Ej: Luna"
                borderColor={errors.nombre ? '#FF2D9B' : undefined}
              />
              {errors.nombre
                ? <p style={{ color:'#FF2D9B', fontSize:13, marginTop:6, fontWeight:500 }}>{errors.nombre}</p>
                : <p style={{ color:'#555', fontSize:12, marginTop:6, lineHeight:1.5 }}>El nombre nos permite personalizar todas las comunicaciones y alertas para tu compañero 🐾</p>
              }
            </div>

            {/* ── Raza con autocompletado ───────────────────────── */}
            <div>
              <label style={{ display:'block', marginBottom:8, color:'#666', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                Raza *
              </label>
              <RazaInput
                value={form.raza}
                onChange={v => setField('raza', v)}
                especie={form.especie}
                hasError={!!errors.raza}
              />
              {errors.raza
                ? <p style={{ color:'#FF2D9B', fontSize:13, marginTop:6, fontWeight:500 }}>{errors.raza}</p>
                : <p style={{ color:'#555', fontSize:12, marginTop:6, lineHeight:1.5 }}>La raza nos permite recomendarte alimentos específicos, detectar predisposiciones de salud y conectarte con especialistas. Si es mestizo selecciona Mix/Mestizo 🧬</p>
              }
            </div>

            {/* ── Fecha de nacimiento ───────────────────────────── */}
            <div>
              <label style={{ display:'block', marginBottom:8, color:'#666', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                Fecha de nacimiento *
              </label>
              <TextInput
                value={form.fecha_nacimiento}
                onChange={v => setField('fecha_nacimiento', v)}
                type="date"
                borderColor={errors.fecha_nacimiento ? '#FF2D9B' : undefined}
              />
              {errors.fecha_nacimiento
                ? <p style={{ color:'#FF2D9B', fontSize:13, marginTop:6, fontWeight:500 }}>{errors.fecha_nacimiento}</p>
                : <p style={{ color:'#555', fontSize:12, marginTop:6, lineHeight:1.5 }}>Calculamos su edad exacta, te recordamos vacunas a tiempo y ajustamos las recomendaciones según su etapa de vida 📅</p>
              }
            </div>

            {/* ── Sexo (condicional por especie) ────────────────── */}
            {form.especie !== 'pez' && (
              <div>
                <label style={{ display:'block', marginBottom:8, color:'#666', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                  Sexo {form.especie === 'ave' ? <span style={{ color:'#444', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(opcional)</span> : '*'}
                </label>
                <div style={{ display:'flex', gap:10 }}>
                  {[
                    { val:'Macho',  icon:'♂' },
                    { val:'Hembra', icon:'♀' },
                    ...(form.especie === 'ave' ? [{ val:'No sé', icon:'?' }] : []),
                  ].map(s => (
                    <button
                      key={s.val}
                      onClick={() => setField('sexo', form.sexo === s.val ? '' : s.val)}
                      style={{
                        flex:1, padding:'12px 0', borderRadius:12, cursor:'pointer',
                        background: form.sexo === s.val ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)' : '#111',
                        color: form.sexo === s.val ? '#000' : '#666',
                        border: form.sexo === s.val ? 'none' : errors.sexo ? '1px solid #FF2D9B44' : '1px solid #222',
                        fontWeight:800, fontSize:14, transition:'all 0.15s',
                      }}
                    >
                      {s.icon} {s.val}
                    </button>
                  ))}
                </div>
                {errors.sexo
                  ? <p style={{ color:'#FF2D9B', fontSize:13, marginTop:6, fontWeight:500 }}>{errors.sexo}</p>
                  : <p style={{ color:'#555', fontSize:12, marginTop:6, lineHeight:1.5 }}>Importante para recomendaciones de salud preventiva, esterilización y cuidados específicos por género</p>
                }
              </div>
            )}

            {/* ── Peso ─────────────────────────────────────────── */}
            <div>
              <label style={{ display:'block', marginBottom:8, color:'#666', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                Peso actual <span style={{ color:'#444', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(opcional)</span>
              </label>
              <div style={{ position:'relative' }}>
                <TextInput
                  value={form.peso}
                  onChange={v => setField('peso', v)}
                  type="number"
                  placeholder="0.0"
                  borderColor={errors.peso ? '#FF2D9B' : undefined}
                />
                <span style={{
                  position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                  color:'#555', fontSize:13, fontWeight:600, pointerEvents:'none',
                }}>kg</span>
              </div>
              {errors.peso
                ? <p style={{ color:'#FF2D9B', fontSize:13, marginTop:6, fontWeight:500 }}>{errors.peso}</p>
                : <p style={{ color:'#444', fontSize:12, marginTop:6, lineHeight:1.5 }}>El peso nos ayuda a calcular las porciones de alimento correctas 🍽️</p>
              }
            </div>

            {/* ── Notas ────────────────────────────────────────── */}
            <Field label="Notas / Condiciones médicas">
              <textarea
                value={form.notas}
                onChange={e => setField('notas', e.target.value)}
                placeholder="Alergias, medicamentos, condiciones especiales…"
                rows={4}
                style={{
                  width:'100%', background:'#111', border:'1px solid #2a2a2a',
                  borderRadius:12, padding:'12px 14px', color:'#fff',
                  fontSize:14, resize:'none', boxSizing:'border-box',
                }}
              />
            </Field>

            {/* ── Banner de errores ─────────────────────────────── */}
            {hayErrores && (
              <div style={{
                padding:'14px 16px', borderRadius:14,
                background:'rgba(255,45,155,0.08)',
                border:'1px solid rgba(255,45,155,0.25)',
              }}>
                <p style={{ color:'#FF2D9B', fontSize:14, fontWeight:700, margin:'0 0 4px' }}>
                  Completa los datos obligatorios de tu compañero 🐾
                </p>
                <p style={{ color:'#884', fontSize:13, margin:0, lineHeight:1.5 }}>
                  Con estos datos podemos personalizar su cuidado
                </p>
              </div>
            )}

            {/* ── Guardar ──────────────────────────────────────── */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width:'100%', padding:'16px 0', borderRadius:14,
                background:'linear-gradient(90deg,#FF2D9B,#00E5FF)',
                color:'#000', fontWeight:800, fontSize:16,
                border:'none', cursor:'pointer',
                boxShadow:'0 0 30px rgba(0,229,255,0.3)',
                opacity: saving ? 0.5 : 1,
              }}
            >
              Guardar Mascota 🐾
            </button>
          </div>
        </div>

        <Toast msg={toast} />
      </IonContent>
    </IonPage>
  );
};

/* ════════════════════════════════════════════════════════════════
   COMPONENTE 3 – DETALLE + VACUNAS  (/biopet/:id)
════════════════════════════════════════════════════════════════ */
export const BioPetDetail: React.FC<{ session: Session; petId: string }> = ({ session, petId }) => {
  const [mascota,      setMascota]      = useState<MascotaConVacunas | null>(null);
  // Guard: nunca debe recibir "new" como petId — si ocurre, renderizar BioPetNew
  const [loading,      setLoading]      = useState(petId !== 'new');
  const [showVacForm,  setShowVacForm]  = useState(false);
  const [vacForm,      setVacForm]      = useState({ nombre:'', fecha_aplicada:'', fecha_proxima:'', veterinario:'' });
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState('');
  const history = useHistory();

  const fetchMascota = useCallback(async () => {
    if (!petId || petId === 'new') { setLoading(false); return; }
    const { data } = await supabase
      .from('mascotas').select('*, vacunas(*)')
      .eq('id', petId).single();
    if (data) setMascota(data as MascotaConVacunas);
    setLoading(false);
  }, [petId]);

  useEffect(() => { fetchMascota(); }, [fetchMascota]);

  // Guard: si llega "new" como petId, este componente no debe renderizarse
  if (petId === 'new') return <BioPetNew session={session} />;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const saveVacuna = async () => {
    if (!vacForm.nombre.trim()) { showToast('El nombre de la vacuna es obligatorio'); return; }
    setSaving(true);
    const { error } = await supabase.from('vacunas').insert({
      mascota_id:     petId,
      nombre:         vacForm.nombre.trim(),
      fecha_aplicada: vacForm.fecha_aplicada  || null,
      fecha_proxima:  vacForm.fecha_proxima   || null,
      veterinario:    vacForm.veterinario     || null,
    });
    if (error) { showToast('Error al guardar vacuna'); setSaving(false); return; }
    await fetchMascota();
    setSaving(false);
    setShowVacForm(false);
    setVacForm({ nombre:'', fecha_aplicada:'', fecha_proxima:'', veterinario:'' });
    showToast('Vacuna registrada ✅');
  };

  if (loading) return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{ background:'#000', minHeight:'100vh', padding:'52px 20px 24px' }}>
          <IonSkeletonText animated style={{ width:80, height:80, borderRadius:'50%', marginBottom:12 } as React.CSSProperties} />
          <IonSkeletonText animated style={{ width:'50%', height:20, borderRadius:6, marginBottom:8 } as React.CSSProperties} />
          <IonSkeletonText animated style={{ width:'30%', height:14, borderRadius:5 } as React.CSSProperties} />
        </div>
      </IonContent>
    </IonPage>
  );

  if (!mascota) return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{ background:'#000', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
          <span style={{ fontSize:48 }}>😿</span>
          <p style={{ color:'#666', fontSize:14 }}>Mascota no encontrada</p>
          <button onClick={() => history.goBack()} style={{ color:'#00E5FF', background:'none', border:'none', cursor:'pointer', fontSize:14 }}>
            ← Volver
          </button>
        </div>
      </IonContent>
    </IonPage>
  );

  const vacunas = [...(mascota.vacunas ?? [])].sort((a, b) => {
    if (!a.fecha_proxima) return 1;
    if (!b.fecha_proxima) return -1;
    return new Date(a.fecha_proxima).getTime() - new Date(b.fecha_proxima).getTime();
  });

  // Próxima vacuna
  const proximaVacuna = vacunas.find(v => {
    const d = diasRestantes(v.fecha_proxima);
    return d !== null && d >= 0;
  });
  const diasProxima = diasRestantes(proximaVacuna?.fecha_proxima);

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonLoading isOpen={saving} message="Guardando…" />

        <div style={{ background:'#000', minHeight:'100vh', paddingBottom:100 }}>

          {/* ── Header ─────────────────────────────────────────── */}
          <div style={{ padding:'52px 20px 0', display:'flex', alignItems:'flex-start', gap:12 }}>
            <BackBtn onClick={() => history.goBack()} />
          </div>

          {/* ── Perfil mascota ──────────────────────────────────── */}
          <div style={{
            padding:'16px 20px 24px',
            display:'flex', alignItems:'center', gap:16,
          }}>
            <PetAvatar nombre={mascota.nombre} foto_url={mascota.foto_url} size={80} />
            <div>
              <h1 style={{ color:'#fff', fontSize:22, fontWeight:800, margin:0 }}>{mascota.nombre}</h1>
              <p style={{ color:'#888', fontSize:13, margin:'3px 0 0', textTransform:'capitalize' }}>
                {mascota.especie}{mascota.raza ? ` · ${mascota.raza}` : ''}
                {mascota.sexo ? ` · ${mascota.sexo}` : ''}
              </p>
              {mascota.fecha_nacimiento && (
                <p style={{ color:'#00E5FF', fontSize:12, margin:'4px 0 0', fontWeight:600 }}>
                  {calcEdad(mascota.fecha_nacimiento)}
                </p>
              )}
            </div>
          </div>

          {/* ── Stats ──────────────────────────────────────────── */}
          <div style={{ padding:'0 20px 24px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[
              { label:'Peso',     val: mascota.peso ? `${mascota.peso} kg` : '—' },
              { label:'Vacunas',  val: String(vacunas.length) },
              { label:'Próxima',  val: diasProxima !== null ? `${diasProxima}d` : '—',
                color: diasProxima !== null && diasProxima <= 7 ? '#FF2D9B' : '#00E5FF' },
            ].map(s => (
              <div key={s.label} style={{
                padding:'14px 10px', borderRadius:14,
                background:'#111', border:'1px solid #1e1e1e',
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              }}>
                <p style={{ color: s.color ?? '#fff', fontSize:17, fontWeight:800, margin:0 }}>{s.val}</p>
                <p style={{ color:'#666', fontSize:11, margin:0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Alerta próxima vacuna ───────────────────────────── */}
          {proximaVacuna && diasProxima !== null && diasProxima <= 30 && (
            <div style={{ padding:'0 20px 20px' }}>
              <div style={{
                display:'flex', borderRadius:14, overflow:'hidden',
                border: diasProxima <= 7 ? '1px solid rgba(255,45,155,0.3)' : '1px solid rgba(255,230,0,0.2)',
              }}>
                <div style={{
                  width:4, flexShrink:0,
                  background: diasProxima <= 7 ? '#FF2D9B' : '#FFE600',
                }} />
                <div style={{
                  flex:1, padding:'12px 14px',
                  background: diasProxima <= 7 ? 'rgba(255,45,155,0.07)' : 'rgba(255,230,0,0.05)',
                }}>
                  <p style={{ color:'#fff', fontSize:13, fontWeight:600, margin:0 }}>
                    {diasProxima <= 7 ? '🚨' : '⚠️'} {proximaVacuna.nombre}
                  </p>
                  <p style={{ color:'#888', fontSize:11, margin:'3px 0 0' }}>
                    Próxima vacuna · en {diasProxima} día{diasProxima !== 1 ? 's' : ''}
                    {' '}· {fmtDate(proximaVacuna.fecha_proxima)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Notas ──────────────────────────────────────────── */}
          {mascota.notas && (
            <div style={{ padding:'0 20px 24px' }}>
              <SectionTitle>Notas</SectionTitle>
              <div style={{
                padding:'12px 14px', borderRadius:14,
                background:'#111', border:'1px solid #1e1e1e',
                color:'#bbb', fontSize:13, lineHeight:1.6,
              }}>
                {mascota.notas}
              </div>
            </div>
          )}

          {/* ── Historial de Vacunas ────────────────────────────── */}
          <div style={{ padding:'0 20px 24px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <SectionTitle>Historial de Vacunas</SectionTitle>
              <button
                onClick={() => setShowVacForm(v => !v)}
                style={{
                  padding:'6px 14px', borderRadius:20, cursor:'pointer',
                  background: showVacForm ? '#333' : 'rgba(0,229,255,0.1)',
                  color: showVacForm ? '#888' : '#00E5FF',
                  border: `1px solid ${showVacForm ? '#444' : 'rgba(0,229,255,0.25)'}`,
                  fontSize:12, fontWeight:700,
                }}
              >
                {showVacForm ? '✕ Cancelar' : '+ Agregar vacuna'}
              </button>
            </div>

            {/* Formulario nueva vacuna */}
            {showVacForm && (
              <div style={{
                marginBottom:14, padding:'16px', borderRadius:16,
                background:'#111', border:'1px solid #2a2a2a',
                display:'flex', flexDirection:'column', gap:12,
              }}>
                <p style={{ color:'#fff', fontSize:14, fontWeight:700, margin:0 }}>Nueva Vacuna</p>
                {[
                  { label:'Nombre vacuna *', key:'nombre',          type:'text', ph:'Ej: Antirrábica' },
                  { label:'Fecha aplicada',  key:'fecha_aplicada',  type:'date', ph:'' },
                  { label:'Próxima dosis',   key:'fecha_proxima',   type:'date', ph:'' },
                  { label:'Veterinario',     key:'veterinario',     type:'text', ph:'Dr. García' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ color:'#666', fontSize:11, fontWeight:600, letterSpacing:'0.08em', display:'block', marginBottom:5 }}>
                      {f.label.toUpperCase()}
                    </label>
                    <input
                      type={f.type}
                      value={(vacForm as Record<string,string>)[f.key]}
                      onChange={e => setVacForm(v => ({ ...v, [f.key]: e.target.value }))}
                      placeholder={f.ph}
                      style={{
                        width:'100%', background:'#0a0a0a', border:'1px solid #2a2a2a',
                        borderRadius:10, padding:'10px 12px', color:'#fff', fontSize:13,
                        boxSizing:'border-box',
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={saveVacuna}
                  disabled={saving}
                  style={{
                    padding:'12px 0', borderRadius:12,
                    background:'linear-gradient(90deg,#FF2D9B,#00E5FF)',
                    color:'#000', fontWeight:800, fontSize:14,
                    border:'none', cursor:'pointer', opacity: saving ? 0.5 : 1,
                  }}
                >
                  {saving ? 'Guardando…' : 'Guardar Vacuna'}
                </button>
              </div>
            )}

            {/* Lista vacunas */}
            {vacunas.length === 0 ? (
              <div style={{
                padding:'28px 0', borderRadius:16,
                background:'#111', border:'2px dashed #2a2a2a',
                display:'flex', flexDirection:'column', alignItems:'center', gap:8,
              }}>
                <span style={{ fontSize:32 }}>💉</span>
                <p style={{ color:'#666', fontSize:13, margin:0 }}>No hay vacunas registradas</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {vacunas.map(v => {
                  const d    = diasRestantes(v.fecha_proxima);
                  const vencida  = d !== null && d < 0;
                  const urgente  = d !== null && d >= 0 && d <= 7;
                  const normal   = d === null || d > 7;
                  const lineColor = vencida ? '#FF2D9B' : urgente ? '#FFE600' : '#4ade80';

                  return (
                    <div key={v.id} style={{
                      display:'flex', borderRadius:12, overflow:'hidden',
                      border:`1px solid ${lineColor}20`,
                    }}>
                      <div style={{ width:3, background:lineColor, flexShrink:0 }} />
                      <div style={{
                        flex:1, padding:'12px 14px',
                        background: vencida ? 'rgba(255,45,155,0.06)' : urgente ? 'rgba(255,230,0,0.05)' : '#111',
                      }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                          <div>
                            <p style={{ color:'#fff', fontSize:13, fontWeight:700, margin:0 }}>💉 {v.nombre}</p>
                            {v.fecha_aplicada && (
                              <p style={{ color:'#666', fontSize:11, margin:'3px 0 0' }}>
                                Aplicada: {fmtDate(v.fecha_aplicada)}
                              </p>
                            )}
                            {v.veterinario && (
                              <p style={{ color:'#555', fontSize:11, margin:'2px 0 0' }}>🩺 {v.veterinario}</p>
                            )}
                          </div>
                          {/* Badge días */}
                          {d !== null && (
                            <div style={{
                              flexShrink:0, padding:'4px 10px', borderRadius:20,
                              background: vencida ? 'rgba(255,45,155,0.15)' : urgente ? 'rgba(255,230,0,0.12)' : 'rgba(74,222,128,0.1)',
                              border: `1px solid ${lineColor}40`,
                            }}>
                              <p style={{ color: lineColor, fontSize:10, fontWeight:800, margin:0, whiteSpace:'nowrap' }}>
                                {vencida ? `Vencida ${Math.abs(d)}d` : urgente ? `${d}d ⚠️` : `${d}d`}
                              </p>
                              <p style={{ color:'#555', fontSize:9, margin:0, textAlign:'center' }}>
                                {fmtDate(v.fecha_proxima)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Toast msg={toast} />
      </IonContent>
    </IonPage>
  );
};

/* ── Micro-components internos ───────────────────────────────── */
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label style={{
      display:'block', marginBottom:8,
      color:'#666', fontSize:11, fontWeight:700,
      letterSpacing:'0.1em', textTransform:'uppercase',
    }}>
      {label}
    </label>
    {children}
  </div>
);

const TextInput: React.FC<{
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; borderColor?: string;
}> = ({ value, onChange, placeholder, type = 'text', borderColor }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      width:'100%', background:'#111',
      border:`1px solid ${borderColor ?? '#2a2a2a'}`,
      borderRadius:12, padding:'13px 14px', color:'#fff',
      fontSize:14, boxSizing:'border-box',
    }}
    onFocus={e => { e.currentTarget.style.borderColor = '#00E5FF'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,229,255,0.12)'; }}
    onBlur={e  => { e.currentTarget.style.borderColor = borderColor ?? '#2a2a2a'; e.currentTarget.style.boxShadow = 'none'; }}
  />
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{ color:'#fff', fontSize:16, fontWeight:700, margin:'0 0 0 0' }}>{children}</h2>
);

export default BioPet;
