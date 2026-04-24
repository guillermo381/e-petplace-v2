# e-PetPlace — Contexto del Proyecto

## Stack
- React + Ionic + TypeScript + Vite
- Supabase (auth + DB + storage)
- Tailwind CSS
- Deploy: Vercel

## Supabase
- URL: https://zyltipqscdsdsxnjclhp.supabase.co
- Tablas: profiles, mascotas, vacunas, citas, pedidos, solicitudes_adopcion, productos

## Colores de marca
- Fondo: #000000
- Cards: #111111
- Rosa: #FF2D9B
- Cyan: #00E5FF
- Amarillo: #FFE600
- Verde: #00F5A0

## Rutas públicas (sin AuthGuard)
/login, /reset-password, /tienda, /carrito, /checkout, /adopcion

## Rutas protegidas (con AuthGuard)
/home, /mascotas, /biopet/*, /perfil, /vet

## Convenciones
- Todo en español
- Toasts para feedback al usuario
- Mobile-first
- Siempre usar import.meta.env para keys
