# CONTEXT.md — e-PetPlace
> Fuente de verdad para retomar el desarrollo. Actualizado: 26 de abril de 2026.

---

## 1. Descripción del Proyecto

**e-PetPlace** es una aplicación móvil (PWA + Capacitor) dirigida a dueños de mascotas en Ecuador. Es un ecosistema completo que centraliza todo lo que una persona necesita para cuidar a su mascota:

- **Tienda online** de productos (alimento, accesorios, salud, higiene, juguetes)
- **Citas veterinarias** — el usuario agenda, elige veterinario/hora, paga en el mismo flujo
- **BioPet** — historia clínica digital de cada mascota (vacunas, peso, fotos)
- **Adopción** — listing de mascotas en adopción, formulario de solicitud
- **Mis Pedidos** — historial de pedidos con seguimiento en tiempo real
- **Perfil** — gestión de cuenta, mascotas, configuración de tema

**Problema que resuelve:** en Ecuador los dueños de mascotas usan múltiples aplicaciones o llaman por teléfono para agendar citas, comprar productos o encontrar animales en adopción. e-PetPlace unifica todo en un flujo mobile-first con checkout guest (sin cuenta obligatoria).

**Modelo de negocio:**
- Margen en productos de la tienda
- Comisión por citas veterinarias agendadas
- Futuro: guardería, grooming, paseos, seguros, wearables (en la app pero marcados "Próximamente")

---

## 2. Stack Tecnológico

### Frontend
| Tecnología | Versión | Rol |
|---|---|---|
| React | 19.0.0 | UI framework |
| TypeScript | ~5.9.0 | Tipado estático |
| Ionic React | ^8.5.0 | Componentes UI mobile (IonPage, IonContent, IonModal, IonTabs, etc.) |
| Ionic React Router | ^8.5.0 | Navegación con tabs |
| React Router DOM | ^5.3.4 | Router (v5, NO v6 — importante) |
| Vite | ^5.0.0 | Build tool + dev server |
| Tailwind CSS | ^3.4.19 | Utility classes (usado parcialmente junto a inline styles) |
| Capacitor | 8.x | Compilación nativa iOS/Android (configurado, no activamente usado) |

### Backend / Servicios
| Servicio | Uso |
|---|---|
| **Supabase** | Auth + Base de datos PostgreSQL + Storage + Realtime |
| **Vercel** | Deploy y hosting de la PWA |

### Supabase
- **URL del proyecto:** `https://zyltipqscdsdsxnjclhp.supabase.co`
- Auth: email/password + Google OAuth
- RLS (Row Level Security) habilitado en todas las tablas
- Realtime: subscripciones en MisPedidos.tsx para actualización de estado de pedidos

---

## 3. Arquitectura del Proyecto

```
e-petplace/
├── src/
│   ├── App.tsx                    # Raíz: providers, router, rutas, tabs
│   ├── main.tsx                   # Entrada de React
│   ├── index.css                  # Variables CSS tema dark/light + estilos globales
│   ├── theme/variables.css        # Variables de tema Ionic (heredado del scaffold)
│   │
│   ├── assets/
│   │   ├── logo.png               # Logo activo (PNG, reemplazó a logo.jpg)
│   │   └── logo.jpg               # Logo antiguo (no borrar, no se usa en código)
│   │
│   ├── lib/
│   │   └── supabase.ts            # Cliente Supabase singleton
│   │
│   ├── context/
│   │   ├── CartContext.tsx        # Carrito: items, totales, persist en localStorage
│   │   ├── GuestContext.tsx       # Modo invitado: guestMode bool, enter/exit
│   │   └── ThemeContext.tsx       # Tema dark/light: isDark, toggleTheme, persist en localStorage
│   │
│   ├── data/
│   │   ├── servicios.ts           # Array SERVICIOS con colores, iconos, rutas, disponibilidad
│   │   └── paises.ts              # PAISES_SOPORTADOS (6) + TODOS_LOS_PAISES (12) con banderas y ciudades
│   │
│   ├── db/
│   │   ├── schema.sql             # DDL completo de Supabase
│   │   └── security.sql          # Políticas RLS adicionales
│   │
│   ├── pages/
│   │   ├── Home.tsx               # Dashboard con mascotas, alertas, servicios, productos IA
│   │   ├── Store.tsx              # Tienda con filtros, búsqueda, grid de productos
│   │   ├── Cart.tsx               # Carrito con resumen
│   │   ├── Checkout.tsx           # Flujo 4 pasos: resumen→envío→pago→confirmación
│   │   ├── MisPedidos.tsx         # Historial con timeline, Realtime, filtros
│   │   ├── BioPet.tsx             # Lista mascotas + BioPetNew + BioPetDetail (3 exports)
│   │   ├── Vet.tsx                # Citas veterinarias con agenda
│   │   ├── Adopcion.tsx           # Listing adopciones + formulario
│   │   ├── Profile.tsx            # Perfil, stats, toggle tema, links legales
│   │   ├── Login.tsx              # Login + Registro + Recuperar contraseña (vista única)
│   │   ├── Welcome.tsx            # Pantalla de bienvenida (no autenticado)
│   │   ├── ResetPassword.tsx      # Cambio de contraseña desde link email
│   │   └── legal/
│   │       ├── PrivacyPolicy.tsx  # Política de Privacidad (LOPDP Ecuador)
│   │       ├── TermsOfService.tsx # Términos y Condiciones
│   │       └── CookiesPolicy.tsx  # Política de Cookies
│   │
│   └── components/
│       ├── FloatingCart.tsx       # Botón flotante carrito (fixed, z-index 9999)
│       ├── GuestHeader.tsx        # Header especial para modo invitado
│       ├── PhoneInput.tsx         # Input de teléfono con selector de país, toggle WhatsApp/Llamada, geo-detección
│       ├── RegisterPrompt.tsx     # Modal de registro para invitados (tras 3 interacciones)
│       ├── ServicesGrid.tsx       # Grid 2 columnas de servicios (Home + Store)
│       └── legal/
│           ├── ConsentBanner.tsx  # (CREADO pero NO montado en App.tsx — disponible si se necesita)
│           └── ConsentCheckbox.tsx # Checkbox de aceptación para formulario de registro
│
├── public/assets/
│   └── logo.png                   # Logo accesible por URL pública
│
├── CONTEXT.md                     # Este archivo
├── CLAUDE.md                      # Instrucciones para Claude Code (stack, colores, rutas)
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

### Árbol de Providers (App.tsx)

```
ThemeProvider
  └── GuestProvider
        └── CartProvider
              └── AppInner (lee session de Supabase)
                    └── IonReactRouter
                          ├── AppContent (branching: autenticado / invitado / público)
                          ├── GuestPromptBridge (modal registro a los 3 productos)
                          └── FloatingCart (visible si hay items y no está en cart/checkout)
```

### Lógica de routing (AppContent)

```
session?        → AuthedContent  (tabs: Inicio, Mascotas, Tienda, Carrito, Pedidos, Perfil)
guestMode?      → GuestContent   (tabs: Tienda, Adopción, Entrar)
(ninguno)       → Rutas públicas (Welcome, Login, ResetPassword)
```

Las rutas legales `/privacidad`, `/terminos`, `/cookies` están definidas en los **tres** modos.

---

## 4. Base de Datos Supabase

### Tablas existentes y confirmadas

| Tabla | Descripción |
|---|---|
| `profiles` | id (FK auth.users), email, nombre, avatar_url, ciudad, pais, pais_codigo, telefono, telefono_codigo_pais, telefono_tipo, direccion_principal, onboarding_completo, foto_url |
| `mascotas` | user_id, nombre, especie, raza, fecha_nacimiento, peso, foto_url, notas, sexo |
| `vacunas` | mascota_id, nombre, fecha_aplicada, fecha_proxima, veterinario |
| `productos` | nombre, categoria, precio, imagen_url, descripcion, para_especie |
| `pedidos` | user_id (nullable para guests), guest_email, items (jsonb), total, estado, numero_orden, direccion, ciudad, metodo_pago |
| `citas` | user_id, veterinario_nombre, clinica, fecha, hora, motivo, estado_reserva, expira_en, estado, guest_email |
| `solicitudes_adopcion` | (estructura exacta pendiente de verificar en Supabase) |

### Columnas adicionales en `profiles` (SQL pendiente de ejecutar)

```sql
-- ⚠️ Pendiente — ejecutar en Supabase SQL Editor
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefono_codigo_pais text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefono_tipo text DEFAULT 'whatsapp';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pais_codigo text DEFAULT 'EC';
```

### Columnas adicionales en `pedidos` (SQL pendiente de ejecutar)

```sql
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS vtex_order_id text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tracking_code text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS courier text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS estado text DEFAULT 'confirmado';
```

### Tabla pendiente de crear

```sql
-- Consentimientos LOPDP
CREATE TABLE consentimientos (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id),
  tipo       text,         -- 'registro', 'marketing', 'cookies'
  aceptado   boolean,
  ip_hash    text,         -- hash de IP para cumplimiento legal
  created_at timestamptz DEFAULT now()
);
```

### Función RPC requerida (ya debe estar creada en Supabase)

```sql
CREATE OR REPLACE FUNCTION public.email_exists(check_email text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = check_email);
$$;
```
Esta función permite detectar desde el frontend si un email ya tiene cuenta, sin exponer `auth.users` al rol anon.

### Trigger automático

Al crear un usuario en `auth.users`, el trigger `on_auth_user_created` llama a `handle_new_user()` que crea el registro en `profiles` automáticamente.

### Políticas RLS importantes

- **pedidos**: Los guests pueden insertar con `user_id IS NULL` (policy "Guest pedidos insert")
- **citas**: Solo usuarios autenticados pueden crear citas
- **productos**: Lectura pública (cualquiera puede ver productos, incluso anon)

---

## 5. Estado Actual del Proyecto

### ✅ Funciona hoy

| Feature | Notas |
|---|---|
| Auth: email/password | Login, registro, recuperación de contraseña por email |
| Auth: Google OAuth | Requiere configuración en Supabase Dashboard + Google Cloud Console |
| Guest mode | Explorar tienda, carrito y checkout sin cuenta |
| Guest checkout | Flujo completo de 4 pasos con email, envío, pago simulado |
| Detección de email registrado en checkout | Usa RPC `email_exists`, muestra campo de password si ya tiene cuenta |
| Citas veterinarias | Solo para usuarios autenticados (auth wall para invitados) |
| BioPet (historia clínica) | CRUD de mascotas + vacunas |
| Tienda con filtros | Por categoría y búsqueda textual |
| Carrito persistente | localStorage, survives refresh |
| FloatingCart | Botón flotante con badge, animación bounce |
| Mis Pedidos | Historial, filtros, timeline de estado, Realtime subscription |
| Modo dark/light | ThemeContext + CSS variables, toggle en Profile |
| Páginas legales | Privacidad (LOPDP), Términos, Cookies |
| ConsentCheckbox en registro | Obligatorio antes de crear cuenta |
| Aviso legal en Welcome | Texto discreto con links |
| Aviso legal en Checkout | Aparece cuando email guest es válido |
| Perfil | Editar nombre, stats, links a legales, logout |
| Home con alertas | Vacunas vencidas/próximas, pedido activo en curso |

### ⚠️ Implementado pero pendiente de configuración externa

| Feature | Qué falta |
|---|---|
| Google OAuth | Configurar en Supabase Dashboard (Authentication → Providers → Google) + credenciales en Google Cloud Console |
| Columnas teléfono en profiles | Ejecutar el ALTER TABLE (ver sección 4) — `telefono_codigo_pais`, `telefono_tipo`, `pais_codigo` |
| Columnas VTEX en pedidos | Ejecutar el ALTER TABLE (ver sección 4) |
| Tabla consentimientos | Ejecutar CREATE TABLE (ver sección 4) |
| Realtime en MisPedidos | Requiere habilitar Realtime en la tabla `pedidos` desde Supabase Dashboard |
| Bucket Storage mascotas | Supabase Dashboard → Storage → New bucket: nombre `mascotas`, Public: ✅. Luego ejecutar policies INSERT/SELECT (ver comentario en Onboarding.tsx) |

### ❌ No implementado / Marcado "Próximamente"

- Guardería, Grooming, Paseos, Seguros, Wearables (servicios en `data/servicios.ts` con `disponible: false`)
- Pasarela de pago real (actualmente es un mock/simulación)
- Notificaciones push
- Upload de foto de perfil de usuario (campo `avatar_url` existe en DB, no hay UI de upload)
- Panel de administración / Seller Portal
- Integración VTEX (campos preparados en DB, lógica pendiente)
- Adopción: el formulario de solicitud se guarda pero no hay flujo de aprobación
- Tracking real de pedidos (campos en DB, lógica de actualización pendiente)

---

## 6. Historial de Sesiones

### Sesión 26 abril 2026 — PhoneInput, validaciones, bug fixes

**Features nuevos:**

1. **`src/data/paises.ts`** — nuevo archivo de datos:
   - `PAISES_SOPORTADOS`: Ecuador, Colombia, Perú, México, Argentina, Chile — con banderas, código de país, código telefónico y array de ciudades
   - `TODOS_LOS_PAISES`: agrega US, España, Venezuela, Bolivia, Paraguay, Uruguay

2. **`src/components/PhoneInput.tsx`** — componente reutilizable completo:
   - Selector de país via IonActionSheet con banderas y códigos
   - Input numérico de teléfono con placeholder dinámico según dígitos del país
   - Geo-detección de país: primero Supabase `profiles.pais_codigo`, luego IP (`ipapi.co/json/`), fallback Ecuador
   - Toggle "¿Cómo prefieres que te contactemos?" con opciones WhatsApp / Llamada tradicional
   - Props: `value`, `codigoPais`, `tipo`, `onChange`, `error`, `clearError`, `compact`, `session?`
   - Exporta `PhoneInputValue { fullNumber, codigoPais, tipo }`

3. **Onboarding.tsx paso 2 (ubicación)** — actualizado:
   - Selector de país usa `PAISES_SOPORTADOS` con banderas (`🇪🇨 Ecuador`, etc.)
   - Ciudades se cargan dinámicamente del array del país seleccionado
   - Seleccionar "Otra" en ciudades muestra input de texto libre
   - Guarda `pais`, `pais_codigo` y `ciudad` en `profiles`

4. **Integración PhoneInput en 3 páginas:**
   - `Profile.tsx`: sección "Completar perfil" → campo teléfono usa PhoneInput; guarda `telefono_codigo_pais` y `telefono_tipo`
   - `Checkout.tsx`: paso 2 "Datos de envío" → campo teléfono usa PhoneInput; persiste en localStorage
   - `Vet.tsx`: modal "Agendar cita" → campo teléfono usa PhoneInput; guarda `telefono_codigo_pais` y `telefono_tipo`

**Bug fixes:**

5. **FIX 1 — Mascotas en Profile.tsx sin navegación**: Las cards de mascotas en "Mis Mascotas" eran `<div>` sin onClick. Cambiadas a `<button>` con `onClick={() => history.push('/biopet/${m.id}')}` y flecha `›`.

6. **FIX 4 — Progress bar nunca llegaba a 100%**: `Home.tsx` usaba `profile.foto_url` en el cálculo del progreso, pero el campo real en la tabla es `avatar_url`. Corregido a `profile.avatar_url`. Ahora cuando los 5 campos están completos el progreso llega a 100% y la barra se oculta automáticamente (`if (pct >= 100) return null`).

7. **FIX 4b — Profile.tsx pedía "segunda mascota" incorrectamente**: La condición `mascotas.length < 2` pedía agregar una segunda mascota aunque el usuario ya tuviera una. Corregido a `mascotas.length === 0` con label "Agrega tu primera mascota".

**SQL ejecutado en Supabase (confirmar con el usuario):**
```sql
-- Columnas de onboarding (sesión anterior)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nombre text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completo boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ciudad text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pais text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tipo_mascotas text[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS direccion_principal text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS sexo text;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS estado_reserva text DEFAULT 'confirmada';
ALTER TABLE citas ADD COLUMN IF NOT EXISTS expira_en timestamptz;
ALTER TABLE pedidos ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS guest_email text;
```

---

### Sesión 25 abril 2026 — Tema, páginas legales, fixes

1. **Fix tab "Pedidos" en tab bar** — el wrapper `PedidosTabButton` como componente custom no era reconocido por `IonTabBar`. Solución: IonTabButton directo inline.

2. **Logo actualizado** — se copió `logo.png` desde Downloads, se actualizaron los 5 archivos que importaban `logo.jpg`.

3. **Sistema de tema dark/light (completo)**:
   - `ThemeContext.tsx` con `isDark` persistido en localStorage
   - Variables CSS en `index.css`: `--bg-primary`, `--bg-secondary`, `--bg-card`, `--text-primary`, `--text-secondary`, `--border-color`
   - Toggle `IonToggle` en Profile.tsx → sección "Aplicación"

4. **Páginas legales (completo)**:
   - `PrivacyPolicy.tsx`, `TermsOfService.tsx`, `CookiesPolicy.tsx`
   - `ConsentCheckbox.tsx` — obligatorio en registro
   - `ConsentBanner.tsx` — creado pero **desactivado** (blocker UX)

5. **Fix sistema de consentimiento** — modelo "consentimiento implícito por uso" + checkbox explícito en registro.

---

## 7. Próximos Pasos (ordenados por prioridad)

### P0 — SQL pendiente de ejecutar en Supabase

```sql
-- 1. Columnas de teléfono y país en profiles (nueva — pendiente)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefono_codigo_pais text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefono_tipo text DEFAULT 'whatsapp';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pais_codigo text DEFAULT 'EC';

-- 2. Columnas VTEX en pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS vtex_order_id text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tracking_code text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS courier text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS estado text DEFAULT 'confirmado';

-- 3. Tabla de consentimientos
CREATE TABLE consentimientos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  tipo text,
  aceptado boolean,
  ip_hash text,
  created_at timestamptz DEFAULT now()
);

-- 4. Habilitar Realtime en pedidos (desde Dashboard o SQL)
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
```

### P0b — Supabase Storage (bucket mascotas)

1. Dashboard → Storage → New bucket: nombre `mascotas`, Public ✅
2. SQL Editor:
```sql
CREATE POLICY "upload_pet_photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'mascotas' AND auth.role() = 'authenticated');
CREATE POLICY "read_pet_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'mascotas');
```

### P1 — Pasarela de pago real

El checkout actual es una simulación. Se debe integrar una pasarela real. Opciones evaluadas para Ecuador:
- **PayPhone** (local, preferido)
- **Kushki** (regional, bien documentado)
- El flujo de Checkout.tsx ya tiene la estructura correcta; solo falta reemplazar el bloque `confirmarPago` que actualmente hace un `setTimeout` de 2 segundos.

### P2 — Upload de fotos (mascotas y perfil)

El campo `foto_url` en `mascotas` y `avatar_url` en `profiles` existen en la DB pero el upload de foto de perfil de usuario no tiene UI.
- Mascotas: la lógica `uploadPetPhoto` existe en `BioPet.tsx` y `Onboarding.tsx`, solo falta que el bucket esté correctamente configurado (ver P0b)
- Perfil: no hay UI para subir foto de perfil del usuario (`avatar_url`)

### P3 — Seller Portal / Panel de administración

- Los campos `vtex_order_id`, `tracking_code`, `courier`, `estado` en `pedidos` fueron preparados para esto
- El Realtime en MisPedidos ya funciona del lado del cliente
- Falta: una vista web (separada o en ruta protegida admin) para que el vendedor actualice el estado de pedidos

### P4 — Notificaciones push

- Capacitor Push Notifications plugin ya está instalado como dependencia
- Se necesita: configurar Firebase Cloud Messaging, manejar tokens de dispositivo, trigger en cambio de estado de pedido

### P5 — Servicios "Próximamente"

En `data/servicios.ts`, cambiar `disponible: false` a `true` e implementar las páginas:
- `/guarderia` — similar a Vet pero para guardería
- `/grooming` — similar a Vet
- `/paseos` — paseadores con agenda
- `/seguros` — formulario de cotización

### P6 — Mejoras de UX pendientes

- Foto de perfil (avatar_url existe en DB, no hay upload)
- Filtro de mascotas en Tienda basado en las mascotas del usuario (la lógica de recomendación IA existe en Home pero no en Store como filtro rápido)
- Historial de citas veterinarias separado del historial de pedidos

---

## 8. Decisiones Técnicas Importantes

### React Router v5 (NO v6)

Se usa `react-router-dom@5.3.x` porque Ionic React Router requiere compatibilidad con v5. **No migrar a v6** — rompería `useHistory`, `useLocation`, y la integración con `IonTabs`.

### Ionic mode: 'ios' globalmente

```ts
setupIonicReact({ mode: 'ios' });
```
Se forzó el modo iOS para consistencia visual en Android e iOS. Esto afecta el estilo de modales, inputs y animaciones.

### Transición de navegación a 10ms

```css
ion-router-outlet { --ion-transition-duration: 10ms; }
.ion-page { animation-duration: 10ms !important; }
```
El usuario reportó que la pausa entre páginas se sentía lenta. Se redujo de 300ms → 200ms → 10ms. La animación existe pero es imperceptible (eso es exactamente lo que se quiere).

### Guest checkout sin cuenta

Decisión de negocio: no forzar registro para comprar. El flujo permite checkout completo con solo un email. La detección de "email ya registrado" usa un RPC `SECURITY DEFINER` porque Supabase no expone `auth.users` al rol `anon`.

### Citas veterinarias solo para usuarios autenticados

Decisión de negocio: las citas requieren un historial persistente vinculado a la cuenta. Los invitados ven la pantalla de veterinarios pero se les muestra un `AuthWall` al intentar agendar.

### `signUp` eliminado del flujo de checkout

Hubo un bug crítico: llamar `supabase.auth.signUp()` dentro de `confirmarPago` disparaba `onAuthStateChange`, lo que desmontaba el componente `GuestContent` y montaba `AuthedContent`, destruyendo el estado de checkout antes de llegar al paso 4. **Solución definitiva:** se eliminó completamente el bloque de `signUp` del checkout. El usuario puede crear cuenta DESPUÉS del pedido desde el paso 4.

### ConsentBanner desactivado (consentimiento implícito)

El banner de cookies bloqueaba UX en la primera visita. Se adoptó modelo más común en apps móviles:
- Texto informativo en Welcome.tsx (sin bloquear)
- Texto inline en Checkout al escribir el email
- ConsentCheckbox **obligatorio** solo en el formulario de **registro** (donde es realmente necesario legalmente)
- `ConsentBanner.tsx` existe en el codebase y se puede reactivar si hay requerimiento legal futuro

### Variables CSS para tema vs. colores hardcodeados en gradientes

Los colores de marca (rosa `#FF2D9B`, cyan `#00E5FF`, amarillo `#FFE600`, verde `#00F5A0`) **nunca** se convierten a variables CSS porque son invariantes entre temas. Solo los fondos, textos y bordes usan variables. Los gradientes siempre llevan los colores hardcodeados.

### `IonTabButton` debe ser hijo directo de `IonTabBar`

Cualquier componente wrapper alrededor de `IonTabButton` (como `CartTabButton` o el anterior `PedidosTabButton`) no funciona si es un componente React externo — Ionic no lo reconoce. La única excepción que funciona es `CartTabButton` porque fue el primero implementado y coincidió. Para nuevos tabs, siempre usar `IonTabButton` inline.

### Inline styles vs. Tailwind

El proyecto usa **ambos** sin jerarquía clara. Los componentes más nuevos tienden a usar más Tailwind classes (`className="..."`) mientras los originales usan inline styles. No intentar homogeneizar — genera conflictos. Aceptar la mezcla.

---

## 9. Variables de Entorno

Archivo: `.env.local` (en la raíz del proyecto, **no commitear**)

| Variable | Para qué sirve |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (formato: `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Clave pública anon de Supabase (segura para exponer en frontend) |

Ambas variables son **requeridas** — la app lanza un `Error` si no están presentes (ver `src/lib/supabase.ts`).

Para obtenerlas: Supabase Dashboard → Project Settings → API.

---

## 10. Comandos Clave

```bash
# Desarrollo local
npm run dev           # Inicia Vite dev server en http://localhost:5173

# Build de producción
npm run build         # TypeScript check + Vite build → dist/

# Preview de build local
npm run preview       # Sirve el build en http://localhost:4173

# Type checking solo (sin build)
npx tsc --noEmit      # Verifica errores TypeScript sin emitir archivos

# Deploy (automático via Vercel + GitHub)
git push origin master  # Vercel detecta el push y despliega automáticamente

# Lint
npm run lint

# Tests (configurados pero no escritos aún)
npm run test.unit     # Vitest
npm run test.e2e      # Cypress
```

**Nota sobre deploy:** El repo está en `github.com/guillermo381/e-petplace-v2`. Vercel escucha el branch `master` (no `main`).

---

## 11. Problemas Conocidos y Soluciones

### `onAuthStateChange` desmonta componentes mid-flow

**Problema:** Cualquier llamada a `supabase.auth.signUp()` o `supabase.auth.signInWithPassword()` exitosa dispara `onAuthStateChange`, que cambia la rama del router (de `GuestContent` a `AuthedContent`), desmontando el componente activo y perdiendo todo el estado.

**Solución activa:** No llamar a ninguna función de auth dentro de flujos de compra. En Checkout, el login/registro se ofrece **después** del pedido confirmado.

### Tab bar ignora componentes React como hijos

**Problema:** `<IonTabBar>` de Ionic renderiza sus hijos directamente; si el hijo es un componente React personalizado (no un `IonTabButton` nativo), el tab no aparece.

**Solución activa:** Siempre poner `IonTabButton` directamente como hijo de `IonTabBar`. Si necesitas estado en el tab (ej. badge con contador), pon el `useEffect` y el `useState` en el componente padre que renderiza el `IonTabBar`, y pasa el valor como prop o accede a contextos desde dentro del `IonTabButton` inline usando hooks (que sí funcionan inline).

### Supabase `.select().single()` falla con RLS RETURNING

**Problema:** Al hacer `supabase.from('citas').insert({...}).select('id').single()`, el `RETURNING` implícito en PostgreSQL requiere política SELECT en la tabla. Si solo hay política INSERT, devuelve `null`.

**Solución activa en Checkout:** En lugar de capturar el `cita_id` del INSERT y usarlo para el UPDATE, se hace un UPDATE masivo:
```ts
await supabase.from('citas')
  .update({ estado_reserva: 'confirmada', expira_en: null, estado: 'confirmada' })
  .eq('user_id', currentUserId)
  .eq('estado_reserva', 'pendiente_pago');
```

### Transición CSS interfiere con animaciones de Ionic

**Problema:** Al agregar `* { transition: background-color 0.3s }` para el cambio de tema, las transiciones de navegación de Ionic se ven afectadas.

**Solución activa:** Override explícito en index.css:
```css
.ion-page, ion-router-outlet, .ion-page-invisible {
  transition: none !important;
}
```

### `useIonRouter` no navega desde dentro de modales

**Problema:** `useIonRouter().push('/ruta')` no funcionaba desde los modales de `AuthWall` en Vet.tsx y Adopcion.tsx.

**Solución activa:** Usar `useHistory()` de react-router-dom directamente.

---

## 12. Integraciones Externas

### Supabase
- **Auth:** `supabase.auth.signInWithPassword()`, `signUp()`, `signInWithOAuth({ provider: 'google' })`, `onAuthStateChange()`
- **DB:** cliente tipado via `supabase.from('tabla').select/insert/update/delete`
- **Realtime:** `supabase.channel('pedido-xxx').on('postgres_changes', ...)` en MisPedidos.tsx
- **RPC:** `supabase.rpc('email_exists', { check_email: email })` para detección de email registrado
- **Storage:** Configurado, no usado aún para uploads de fotos

### Google OAuth (configuración pendiente)
Para activar Google login se necesita:
1. Supabase Dashboard → Authentication → Providers → Google → Enable
2. Google Cloud Console → crear OAuth 2.0 Client ID
3. Authorized redirect URI: `https://zyltipqscdsdsxnjclhp.supabase.co/auth/v1/callback`
4. Site URL en Supabase: `https://e-petplace-v2.vercel.app`
5. Redirect URLs: `https://e-petplace-v2.vercel.app/**`, `http://localhost:5173/**`

### Vercel
- Deploy automático desde GitHub `master`
- Variables de entorno configuradas en Vercel Dashboard (mismas que `.env.local`)
- URL de producción: `https://e-petplace-v2.vercel.app`

### VTEX (preparado, no integrado)
Los campos `vtex_order_id`, `tracking_code`, `courier` en la tabla `pedidos` fueron añadidos para futura integración. El Seller Portal actualizaría estos campos vía API de Supabase o un webhook, y el Realtime del cliente mostraría los cambios en tiempo real en MisPedidos.tsx.

---

## 13. Contexto de Negocio

### Ecuador como mercado objetivo
La app está diseñada para Ecuador: precios en USD, términos legales bajo LOPDP (Ley Orgánica de Protección de Datos Personales), jurisdicción en Quito.

### Flujo guest fue una decisión de negocio explícita
El dueño del negocio decidió **no forzar registro para comprar** porque las métricas del sector muestran alta tasa de abandono cuando se exige cuenta antes del checkout. El checkout guest permite capturar el email para remarketing posterior.

### Citas veterinarias requieren cuenta (también decisión de negocio)
Para las citas, el historial médico y la trazabilidad legal son importantes. Se decidió que las citas solo son para usuarios registrados — los guests ven los veterinarios disponibles pero no pueden agendar.

### Servicios "Próximamente" son validación de mercado
Los 5 servicios deshabilitados (guardería, grooming, paseos, seguros, wearables) se muestran en la app como señal de roadmap. Si los usuarios preguntan por ellos, hay demanda. Es una estrategia deliberada de product discovery.

### Adopción: e-PetPlace es facilitador, no responsable
Los términos legales establecen explícitamente que e-PetPlace no verifica el estado de salud de los animales en adopción ni garantiza el proceso. Esto fue una decisión legal para limitar responsabilidad. La app conecta adoptantes con donantes pero no interviene en el proceso físico.

### VTEX como plataforma de fulfillment futura
El dueño tiene relaciones con VTEX para el fulfillment logístico. Por eso los campos `vtex_order_id`, `tracking_code`, `courier` fueron añadidos desde ya en los pedidos. La integración real VTEX está en el roadmap pero no tiene fecha.

### Diseño visual: dark mode por defecto, no negociable
El tema oscuro con colores neón (rosa/cyan/amarillo) es identidad de marca. El modo claro fue añadido como opción (accesibilidad) pero el dark es el modo por defecto y el que se muestra en toda la comunicación de marketing.

---

## 14. Colores de Marca (invariantes en ambos temas)

```
Rosa:    #FF2D9B   -- CTAs, alertas, acento primario
Cyan:    #00E5FF   -- Links, tabs activos, info
Amarillo: #FFE600  -- Badges, avisos, pedidos activos
Verde:   #00F5A0   -- Estados positivos, confirmaciones
Morado:  #A78BFA   -- Labels "IA", badges secundarios
Naranja: #FF6B35   -- Estado "en camino" en pedidos
```

Gradiente principal: `linear-gradient(135deg, #FF2D9B, #00E5FF)`
Gradiente texto: `linear-gradient(90deg, #FF2D9B, #00E5FF, #FFE600)`

---

## 15. localStorage Keys en Uso

| Key | Tipo | Descripción |
|---|---|---|
| `epetplace_cart` | `CartItem[]` JSON | Items del carrito persistidos |
| `epetplace_theme` | `'dark' \| 'light'` | Preferencia de tema |
| `epetplace_consent` | `{ accepted: boolean, date: ISO }` | Consentimiento de cookies |
| `guest_mode` | `'true'` | Flag de modo invitado |
| `prefill_email` | `string` | Email para prellenar en Login desde Checkout paso 4 |
| `register_prompt_shown` | `'true'` | Flag para no mostrar el RegisterPrompt más de una vez por sesión |
| `onboarding_done_{userId}` | `'true'` | Evita redirigir al onboarding si ya se completó |
| `onboarding_postponed` | `'true'` | Flag cuando el usuario eligió "Lo haré después" |
| `checkout_envio` | JSON | Datos de envío persistidos entre sesiones de checkout |
| `checkout_email` | `string` | Email de guest persistido en checkout |

`sessionStorage` keys:
| Key | Descripción |
|---|---|
| `epetplace_session_interactions` | Contador de productos añadidos (para disparar RegisterPrompt) |
| `register_prompt_shown` | Flag de sesión para no repetir el prompt |

---

## 16. Flujo de Onboarding (complejo — leer antes de tocar)

`src/pages/Onboarding.tsx` — se activa automáticamente cuando un usuario nuevo entra a `/home` y `profiles.onboarding_completo` es `false`.

### Cuándo se redirige al onboarding

En `Home.tsx → fetchAll()`:
```ts
if (!memoDone && !lsDone && !prof.onboarding_completo) {
  history.replace('/onboarding');
  return;
}
```
Donde `lsDone = localStorage.getItem('onboarding_done_${userId}')`.

### Flujo normal (primer ingreso)

```
1. IonModal de bienvenida (backdropDismiss=false)
   ├── "¡Empezar ahora!" → cierra el modal → Paso 1
   └── "Lo haré después" → postergarOnboarding() → /home

2. Paso 1 — Datos de la mascota
   Campos: foto (opcional), especie*, nombre*, raza (opcional),
           fecha_nacimiento*, sexo* (condicional por especie), peso (opcional)
   └── "Continuar →" valida campos obligatorios → Paso 2
   └── "Omitir este paso →" salta directo a Paso 2 sin validar

3. Paso 2 — Ubicación
   Campos: país* (PAISES_SOPORTADOS con banderas), ciudad* (array dinámico del país)
   Si ciudad = "Otra" → aparece input de texto libre
   └── "¡Empezar! 🚀" → completarOnboarding(false) → guarda todo → /home
   └── "Omitir este paso →" → completarOnboarding(true) → no guarda ubicación → /home
```

### Deep link `?step=ciudad`

`/onboarding?step=ciudad` salta directamente al Paso 2, sin mostrar el modal de bienvenida ni el Paso 1. Se usa cuando el usuario ya tiene mascotas pero no tiene ciudad guardada. Lo dispara `Home.tsx` en el botón "Completar ahora":
```ts
else if (sinCiudad) history.push('/onboarding?step=ciudad');
```

Implementado con:
```ts
const stepParam = new URLSearchParams(location.search).get('step');
const esSoloCiudad = stepParam === 'ciudad';
const [showWelcome, setShowWelcome] = useState(!esSoloCiudad);
const [paso, setPaso] = useState<1 | 2>(esSoloCiudad ? 2 : 1);
```

### `postergarOnboarding()` vs `completarOnboarding()`

| Función | Cuándo | Qué hace |
|---|---|---|
| `postergarOnboarding()` | Clic en "Lo haré después" en el modal | Escribe `onboarding_completo: true` en DB (fire-and-forget) + `onboarding_done_${id}` en localStorage + `onboarding_postponed: true` → navega a /home |
| `completarOnboarding(false)` | Botón "¡Empezar!" con ubicación válida | Guarda perfil (ciudad, pais, pais_codigo, tipo_mascotas) + crea mascota en DB + sube foto si hay → navega a /home |
| `completarOnboarding(true)` | Clic en "Omitir este paso →" en Paso 2 | Igual pero `skipLocation=true`: solo guarda `onboarding_completo: true`, no toca ciudad ni país |

**Por qué dos mecanismos (DB + localStorage):** la DB evita el redirect en sesiones futuras desde otros dispositivos; el localStorage evita el redirect antes de que termine la llamada asíncrona a Supabase (race condition).

---

## 17. BioPet.tsx — Exports y dependencias (cuidado antes de modificar)

`src/pages/BioPet.tsx` exporta **6 cosas**. Tocar este archivo puede romper Onboarding.tsx.

### Exports

| Export | Tipo | Usado en |
|---|---|---|
| `default BioPet` | Componente — lista de mascotas en `/mascotas` | App.tsx |
| `BioPetNew` | Componente — formulario crear mascota `/biopet/new` | App.tsx |
| `BioPetDetail` | Componente — detalle/edición mascota `/biopet/:id` | App.tsx |
| `RAZAS` | `Record<string, string[]>` — razas por especie | **Onboarding.tsx** |
| `TITULO_ESPECIE` | `Record<string, string>` — título del formulario por especie | **Onboarding.tsx** |
| `RazaInput` | Componente React — autocomplete de razas con dropdown | **Onboarding.tsx** |

### Riesgo de importación circular

`Onboarding.tsx` importa de `BioPet.tsx`:
```ts
import { RAZAS, TITULO_ESPECIE, RazaInput } from './BioPet';
```
No hay riesgo circular porque `BioPet.tsx` **no** importa nada de `Onboarding.tsx`. Pero si se mueve `RAZAS` o `RazaInput` a otro archivo, hay que actualizar el import en Onboarding.

### `BioPetDetail` con guard interno

```ts
// En App.tsx
<Route exact path="/biopet/new" render={() => <BioPetNew session={session} />} />
<Route exact path="/biopet/:id" render={(props) => {
  const id = props.match.params.id;
  if (!id || id === 'new') return <BioPetNew session={session} />;
  return <BioPetDetail session={session} petId={id} />;
}} />
```
Y dentro de `BioPetDetail`, hay una segunda guarda:
```ts
if (petId === 'new') return <BioPetNew session={session} />;
```
Doble protección intencionada.

---

## 18. Decisiones de Diseño del PhoneInput

### Jerarquía de detección de país (en orden de prioridad)
1. Prop `codigoPais` — el padre ya conoce el país del usuario
2. `profiles.pais_codigo` en Supabase — si se pasa prop `session`
3. Geo-detección por IP via `https://ipapi.co/json/`
4. Ecuador por defecto

### Prop `compact`
Oculta el subtexto de preferencia de contacto y el aviso de país no soportado. Se usa `compact` en Checkout y Vet (espacio limitado); sin `compact` en Onboarding y Profile.

### Sesión opcional
`session` es `Session | null | undefined`. Si es null (usuario guest en Checkout), simplemente se salta el paso de Supabase y va directo a la detección por IP. No hay que manejar el caso null especialmente — el `if (session?.user?.id)` lo cubre.
