import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import type { Database, Json } from './database.types';
import { supabase } from './supabase';

/* ── Tipos públicos ──────────────────────────────────────────── */

type CountryConfigRow = Database['public']['Tables']['country_config']['Row'];
type RpcRow           = Database['public']['Functions']['get_country_config']['Returns'][number];

export interface ServicesEnabled {
  marketplace?:  boolean;
  vet?:          boolean;
  grooming?:     boolean;
  walking?:      boolean;
  adoption?:     boolean;
  telemedicine?: boolean;
  wearables?:    boolean;
  insurance?:    boolean;
  [key: string]: boolean | undefined;
}

export type CountryConfig = Omit<CountryConfigRow, 'services_enabled'> & {
  services_enabled: ServicesEnabled;
};

export interface UseCountryResult {
  countryCode: string;
  config:      CountryConfig | null;
  loading:     boolean;
  error:       string | null;
}

/* ── Constantes ──────────────────────────────────────────────── */

const DEFAULT_CODE = 'EC';

/* ── Helpers internos ────────────────────────────────────────── */

function toServicesEnabled(raw: Json): ServicesEnabled {
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return raw as unknown as ServicesEnabled;
  }
  return {};
}

function rowToConfig(row: RpcRow): CountryConfig {
  return { ...row, services_enabled: toServicesEnabled(row.services_enabled) };
}

async function detectCountryCode(session: Session | null): Promise<string> {
  // 1. Geolocation API + reverse geocode (bigdatacloud.net, sin API key)
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    try {
      const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { timeout: 5000 },
        );
      });
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`,
      );
      if (res.ok) {
        const geo = (await res.json()) as { countryCode?: string };
        if (geo.countryCode) return geo.countryCode;
      }
    } catch {
      // Permiso denegado o timeout — caer al siguiente nivel
    }
  }

  // 2. pais_codigo del perfil (usuarios autenticados)
  if (session) {
    const { data } = await supabase
      .from('profiles')
      .select('pais_codigo')
      .eq('id', session.user.id)
      .single();
    if (data?.pais_codigo) return data.pais_codigo;
  }

  // 3. Default
  return DEFAULT_CODE;
}

/* ── Hook ────────────────────────────────────────────────────── */

export function useCountry(session: Session | null): UseCountryResult {
  const [countryCode, setCountryCode] = useState(DEFAULT_CODE);
  const [config,      setConfig]      = useState<CountryConfig | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error]                       = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // — Detectar país —
      let code = DEFAULT_CODE;
      try {
        code = await detectCountryCode(session);
      } catch {
        // silent
      }
      if (cancelled) return;

      // — Cargar configuración —
      let resolved: CountryConfig | null = null;
      try {
        const { data } = await supabase.rpc('get_country_config', { p_country_code: code });
        if (data && data.length > 0) resolved = rowToConfig(data[0]);
      } catch {
        // silent
      }

      // — Fallback a EC si el país detectado no tiene config —
      if (!resolved && code !== DEFAULT_CODE) {
        try {
          const { data } = await supabase.rpc('get_country_config', { p_country_code: DEFAULT_CODE });
          if (data && data.length > 0) resolved = rowToConfig(data[0]);
        } catch {
          // silent
        }
      }

      if (!cancelled) {
        setCountryCode(code);
        setConfig(resolved);
        setLoading(false);
        console.log('[useCountry] country_code:', code, 'config:', resolved);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { countryCode, config, loading, error };
}
