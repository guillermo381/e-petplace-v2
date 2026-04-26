import React, { useState, useEffect } from 'react';
import { IonActionSheet } from '@ionic/react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { TODOS_LOS_PAISES, PAISES_SOPORTADOS, PaisData } from '../data/paises';

const ECUADOR = PAISES_SOPORTADOS[0];

export interface PhoneInputValue {
  fullNumber: string;          // '+593987654321'
  codigoPais: string;          // 'EC'
  tipo:       'whatsapp' | 'llamada';
}

interface Props {
  value?:       string;        // full number existing, e.g. '+593987654321'
  codigoPais?:  string;        // 'EC'
  tipo?:        'whatsapp' | 'llamada';
  onChange:     (v: PhoneInputValue) => void;
  error?:       string;
  clearError?:  () => void;
  compact?:     boolean;       // hides helper text
  session?:     Session | null;
}

const PhoneInput: React.FC<Props> = ({
  value, codigoPais, tipo, onChange, error, clearError, compact, session,
}) => {
  const [pais,          setPais]          = useState<PaisData>(() => {
    if (codigoPais) return TODOS_LOS_PAISES.find(p => p.codigo === codigoPais) ?? ECUADOR;
    return ECUADOR;
  });
  const [numero,        setNumero]        = useState('');
  const [tipoContacto,  setTipoContacto]  = useState<'whatsapp' | 'llamada'>(tipo ?? 'whatsapp');
  const [showSheet,     setShowSheet]     = useState(false);
  const [aviso,         setAviso]         = useState<string | null>(null);

  // Parsear valor inicial
  useEffect(() => {
    if (!value) return;
    // Buscar código de país más largo primero para evitar falsos positivos
    const sorted = [...TODOS_LOS_PAISES].sort((a, b) => b.telefono.length - a.telefono.length);
    const found  = sorted.find(p => value.startsWith(p.telefono));
    if (found) { setPais(found); setNumero(value.slice(found.telefono.length)); }
    else        { setNumero(value.replace(/^\+/, '')); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detectar país: 1) perfil Supabase  2) IP geo  3) Ecuador por defecto
  useEffect(() => {
    if (codigoPais || value) return;
    const detect = async () => {
      // 1. Leer pais_codigo del perfil si hay sesión
      if (session?.user?.id) {
        try {
          const { data: prof } = await supabase
            .from('profiles').select('pais_codigo').eq('id', session.user.id).single();
          const found = TODOS_LOS_PAISES.find(p => p.codigo === (prof?.pais_codigo ?? ''));
          if (found) { setPais(found); return; }
        } catch { /* continuar con IP */ }
      }
      // 2. Geo-detección por IP
      try {
        const res    = await fetch('https://ipapi.co/json/');
        const data   = await res.json();
        const codigo: string = data.country_code ?? '';
        const found     = TODOS_LOS_PAISES.find(p => p.codigo === codigo);
        const soportado = PAISES_SOPORTADOS.find(p => p.codigo === codigo);
        if (found) {
          setPais(found);
          if (!soportado) setAviso(`Detectamos que estás en ${found.nombre}. Actualmente operamos principalmente en Ecuador, Colombia y más países de LatAm.`);
        }
      } catch { /* silencioso — Ecuador por defecto */ }
    };
    detect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = (n: string, p: PaisData, t: 'whatsapp' | 'llamada') =>
    onChange({ fullNumber: `${p.telefono}${n}`, codigoPais: p.codigo, tipo: t });

  const handleNumero = (val: string) => {
    const solo = val.replace(/\D/g, '');
    setNumero(solo);
    clearError?.();
    emit(solo, pais, tipoContacto);
  };

  const handlePais = (nuevo: PaisData) => {
    setPais(nuevo);
    setAviso(null);
    emit(numero, nuevo, tipoContacto);
  };

  const handleTipo = (t: 'whatsapp' | 'llamada') => {
    setTipoContacto(t);
    emit(numero, pais, t);
  };

  const sheetButtons = [
    ...TODOS_LOS_PAISES.map(p => ({
      text:    `${p.bandera} ${p.nombre} (${p.telefono})`,
      handler: () => handlePais(p),
    })),
    { text: 'Cancelar', role: 'cancel' as const, handler: () => {} },
  ];

  return (
    <div>
      {/* Fila: selector de país + input número */}
      <div style={{ display:'flex', gap:8, alignItems:'stretch' }}>
        <button
          type="button"
          onClick={() => setShowSheet(true)}
          style={{
            flexShrink:0, background:'#111',
            border:`1px solid ${error ? '#FF2D9B' : '#2a2a2a'}`,
            borderRadius:12, padding:'11px 12px',
            display:'flex', alignItems:'center', gap:5,
            cursor:'pointer', color:'#fff',
          }}
        >
          <span style={{ fontSize:20, lineHeight:1 }}>{pais.bandera}</span>
          <span style={{ color:'#888', fontSize:13, fontWeight:700 }}>{pais.telefono}</span>
          <span style={{ color:'#444', fontSize:10 }}>▾</span>
        </button>

        <input
          type="tel"
          inputMode="numeric"
          value={numero}
          onChange={e => handleNumero(e.target.value)}
          placeholder={'9'.repeat(Math.min(pais.digitosTel, 9))}
          maxLength={pais.digitosTel + 2}
          style={{
            flex:1, background:'#111',
            border:`1px solid ${error ? '#FF2D9B' : '#2a2a2a'}`,
            borderRadius:12, padding:'11px 14px', color:'#fff',
            fontSize:14, boxSizing:'border-box', outline:'none',
          }}
          onFocus={e  => { e.currentTarget.style.borderColor = '#00E5FF'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,229,255,0.12)'; }}
          onBlur={e   => { e.currentTarget.style.borderColor = error ? '#FF2D9B' : '#2a2a2a'; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Toggle preferencia de contacto */}
      <div style={{ marginTop:10 }}>
        <p style={{ color:'#888', fontSize:12, margin:'0 0 7px', fontWeight:500 }}>
          ¿Cómo prefieres que te contactemos? 💬
        </p>
        <div style={{ display:'flex', gap:8 }}>
          {([
            { val: 'whatsapp', label: '💬 WhatsApp'          },
            { val: 'llamada',  label: '📞 Llamada tradicional'},
          ] as const).map(t => (
            <button
              key={t.val}
              type="button"
              onClick={() => handleTipo(t.val)}
              style={{
                flex:1, padding:'9px 6px', borderRadius:10, cursor:'pointer',
                background: tipoContacto === t.val ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)' : '#111',
                color: tipoContacto === t.val ? '#000' : '#555',
                border: tipoContacto === t.val ? 'none' : '1px solid #222',
                fontWeight:700, fontSize:12, transition:'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {!compact && (
          <p style={{ color:'#444', fontSize:11, marginTop:6, lineHeight:1.5 }}>
            Usamos este canal para confirmar citas y enviarte novedades de tus pedidos
          </p>
        )}
      </div>

      {/* Mensajes */}
      {error && <p style={{ color:'#FF2D9B', fontSize:13, marginTop:6, fontWeight:500 }}>{error}</p>}
      {!error && !compact && aviso && (
        <p style={{ color:'#888', fontSize:12, marginTop:6, lineHeight:1.5 }}>{aviso}</p>
      )}

      <IonActionSheet
        isOpen={showSheet}
        onDidDismiss={() => setShowSheet(false)}
        header="Selecciona tu país"
        buttons={sheetButtons}
      />
    </div>
  );
};

export default PhoneInput;
