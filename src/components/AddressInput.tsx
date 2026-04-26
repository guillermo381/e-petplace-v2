import React, { useState, useEffect, useRef } from 'react';

export interface AddressValue {
  completa:     string;
  linea1?:      string;
  sector?:      string;
  apto:         string;
  referencias:  string;
  ciudad:       string;
  pais:         string;
  codigoPostal: string;
  guardadaComo: 'casa' | 'trabajo' | 'otro';
}

interface Props {
  value?:       Partial<AddressValue>;
  onChange:     (v: AddressValue) => void;
  fieldError?:  string;
  clearError?:  () => void;
  compact?:     boolean;
}

/* ── Singleton loader ────────────────────────────────────────── */
declare global {
  interface Window {
    google:               any;
    _gMapsLoading?:       boolean;
    _gMapsLoaded?:        boolean;
    _gMapsLoadCallbacks?: Array<() => void>;
  }
}

function loadGooglePlaces(): Promise<void> {
  if (window._gMapsLoaded && window.google?.maps?.places) return Promise.resolve();
  if (typeof window.google !== 'undefined' && window.google?.maps?.places) {
    window._gMapsLoaded = true;
    return Promise.resolve();
  }
  if (window._gMapsLoading) {
    return new Promise(resolve => {
      window._gMapsLoadCallbacks = window._gMapsLoadCallbacks ?? [];
      window._gMapsLoadCallbacks.push(resolve);
    });
  }
  const key = import.meta.env.VITE_GOOGLE_PLACES_KEY as string | undefined;
  if (!key) return Promise.reject(new Error('VITE_GOOGLE_PLACES_KEY no configurada'));
  window._gMapsLoading = true;
  return new Promise((resolve, reject) => {
    const s   = document.createElement('script');
    s.src     = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async&language=es`;
    s.async   = true;
    s.defer   = true;
    s.onload  = () => {
      window._gMapsLoaded  = true;
      window._gMapsLoading = false;
      window._gMapsLoadCallbacks?.forEach(cb => cb());
      window._gMapsLoadCallbacks = [];
      resolve();
    };
    s.onerror = (e) => {
      window._gMapsLoading = false;
      reject(new Error(`Error al cargar Google Maps: ${String(e)}`));
    };
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

const MIN_REFS = 10;

/* ════════════════════════════════════════════════════════════════
   Fallback — input manual cuando Google Places no está disponible
════════════════════════════════════════════════════════════════ */
const FallbackInput: React.FC<{
  value: Partial<AddressValue>;
  onChange: (v: AddressValue) => void;
  fieldError?: string;
  compact?: boolean;
  motivo?: string;
}> = ({ value, onChange, fieldError, compact, motivo }) => {
  const [completa,     setCompleta]     = useState(value.completa     ?? '');
  const [apto,         setApto]         = useState(value.apto         ?? '');
  const [referencias,  setReferencias]  = useState(value.referencias  ?? '');
  const [guardadaComo, setGuardadaComo] = useState<'casa'|'trabajo'|'otro'>(value.guardadaComo ?? 'casa');

  const emit = (o: Partial<AddressValue> = {}) =>
    onChange({ completa, apto, referencias, ciudad: '', pais: '', codigoPostal: '', guardadaComo, ...o });

  return (
    <div>
      <input
        type="text"
        value={completa}
        onChange={e => { setCompleta(e.target.value); emit({ completa: e.target.value }); }}
        placeholder="Ingresa tu dirección completa"
        style={{ ...iStyle, borderColor: fieldError ? '#FF2D9B' : '#2a2a2a' }}
      />
      {fieldError && (
        <p style={{ color: '#FF2D9B', fontSize: 13, margin: '5px 0 0', fontWeight: 500 }}>{fieldError}</p>
      )}
      <p style={{ color: '#555', fontSize: 11, margin: '5px 0 8px' }}>
        {motivo ?? 'Búsqueda automática no disponible.'} Ingresa tu dirección manualmente.
      </p>

      {completa && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            value={apto}
            onChange={e => { setApto(e.target.value); emit({ apto: e.target.value }); }}
            placeholder="Apto / piso / interior (opcional)"
            style={iStyle}
          />
          <div>
            <textarea
              value={referencias}
              onChange={e => { setReferencias(e.target.value); emit({ referencias: e.target.value }); }}
              placeholder="Referencias: ej. frente al parque, casa azul con reja…"
              rows={2}
              style={{
                ...iStyle, resize: 'none',
                borderColor: referencias.length > 0 && referencias.length < MIN_REFS ? '#FF2D9B' : '#2a2a2a',
              }}
            />
            {referencias.length > 0 && referencias.length < MIN_REFS && (
              <p style={{ color: '#FF2D9B', fontSize: 11, margin: '3px 0 0' }}>
                Agrega al menos {MIN_REFS} caracteres ({referencias.length}/{MIN_REFS})
              </p>
            )}
          </div>
          {!compact && (
            <div>
              <p style={{ color: '#666', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 7px' }}>
                Guardar como
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {GUARDADA_OPTS.map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => { setGuardadaComo(opt.val); emit({ guardadaComo: opt.val }); }}
                    style={{
                      flex: 1, padding: '9px 4px', borderRadius: 10, cursor: 'pointer',
                      background: guardadaComo === opt.val ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)' : '#111',
                      color:      guardadaComo === opt.val ? '#000' : '#555',
                      border:     guardadaComo === opt.val ? 'none' : '1px solid #222',
                      fontWeight: 700, fontSize: 12, transition: 'all 0.15s',
                    }}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   Componente principal
════════════════════════════════════════════════════════════════ */
const AddressInput: React.FC<Props> = ({ value, onChange, fieldError, clearError, compact }) => {
  const [mapsLoaded,   setMapsLoaded]   = useState(false);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [selected,     setSelected]     = useState(!!value?.completa);
  const [apto,         setApto]         = useState(value?.apto         ?? '');
  const [referencias,  setReferencias]  = useState(value?.referencias  ?? '');
  const [guardadaComo, setGuardadaComo] = useState<'casa' | 'trabajo' | 'otro'>(value?.guardadaComo ?? 'casa');
  const [ciudad,       setCiudad]       = useState(value?.ciudad       ?? '');
  const [pais,         setPais]         = useState(value?.pais         ?? '');
  const [codigoPostal, setCodigoPostal] = useState(value?.codigoPostal ?? '');
  const [displayAddr,  setDisplayAddr]  = useState(value?.completa     ?? '');

  const inputContainerRef  = useRef<HTMLDivElement>(null);
  const placeAutocompleteRef = useRef<any>(null);

  // Refs para leer valores actuales desde dentro del listener async
  const aptoRef         = useRef(apto);
  const referenciasRef  = useRef(referencias);
  const guardadaComoRef = useRef(guardadaComo);
  useEffect(() => { aptoRef.current = apto; },              [apto]);
  useEffect(() => { referenciasRef.current = referencias; }, [referencias]);
  useEffect(() => { guardadaComoRef.current = guardadaComo; }, [guardadaComo]);

  // Capturar errores de red del script (clave inválida → HTTP 400/403)
  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      if (e.filename?.includes('maps.googleapis.com')) setLoadError('Error al cargar Google Maps');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Cargar SDK
  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_PLACES_KEY) { setLoadError('sin-key'); return; }
    loadGooglePlaces()
      .then(() => setMapsLoaded(true))
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : String(err)));
  }, []);

  // Montar PlaceAutocompleteElement una sola vez
  useEffect(() => {
    if (!mapsLoaded || !inputContainerRef.current || placeAutocompleteRef.current) return;

    if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
      setLoadError('Google Maps Places (v3) no disponible');
      return;
    }

    try {
      const pa = new window.google.maps.places.PlaceAutocompleteElement({
        componentRestrictions: { country: ['ec', 'co', 'pe', 'mx', 'ar', 'cl'] },
        types: ['address'],
      });

      // Estilos mínimos para que ocupe el ancho del contenedor
      Object.assign(pa.style, { width: '100%', display: 'block' });

      inputContainerRef.current.appendChild(pa);
      placeAutocompleteRef.current = pa;

      pa.addEventListener('gmp-placeselect', async (event: any) => {
        try {
          const { place } = event;
          await place.fetchFields({
            fields: ['displayName', 'formattedAddress', 'addressComponents'],
          });

          const components = place.addressComponents ?? [];
          const get = (type: string): string =>
            components.find((c: any) => c.types.includes(type))?.longText ?? '';

          const linea1   = `${get('route')} ${get('street_number')}`.trim();
          const sector   = get('sublocality') || get('neighborhood');
          const ciudad   = get('locality');
          const paisStr  = get('country');
          const postal   = get('postal_code');
          const completa = place.formattedAddress ?? '';

          setSelected(true);
          setDisplayAddr(completa);
          setCiudad(ciudad);
          setPais(paisStr);
          setCodigoPostal(postal);
          clearError?.();

          onChange({
            completa,
            linea1,
            sector,
            apto:         aptoRef.current,
            referencias:  referenciasRef.current,
            ciudad,
            pais:         paisStr,
            codigoPostal: postal,
            guardadaComo: guardadaComoRef.current,
          });
        } catch (err) {
          console.error('AddressInput gmp-placeselect error:', err);
          setLoadError('Error al procesar la dirección seleccionada');
        }
      });
    } catch (err) {
      console.error('AddressInput PlaceAutocompleteElement init error:', err);
      setLoadError('No se pudo inicializar el autocompletado');
    }

    return () => {
      if (placeAutocompleteRef.current && inputContainerRef.current) {
        try { inputContainerRef.current.removeChild(placeAutocompleteRef.current); } catch { /* ignorar */ }
        placeAutocompleteRef.current = null;
      }
    };
  }, [mapsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildCurrent = (): AddressValue => ({
    completa: displayAddr, apto, referencias, ciudad, pais, codigoPostal, guardadaComo,
  });

  // ── Fallback ────────────────────────────────────────────────
  if (loadError) {
    return (
      <FallbackInput
        value={value ?? {}}
        onChange={onChange}
        fieldError={fieldError}
        compact={compact}
        motivo={loadError === 'sin-key' ? 'API key de Google Maps no configurada.' : undefined}
      />
    );
  }

  // ── Cargando ────────────────────────────────────────────────
  if (!mapsLoaded) {
    return (
      <input
        type="text"
        disabled
        placeholder="Cargando autocompletado…"
        style={{ ...iStyle, opacity: 0.5, cursor: 'not-allowed' }}
      />
    );
  }

  // ── Widget normal ───────────────────────────────────────────
  return (
    <div>
      {/* Contenedor donde Google inyecta el PlaceAutocompleteElement */}
      <div
        ref={inputContainerRef}
        style={{
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${fieldError ? '#FF2D9B' : selected ? '#00F5A0' : '#2a2a2a'}`,
          // CSS custom properties del nuevo Places UI Kit para dark mode
          ['--gmpx-color-surface' as string]:          '#111',
          ['--gmpx-color-on-surface' as string]:       '#fff',
          ['--gmpx-color-on-surface-variant' as string]: '#888',
          ['--gmpx-color-primary' as string]:          '#00E5FF',
          ['--gmpx-font-size-base' as string]:         '14px',
          ['--gmpx-color-outline' as string]:          'transparent',
        }}
      />

      {fieldError && (
        <p style={{ color: '#FF2D9B', fontSize: 13, margin: '5px 0 0', fontWeight: 500 }}>{fieldError}</p>
      )}

      {selected && displayAddr && (
        <p style={{ color: '#00F5A0', fontSize: 12, margin: '5px 0 0' }}>
          ✓ {displayAddr}
        </p>
      )}

      {selected && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            value={apto}
            onChange={e => { setApto(e.target.value); onChange({ ...buildCurrent(), apto: e.target.value }); }}
            placeholder="Apto / piso / interior (opcional)"
            style={iStyle}
          />

          <div>
            <textarea
              value={referencias}
              onChange={e => { setReferencias(e.target.value); onChange({ ...buildCurrent(), referencias: e.target.value }); }}
              placeholder="Referencias: ej. frente al parque, casa azul con reja…"
              rows={2}
              style={{
                ...iStyle, resize: 'none',
                borderColor: referencias.length > 0 && referencias.length < MIN_REFS ? '#FF2D9B' : '#2a2a2a',
              }}
            />
            {referencias.length > 0 && referencias.length < MIN_REFS && (
              <p style={{ color: '#FF2D9B', fontSize: 11, margin: '3px 0 0' }}>
                Agrega al menos {MIN_REFS} caracteres para facilitar la entrega ({referencias.length}/{MIN_REFS})
              </p>
            )}
          </div>

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
                    onClick={() => { setGuardadaComo(opt.val); onChange({ ...buildCurrent(), guardadaComo: opt.val }); }}
                    style={{
                      flex: 1, padding: '9px 4px', borderRadius: 10, cursor: 'pointer',
                      background: guardadaComo === opt.val ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)' : '#111',
                      color:      guardadaComo === opt.val ? '#000' : '#555',
                      border:     guardadaComo === opt.val ? 'none' : '1px solid #222',
                      fontWeight: 700, fontSize: 12, transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {ciudad && (
            <p style={{ color: '#555', fontSize: 12, margin: 0 }}>
              🏙 Ciudad detectada: <span style={{ color: '#888' }}>{ciudad}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
