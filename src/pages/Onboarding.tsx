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
*/

import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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

const CIUDADES_POR_PAIS: Record<string, string[]> = {
  Ecuador:  ['Quito','Guayaquil','Cuenca','Manta','Ambato','Loja','Ibarra','Esmeraldas','Santo Domingo','Otra ciudad'],
  Colombia: ['Bogotá','Medellín','Cali','Barranquilla','Cartagena','Otra ciudad'],
  Perú:     ['Lima','Arequipa','Trujillo','Otra ciudad'],
  México:   ['Ciudad de México','Guadalajara','Monterrey','Otra ciudad'],
  Otro:     [],
};

const PAISES = ['Ecuador','Colombia','Perú','México','Otro'];

const selectStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#111', border: '1px solid #222', borderRadius: 12,
  padding: '13px 40px 13px 16px', color: '#fff',
  fontSize: 14, appearance: 'none', WebkitAppearance: 'none',
};

const Onboarding: React.FC<Props> = ({ session }) => {
  const history = useHistory();
  const [paso,         setPaso]         = useState<1 | 2>(1);
  const [tiposMascota, setTiposMascota] = useState<string[]>([]);
  const [pais,         setPais]         = useState('Ecuador');
  const [ciudad,       setCiudad]       = useState('');
  const [ciudadTexto,  setCiudadTexto]  = useState('');
  const [saving,       setSaving]       = useState(false);

  const nombreUsuario = session.user.user_metadata?.nombre
    ?? session.user.email?.split('@')[0] ?? 'amigo';

  const progreso = paso === 1 ? 50 : 100;
  const ciudades  = CIUDADES_POR_PAIS[pais] ?? [];

  const toggleTipo = (id: string) =>
    setTiposMascota(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );

  const handlePaisChange = (nuevoPais: string) => {
    setPais(nuevoPais);
    setCiudad('');
    setCiudadTexto('');
  };

  const ciudadFinal = pais === 'Otro' ? ciudadTexto.trim() : ciudad;

  const completarOnboarding = async (skip = false) => {
    setSaving(true);

    const updateData: Record<string, unknown> = { onboarding_completo: true };
    if (!skip) {
      if (ciudadFinal)              updateData.ciudad         = ciudadFinal;
      if (pais)                     updateData.pais           = pais;
      if (tiposMascota.length > 0)  updateData.tipo_mascotas  = tiposMascota;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', session.user.id);

    console.log('Onboarding completado:', error ?? 'OK');

    // Guardar en localStorage como respaldo inmediato
    localStorage.setItem(`onboarding_done_${session.user.id}`, 'true');

    setSaving(false);

    if (!skip && tiposMascota.length > 0) {
      history.replace('/biopet/new');
    } else {
      history.replace('/home');
    }
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': '#000' } as React.CSSProperties}>
        <div style={{ background: '#000', minHeight: '100vh', padding: '56px 24px 48px' }}>

          {/* Barra de progreso */}
          <div style={{ marginBottom: 36 }}>
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

          {/* ── PASO 1: Tipo de mascotas ─────────────────────────── */}
          {paso === 1 && (
            <>
              <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 24, margin: '0 0 8px', lineHeight: 1.25 }}>
                ¡Hola {nombreUsuario}! 🐾
              </h2>
              <p style={{ color: '#555', fontSize: 14, margin: '0 0 32px', lineHeight: 1.6 }}>
                Cuéntanos sobre tus mascotas para personalizar tu experiencia
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 36 }}>
                {TIPOS_MASCOTA.map(t => {
                  const sel = tiposMascota.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTipo(t.id)}
                      style={{
                        background: sel ? 'rgba(0,229,255,0.08)' : '#111',
                        border: `2px solid ${sel ? '#00E5FF' : '#1e1e1e'}`,
                        borderRadius: 20, padding: '20px 8px 16px',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 8, cursor: 'pointer',
                        transition: 'all 0.18s',
                        boxShadow: sel ? '0 0 18px rgba(0,229,255,0.12)' : 'none',
                        position: 'relative',
                      }}
                    >
                      {sel && (
                        <div style={{
                          position: 'absolute', top: 8, right: 8,
                          width: 16, height: 16, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#FF2D9B,#00E5FF)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, color: '#000', fontWeight: 900,
                        }}>✓</div>
                      )}
                      <span style={{ fontSize: 36, lineHeight: 1 }}>{t.emoji}</span>
                      <span style={{ color: sel ? '#00E5FF' : '#666', fontSize: 12, fontWeight: 700 }}>
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPaso(2)}
                className="btn-brand"
                style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 16,
                  boxShadow: '0 0 30px rgba(0,229,255,0.15)' }}
              >
                Continuar →
              </button>
              <button
                type="button"
                onClick={() => setPaso(2)}
                style={{ width: '100%', padding: '13px 0', background: 'none', border: 'none',
                  color: '#333', fontSize: 13, cursor: 'pointer', marginTop: 10, fontWeight: 500 }}
              >
                Omitir por ahora
              </button>
            </>
          )}

          {/* ── PASO 2: País → Ciudad ─────────────────────────────── */}
          {paso === 2 && (
            <>
              <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 24, margin: '0 0 8px' }}>
                ¿Dónde estás? 📍
              </h2>
              <p style={{ color: '#555', fontSize: 14, margin: '0 0 32px', lineHeight: 1.6 }}>
                Para mostrarte veterinarios y servicios cercanos
              </p>

              {/* País — primero */}
              <div style={{ marginBottom: 18 }}>
                <p style={{ color: '#444', fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                  País
                </p>
                <div style={{ position: 'relative' }}>
                  <select value={pais} onChange={e => handlePaisChange(e.target.value)} style={selectStyle}>
                    {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    color: '#444', fontSize: 12, pointerEvents: 'none' }}>▾</span>
                </div>
              </div>

              {/* Ciudad — dinámica según país */}
              <div style={{ marginBottom: 36 }}>
                <p style={{ color: '#444', fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                  Ciudad
                </p>

                {pais === 'Otro' ? (
                  <input
                    type="text"
                    value={ciudadTexto}
                    onChange={e => setCiudadTexto(e.target.value)}
                    placeholder="Escribe tu ciudad"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: '#111', border: '1px solid #222', borderRadius: 12,
                      padding: '13px 16px', color: '#fff', fontSize: 14,
                    }}
                  />
                ) : (
                  <div style={{ position: 'relative' }}>
                    <select
                      value={ciudad}
                      onChange={e => setCiudad(e.target.value)}
                      style={{ ...selectStyle, color: ciudad ? '#fff' : '#444' }}
                    >
                      <option value="">Selecciona tu ciudad</option>
                      {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      color: '#444', fontSize: 12, pointerEvents: 'none' }}>▾</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => completarOnboarding(false)}
                disabled={saving}
                className="btn-brand"
                style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 16,
                  boxShadow: saving ? 'none' : '0 0 30px rgba(0,229,255,0.15)', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Guardando…' : '¡Empezar! 🚀'}
              </button>
              <button
                type="button"
                onClick={() => completarOnboarding(true)}
                disabled={saving}
                style={{ width: '100%', padding: '13px 0', background: 'none', border: 'none',
                  color: '#333', fontSize: 13, cursor: 'pointer', marginTop: 10, fontWeight: 500 }}
              >
                Omitir
              </button>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Onboarding;
