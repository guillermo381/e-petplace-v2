# e-PetPlace — Contexto Completo del Proyecto

## Descripción
Ecosistema digital para mascotas. App móvil + web con React + Ionic.
Startup ecuatoriana con visión LatAm. Pre-Seed $400K.

## Stack Técnico
- React + Vite + TypeScript
- Ionic Framework (componentes mobile nativos)
- Capacitor (compilar a iOS y Android)
- Supabase (auth + DB + storage)
- Tailwind CSS
- Deploy: Vercel → https://e-petplace-v2.vercel.app

## Variables de Entorno (.env.local)
VITE_SUPABASE_URL=https://zyltipqscdsdsxnjclhp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bHRpcHFzY2RzZHN4bmpjbGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDMxMDYsImV4cCI6MjA5MjM3OTEwNn0.kvHD9-JvaGytu0a7kAwgTyVXExrhIaGg1Z8_-99SOxA
VITE_GOOGLE_PLACES_KEY=AIzaSyBkRh0dUe7uFywdLQGDeq4bMecEis5htzc

## Identidad Visual e-PetPlace
- Fondo principal: #000000
- Cards: #111111
- Rosa/Magenta: #FF2D9B
- Cyan: #00E5FF  
- Amarillo neón: #FFE600
- Verde: #00F5A0
- Púrpura: #A78BFA
- Naranja: #FF6B35
- Texto primario: var(--text-primary)
- Texto secundario: var(--text-secondary)
- Gradiente marca: rosa→cyan (#FF2D9B → #00E5FF)
- Soporte dark/light mode con variables CSS

## Estructura de Archivos Clave
src/
├── pages/
│   ├── Welcome.tsx          # Pantalla bienvenida (primera vez)
│   ├── Login.tsx            # Login + Registro + Google Auth + Reset Password
│   ├── Onboarding.tsx       # Onboarding post-registro (mascotas + ubicación)
│   ├── Home.tsx             # Dashboard principal con mascotas + servicios + alertas
│   ├── BioPet.tsx           # Bio-expediente mascotas (CRUD completo)
│   ├── Store.tsx            # Tienda con guest checkout
│   ├── Cart.tsx             # Carrito de compras
│   ├── Checkout.tsx         # Checkout 4 pasos (guest + autenticado)
│   ├── MisPedidos.tsx       # Historial de pedidos con timeline
│   ├── Vet.tsx              # Veterinarios + agendar citas
│   ├── Adopcion.tsx         # Adopción de mascotas
│   ├── Profile.tsx          # Perfil + datos personales + progreso
│   ├── ResetPassword.tsx    # Resetear contraseña
│   └── legal/
│       ├── PrivacyPolicy.tsx
│       ├── TermsOfService.tsx
│       └── CookiesPolicy.tsx
├── components/
│   ├── FloatingCart.tsx     # Carrito flotante persistente
│   ├── AddressInput.tsx     # Input dirección con Google Places API
│   ├── PhoneInput.tsx       # Input teléfono con código de país
│   └── legal/
│       ├── ConsentBanner.tsx
│       └── ConsentCheckbox.tsx
├── context/
│   ├── CartContext.tsx      # Estado global del carrito (localStorage)
│   └── ThemeContext.tsx     # Dark/Light mode
├── data/
│   ├── servicios.ts         # Array unificado de servicios (usado en Home y Store)
│   └── paises.ts            # Países soportados con banderas y códigos
├── lib/
│   └── supabase.ts          # Cliente Supabase con variables de entorno
└── db/
    ├── schema.sql           # Schema inicial
    └── security.sql         # RLS policies

## Base de Datos Supabase — Tablas Principales

### profiles
- id (uuid, FK auth.users)
- nombre, email
- telefono, telefono_codigo_pais, telefono_tipo (whatsapp/llamada)
- pais_codigo, ciudad
- direccion_completa, direccion_linea1, direccion_apto
- direccion_referencias, direccion_sector, direccion_ciudad
- direccion_pais, direccion_guardada_como
- avatar_url
- onboarding_completo (boolean)

### mascotas
- id, user_id
- nombre, especie, raza, sexo
- fecha_nacimiento, peso
- foto_url
- notas

### vacunas
- id, mascota_id
- nombre, fecha_aplicada, fecha_proxima, veterinario

### citas
- id, user_id, mascota_id
- veterinario_nombre, clinica
- fecha, hora, motivo, precio
- estado_reserva (pendiente_pago/confirmada/expirada)
- expira_en (timestamptz, pg_cron limpia en 30min)
- guest_email

### pedidos
- id, user_id, guest_email
- items (jsonb), total
- direccion, ciudad, metodo_pago
- numero_orden, estado (confirmado/preparando/en_camino/entregado/cancelado)
- vtex_order_id, tracking_code, courier (para integración futura VTEX)

### solicitudes_adopcion
- id, user_id, mascota_nombre, refugio
- nombre_solicitante, email, telefono
- tiene_mascotas, espacio_exterior, motivo

### consentimientos
- id, user_id, tipo, aceptado, ip_hash

### direcciones (tabla futura para múltiples direcciones)
- id, user_id, alias, linea1, referencias
- ciudad, pais, completa, es_principal

## Rutas de la App

### Públicas (sin AuthGuard)
/welcome, /login, /reset-password, /tienda, /carrito, 
/checkout, /adopcion, /privacidad, /terminos, /cookies

### Protegidas (requieren sesión)
/home, /mascotas, /biopet/*, /perfil, /vet, 
/mis-pedidos, /onboarding

## Flujos Importantes

### Guest Checkout
1. Invitado navega tienda libremente
2. Agrega al carrito → FloatingCart visible
3. Checkout → email obligatorio + aceptar términos
4. Si email registrado → detectar y pedir contraseña
5. Pago → pedido guardado con guest_email
6. Post-pago → opción crear cuenta
7. Al registrarse → pedidos/citas migran al user_id

### Onboarding Post-Registro
1. Modal bienvenida → "¿Empezar ahora o después?"
2. Paso 1: Agregar primera mascota (nombre+especie+fecha+sexo obligatorio)
3. Paso 2: País + Ciudad
4. Al completar: onboarding_completo=true en profiles
5. Barra de progreso en Home si perfil incompleto

### Citas Veterinario
1. Usuario selecciona veterinario → fecha → hora → motivo
2. Validación: hora no pasada, confirmación si es hoy
3. Toast inteligente: "Cita para HOY/mañana/este domingo"
4. Se agrega al carrito como item tipo 'cita'
5. Al pagar: INSERT en tabla citas con estado 'confirmada'
6. pg_cron expira citas pendientes_pago después de 30 minutos

## Servicios Disponibles (src/data/servicios.ts)
Nutrición, Veterinario, Adopción, Guardería (pronto),
Grooming (pronto), Paseos (pronto), Seguros (pronto), Wearables (pronto)
Todos visibles para invitados y usuarios registrados.
Citas y adopción requieren cuenta registrada.

## Google Places API
- API Key: en VITE_GOOGLE_PLACES_KEY
- Usar PlaceAutocompleteElement (nueva API, no la legacy)
- Países: ec, co, pe, mx, ar, cl
- Componente: src/components/AddressInput.tsx
- PROBLEMA ACTIVO: Primera vez no carga, al editar sí carga pero no guarda

## Bugs Activos Pendientes
1. AddressInput: primera vez que se abre no carga Google Places
2. AddressInput: al editar y guardar no persiste los cambios en Supabase
3. Modo claro: Onboarding welcome modal aún puede tener colores hardcodeados

## Convenciones de Código
- Todo en español (UI y comentarios)
- Toasts para feedback al usuario
- Mobile-first, responsive
- IonToast para mensajes
- useIonViewWillEnter para refrescar datos al entrar a pantalla
- Variables CSS para colores (soporta dark/light mode)
- Siempre usar import.meta.env para keys sensibles
- NUNCA hardcodear keys en el código

## Plan de Desarrollo (Pendiente)
Semana actual:
- [x] Seguridad base (RLS + variables entorno)
- [x] Google Auth + recuperación contraseña
- [x] Guest checkout completo
- [x] Onboarding post-registro
- [x] Políticas legales
- [x] Teléfono con código de país
- [x] PetBot IA (chat-ayuda Edge Function)
- [x] Centro de ayuda /ayuda
- [x] Adopción dinámica con Supabase
- [x] Donaciones al carrito desde adopción
- [x] Modo claro fixes (Login, Onboarding, Vet)
- [ ] Dirección con Google Places (EN PROGRESO)
- [ ] Sección "Mis datos" en perfil editable

Próximas semanas:
- Modelo de suscripción premium (es_premium + Kushki)
- Cupones y códigos promocionales
- Gamificación y puntos
- Multi-idioma con geolocalización
- Build iOS/Android con Capacitor
- Integración VTEX
- Pasarela de pagos Kushki
- Notificaciones push con Capacitor
- Admin back office

## Sesión 27 Abr 2026 — Parte 2

### Completado
- [x] Dashboard mascota completo: hero con ring gradiente, índice de salud, estimado de alimento, bio-expediente grid
- [x] AlimentoEstimado: calcula días restantes basado en último pedido real
- [x] Editar mascota: formulario completo con resize automático de fotos (máx 800px, ~150KB)
- [x] useIonViewWillEnter en BioPet y BioPetDetail para refrescar datos al volver
- [x] Carnet digital de vacunas con IA: Edge Function extract-vacuna en Supabase
- [x] Escaneo de carnet físico: foto → Claude Haiku → extrae múltiples vacunas automáticamente
- [x] Importación masiva de vacunas desde carnet en una sola foto
- [x] Carnet digital visual: modal fullscreen con diseño e-PetPlace
- [x] Descarga PNG del carnet con html2canvas
- [x] Compartir carnet por WhatsApp/nativo
- [x] Fix Checkout: pre-populate datos del perfil al pagar
- [x] Fix columna direccion_codigo_postal inexistente en query de Checkout

### Infraestructura agregada
- Supabase Edge Function: extract-vacuna (claude-haiku-4-5-20251001)
- ANTHROPIC_API_KEY configurada en Supabase Secrets
- npm install html2canvas

### Bugs Activos Pendientes
- [ ] Google Places AddressInput: solución portal pendiente de validar en producción
- [ ] Modo claro: revisar páginas Vet, Adopcion, Login, Onboarding
- [ ] Carnet PNG: verificar render correcto en todos los dispositivos

### Próximas sesiones prioritarias
1. Modelo de suscripción premium (es_premium en profiles + Kushki/Stripe)
2. Chat IA con Claude API en contexto de mascota
3. Rediseño Home final con orden correcto de secciones
4. Notificaciones push con Capacitor
5. Build iOS/Android
6. Multi-idioma ES/EN
7. Integración VTEX + Kushki

## Sesión 28 Abr 2026

### Completado
- [x] Adopcion.tsx rewrite completo: datos dinámicos desde tabla mascotas_adopcion en Supabase
- [x] Filtros por especie en adopción (Todos/Perros/Gatos/Aves/Conejos/Urgente)
- [x] Modal detalle mascota + formulario de solicitud → INSERT en solicitudes_adopcion
- [x] Donaciones al carrito desde adopción (montos sugeridos por necesidad)
- [x] MisPedidos: detectarTipoPedido() — timeline condicional por tipo (producto/cita/donación/mixto)
- [x] MisPedidos: badge tipo en cards (❤️ Donación / 🏥 Cita / 📦 Pedido)
- [x] MisPedidos: mensaje especial para donaciones ("🌟 ¡Eres increíble!")
- [x] MisPedidos: info de envío oculta para citas y donaciones
- [x] Modo claro completo: Vet.tsx, Login.tsx, Onboarding.tsx — colores hardcodeados → variables CSS
- [x] Home.tsx: campana 🔔 abre drawer de notificaciones (alertas reales + pedido activo)
- [x] Home.tsx: sección alertas eliminada del body (movida al drawer)
- [x] Home.tsx: saludo dinámico por hora (Buenos días/tardes/noches)
- [x] Home.tsx: mini health bar en cards de mascotas
- [x] Centro de ayuda /ayuda: FAQ accordion, WhatsApp, accesos rápidos
- [x] PetBot 🐾: chat flotante con IA (claude-haiku-4-5-20251001) via Edge Function chat-ayuda
- [x] HelpButton: posición dinámica según FloatingCart (sube cuando carrito visible)
- [x] Cart.tsx: confirmación inline antes de vaciar carrito
- [x] Profile.tsx: clearCart() al hacer logout
- [x] Profile.tsx: subida real de foto de perfil con resize (400px, JPEG 0.85) → bucket 'avatars'
- [x] Profile.tsx: ocultar campo contraseña si login con Google (detección por identities[])
- [x] Cross-sell carousel de servicios en Vet, Adopcion y MisPedidos
- [x] BioPet.tsx: RAZAS expandidas (74+ perros, 42+ gatos, 23 aves, 22 conejos, etc.)
- [x] BioPet.tsx: RazaInput muestra advertencia si no hay especie seleccionada
- [x] BioPet.tsx: lista mejorada con mini health bar + grid integrado
- [x] Performance: eliminado @vitejs/plugin-legacy, lazy loading para 5 páginas
- [x] App.tsx: fix routing /biopet/:id (eliminado guard innecesario)
- [x] KNOWLEDGE de chat-ayuda actualizado con toda la documentación de la app

### SQL ejecutado en Supabase (28 Abr)
```sql
-- Tabla mascotas_adopcion
CREATE TABLE mascotas_adopcion (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL, especie text NOT NULL, raza text, sexo text,
  edad_texto text, peso numeric, foto_url text, descripcion text,
  refugio text, ciudad text, urgente boolean DEFAULT false,
  necesita_vacunas boolean DEFAULT false, necesita_esterilizacion boolean DEFAULT false,
  necesita_alimento boolean DEFAULT false, donacion_sugerida numeric DEFAULT 0,
  activa boolean DEFAULT true, created_at timestamptz DEFAULT now()
);
ALTER TABLE mascotas_adopcion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público puede ver mascotas adopcion" ON mascotas_adopcion FOR SELECT USING (activa = true);
-- + INSERT de mascotas de ejemplo
```

### Infraestructura agregada
- Supabase Edge Function: chat-ayuda (PetBot IA con claude-haiku-4-5-20251001)
- Tabla: mascotas_adopcion con RLS pública
- Storage bucket: avatars (fotos de perfil de usuarios)
- Nuevas páginas: /ayuda (Centro de ayuda)
- Nuevos componentes: HelpButton.tsx (chat flotante)

### Bugs Activos Pendientes
- [ ] Google Places AddressInput: validar en producción
- [ ] Onboarding welcome modal: posible color hardcodeado en fondo
- [ ] Carnet PNG: verificar render correcto en todos los dispositivos
- [ ] Modo claro: BioPet.tsx — revisar colores en detalle de mascota

### Próximas sesiones prioritarias
1. Modelo de suscripción premium (es_premium en profiles + Kushki/Stripe)
2. Chat IA con Claude API en contexto de mascota específica (desde BioPetDetail)
3. Notificaciones push con Capacitor
4. Build iOS/Android
5. Multi-idioma ES/EN
6. Admin back office (dashboard de pedidos, vets, adopciones)
7. Integración VTEX + Kushki
