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
  IonContent, IonPage, IonLoading, IonSkeletonText, useIonViewWillEnter,
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
      background:'var(--bg-card)', border:'1px solid var(--border-color)',
      color:'var(--text-primary)', fontSize:20, cursor:'pointer',
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

  const loadMascotas = useCallback(async () => {
    const { data } = await supabase
      .from('mascotas').select('*')
      .eq('user_id', session.user.id).order('nombre');
    if (data) setMascotas(data as MascotaDB[]);
    setLoading(false);
  }, [session]);

  useEffect(() => { loadMascotas(); }, [loadMascotas]);
  useIonViewWillEnter(() => { loadMascotas(); });

  return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{ background:'var(--bg-primary)', minHeight:'100vh', paddingBottom:100 }}>

          {/* Header */}
          <div style={{ padding:'52px 20px 24px' }}>
            <h1 style={{ color:'var(--text-primary)', fontSize:24, fontWeight:800, margin:0 }}>Mis Mascotas</h1>
            {!loading && (
              <p style={{ color:'var(--text-secondary)', fontSize:13, margin:'4px 0 0' }}>
                {mascotas.length} mascota{mascotas.length !== 1 ? 's' : ''} registrada{mascotas.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Content */}
          <div>
            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'0 20px' }}>
                {[1,2,3,4].map(k => (
                  <div key={k} style={{
                    padding:'18px 12px', borderRadius:20,
                    background:'var(--bg-card)', border:'1px solid var(--border-color)',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                  }}>
                    <IonSkeletonText animated style={{ width:60, height:60, borderRadius:'50%' } as React.CSSProperties} />
                    <IonSkeletonText animated style={{ width:'70%', height:13, borderRadius:5 } as React.CSSProperties} />
                    <IonSkeletonText animated style={{ width:'50%', height:10, borderRadius:5 } as React.CSSProperties} />
                  </div>
                ))}
              </div>
            ) : mascotas.length === 0 ? (
              <div style={{
                marginTop:20, marginInline:20, padding:'40px 20px', borderRadius:20,
                background:'var(--bg-card)', border:'2px dashed var(--border-color)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:12, textAlign:'center',
              }}>
                <span style={{ fontSize:52 }}>🐾</span>
                <p style={{ color:'var(--text-primary)', fontSize:16, fontWeight:700, margin:0 }}>Aún no tienes mascotas</p>
                <p style={{ color:'var(--text-secondary)', fontSize:13, margin:0 }}>Registra a tus compañeros y cuida su salud</p>
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
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'0 20px' }}>
                {mascotas.map(m => (
                  <button
                    key={m.id}
                    onClick={() => history.push(`/biopet/${m.id}`)}
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'center',
                      padding:'18px 12px 14px', borderRadius:20,
                      background:`linear-gradient(var(--bg-card),var(--bg-card)) padding-box, linear-gradient(135deg,#FF2D9B,#00E5FF,#FFE600) border-box`,
                      border:'2px solid transparent', cursor:'pointer', gap:8, position:'relative',
                    }}
                  >
                    <PetAvatar nombre={m.nombre} foto_url={m.foto_url} size={60} />
                    <div style={{ textAlign:'center', width:'100%' }}>
                      <p style={{ color:'var(--text-primary)', fontSize:14, fontWeight:700, margin:0,
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {m.nombre}
                      </p>
                      <p style={{ color:'var(--text-secondary)', fontSize:11, margin:'3px 0 0', textTransform:'capitalize' }}>
                        {m.especie}{m.raza ? ` · ${m.raza}` : ''}
                      </p>
                      {m.fecha_nacimiento && (
                        <p style={{ color:'#00E5FF', fontSize:11, margin:'2px 0 0', fontWeight:600 }}>
                          {calcEdad(m.fecha_nacimiento)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
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
          width:'100%', background:'var(--bg-card)',
          border:`1px solid ${hasError ? '#FF2D9B' : 'var(--border-color)'}`,
          borderRadius:12, padding:'13px 14px', color:'var(--text-primary)',
          fontSize:14, boxSizing:'border-box', outline:'none',
        }}
      />
      {open && filtradas.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0, zIndex:200,
          background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:12,
          marginTop:4, maxHeight:200, overflowY:'auto',
          boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
        }}>
          {filtradas.map(raza => (
            <button
              key={raza}
              type="button"
              onMouseDown={() => { onChange(raza); setOpen(false); }}
              style={{
                display:'block', width:'100%', textAlign:'left',
                padding:'10px 14px', background:'none', border:'none',
                borderBottom:'1px solid var(--border-color)', color:'var(--text-primary)',
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

        <div style={{ background:'var(--bg-primary)', minHeight:'100vh', paddingBottom:120 }}>

          {/* Header */}
          <div style={{ padding:'52px 20px 16px', display:'flex', alignItems:'center', gap:12 }}>
            <BackBtn onClick={() => history.goBack()} />
            <h1 style={{ color:'var(--text-primary)', fontSize:18, fontWeight:800, margin:0, lineHeight:1.3 }}>{titulo}</h1>
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
              <p style={{ color:'var(--text-secondary)', fontSize:12, margin:0 }}>
                Foto <span style={{ color:'var(--text-secondary)' }}>(opcional, recomendado)</span>
              </p>
              <p style={{ color:'var(--text-secondary)', fontSize:12, margin:0, textAlign:'center', lineHeight:1.5, maxWidth:260 }}>
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
                        background: sel ? 'linear-gradient(135deg,#FF2D9B22,#00E5FF22)' : 'var(--bg-card)',
                        border: sel ? '2px solid #00E5FF' : errors.especie ? '1px solid #FF2D9B44' : '1px solid var(--border-color)',
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
                      <span style={{ fontSize:10, color: sel ? '#00E5FF' : 'var(--text-secondary)', fontWeight:700 }}>{e.label}</span>
                    </button>
                  );
                })}
              </div>
              {errors.especie
                ? <p style={{ color:'#FF2D9B', fontSize:13, marginTop:6, fontWeight:500 }}>{errors.especie}</p>
                : <p style={{ color:'var(--text-secondary)', fontSize:12, marginTop:8, lineHeight:1.5 }}>Define qué servicios, productos y veterinarios son los más adecuados para tu compañero</p>
              }
            </div>

            {/* ── Nombre ───────────────────────────────────────── */}
            <div>
              <label style={{ display:'block', marginBottom:8, color:'var(--text-secondary)', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>
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
                : <p style={{ color:'var(--text-secondary)', fontSize:12, marginTop:6, lineHeight:1.5 }}>El nombre nos permite personalizar todas las comunicaciones y alertas para tu compañero 🐾</p>
              }
            </div>

            {/* ── Raza con autocompletado ───────────────────────── */}
            <div>
              <label style={{ display:'block', marginBottom:8, color:'var(--text-secondary)', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>
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
                : <p style={{ color:'var(--text-secondary)', fontSize:12, marginTop:6, lineHeight:1.5 }}>La raza nos permite recomendarte alimentos específicos, detectar predisposiciones de salud y conectarte con especialistas. Si es mestizo selecciona Mix/Mestizo 🧬</p>
              }
            </div>

            {/* ── Fecha de nacimiento ───────────────────────────── */}
            <div>
              <label style={{ display:'block', marginBottom:8, color:'var(--text-secondary)', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>
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
                : <p style={{ color:'var(--text-secondary)', fontSize:12, marginTop:6, lineHeight:1.5 }}>Calculamos su edad exacta, te recordamos vacunas a tiempo y ajustamos las recomendaciones según su etapa de vida 📅</p>
              }
            </div>

            {/* ── Sexo (condicional por especie) ────────────────── */}
            {form.especie !== 'pez' && (
              <div>
                <label style={{ display:'block', marginBottom:8, color:'var(--text-secondary)', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>
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
                        background: form.sexo === s.val ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)' : 'var(--bg-card)',
                        color: form.sexo === s.val ? '#000' : 'var(--text-secondary)',
                        border: form.sexo === s.val ? 'none' : errors.sexo ? '1px solid #FF2D9B44' : '1px solid var(--border-color)',
                        fontWeight:800, fontSize:14, transition:'all 0.15s',
                      }}
                    >
                      {s.icon} {s.val}
                    </button>
                  ))}
                </div>
                {errors.sexo
                  ? <p style={{ color:'#FF2D9B', fontSize:13, marginTop:6, fontWeight:500 }}>{errors.sexo}</p>
                  : <p style={{ color:'var(--text-secondary)', fontSize:12, marginTop:6, lineHeight:1.5 }}>Importante para recomendaciones de salud preventiva, esterilización y cuidados específicos por género</p>
                }
              </div>
            )}

            {/* ── Peso ─────────────────────────────────────────── */}
            <div>
              <label style={{ display:'block', marginBottom:8, color:'var(--text-secondary)', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>
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
                  color:'var(--text-secondary)', fontSize:13, fontWeight:600, pointerEvents:'none',
                }}>kg</span>
              </div>
              {errors.peso
                ? <p style={{ color:'#FF2D9B', fontSize:13, marginTop:6, fontWeight:500 }}>{errors.peso}</p>
                : <p style={{ color:'var(--text-secondary)', fontSize:12, marginTop:6, lineHeight:1.5 }}>El peso nos ayuda a calcular las porciones de alimento correctas 🍽️</p>
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
                  width:'100%', background:'var(--bg-card)', border:'1px solid var(--border-color)',
                  borderRadius:12, padding:'12px 14px', color:'var(--text-primary)',
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

/* ── Estimado de alimento ────────────────────────────────────── */
const AlimentoEstimado: React.FC<{ petId: string; especie: string; peso?: number }> = ({ petId, especie, peso }) => {
  const [ultimoPedido, setUltimoPedido] = useState<{ nombre: string; fecha: string; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('pedidos')
      .select('items, created_at, total')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        for (const pedido of data) {
          const items = pedido.items as Array<{ nombre: string; tipo?: string }>;
          const alimento = items?.find(i =>
            i.nombre?.toLowerCase().includes('croqueta') ||
            i.nombre?.toLowerCase().includes('alimento') ||
            i.nombre?.toLowerCase().includes('comida') ||
            i.nombre?.toLowerCase().includes('nutrición') ||
            i.nombre?.toLowerCase().includes('premium')
          );
          if (alimento) {
            setUltimoPedido({ nombre: alimento.nombre, fecha: pedido.created_at, total: pedido.total });
            break;
          }
        }
        setLoading(false);
      });
  }, [petId]);

  if (loading || !ultimoPedido) return null;

  const gramsDia = peso ? Math.round(peso * 20) : 250;
  const diasDesdeCompra = Math.floor((Date.now() - new Date(ultimoPedido.fecha).getTime()) / 86_400_000);
  const bolsaGramos = 3000;
  const gramosConsumidos = diasDesdeCompra * gramsDia;
  const pct = Math.max(0, Math.min(100, Math.round(((bolsaGramos - gramosConsumidos) / bolsaGramos) * 100)));
  const diasRestantesAlimento = Math.max(0, Math.floor((bolsaGramos - gramosConsumidos) / gramsDia));
  const colorBar = pct > 40 ? '#00F5A0' : pct > 15 ? '#FFE600' : '#FF2D9B';

  if (pct <= 0) return null;

  return (
    <div style={{ padding:'0 20px 20px' }}>
      <div style={{ background:'var(--bg-card)', borderRadius:16, border:'1px solid var(--border-color)', padding:'14px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <p style={{ color:'var(--text-primary)', fontSize:13, fontWeight:600, margin:0 }}>🥩 Alimento estimado</p>
          <span style={{ color: colorBar, fontSize:12, fontWeight:700 }}>~{diasRestantesAlimento} días</span>
        </div>
        <div style={{ height:6, background:'var(--border-color)', borderRadius:3, overflow:'hidden', marginBottom:8 }}>
          <div style={{
            height:'100%', width:`${pct}%`,
            background:`linear-gradient(90deg,${colorBar},${colorBar}88)`,
            borderRadius:3, transition:'width 0.6s ease',
          }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ color:'var(--text-secondary)', fontSize:11, margin:0 }}>
            {ultimoPedido.nombre.length > 28 ? ultimoPedido.nombre.slice(0,28)+'…' : ultimoPedido.nombre}
          </p>
          {diasRestantesAlimento <= 7 && (
            <span style={{
              fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10,
              background:'rgba(255,45,155,0.12)', color:'#FF2D9B',
              border:'1px solid rgba(255,45,155,0.25)',
            }}>Pedir pronto</span>
          )}
        </div>
      </div>
    </div>
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
  const [scanLoading,  setScanLoading]  = useState(false);
  const [showCarnet,   setShowCarnet]   = useState(false);
  const [toast,        setToast]        = useState('');
  const scanRef = useRef<HTMLInputElement>(null);
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
  useIonViewWillEnter(() => { fetchMascota(); });

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

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanLoading(true);
    // Resize a máx 1024px antes de enviar
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    const resized: File = await new Promise(resolve => {
      img.onload = () => {
        const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(blobUrl);
          resolve(new File([blob!], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.85);
      };
      img.src = blobUrl;
    });
    // Convertir a base64
    const base64: string = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = ev => resolve((ev.target!.result as string).split(',')[1]);
      reader.readAsDataURL(resized);
    });
    const { data, error } = await supabase.functions.invoke('extract-vacuna', {
      body: { imageBase64: base64, mediaType: 'image/jpeg' },
    });
    console.log('data:', JSON.stringify(data));
    console.log('error:', JSON.stringify(error));
    setScanLoading(false);
    if (error || !data || data.error) {
      showToast('No se pudo leer el carnet. Intenta con mejor iluminación 📷');
      return;
    }
    if (data.vacunas && data.vacunas.length > 0) {
      let guardadas = 0;
      for (const vac of data.vacunas) {
        if (!vac.nombre) continue;
        const { error: insErr } = await supabase.from('vacunas').insert({
          mascota_id:     petId,
          nombre:         vac.nombre,
          fecha_aplicada: vac.fecha_aplicada || null,
          fecha_proxima:  vac.fecha_proxima  || null,
          veterinario:    vac.veterinario    || null,
        });
        if (!insErr) guardadas++;
      }
      await fetchMascota();
      setShowVacForm(false);
      showToast(`✅ ${guardadas} vacuna${guardadas !== 1 ? 's' : ''} importada${guardadas !== 1 ? 's' : ''} del carnet`);
    } else {
      setVacForm({
        nombre:         data.nombre         || '',
        fecha_aplicada: data.fecha_aplicada || '',
        fecha_proxima:  data.fecha_proxima  || '',
        veterinario:    data.veterinario    || '',
      });
      setShowVacForm(true);
      showToast('⚠️ Revisa los datos extraídos y guarda manualmente');
    }
    if (scanRef.current) scanRef.current.value = '';
  };

  if (loading) return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{ background:'var(--bg-primary)', minHeight:'100vh', padding:'52px 20px 24px' }}>
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
        <div style={{ background:'var(--bg-primary)', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
          <span style={{ fontSize:48 }}>😿</span>
          <p style={{ color:'var(--text-secondary)', fontSize:14 }}>Mascota no encontrada</p>
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

        <div style={{ background:'var(--bg-primary)', minHeight:'100vh', paddingBottom:100 }}>

          {/* ── Header ─────────────────────────────────────────── */}
          <div style={{ padding:'52px 20px 0', display:'flex', alignItems:'flex-start', gap:12 }}>
            <BackBtn onClick={() => history.goBack()} />
          </div>

          {/* ── Hero ──────────────────────────────────────────────────── */}
          <div style={{ padding:'16px 20px 20px', display:'flex', alignItems:'center', gap:16 }}>
            {/* Avatar con ring */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{
                position:'absolute', inset:-3, borderRadius:'50%',
                background:'linear-gradient(135deg,#FF2D9B,#A78BFA,#00E5FF)',
                zIndex:0,
              }} />
              <div style={{ position:'relative', zIndex:1, borderRadius:'50%', overflow:'hidden',
                width:84, height:84, border:'3px solid var(--bg-primary)' }}>
                <PetAvatar nombre={mascota.nombre} foto_url={mascota.foto_url} size={84} />
              </div>
            </div>

            <div style={{ flex:1 }}>
              <h1 style={{ color:'var(--text-primary)', fontSize:22, fontWeight:800, margin:'0 0 2px' }}>
                {mascota.nombre}
              </h1>
              <p style={{ color:'var(--text-secondary)', fontSize:12, margin:'0 0 8px', textTransform:'capitalize' }}>
                {mascota.especie}{mascota.raza ? ` · ${mascota.raza}` : ''}{mascota.sexo ? ` · ${mascota.sexo}` : ''}
              </p>
              {mascota.fecha_nacimiento && (
                <span style={{
                  display:'inline-block', padding:'3px 10px', borderRadius:20,
                  background:'rgba(0,229,255,0.1)', border:'1px solid rgba(0,229,255,0.2)',
                  color:'#00E5FF', fontSize:11, fontWeight:600,
                }}>
                  {calcEdad(mascota.fecha_nacimiento)}
                </span>
              )}
            </div>

            {/* Botón editar */}
            <button
              onClick={() => history.push(`/biopet/${petId}/editar`)}
              style={{
                width:36, height:36, borderRadius:10, flexShrink:0,
                background:'var(--bg-card)', border:'1px solid var(--border-color)',
                color:'var(--text-secondary)', fontSize:16, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}
            >✎</button>
          </div>

          {/* ── Índice de salud ──────────────────────────────────── */}
          {(() => {
            let score = 40;
            if (mascota.peso)             score += 15;
            if (mascota.fecha_nacimiento) score += 10;
            if (mascota.sexo)             score += 5;
            if (vacunas.length > 0)       score += 20;
            const sinVencidas = vacunas.every(v => { const d = diasRestantes(v.fecha_proxima); return d === null || d >= 0; });
            if (sinVencidas && vacunas.length > 0) score += 10;
            score = Math.min(score, 100);
            const color = score >= 80 ? '#00F5A0' : score >= 50 ? '#FFE600' : '#FF2D9B';
            return (
              <div style={{ padding:'0 20px 20px' }}>
                <div style={{ background:'var(--bg-card)', borderRadius:16, border:'1px solid var(--border-color)', padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <p style={{ color:'var(--text-primary)', fontSize:13, fontWeight:600, margin:0 }}>Índice de salud</p>
                    <p style={{ color, fontSize:16, fontWeight:800, margin:0 }}>{score}%</p>
                  </div>
                  <div style={{ height:6, background:'var(--border-color)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${score}%`, background:`linear-gradient(90deg, ${color}, ${color}88)`, borderRadius:3, transition:'width 0.6s ease' }} />
                  </div>
                  <p style={{ color:'var(--text-secondary)', fontSize:11, margin:'6px 0 0' }}>
                    {score >= 80 ? '🌟 Excelente — todo al día' : score >= 50 ? '⚠️ Puede mejorar — registra más datos' : '🔴 Necesita atención — completa el perfil'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* ── Carnet digital ───────────────────────────────────────── */}
          <div style={{ padding:'0 20px 20px' }}>
            <button
              onClick={() => setShowCarnet(true)}
              style={{
                width:'100%', padding:'13px 0', borderRadius:14,
                background:'linear-gradient(90deg,#FF2D9B,#A78BFA,#00E5FF)',
                color:'#000', fontWeight:800, fontSize:14,
                border:'none', cursor:'pointer',
                boxShadow:'0 0 20px rgba(255,45,155,0.25)',
              }}
            >
              📋 Ver carnet digital
            </button>
          </div>

          {/* ── Estimado de alimento ─────────────────────────────────── */}
          <AlimentoEstimado petId={petId} especie={mascota.especie} peso={mascota.peso} />

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
                background:'var(--bg-card)', border:'1px solid var(--border-color)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              }}>
                <p style={{ color: s.color ?? 'var(--text-primary)', fontSize:17, fontWeight:800, margin:0 }}>{s.val}</p>
                <p style={{ color:'var(--text-secondary)', fontSize:11, margin:0 }}>{s.label}</p>
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
                  <p style={{ color:'var(--text-primary)', fontSize:13, fontWeight:600, margin:0 }}>
                    {diasProxima <= 7 ? '🚨' : '⚠️'} {proximaVacuna.nombre}
                  </p>
                  <p style={{ color:'var(--text-secondary)', fontSize:11, margin:'3px 0 0' }}>
                    Próxima vacuna · en {diasProxima} día{diasProxima !== 1 ? 's' : ''}
                    {' '}· {fmtDate(proximaVacuna.fecha_proxima)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Bio-expediente ─────────────────────────────────────────── */}
          <div style={{ padding:'0 20px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <SectionTitle>Bio-expediente</SectionTitle>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { icon:'⚖️', label:'Peso', val: mascota.peso ? `${mascota.peso} kg` : '—' },
                { icon:'🎂', label:'Nacimiento', val: mascota.fecha_nacimiento ? fmtDate(mascota.fecha_nacimiento) : '—' },
                { icon:'🧬', label:'Sexo', val: mascota.sexo ? (mascota.sexo.charAt(0).toUpperCase() + mascota.sexo.slice(1)) : '—' },
                { icon:'🐾', label:'Especie', val: mascota.especie.charAt(0).toUpperCase() + mascota.especie.slice(1) },
              ].map(item => (
                <div key={item.label} style={{
                  padding:'12px 14px', borderRadius:12,
                  background:'var(--bg-card)', border:'1px solid var(--border-color)',
                  display:'flex', alignItems:'center', gap:10,
                }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
                  <div>
                    <p style={{ color:'var(--text-secondary)', fontSize:10, fontWeight:600, margin:0, textTransform:'uppercase', letterSpacing:'0.05em' }}>{item.label}</p>
                    <p style={{ color:'var(--text-primary)', fontSize:13, fontWeight:600, margin:'2px 0 0' }}>{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Notas ──────────────────────────────────────────── */}
          {mascota.notas && (
            <div style={{ padding:'0 20px 24px' }}>
              <SectionTitle>Notas</SectionTitle>
              <div style={{
                padding:'12px 14px', borderRadius:14,
                background:'var(--bg-card)', border:'1px solid var(--border-color)',
                color:'var(--text-primary)', fontSize:13, lineHeight:1.6,
              }}>
                {mascota.notas}
              </div>
            </div>
          )}

          {/* ── Historial de Vacunas ────────────────────────────── */}
          <div style={{ padding:'0 20px 24px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <SectionTitle>Historial de Vacunas</SectionTitle>
              <div style={{ display:'flex', gap:8 }}>
                {/* Escanear carnet */}
                <button
                  onClick={() => scanRef.current?.click()}
                  disabled={scanLoading}
                  style={{
                    padding:'6px 12px', borderRadius:20, cursor:'pointer',
                    background: 'rgba(167,139,250,0.1)',
                    color: '#A78BFA',
                    border: '1px solid rgba(167,139,250,0.3)',
                    fontSize:12, fontWeight:700,
                    opacity: scanLoading ? 0.6 : 1,
                  }}
                >
                  {scanLoading ? '⏳ Leyendo…' : '📷 Escanear carnet'}
                </button>
                <input
                  ref={scanRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display:'none' }}
                  onChange={handleScan}
                />
                {/* Agregar manual */}
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
                  {showVacForm ? '✕ Cancelar' : '+ Manual'}
                </button>
              </div>
            </div>

            {/* Formulario nueva vacuna */}
            {showVacForm && (
              <div style={{
                marginBottom:14, padding:'16px', borderRadius:16,
                background:'var(--bg-card)', border:'1px solid var(--border-color)',
                display:'flex', flexDirection:'column', gap:12,
              }}>
                <p style={{ color:'var(--text-primary)', fontSize:14, fontWeight:700, margin:0 }}>Nueva Vacuna</p>
                {[
                  { label:'Nombre vacuna *', key:'nombre',          type:'text', ph:'Ej: Antirrábica' },
                  { label:'Fecha aplicada',  key:'fecha_aplicada',  type:'date', ph:'' },
                  { label:'Próxima dosis',   key:'fecha_proxima',   type:'date', ph:'' },
                  { label:'Veterinario',     key:'veterinario',     type:'text', ph:'Dr. García' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ color:'var(--text-secondary)', fontSize:11, fontWeight:600, letterSpacing:'0.08em', display:'block', marginBottom:5 }}>
                      {f.label.toUpperCase()}
                    </label>
                    <input
                      type={f.type}
                      value={(vacForm as Record<string,string>)[f.key]}
                      onChange={e => setVacForm(v => ({ ...v, [f.key]: e.target.value }))}
                      placeholder={f.ph}
                      style={{
                        width:'100%', background:'var(--bg-primary)', border:'1px solid var(--border-color)',
                        borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', fontSize:13,
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
                background:'var(--bg-card)', border:'2px dashed var(--border-color)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:8,
              }}>
                <span style={{ fontSize:32 }}>💉</span>
                <p style={{ color:'var(--text-secondary)', fontSize:13, margin:0 }}>No hay vacunas registradas</p>
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
                        background: vencida ? 'rgba(255,45,155,0.06)' : urgente ? 'rgba(255,230,0,0.05)' : 'var(--bg-card)',
                      }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                          <div>
                            <p style={{ color:'var(--text-primary)', fontSize:13, fontWeight:700, margin:0 }}>💉 {v.nombre}</p>
                            {v.fecha_aplicada && (
                              <p style={{ color:'var(--text-secondary)', fontSize:11, margin:'3px 0 0' }}>
                                Aplicada: {fmtDate(v.fecha_aplicada)}
                              </p>
                            )}
                            {v.veterinario && (
                              <p style={{ color:'var(--text-secondary)', fontSize:11, margin:'2px 0 0' }}>🩺 {v.veterinario}</p>
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
                              <p style={{ color:'var(--text-secondary)', fontSize:9, margin:0, textAlign:'center' }}>
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

        {/* ── Modal Carnet Digital ─────────────────────────────────── */}
        {showCarnet && (
          <div style={{
            position:'fixed', inset:0, zIndex:9999,
            background:'rgba(0,0,0,0.85)',
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            padding:'20px',
          }}>
            {/* Botón cerrar */}
            <button
              onClick={() => setShowCarnet(false)}
              style={{
                position:'absolute', top:52, right:20,
                background:'#222', border:'none', borderRadius:'50%',
                width:36, height:36, color:'#fff', fontSize:20,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              }}
            >✕</button>

            {/* Carnet */}
            <div id="carnet-digital" style={{
              background:'#0a0a0a', borderRadius:20, overflow:'hidden',
              width:'100%', maxWidth:340,
            }}>
              {/* Header gradiente */}
              <div style={{
                background:'linear-gradient(135deg,#FF2D9B,#A78BFA,#00E5FF)',
                padding:'20px 20px 16px', display:'flex', alignItems:'center', gap:14,
              }}>
                <div style={{
                  width:64, height:64, borderRadius:'50%', flexShrink:0,
                  background:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.4)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:28, fontWeight:800, color:'#fff', overflow:'hidden',
                }}>
                  {mascota.foto_url
                    ? <img src={mascota.foto_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt={mascota.nombre} />
                    : mascota.nombre.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:20, fontWeight:800, color:'#fff', margin:'0 0 2px' }}>{mascota.nombre}</p>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.8)', margin:'0 0 6px', textTransform:'capitalize' }}>
                    {mascota.especie}{mascota.raza ? ` · ${mascota.raza}` : ''}{mascota.sexo ? ` · ${mascota.sexo}` : ''}
                    {mascota.fecha_nacimiento ? ` · ${calcEdad(mascota.fecha_nacimiento)}` : ''}
                  </p>
                  <p style={{ fontSize:10, color:'rgba(255,255,255,0.7)', fontWeight:600, letterSpacing:'0.05em', margin:0 }}>
                    e-PetPlace · Carnet Digital
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'#1a1a1a' }}>
                {[
                  { val: mascota.peso ? `${mascota.peso}kg` : '—', label:'Peso' },
                  { val: String(vacunas.length), label:'Vacunas' },
                  { val: diasProxima !== null ? `${diasProxima}d` : '—', label:'Próxima' },
                ].map(s => (
                  <div key={s.label} style={{ background:'#111', padding:'12px 8px', textAlign:'center' }}>
                    <span style={{ display:'block', fontSize:15, fontWeight:700, color:'#00E5FF' }}>{s.val}</span>
                    <span style={{ display:'block', fontSize:9, color:'#555', marginTop:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Bio */}
              <div style={{ padding:'14px 16px', borderTop:'1px solid #1a1a1a' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 10px' }}>Bio-expediente</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    { key:'Especie', val: mascota.especie },
                    { key:'Raza', val: mascota.raza || '—' },
                    { key:'Nacimiento', val: mascota.fecha_nacimiento ? fmtDate(mascota.fecha_nacimiento) : '—' },
                    { key:'Sexo', val: mascota.sexo || '—' },
                  ].map(item => (
                    <div key={item.key} style={{ background:'#161616', borderRadius:10, padding:'8px 10px' }}>
                      <p style={{ fontSize:9, color:'#555', margin:'0 0 3px' }}>{item.key}</p>
                      <p style={{ fontSize:12, color:'#fff', fontWeight:600, margin:0, textTransform:'capitalize' }}>{item.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vacunas */}
              <div style={{ padding:'14px 16px', borderTop:'1px solid #1a1a1a' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 10px' }}>Historial de vacunas</p>
                {vacunas.length === 0 ? (
                  <p style={{ color:'#444', fontSize:12 }}>Sin vacunas registradas</p>
                ) : vacunas.slice(0, 4).map(v => {
                  const d = diasRestantes(v.fecha_proxima);
                  const vencida = d !== null && d < 0;
                  const urgente = d !== null && d >= 0 && d <= 7;
                  const color = vencida ? '#FF2D9B' : urgente ? '#FFE600' : '#00F5A0';
                  const badge = vencida ? 'Vencida' : urgente ? `${d}d ⚠` : 'Al día';
                  return (
                    <div key={v.id} style={{ display:'flex', borderRadius:10, overflow:'hidden', marginBottom:6 }}>
                      <div style={{ width:3, background:color, flexShrink:0 }} />
                      <div style={{ flex:1, padding:'8px 10px', background:'#161616' }}>
                        <p style={{ fontSize:12, fontWeight:700, color:'#fff', margin:'0 0 2px' }}>💉 {v.nombre}</p>
                        <p style={{ fontSize:10, color:'#555', margin:0 }}>
                          {v.fecha_aplicada ? fmtDate(v.fecha_aplicada) : '—'}
                          {v.fecha_proxima ? ` · Próxima: ${fmtDate(v.fecha_proxima)}` : ''}
                        </p>
                      </div>
                      <span style={{
                        fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:10,
                        alignSelf:'center', flexShrink:0, marginRight:8,
                        background:`${color}18`, color,
                      }}>{badge}</span>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div style={{
                padding:'12px 16px', borderTop:'1px solid #1a1a1a',
                display:'flex', justifyContent:'space-between', alignItems:'center',
              }}>
                <span style={{ fontSize:9, color:'#333', fontFamily:'monospace' }}>
                  EPP-{mascota.nombre.toUpperCase()}-{petId.slice(0,6).toUpperCase()} · {new Date().toLocaleDateString('es-ES')}
                </span>
                <span style={{ fontSize:10, fontWeight:700, color:'#FF2D9B' }}>e-PetPlace</span>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display:'flex', gap:10, marginTop:16, width:'100%', maxWidth:340 }}>
              <button
                onClick={async () => {
                  try {
                    const html2canvas = (await import('html2canvas')).default;
                    const el = document.getElementById('carnet-digital');
                    if (!el) return;
                    const canvas = await html2canvas(el, { backgroundColor: '#0a0a0a', scale: 2 });
                    const link = document.createElement('a');
                    link.download = `carnet-${mascota.nombre.toLowerCase()}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                  } catch { showToast('Error al generar imagen'); }
                }}
                style={{
                  flex:1, padding:'13px 0', borderRadius:12,
                  background:'linear-gradient(90deg,#FF2D9B,#00E5FF)',
                  color:'#000', fontWeight:800, fontSize:13,
                  border:'none', cursor:'pointer',
                }}
              >Descargar PNG</button>
              <button
                onClick={() => {
                  const text = `Carnet de vacunación de ${mascota.nombre} — e-PetPlace\nVacunas: ${vacunas.map(v => v.nombre).join(', ')}`;
                  if (navigator.share) {
                    navigator.share({ title: `Carnet de ${mascota.nombre}`, text });
                  } else {
                    navigator.clipboard.writeText(text);
                    showToast('Datos copiados al portapapeles');
                  }
                }}
                style={{
                  flex:1, padding:'13px 0', borderRadius:12,
                  background:'#161616', color:'#00E5FF',
                  border:'1px solid rgba(0,229,255,0.2)',
                  fontWeight:800, fontSize:13, cursor:'pointer',
                }}
              >Compartir</button>
            </div>
          </div>
        )}

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
      color:'var(--text-secondary)', fontSize:11, fontWeight:700,
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
      width:'100%', background:'var(--bg-card)',
      border:`1px solid ${borderColor ?? 'var(--border-color)'}`,
      borderRadius:12, padding:'13px 14px', color:'var(--text-primary)',
      fontSize:14, boxSizing:'border-box',
    }}
    onFocus={e => { e.currentTarget.style.borderColor = '#00E5FF'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,229,255,0.12)'; }}
    onBlur={e  => { e.currentTarget.style.borderColor = borderColor ?? 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
  />
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{ color:'var(--text-primary)', fontSize:16, fontWeight:700, margin:'0 0 0 0' }}>{children}</h2>
);

/* ════════════════════════════════════════════════════════════════
   COMPONENTE 4 – EDITAR MASCOTA  (/biopet/:id/editar)
════════════════════════════════════════════════════════════════ */
export const BioPetEdit: React.FC<{ session: Session; petId: string }> = ({ session, petId }) => {
  const [form,         setForm]         = useState({ ...EMPTY_FORM });
  const [errors,       setErrors]       = useState<Record<string,string>>({});
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const history = useHistory();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  /* ── Cargar datos existentes ─────────────────────────────── */
  useEffect(() => {
    supabase.from('mascotas').select('*').eq('id', petId).single()
      .then(({ data }) => {
        if (data) {
          setForm({
            nombre:           data.nombre           ?? '',
            especie:          data.especie           ?? '',
            raza:             data.raza              ?? '',
            fecha_nacimiento: data.fecha_nacimiento  ?? '',
            sexo:             data.sexo              ?? '',
            peso:             data.peso ? String(data.peso) : '',
            notas:            data.notas             ?? '',
            foto_url:         data.foto_url          ?? '',
          });
          if (data.foto_url) setPhotoPreview(data.foto_url);
        }
        setLoading(false);
      });
  }, [petId]);

  const setField = (key: string, val: string) => {
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === 'especie') next.raza = '';
      return next;
    });
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  /* ── Resize foto antes de subir ──────────────────────────── */
  const resizeImage = (file: File, maxSize = 800): Promise<File> => {
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(url);
          resolve(new File([blob!], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.82);
      };
      img.src = url;
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    setPhotoFile(resized);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(resized);
  };

  const validate = (): boolean => {
    const errs: Record<string,string> = {};
    if (!form.nombre.trim()) errs.nombre = '⚠️ El nombre es obligatorio';
    if (!form.especie)       errs.especie = '⚠️ Selecciona la especie';
    if (!form.raza.trim())   errs.raza = '⚠️ La raza es obligatoria';
    if (form.fecha_nacimiento) {
      const err = validarFechaMascota(form.fecha_nacimiento);
      if (err) errs.fecha_nacimiento = err;
    }
    if (form.peso) {
      const n = parseFloat(form.peso);
      if (isNaN(n) || n < 0.1 || n > 200) errs.peso = '⚠️ Peso entre 0.1 y 200 kg';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    let foto_url = form.foto_url;

    if (photoFile) {
      const url = await uploadPetPhoto(photoFile, petId);
      if (url) foto_url = url;
    }

    const { error } = await supabase.from('mascotas').update({
      nombre:           form.nombre.trim(),
      especie:          form.especie,
      raza:             form.raza             || null,
      fecha_nacimiento: form.fecha_nacimiento  || null,
      sexo:             form.sexo              || null,
      peso:             form.peso ? parseFloat(form.peso) : null,
      notas:            form.notas             || null,
      foto_url:         foto_url               || null,
    }).eq('id', petId);

    setSaving(false);

    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }

    showToast('¡Mascota actualizada! ✅');
    setTimeout(() => history.replace(`/biopet/${petId}`), 800);
  };

  if (loading) return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{ background:'var(--bg-primary)', minHeight:'100vh', padding:'52px 20px' }}>
          <IonSkeletonText animated style={{ width:'60%', height:24, borderRadius:8, marginBottom:20 } as React.CSSProperties} />
          {[1,2,3,4].map(k => (
            <IonSkeletonText key={k} animated style={{ width:'100%', height:48, borderRadius:12, marginBottom:12 } as React.CSSProperties} />
          ))}
        </div>
      </IonContent>
    </IonPage>
  );

  const titulo = form.especie ? TITULO_ESPECIE[form.especie] : '✎ Editar mascota';

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonLoading isOpen={saving} message="Guardando cambios…" />

        <div style={{ background:'var(--bg-primary)', minHeight:'100vh', paddingBottom:120 }}>

          {/* Header */}
          <div style={{ padding:'52px 20px 16px', display:'flex', alignItems:'center', gap:12 }}>
            <BackBtn onClick={() => history.goBack()} />
            <h1 style={{ color:'var(--text-primary)', fontSize:18, fontWeight:800, margin:0 }}>
              Editar — {form.nombre || 'mascota'}
            </h1>
          </div>

          <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:20 }}>

            {/* ── Foto ────────────────────────────────────────── */}
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
                  position:'absolute', inset:0, background:'rgba(0,0,0,0.35)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <span style={{ color:'#fff', fontSize:22 }}>✎</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoChange} />
              <p style={{ color:'var(--text-secondary)', fontSize:12, margin:0 }}>
                Toca para cambiar la foto · máx 800px, ~150KB
              </p>
            </div>

            {/* ── Especie ─────────────────────────────────────── */}
            <Field label="Especie *">
              {errors.especie && <p style={{ color:'#FF2D9B', fontSize:12, margin:'0 0 6px' }}>{errors.especie}</p>}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {ESPECIES.map(e => {
                  const sel = form.especie === e.key;
                  return (
                    <button
                      key={e.key} type="button"
                      onClick={() => setField('especie', e.key)}
                      style={{
                        padding:'8px 14px', borderRadius:20, cursor:'pointer', fontSize:13, fontWeight:600,
                        background: sel ? 'rgba(0,229,255,0.12)' : 'var(--bg-card)',
                        border: `1px solid ${sel ? '#00E5FF' : 'var(--border-color)'}`,
                        color: sel ? '#00E5FF' : 'var(--text-secondary)',
                      }}
                    >{e.emoji} {e.label}</button>
                  );
                })}
              </div>
            </Field>

            {/* ── Nombre ──────────────────────────────────────── */}
            <Field label="Nombre *">
              {errors.nombre && <p style={{ color:'#FF2D9B', fontSize:12, margin:'0 0 6px' }}>{errors.nombre}</p>}
              <TextInput value={form.nombre} onChange={v => setField('nombre', v)}
                placeholder="¿Cómo se llama?" borderColor={errors.nombre ? '#FF2D9B' : undefined} />
            </Field>

            {/* ── Raza ────────────────────────────────────────── */}
            {form.especie && (
              <Field label="Raza *">
                {errors.raza && <p style={{ color:'#FF2D9B', fontSize:12, margin:'0 0 6px' }}>{errors.raza}</p>}
                <RazaInput value={form.raza} onChange={v => setField('raza', v)}
                  especie={form.especie} hasError={!!errors.raza} />
              </Field>
            )}

            {/* ── Fecha nacimiento ─────────────────────────────── */}
            <Field label="Fecha de nacimiento">
              {errors.fecha_nacimiento && <p style={{ color:'#FF2D9B', fontSize:12, margin:'0 0 6px' }}>{errors.fecha_nacimiento}</p>}
              <TextInput value={form.fecha_nacimiento} onChange={v => setField('fecha_nacimiento', v)}
                type="date" borderColor={errors.fecha_nacimiento ? '#FF2D9B' : undefined} />
            </Field>

            {/* ── Sexo ────────────────────────────────────────── */}
            {form.especie && form.especie !== 'pez' && (
              <Field label={`Sexo${form.especie !== 'ave' ? ' *' : ''}`}>
                {errors.sexo && <p style={{ color:'#FF2D9B', fontSize:12, margin:'0 0 6px' }}>{errors.sexo}</p>}
                <div style={{ display:'flex', gap:10 }}>
                  {['macho','hembra'].map(s => {
                    const sel = form.sexo === s;
                    return (
                      <button key={s} type="button" onClick={() => setField('sexo', s)}
                        style={{
                          flex:1, padding:'12px 0', borderRadius:12, cursor:'pointer', fontWeight:700, fontSize:14,
                          background: sel ? 'rgba(0,229,255,0.1)' : 'var(--bg-card)',
                          border: `1px solid ${sel ? '#00E5FF' : 'var(--border-color)'}`,
                          color: sel ? '#00E5FF' : 'var(--text-secondary)',
                        }}
                      >{s === 'macho' ? '♂ Macho' : '♀ Hembra'}</button>
                    );
                  })}
                </div>
              </Field>
            )}

            {/* ── Peso ────────────────────────────────────────── */}
            <Field label="Peso (kg)">
              {errors.peso && <p style={{ color:'#FF2D9B', fontSize:12, margin:'0 0 6px' }}>{errors.peso}</p>}
              <TextInput value={form.peso} onChange={v => setField('peso', v)}
                type="number" placeholder="Ej: 8.5" borderColor={errors.peso ? '#FF2D9B' : undefined} />
            </Field>

            {/* ── Notas ───────────────────────────────────────── */}
            <Field label="Notas / alergias / condiciones">
              <textarea
                value={form.notas}
                onChange={e => setField('notas', e.target.value)}
                placeholder="Alergias, condiciones especiales, personalidad…"
                rows={3}
                style={{
                  width:'100%', background:'var(--bg-card)',
                  border:'1px solid var(--border-color)', borderRadius:12,
                  padding:'13px 14px', color:'var(--text-primary)',
                  fontSize:14, boxSizing:'border-box', resize:'none',
                }}
              />
            </Field>

            {/* ── Guardar ─────────────────────────────────────── */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding:'16px 0', borderRadius:14,
                background:'linear-gradient(90deg,#FF2D9B,#00E5FF)',
                color:'#000', fontWeight:800, fontSize:16,
                border:'none', cursor:'pointer',
                opacity: saving ? 0.5 : 1,
                boxShadow: saving ? 'none' : '0 0 30px rgba(0,229,255,0.2)',
              }}
            >
              Guardar cambios ✅
            </button>

          </div>
        </div>

        <Toast msg={toast} />
      </IonContent>
    </IonPage>
  );
};

export default BioPet;
