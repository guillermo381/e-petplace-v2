# e-PetPlace — App Principal (e-petplace-v2)

> Repo: https://github.com/guillermo381/e-petplace-v2
> Deploy: https://e-petplace-v2.vercel.app
> Última actualización: 2 Mayo 2026 — Bloque 1 completado
> Contexto maestro del ecosistema: ver CLAUDE.md maestro

---

## Qué pasó desde la última actualización

**Bloque 1 completado (2 Mayo 2026) — 5 tareas:**

1. `database.types.ts` regenerado con schema v2: 9 tablas nuevas + columnas nuevas en pedidos/citas/vacunas. Build pasa en local y Vercel.
2. Sentry instalado (`@sentry/react @sentry/vite-plugin`). `Sentry.init()` en `main.tsx` antes del `createRoot`, condicional a `VITE_SENTRY_DSN`. Falla silenciosa si no hay DSN.
3. PostHog instalado (`posthog-js`). `posthog.init()` en `main.tsx`, `autocapture: false`. 10 eventos instrumentados en Login, Store, Checkout, Vet y BioPet.
4. Hook `useCountry` creado en `src/lib/useCountry.ts`. Detecta país por GPS → perfil → 'EC'. Carga `country_config` vía `get_country_config()`. Integrado en `AppInner` de App.tsx.
5. Auditoría de seguridad: se encontraron y corrigieron dos políticas SELECT permisivas en `pedidos` y `citas` que exponían datos de invitados sin autenticación. Ver sección "Seguridad RLS" más abajo.

### Tablas en Supabase (schema v2 activo)

**Nuevas:**
```
wearable_devices      → collares inteligentes vinculados a mascotas
wearable_telemetry    → series de tiempo GPS + biometría
wearable_alerts       → alertas biométricas y de geofencing
wearable_zones        → zonas seguras del dueño
analytics_events      → eventos server-side para analytics y DaaS
analytics_aggregated  → resúmenes diarios anonimizados
daas_api_clients      → clientes B2B (solo admin)
country_config        → configuración por país (pasarela, moneda, servicios)
user_roles            → roles multi-portal por usuario y país
```

**Columnas nuevas en tablas existentes:**
```
pedidos:  kushki_token, kushki_charge_id, kushki_status, kushki_response,
          pagado_en, subtotal, descuento_monto, cupon_codigo,
          notas_admin, updated_at
citas:    country_code, tipo_servicio, resultado_servicio, diagnostico,
          tratamiento, proxima_cita_recomendada, archivos_resultado,
          resultado_completado_en, calificacion, calificacion_comentario,
          calificacion_en, prestador_id
vacunas:  country_code, lote, dosis, via_administracion,
          archivo_url, prestador_id, updated_at
consentimientos: version, metadata (tipo='daas' = consentimiento DaaS)
```

### Funciones Supabase disponibles
```sql
get_country_config(p_country_code)   → config completa del país (SECURITY DEFINER — bypasea RLS intencionalmente)
service_active_in(service, country)  → boolean, si el servicio está activo
log_analytics_event(...)             → registrar evento desde Edge Function
```

### Datos en country_config
```
EC (Ecuador):  is_active=true  — marketplace, vet, grooming, walking, adopción
CO (Colombia): is_active=false — pre-configurado, activar desde admin cuando corresponda
```

---

## Stack de este repo

- React + Vite + TypeScript (web app mobile-first)
- Ionic Framework (componentes mobile nativos)
- Capacitor (compilar a iOS y Android — pendiente)
- Supabase — misma instancia que admin portal
- React Router v6
- Sentry (`@sentry/react`) ← instalado Bloque 1
- PostHog (`posthog-js`) ← instalado Bloque 1
- Deploy: Vercel

### Migración pendiente a React Native (Bloque 4)
Este repo es la base web. En el Bloque 4 se migra a React Native + Expo
para iOS y Android. No hacer decisiones de arquitectura que compliquen esa migración.
Evitar: APIs de browser puras sin fallback, Web APIs que no existen en React Native.

---

## Variables de entorno (.env.local) — nunca al repo

```
VITE_SUPABASE_URL=https://zyltipqscdsdsxnjclhp.supabase.co
VITE_SUPABASE_ANON_KEY=[anon key — pública por diseño]
VITE_KUSHKI_PUBLIC_KEY=[obtener al activar cuenta Kushki]
VITE_POSTHOG_KEY=[obtener en posthog.com]
VITE_SENTRY_DSN=[obtener en sentry.io]
VITE_GOOGLE_PLACES_KEY=[Google Places API key]
```

Las mismas variables deben estar en Vercel → Settings → Environment Variables
marcadas para Production. Sin ellas el deploy conecta pero Supabase no responde.
IMPORTANTE: después de agregar variables en Vercel, siempre hacer Redeploy
con "Use existing Build Cache" DESACTIVADO.

La service role key NUNCA va en este repo — solo en Edge Functions.

---

## Lecciones aprendidas del admin portal

### Build — SIEMPRE usar npm run build, no tsc --noEmit

Al regenerar database.types.ts con el CLI de Supabase, usar SIEMPRE:
```bash
npx supabase gen types typescript \
  --project-id zyltipqscdsdsxnjclhp \
  --schema public 2>/dev/null > src/lib/database.types.ts
```

El `2>/dev/null` evita que el output del CLI se cuele en el archivo.
Verificar el build con `npm run build` (no solo `tsc --noEmit`) —
Vite/esbuild es más estricto que tsc y puede fallar donde tsc pasa.

---

## Seguridad RLS — Reglas no negociables

### ❌ NUNCA: `USING (user_id IS NULL)` en políticas SELECT

**El problema (encontrado en auditoría 2 Mayo 2026):**
El guest checkout tenía una política SELECT con `USING (user_id IS NULL)`.
Eso retorna TODAS las filas donde `user_id` es NULL — sin autenticación,
cualquier persona podía leer los 30 pedidos de invitados con emails reales,
items, totales y métodos de pago.

**La regla:**
- SELECT anon → `USING (false)` — nadie anónimo lee vía API REST directa
- INSERT anon → permitido para crear el registro
- UPDATE auth → `USING (user_id IS NULL AND guest_email = auth.email())`
  para que el usuario reclame su pedido al hacer login

**Para mostrarle su pedido a un invitado:**
Usar una Edge Function que valide `numero_orden + guest_email` juntos
con service role. **Nunca exponer vía API REST directa.**
→ Tarea pendiente: Edge Function `get-guest-order` (F1-06 en Plan Maestro)

**Fix aplicado (2 Mayo 2026):**
`fix_rls_pedidos_citas.sql` — políticas activas:
- pedidos: `pedidos_select_owner`, `pedidos_select_admin`, `pedidos_select_guest` (USING false)
- citas: `citas_select_owner`, `citas_select_admin`, `citas_select_anon` (USING false)

### Otras reglas RLS
- Nunca deshabilitar RLS para simplificar una query
- Nunca queries directas desde componentes — usar `lib/` o Edge Functions
- La service role key NUNCA en el cliente — solo en Edge Functions de Supabase

---

## Tablas de Supabase que usa este repo

### Tablas activas
```
profiles            → pet parent: nombre, avatar, country_code, pais_codigo
mascotas            → bio-expediente: especie, raza, peso, country_code, pet_hash
vacunas             → historial: nombre, fecha, próxima, lote, archivo_url
pedidos             → órdenes: estado, total, kushki_charge_id, cupon_codigo
citas               → servicios: estado, tipo_servicio, resultado_servicio
solicitudes_adopcion
mascotas_adopcion
productos           → catálogo del marketplace
consentimientos     → TyC, privacidad, cookies, daas
country_config      → config del país detectado por GPS
user_roles          → rol del usuario en este portal = 'pet_parent'
```

### Tablas disponibles para fases futuras
```
wearable_devices    → Fase 2 (cuando haya collar físico)
wearable_telemetry  → Fase 2
wearable_alerts     → Fase 2
analytics_events    → disponible — aún no instrumentado desde el cliente
```

---

## Estructura de archivos (estado actual)

```
src/
├── pages/
│   ├── Home.tsx              ← FUNCIONAL
│   ├── Store.tsx             ← FUNCIONAL (Tienda)
│   ├── Cart.tsx              ← FUNCIONAL (Carrito)
│   ├── Checkout.tsx          ← PARCIAL: falta integración Kushki (Bloque 2)
│   ├── MisPedidos.tsx        ← FUNCIONAL
│   ├── Profile.tsx           ← FUNCIONAL
│   ├── BioPet.tsx            ← FUNCIONAL (mascotas + bio-expediente + vacunas)
│   ├── Vet.tsx               ← FUNCIONAL
│   ├── Adopcion.tsx          ← FUNCIONAL
│   ├── Login.tsx             ← FUNCIONAL
│   ├── Onboarding.tsx        ← FUNCIONAL
│   ├── Welcome.tsx           ← FUNCIONAL
│   ├── ResetPassword.tsx     ← FUNCIONAL
│   ├── Ayuda.tsx             ← FUNCIONAL
│   └── legal/
│       ├── PrivacyPolicy.tsx
│       ├── TermsOfService.tsx
│       └── CookiesPolicy.tsx
├── components/
│   ├── FloatingCart.tsx
│   ├── HelpButton.tsx        ← PetBot chat flotante
│   ├── AddressInput.tsx      ← Google Places (bug pendiente)
│   ├── PhoneInput.tsx
│   ├── GuestHeader.tsx
│   ├── RegisterPrompt.tsx
│   └── legal/
│       ├── ConsentBanner.tsx
│       └── ConsentCheckbox.tsx
├── context/
│   ├── CartContext.tsx
│   ├── GuestContext.tsx
│   └── ThemeContext.tsx
├── lib/
│   ├── supabase.ts
│   ├── database.types.ts    ← regenerado con schema v2 (Bloque 1 ✅)
│   ├── useCountry.ts        ← hook multi-país (Bloque 1 ✅)
│   └── validaciones.ts
├── data/
│   ├── servicios.ts
│   └── paises.ts
└── main.tsx                 ← Sentry + PostHog init (Bloque 1 ✅)
```

---

## PostHog — eventos instrumentados

```tsx
// Login.tsx
posthog.capture('login_success',   { metodo: 'email' | 'google' })
posthog.capture('login_failed',    { motivo })
posthog.capture('user_registered', { metodo: 'email' | 'google' })

// Store.tsx
posthog.capture('product_viewed',  { producto_id, categoria })
posthog.capture('cart_added',      { producto_id, precio })

// Checkout.tsx
posthog.capture('checkout_started', { items, total })
posthog.capture('order_completed',  { pedido_id, total, metodo_pago })

// Vet.tsx
posthog.capture('service_booked',  { tipo_servicio })

// BioPet.tsx
posthog.capture('pet_added',       { especie })
posthog.capture('vacuna_added',    { mascota_id })
```

Sin PII en los eventos — solo IDs y categorías.

---

## useCountry — cómo se usa en componentes

```tsx
import { useCountry } from '../lib/useCountry';

// En cualquier componente con acceso a session:
const { countryCode, config, loading } = useCountry(session);

// Mostrar/ocultar secciones por país:
if (!config?.services_enabled?.telemedicine) return null;

// Formato de moneda:
`${config?.currency_symbol}${precio.toFixed(config?.currency_decimals ?? 2)}`
```

El hook ya está activo en `AppInner` (App.tsx) — carga automáticamente
al arrancar la app. Console.log en desarrollo: `[useCountry] country_code: EC config: {...}`.

---

## Sprint completado — Bloque 1: Fundamentos técnicos ✅

| Tarea | Estado | Commit |
|---|---|---|
| Regenerar database.types.ts | ✅ | 3f9e052 |
| Instalar Sentry | ✅ | d81ebbe |
| Instalar PostHog + 10 eventos | ✅ | 3590a1a |
| Hook useCountry | ✅ | 141f854 |
| Auditoría seguridad RLS | ✅ | (SQL fix en Supabase) |

---

## Siguiente sprint — Bloque 2: Kushki (bloqueador del Go-Live)

No arrancar hasta que el build en Vercel pase con las variables de entorno activas.

Flujo de seguridad — no negociable:
```
1. Cliente: Kushki SDK tokeniza tarjeta → retorna kushki_token
2. Cliente: POST a Edge Function con { kushki_token, pedido_id, monto }
3. Edge Function: llama Kushki API → obtiene kushki_charge_id
4. Kushki: envía webhook de confirmación al webhook handler
5. Edge Function webhook: UPDATE pedidos SET
     kushki_status='approved',
     kushki_charge_id='...',
     pagado_en=NOW(),
     estado='pagado'
6. Cliente: escucha cambio vía Supabase Realtime → muestra confirmación
```

Campos en tabla `pedidos` ya listos: `kushki_token, kushki_charge_id, kushki_status, kushki_response, pagado_en`

NUNCA almacenar datos de tarjeta. Solo el token de Kushki.
NUNCA llamar la API de Kushki directamente desde el cliente.

**Pendiente relacionado con guest checkout:**
Edge Function `get-guest-order` — valida `numero_orden + guest_email` server-side
y retorna los datos del pedido con service role. Tarea F1-06 en Plan Maestro.
Construir junto con la integración Kushki.

---

## Fase 1 — Post Go-Live (después del Bloque 2)

En este orden:
1. Historia clínica en BioPet (campos ya en tabla citas: resultado_servicio, diagnostico, tratamiento)
2. Recomendaciones IA — Claude API con contexto del Bio-Expediente
3. Cross-sell IA en checkout
4. Chat Pet Expert IA en contexto de mascota específica (desde BioPetDetail)
5. Cupones y descuentos (campo cupon_codigo ya en pedidos)
6. Rating de servicios (campos calificacion ya en citas)
7. Carnet QR — compartible, descargable, escaneable por vets
8. Edge Function `get-guest-order` (F1-06)

---

## Bugs activos pendientes

```
[ ] Google Places AddressInput: validar en producción
[ ] Onboarding welcome modal: posible color hardcodeado en fondo
[ ] Carnet PNG (html2canvas): verificar render correcto en todos los dispositivos
[ ] Modo claro: BioPet.tsx — revisar colores en detalle de mascota
```

---

## Identidad visual

```
Fondo:         #0a0a0a
Cards:         #111111
Hover:         #1a1a1a
Border:        #222222
Cyan (acción): #00E5FF
Pink (alerta): #FF2D9B
Green (éxito): #00F5A0
Yellow (warn): #FFE600
Purple:        #A855F7
Orange:        #FF6B35
Gradiente:     #FF2D9B → #00E5FF
```

---

## Convenciones — no negociables

- Todo en español: UI, comentarios, variables de dominio
- Cada componente: loading state + error state + empty state
- No usar `any` en TypeScript — usar tipos de database.types.ts
- No queries directas desde componentes — usar hooks o funciones en lib/
- Imágenes con lazy loading
- No deshabilitar RLS para simplificar queries
- Verificar siempre con `npm run build`, no solo `tsc --noEmit`

---

## Plantilla de tarea para Claude Code

```
Contexto: App principal e-PetPlace (e-petplace-v2). React + Vite + TypeScript + Supabase.
Bloque 1 completado. Schema v2 activo. Sentry + PostHog instalados. Hook useCountry activo.
[estado actual del módulo a tocar]

Tarea: [una sola cosa, máximo un "y"]

Criterio de éxito: [cómo verifico — preferir "npm run build pasa" sobre "tsc --noEmit"]

Restricciones:
- No tocar RLS sin revisar primero (ver sección Seguridad RLS)
- No exponer service role key en el cliente
- Español, loading/error states, tipos de database.types.ts
- No proponer alternativas al stack definido
- Verificar con npm run build, no solo tsc --noEmit
```
