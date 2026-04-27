import React, { useEffect, useRef, useState } from 'react';

export interface AddressValue {
  completa: string; linea1: string; sector: string;
  apto: string; referencias: string; ciudad: string;
  pais: string; codigoPostal: string; guardadoComo: string;
}
interface Props {
  value?: Partial<AddressValue>;
  onChange: (v: AddressValue) => void;
  fieldError?: string;
  clearError?: () => void;
  compact?: boolean;
}

interface Sugerencia {
  placePrediction: {
    placeId: string;
    text: { text: string };
    structuredFormat?: { mainText: { text: string }; secondaryText?: { text: string } };
  };
}

const ALIAS_OPTS = [
  { val: 'casa',    icon: '🏠', label: 'Casa'    },
  { val: 'trabajo', icon: '🏢', label: 'Trabajo' },
  { val: 'familia', icon: '👨‍👩‍👧', label: 'Familia' },
  { val: 'otro',    icon: '📍', label: 'Otro'    },
];
export const getAliasIcon  = (v?: string) => ALIAS_OPTS.find(o => o.val === v)?.icon  ?? '📍';
export const getAliasLabel = (v?: string) => ALIAS_OPTS.find(o => o.val === v)?.label ?? (v || 'Otro');

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY as string;

const AddressInput = ({ value, onChange, fieldError, clearError, compact = false }: Props) => {
  // Ref estable — se asigna sincrónicamente, sin useEffect
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [query,        setQuery]        = useState(value?.completa || '');
  const [sugerencias,  setSugerencias]  = useState<Sugerencia[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [seleccionada, setSeleccionada] = useState<AddressValue | null>(
    value?.completa
      ? { completa: value.completa, linea1: value.linea1 || '', sector: value.sector || '', ciudad: value.ciudad || '', pais: value.pais || '', codigoPostal: value.codigoPostal || '', apto: value.apto || '', referencias: value.referencias || '', guardadoComo: value.guardadoComo || 'casa' }
      : null
  );
  const [modoEdicion,  setModoEdicion]  = useState(!value?.completa);
  const [apto,         setApto]         = useState(value?.apto        || '');
  const [referencias,  setReferencias]  = useState(value?.referencias || '');
  const [guardadoComo, setGuardadoComo] = useState(value?.guardadoComo || 'casa');
  const [errorRefs,    setErrorRefs]    = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  // Estado local para evitar re-renders del padre en cada keystroke
  const [localApto, setLocalApto] = useState(value?.apto        || '');
  const [localRefs, setLocalRefs] = useState(value?.referencias || '');

  /* ── Autocomplete Places API (New) ───────────────────────────── */
  const buscarSugerencias = async (texto: string) => {
    if (texto.length < 3) { setSugerencias([]); return; }
    setLoading(true);
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_KEY },
        body: JSON.stringify({ input: texto, languageCode: 'es', includedRegionCodes: ['ec', 'co', 'pe', 'mx', 'ar', 'cl'] }),
      });
      const data = await res.json();
      setSugerencias(data.suggestions || []);
    } catch (e) {
      console.error('Error Places autocomplete:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!modoEdicion) return;
    const timer = setTimeout(() => buscarSugerencias(query), 500);
    return () => clearTimeout(timer);
  }, [query, modoEdicion]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Obtener detalles y notificar UNA SOLA VEZ ───────────────── */
  const handlePlaceSelect = async (placeId: string, descripcion: string) => {
    try {
      const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: { 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': 'addressComponents,formattedAddress' },
      });
      const place = await res.json();

      const get = (type: string) => {
        if (!place.addressComponents) return '';
        const c = place.addressComponents.find((c: any) => {
          const types = c.types || c.componentType || [];
          return Array.isArray(types) ? types.includes(type) : types === type;
        });
        return c?.longText || c?.long_name || '';
      };

      const dir: AddressValue = {
        completa:     place.formattedAddress || descripcion,
        linea1:       `${get('route')} ${get('street_number')}`.trim(),
        sector:       get('sublocality') || get('neighborhood') || '',
        ciudad:       get('locality') || get('administrative_area_level_2') || '',
        pais:         get('country') || '',
        codigoPostal: get('postal_code') || '',
        apto, referencias, guardadoComo,
      };

      setSeleccionada(dir);
      setQuery(dir.completa);
      setSugerencias([]);
      setModoEdicion(false);
      clearError?.();
      onChangeRef.current(dir); // llamada única al seleccionar
    } catch (e) {
      console.error('Error obteniendo detalles:', e);
    }
  };

  /* ── Handlers directos para campos secundarios ───────────────── */
  const handleAptoChange = (val: string) => {
    setApto(val);
    if (seleccionada) onChangeRef.current({ ...seleccionada, apto: val, referencias, guardadoComo });
  };

  const handleReferenciasChange = (val: string) => {
    setReferencias(val);
    if (seleccionada) onChangeRef.current({ ...seleccionada, apto, referencias: val, guardadoComo });
  };

  const handleGuardadoComoChange = (val: string) => {
    setGuardadoComo(val);
    if (seleccionada) onChangeRef.current({ ...seleccionada, apto, referencias, guardadoComo: val });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 12px 12px 36px', boxSizing: 'border-box',
    background: '#111111', border: `1px solid ${inputFocused ? '#00E5FF' : fieldError ? '#FF2D9B' : '#333'}`,
    borderRadius: 10, color: '#ffffff', fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Dirección seleccionada (modo lectura) ─────────────────── */}
      {!modoEdicion && seleccionada ? (
        <div style={{ background: 'rgba(0,245,160,0.07)', border: '1px solid rgba(0,245,160,0.25)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>✅</span>
            <p style={{ flex: 1, color: '#00F5A0', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{seleccionada.completa}</p>
          </div>
          <button type="button"
            onClick={() => { setModoEdicion(true); setQuery(''); setSugerencias([]); }}
            style={{ marginTop: 8, background: 'none', border: '1px solid #333', borderRadius: 8, padding: '5px 12px', color: '#00E5FF', fontSize: 12, cursor: 'pointer' }}>
            Cambiar dirección
          </button>
        </div>

      ) : (
        /* ── Buscador ───────────────────────────────────────────── */
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none', zIndex: 1 }}>📍</span>
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setTimeout(() => setInputFocused(false), 200)}
            placeholder="Escribe tu dirección…" autoComplete="off" style={inputStyle}
          />
          {loading && (
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#00E5FF', fontSize: 12 }}>⏳</span>
          )}

          {sugerencias.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#111111', border: '1px solid #333', borderRadius: 10, zIndex: 9999, maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.7)', marginTop: 4 }}>
              {sugerencias.map(s => {
                const pred      = s.placePrediction;
                const main      = pred.structuredFormat?.mainText?.text    || pred.text.text;
                const secondary = pred.structuredFormat?.secondaryText?.text || '';
                return (
                  <div key={pred.placeId}
                    onMouseDown={e => { e.preventDefault(); handlePlaceSelect(pred.placeId, pred.text.text); }}
                    style={{ padding: '12px 14px', color: '#fff', borderBottom: '1px solid #222', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>📍</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: '#fff', fontWeight: 500 }}>{main}</p>
                      {secondary && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#888' }}>{secondary}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {query.length > 0 && query.length < 3 && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#555' }}>Escribe al menos 3 caracteres…</p>
          )}
          {!loading && query.length >= 3 && sugerencias.length === 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#555' }}>Sin resultados. Prueba con el nombre de la calle o un lugar de referencia.</p>
          )}
        </div>
      )}

      {fieldError && <p style={{ color: '#FF2D9B', fontSize: 12, margin: '-4px 0 0', fontWeight: 500 }}>{fieldError}</p>}

      {/* ── Campos adicionales ────────────────────────────────────── */}
      {seleccionada && !modoEdicion && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <input
              type="text"
              value={localApto}
              onChange={e => { e.stopPropagation(); setLocalApto(e.target.value); }}
              onBlur={() => handleAptoChange(localApto)}
              placeholder="Apto, Casa, Oficina (opcional)"
              autoComplete="off"
              style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', background: 'var(--bg-card)', border: '1px solid #333', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
            />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888' }}>Ej: Apto 301, Casa 2, Oficina B</p>
          </div>
          <div>
            <textarea
              value={localRefs}
              onChange={e => { e.stopPropagation(); setLocalRefs(e.target.value); if (e.target.value.length >= 10) setErrorRefs(''); }}
              onBlur={() => { handleReferenciasChange(localRefs); if (localRefs.length > 0 && localRefs.length < 10) setErrorRefs('Agrega al menos 10 caracteres'); }}
              placeholder="Referencias para el repartidor…"
              rows={3}
              style={{ width: '100%', padding: '12px', boxSizing: 'border-box', background: 'var(--bg-card)', border: `1px solid ${errorRefs ? '#FF2D9B' : '#333'}`, borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, resize: 'none', outline: 'none' }}
            />
            {errorRefs && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#FF2D9B' }}>⚠️ {errorRefs}</p>}
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888' }}>⚡ Ej: Casa azul con reja negra, frente al parque</p>
          </div>
          {!compact && (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-secondary)' }}>Guardar como:</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {ALIAS_OPTS.map(opt => (
                  <button key={opt.val} type="button" onClick={() => handleGuardadoComoChange(opt.val)}
                    style={{ flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${guardadoComo === opt.val ? '#00E5FF' : '#333'}`, background: guardadoComo === opt.val ? '#0d1a2b' : 'var(--bg-card)', color: guardadoComo === opt.val ? '#00E5FF' : '#888', fontSize: 11, fontWeight: 600 }}>
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { ALIAS_OPTS };
export default AddressInput;
