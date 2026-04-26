/*
-- SQL para múltiples direcciones (activar cuando el usuario agregue la segunda):
-- CREATE TABLE IF NOT EXISTS direcciones (
--   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id uuid REFERENCES auth.users(id),
--   alias text DEFAULT 'casa',
--   linea1 text, referencias text, ciudad text, pais text, completa text,
--   es_principal boolean DEFAULT false,
--   created_at timestamptz DEFAULT now()
-- );
-- ALTER TABLE direcciones ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "users_own_direcciones" ON direcciones
--   USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
*/

import { useEffect, useRef, useState } from 'react';

/* ── Tipos ───────────────────────────────────────────────────── */
export interface AddressValue {
  completa:     string;
  linea1:       string;
  sector:       string;
  apto:         string;
  referencias:  string;
  ciudad:       string;
  pais:         string;
  codigoPostal: string;
  guardadoComo: string;
}

interface Props {
  value?:       Partial<AddressValue>;
  onChange:     (v: AddressValue) => void;
  fieldError?:  string;
  clearError?:  () => void;
  compact?:     boolean;
}

/* ── Alias helpers (usados en Profile.tsx) ───────────────────── */
const ALIAS_OPTS = [
  { val: 'casa',    icon: '🏠', label: 'Casa'    },
  { val: 'trabajo', icon: '🏢', label: 'Trabajo' },
  { val: 'familia', icon: '👨‍👩‍👧', label: 'Familia' },
  { val: 'otro',    icon: '📍', label: 'Otro'    },
];
export const getAliasIcon  = (v?: string) => ALIAS_OPTS.find(o => o.val === v)?.icon  ?? '📍';
export const getAliasLabel = (v?: string) => ALIAS_OPTS.find(o => o.val === v)?.label ?? (v || 'Otro');

/* ── Google Maps (global) ────────────────────────────────────── */
declare global { interface Window { google: any } }

/* ════════════════════════════════════════════════════════════════
   AddressInput
════════════════════════════════════════════════════════════════ */
const AddressInput = ({ value, onChange, fieldError, clearError, compact = false }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapsLoaded,       setMapsLoaded]       = useState(false);
  const [mapsError,        setMapsError]        = useState(false);
  const [selectedAddress,  setSelectedAddress]  = useState(value?.completa   || '');
  const [apto,             setApto]             = useState(value?.apto        || '');
  const [referencias,      setReferencias]      = useState(value?.referencias || '');
  const [guardadoComo,     setGuardadoComo]     = useState(value?.guardadoComo || 'casa');
  const [errorRefs,        setErrorRefs]        = useState('');

  // Ref para componer el onChange cuando cambian campos secundarios
  // sin perder los datos de la dirección principal
  const addressPartsRef = useRef<Omit<AddressValue, 'apto' | 'referencias' | 'guardadoComo'>>({
    completa: value?.completa || '', linea1: value?.linea1 || '',
    sector: value?.sector || '', ciudad: value?.ciudad || '',
    pais: value?.pais || '', codigoPostal: value?.codigoPostal || '',
  });

  /* ── Cargar Google Maps ─────────────────────────────────────── */
  useEffect(() => {
    const loadMaps = async () => {
      if (window.google?.maps?.places?.PlaceAutocompleteElement) {
        setMapsLoaded(true);
        return;
      }

      const existing = document.querySelector<HTMLScriptElement>('#gmaps-script');
      if (existing) {
        existing.addEventListener('load',  () => setMapsLoaded(true));
        existing.addEventListener('error', () => setMapsError(true));
        return;
      }

      const key = import.meta.env.VITE_GOOGLE_PLACES_KEY as string | undefined;
      if (!key) { setMapsError(true); return; }

      const script  = document.createElement('script');
      script.id     = 'gmaps-script';
      script.src    = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&v=weekly&loading=async&language=es`;
      script.async  = true;
      script.defer  = true;
      script.onload = () => setMapsLoaded(true);
      script.onerror = () => setMapsError(true);
      document.head.appendChild(script);
    };

    loadMaps();
  }, []);

  /* ── Inyectar CSS dark mode (una sola vez) ──────────────────── */
  useEffect(() => {
    if (document.querySelector('#gmp-styles')) return;
    const style = document.createElement('style');
    style.id = 'gmp-styles';
    style.textContent = `
      gmp-placeautocomplete {
        --gmp-input-background-color: #111111;
        --gmp-input-border-color: #333333;
        --gmp-input-color: #ffffff;
        --gmp-input-font-size: 14px;
        --gmp-input-padding: 12px;
        --gmp-input-border-radius: 10px;
      }
      .pac-container {
        background: #111111 !important;
        border: 1px solid #333 !important;
        border-radius: 8px !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.7) !important;
        margin-top: 4px !important;
      }
      .pac-item {
        background: #111111 !important;
        color: #fff !important;
        padding: 10px 12px !important;
        border-top: 1px solid #222 !important;
        cursor: pointer !important;
        font-size: 13px !important;
      }
      .pac-item:hover    { background: #1a1a1a !important; }
      .pac-item-query    { color: #00E5FF !important; }
      .pac-matched       { color: #FF2D9B !important; font-weight: 700 !important; }
      .pac-icon          { display: none !important; }
    `;
    document.head.appendChild(style);
  }, []);

  /* ── Montar PlaceAutocompleteElement ────────────────────────── */
  useEffect(() => {
    if (!mapsLoaded || !containerRef.current) return;
    if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
      setMapsError(true);
      return;
    }

    // Evitar duplicados
    const existing = containerRef.current.querySelector('gmp-placeautocomplete');
    if (existing) existing.remove();

    let pa: any;
    try {
      pa = new window.google.maps.places.PlaceAutocompleteElement({
        componentRestrictions: { country: ['ec', 'co', 'pe', 'mx', 'ar', 'cl'] },
      });
      pa.style.width   = '100%';
      pa.style.display = 'block';
      containerRef.current.appendChild(pa);

      pa.addEventListener('gmp-placeselect', async (event: any) => {
        try {
          const { place } = event;
          await place.fetchFields({
            fields: ['displayName', 'formattedAddress', 'addressComponents'],
          });

          const comps = place.addressComponents || [];
          const get   = (type: string) =>
            comps.find((c: any) => c.types.includes(type))?.longText || '';

          const parts = {
            completa:     place.formattedAddress || '',
            linea1:       `${get('route')} ${get('street_number')}`.trim(),
            sector:       get('sublocality') || get('neighborhood') || '',
            ciudad:       get('locality') || '',
            pais:         get('country') || '',
            codigoPostal: get('postal_code') || '',
          };

          addressPartsRef.current = parts;
          setSelectedAddress(parts.completa);
          clearError?.();

          onChange({
            ...parts,
            apto:        apto,
            referencias: referencias,
            guardadoComo: guardadoComo,
          });
        } catch (e) {
          console.error('Error gmp-placeselect:', e);
        }
      });
    } catch (e) {
      console.error('Error PlaceAutocompleteElement:', e);
      setMapsError(true);
    }

    return () => {
      try { pa?.remove(); } catch { /* ignorar */ }
    };
  }, [mapsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Propagar cambios de campos secundarios ─────────────────── */
  useEffect(() => {
    if (!selectedAddress) return;
    onChange({
      ...addressPartsRef.current,
      apto,
      referencias,
      guardadoComo,
    });
  }, [apto, referencias, guardadoComo]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Fallback si Maps no cargó ──────────────────────────────── */
  if (mapsError) {
    return (
      <FallbackManual
        value={value} onChange={onChange}
        fieldError={fieldError} compact={compact}
      />
    );
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      <p style={{ margin:0, fontSize:13, color:'var(--text-secondary)' }}>
        📍 Busca tu dirección
      </p>

      {/* Contenedor de PlaceAutocompleteElement */}
      <div ref={containerRef} style={{ width:'100%' }}>
        {!mapsLoaded && (
          <input
            placeholder="Cargando buscador…"
            disabled
            style={{
              width:'100%', padding:'12px', background:'#111',
              border:'1px solid #333', borderRadius:10,
              color:'#888', fontSize:14, boxSizing:'border-box',
            }}
          />
        )}
      </div>

      {fieldError && (
        <p style={{ color:'#FF2D9B', fontSize:12, margin:'-4px 0 0', fontWeight:500 }}>{fieldError}</p>
      )}

      {/* Dirección seleccionada (confirmación) */}
      {selectedAddress && (
        <p style={{ color:'#00F5A0', fontSize:12, margin:'-4px 0 0' }}>✓ {selectedAddress}</p>
      )}

      {/* Campos adicionales */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

        {/* Apto / Interior */}
        <div>
          <input
            placeholder="Apto, Casa, Oficina (opcional)"
            value={apto}
            onChange={e => setApto(e.target.value)}
            style={{
              width:'100%', padding:'12px', boxSizing:'border-box',
              background:'var(--bg-card)', border:'1px solid #333', borderRadius:10,
              color:'var(--text-primary)', fontSize:14, outline:'none',
            }}
          />
          <p style={{ margin:'4px 0 0', fontSize:11, color:'#888' }}>
            Ej: Apto 301, Casa 2, Oficina B
          </p>
        </div>

        {/* Referencias */}
        <div>
          <textarea
            placeholder="Referencias para el repartidor…"
            value={referencias}
            onChange={e => {
              setReferencias(e.target.value);
              if (e.target.value.length >= 10) setErrorRefs('');
            }}
            onBlur={() => {
              if (referencias.length > 0 && referencias.length < 10)
                setErrorRefs('Agrega al menos 10 caracteres para facilitar la entrega');
            }}
            rows={3}
            style={{
              width:'100%', padding:'12px', boxSizing:'border-box',
              background:'var(--bg-card)',
              border:`1px solid ${errorRefs ? '#FF2D9B' : '#333'}`,
              borderRadius:10, color:'var(--text-primary)',
              fontSize:14, resize:'none', outline:'none',
            }}
          />
          {errorRefs && (
            <p style={{ margin:'4px 0 0', fontSize:11, color:'#FF2D9B' }}>⚠️ {errorRefs}</p>
          )}
          <p style={{ margin:'4px 0 0', fontSize:11, color:'#888' }}>
            ⚡ Ej: Casa azul con reja negra, frente al parque, timbre no funciona
          </p>
        </div>

        {/* Alias */}
        {!compact && (
          <div>
            <p style={{ margin:'0 0 8px', fontSize:12, color:'var(--text-secondary)' }}>
              Guardar como:
            </p>
            <div style={{ display:'flex', gap:8 }}>
              {ALIAS_OPTS.map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setGuardadoComo(opt.val)}
                  style={{
                    flex:1, padding:'8px 4px', borderRadius:8, cursor:'pointer',
                    border:`1px solid ${guardadoComo === opt.val ? '#00E5FF' : '#333'}`,
                    background: guardadoComo === opt.val ? '#0d1a2b' : 'var(--bg-card)',
                    color: guardadoComo === opt.val ? '#00E5FF' : '#888',
                    fontSize:11, fontWeight:600,
                  }}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   Fallback — input manual cuando Google Maps no está disponible
════════════════════════════════════════════════════════════════ */
const FallbackManual = ({
  value, onChange, fieldError, compact,
}: {
  value?: Partial<AddressValue>; onChange: (v: AddressValue) => void;
  fieldError?: string; compact?: boolean;
}) => {
  const [completa,    setCompleta]    = useState(value?.completa    || '');
  const [apto,        setApto]        = useState(value?.apto        || '');
  const [referencias, setReferencias] = useState(value?.referencias || '');
  const [guardadoComo, setGuardadoComo] = useState(value?.guardadoComo || 'casa');

  const emit = (o: Partial<AddressValue> = {}) =>
    onChange({ completa, linea1:'', sector:'', apto, referencias, ciudad:'', pais:'', codigoPostal:'', guardadoComo, ...o });

  const s: React.CSSProperties = {
    width:'100%', boxSizing:'border-box', padding:'12px',
    background:'var(--bg-card)', border:'1px solid #333', borderRadius:10,
    color:'var(--text-primary)', fontSize:14, outline:'none',
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <input type="text" value={completa}
        onChange={e => { setCompleta(e.target.value); emit({ completa: e.target.value }); }}
        placeholder="Ingresa tu dirección completa"
        style={{ ...s, borderColor: fieldError ? '#FF2D9B' : '#333' }}
      />
      {fieldError && <p style={{ color:'#FF2D9B', fontSize:12, margin:'-4px 0 0' }}>{fieldError}</p>}
      <p style={{ fontSize:11, color:'#555', margin:'-4px 0 0' }}>
        Búsqueda automática no disponible. Ingresa tu dirección manualmente.
      </p>
      {completa && (
        <>
          <input type="text" value={apto}
            onChange={e => { setApto(e.target.value); emit({ apto: e.target.value }); }}
            placeholder="Apto, Casa, Oficina (opcional)" style={s}
          />
          <textarea value={referencias} rows={3}
            onChange={e => { setReferencias(e.target.value); emit({ referencias: e.target.value }); }}
            placeholder="Referencias para el repartidor…"
            style={{ ...s, resize:'none' }}
          />
          {!compact && (
            <div style={{ display:'flex', gap:8 }}>
              {ALIAS_OPTS.map(opt => (
                <button key={opt.val} type="button" onClick={() => { setGuardadoComo(opt.val); emit({ guardadoComo: opt.val }); }}
                  style={{
                    flex:1, padding:'8px 4px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:600,
                    border:`1px solid ${guardadoComo === opt.val ? '#00E5FF' : '#333'}`,
                    background: guardadoComo === opt.val ? '#0d1a2b' : 'var(--bg-card)',
                    color: guardadoComo === opt.val ? '#00E5FF' : '#888',
                  }}
                >{opt.icon} {opt.label}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AddressInput;
