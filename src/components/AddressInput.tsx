import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface AddressValue {
  completa:     string;
  apto:         string;
  referencias:  string;
  ciudad:       string;
  pais:         string;
  codigoPostal: string;
  guardadaComo: 'casa' | 'trabajo' | 'otro';
}

interface Props {
  value?:      Partial<AddressValue>;
  onChange:    (v: AddressValue) => void;
  error?:      string;
  clearError?: () => void;
  compact?:    boolean;
}

/* ── Singleton loader ────────────────────────────────────────── */
declare global {
  interface Window {
    google:                 any;
    _gMapsLoading?:         boolean;
    _gMapsLoaded?:          boolean;
    _gMapsLoadCallbacks?:   Array<() => void>;
  }
}

const PLACES_KEY = (import.meta as unknown as Record<string, any>).env?.VITE_GOOGLE_PLACES_KEY as string | undefined;

function loadGooglePlaces(): Promise<void> {
  if (window._gMapsLoaded) return Promise.resolve();
  if (window._gMapsLoading) {
    return new Promise(resolve => {
      window._gMapsLoadCallbacks = window._gMapsLoadCallbacks ?? [];
      window._gMapsLoadCallbacks.push(resolve);
    });
  }
  if (!PLACES_KEY) return Promise.reject(new Error('No VITE_GOOGLE_PLACES_KEY'));
  window._gMapsLoading = true;
  return new Promise((resolve, reject) => {
    const s   = document.createElement('script');
    s.src     = `https://maps.googleapis.com/maps/api/js?key=${PLACES_KEY}&libraries=places`;
    s.async   = true;
    s.onload  = () => {
      window._gMapsLoaded = true;
      window._gMapsLoadCallbacks?.forEach(cb => cb());
      resolve();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ── Helpers ─────────────────────────────────────────────────── */
const iStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#111', border: '1px solid #2a2a2a', borderRadius: 12,
  padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none',
};

const GUARDADA_OPTS: { val: 'casa' | 'trabajo' | 'otro'; label: string }[] = [
  { val: 'casa',    label: '🏠 Casa'    },
  { val: 'trabajo', label: '🏢 Trabajo' },
  { val: 'otro',    label: '📍 Otro'   },
];

const COUNTRIES = ['ec', 'co', 'pe', 'mx', 'ar', 'cl'] as const;

/* ════════════════════════════════════════════════════════════════ */
const AddressInput: React.FC<Props> = ({ value, onChange, error, clearError, compact }) => {
  const [query,        setQuery]        = useState(value?.completa     ?? '');
  const [suggestions,  setSuggestions]  = useState<any[]>([]);
  const [selected,     setSelected]     = useState(!!value?.completa);
  const [apto,         setApto]         = useState(value?.apto         ?? '');
  const [referencias,  setReferencias]  = useState(value?.referencias  ?? '');
  const [guardadaComo, setGuardadaComo] = useState<'casa' | 'trabajo' | 'otro'>(value?.guardadaComo ?? 'casa');
  const [ciudad,       setCiudad]       = useState(value?.ciudad       ?? '');
  const [pais,         setPais]         = useState(value?.pais         ?? '');
  const [codigoPostal, setCodigoPostal] = useState(value?.codigoPostal ?? '');
  const [apiReady,     setApiReady]     = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const mapDivRef    = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGooglePlaces().then(() => setApiReady(true)).catch(() => {});
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const buildValue = useCallback((overrides: Partial<AddressValue> = {}): AddressValue => ({
    completa:     query,
    apto,
    referencias,
    ciudad,
    pais,
    codigoPostal,
    guardadaComo,
    ...overrides,
  }), [query, apto, referencias, ciudad, pais, codigoPostal, guardadaComo]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelected(false);
    clearError?.();
    if (!apiReady || val.length < 3) { setSuggestions([]); setShowDropdown(false); return; }
    const svc = new window.google.maps.places.AutocompleteService();
    svc.getPlacePredictions(
      { input: val, componentRestrictions: { country: COUNTRIES }, types: ['address'] },
      (preds: any, status: any) => {
        if (status === 'OK' && preds?.length) { setSuggestions(preds); setShowDropdown(true); }
        else { setSuggestions([]); setShowDropdown(false); }
      }
    );
  };

  const handleSelect = (pred: any) => {
    setQuery(pred.description);
    setSuggestions([]);
    setShowDropdown(false);
    setSelected(true);
    clearError?.();

    if (!mapDivRef.current) return;
    const svc = new window.google.maps.places.PlacesService(mapDivRef.current);
    svc.getDetails(
      { placeId: pred.place_id, fields: ['address_components', 'formatted_address'] },
      (place: any, status: any) => {
        if (status !== 'OK' || !place) {
          onChange(buildValue({ completa: pred.description }));
          return;
        }
        let c = '', p = '', postal = '';
        (place.address_components ?? []).forEach((comp: any) => {
          if (comp.types.includes('locality'))     c      = comp.long_name;
          if (comp.types.includes('country'))      p      = comp.long_name;
          if (comp.types.includes('postal_code'))  postal = comp.long_name;
        });
        setCiudad(c);
        setPais(p);
        setCodigoPostal(postal);
        onChange(buildValue({ completa: pred.description, ciudad: c, pais: p, codigoPostal: postal }));
      }
    );
  };

  return (
    <div ref={containerRef}>
      {/* Campo de búsqueda */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          placeholder="Busca tu dirección…"
          style={{
            ...iStyle,
            borderColor: error ? '#FF2D9B' : selected ? '#00F5A0' : '#2a2a2a',
            paddingRight: selected ? 36 : 14,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = error ? '#FF2D9B' : '#00E5FF'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,229,255,0.12)'; }}
          onBlur={e  => { e.currentTarget.style.borderColor = error ? '#FF2D9B' : selected ? '#00F5A0' : '#2a2a2a'; e.currentTarget.style.boxShadow = 'none'; }}
        />
        {selected && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#00F5A0', fontSize: 16, pointerEvents: 'none' }}>✓</span>
        )}
      </div>

      {/* Dropdown de sugerencias */}
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', zIndex: 999,
          background: '#141414', border: '1px solid #333', borderRadius: 12,
          overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          maxHeight: 260, overflowY: 'auto',
          width: containerRef.current?.offsetWidth ?? 'auto',
        }}>
          {suggestions.map((pred, i) => (
            <button
              key={pred.place_id ?? i}
              type="button"
              onMouseDown={() => handleSelect(pred)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '11px 14px', background: 'none', border: 'none',
                borderBottom: i < suggestions.length - 1 ? '1px solid #1e1e1e' : 'none',
                color: '#fff', fontSize: 13, cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,229,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ color: '#00E5FF', marginRight: 8 }}>📍</span>
              <span>{pred.structured_formatting?.main_text ?? pred.description}</span>
              <span style={{ color: '#555', fontSize: 11, display: 'block', paddingLeft: 22, marginTop: 1 }}>
                {pred.structured_formatting?.secondary_text}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p style={{ color: '#FF2D9B', fontSize: 13, margin: '5px 0 0', fontWeight: 500 }}>{error}</p>}

      {/* Campos adicionales tras seleccionar */}
      {selected && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Apto / Interior */}
          <input
            type="text"
            value={apto}
            onChange={e => { setApto(e.target.value); onChange(buildValue({ apto: e.target.value })); }}
            placeholder="Apto / piso / interior (opcional)"
            style={iStyle}
          />

          {/* Referencias */}
          <div>
            <textarea
              value={referencias}
              onChange={e => { setReferencias(e.target.value); onChange(buildValue({ referencias: e.target.value })); }}
              placeholder="Referencias: ej. frente al parque, casa azul con reja…"
              rows={2}
              style={{ ...iStyle, resize: 'none', borderColor: referencias.length > 0 && referencias.length < 15 ? '#FF2D9B' : '#2a2a2a' }}
            />
            {referencias.length > 0 && referencias.length < 15 && (
              <p style={{ color: '#FF2D9B', fontSize: 11, margin: '3px 0 0' }}>
                Agrega al menos 15 caracteres para facilitar la entrega ({referencias.length}/15)
              </p>
            )}
          </div>

          {/* Guardada como */}
          {!compact && (
            <div>
              <p style={{ color: '#666', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 7px' }}>
                Guardar como
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {GUARDADA_OPTS.map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => { setGuardadaComo(opt.val); onChange(buildValue({ guardadaComo: opt.val })); }}
                    style={{
                      flex: 1, padding: '9px 4px', borderRadius: 10, cursor: 'pointer',
                      background: guardadaComo === opt.val ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)' : '#111',
                      color: guardadaComo === opt.val ? '#000' : '#555',
                      border: guardadaComo === opt.val ? 'none' : '1px solid #222',
                      fontWeight: 700, fontSize: 12, transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ciudad detectada (readonly, sirve como confirmación) */}
          {ciudad && (
            <p style={{ color: '#555', fontSize: 12, margin: 0 }}>
              🏙 Ciudad detectada: <span style={{ color: '#888' }}>{ciudad}</span>
            </p>
          )}
        </div>
      )}

      {/* Hint si API key no está configurada */}
      {!apiReady && !PLACES_KEY && (
        <p style={{ color: '#555', fontSize: 11, margin: '5px 0 0' }}>
          Configura VITE_GOOGLE_PLACES_KEY para autocompletado inteligente
        </p>
      )}

      {/* Contenedor invisible requerido por PlacesService */}
      <div ref={mapDivRef} style={{ display: 'none' }} />
    </div>
  );
};

export default AddressInput;
