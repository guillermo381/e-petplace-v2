const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const KNOWLEDGE = `
## e-PetPlace — Conocimiento completo de la app

### ¿Qué es e-PetPlace?
Ecosistema digital para mascotas. App móvil + web para Ecuador y LatAm.
Permite gestionar la salud de tus mascotas, comprar productos, agendar citas veterinarias y adoptar.

### Servicios disponibles hoy
- **Tienda**: productos de nutrición, accesorios, juguetes, salud. Envío 2-5 días hábiles Quito, 5-7 otras ciudades.
- **Veterinario**: agenda citas con veterinarios verificados. Se agregan al carrito y se pagan como productos.
- **Adopción**: mascotas de refugios reales. Se puede adoptar o donar para vacunas/esterilización/alimento.
- **Donaciones**: se agregan al carrito igual que productos. Van directo al refugio.

### Servicios próximamente
Guardería, Grooming, Paseos, Seguros, Wearables.

### Sección Mascotas — features clave
- **Grid de mascotas**: vista en cuadrícula 2x2 con foto, nombre, especie y edad.
- **Dashboard de mascota**: al tocar una mascota se abre su dashboard personal completo.
- **Índice de salud**: puntaje de 0-100% que se calcula automáticamente con:
  - +40 puntos base
  - +15 si tiene peso registrado
  - +10 si tiene fecha de nacimiento
  - +5 si tiene sexo registrado
  - +20 si tiene al menos una vacuna registrada
  - +10 si todas las vacunas están al día (no vencidas)
  - Máximo 100%. Verde = 80%+, Amarillo = 50-79%, Rojo = menos de 50%.
  - Para mejorar el índice: completa el perfil de la mascota, registra vacunas, actualiza el peso.
- **Estimado de alimento**: calcula días restantes de comida basado en el último pedido y el peso de la mascota (~20g/kg/día). Aparece solo si hay compra reciente de alimento.
- **Bio-expediente**: peso, fecha de nacimiento, sexo, especie, raza.
- **Historial médico**: vacunas con fecha aplicada, próxima dosis y veterinario.
- **Carnet digital**: genera un carnet visual con todos los datos de la mascota, descargable como PNG y compartible por WhatsApp.
- **Escaneo de carnet físico con IA**: toma foto del carnet de vacunas físico → Claude extrae automáticamente nombre de vacuna, fechas y veterinario → se importan todas las vacunas de una vez.
- **Editar mascota**: puedes editar todos los datos incluyendo foto. Las fotos se redimensionan automáticamente a máx 800px.
- **Alerta de vacuna**: punto amarillo en la card si hay vacuna vencida o que vence en menos de 7 días.

### Perfil de usuario
- Nombre, email, teléfono con código de país (WhatsApp o llamada).
- Dirección con Google Places (autocompletado).
- Avatar automático con iniciales y color único.
- Toggle modo claro/oscuro.
- Índice de completitud del perfil con campos pendientes.

### Carrito y Checkout
- Carrito persistente (localStorage), funciona sin cuenta.
- Guest checkout: compra sin registrarse ingresando solo email.
- Checkout en 4 pasos: datos → envío → pago → confirmación.
- Pre-población automática de datos del perfil al hacer checkout.
- Métodos de pago: tarjeta, transferencia, efectivo.

### Mis Pedidos
- Timeline de estados diferente según tipo:
  - Producto físico: Confirmado → Preparando → Listo para envío → En camino → Entregado.
  - Cita veterinaria: Confirmada → Recordatorio 24h → Completada.
  - Donación: Confirmada → Transferida al refugio → Impacto generado.
- Realtime: el estado se actualiza en vivo sin recargar.

### Alertas inteligentes (campana 🔔 en Home)
- Vacuna vencida: urgente (rojo).
- Vacuna vence en menos de 7 días: warning (amarillo).
- Vacuna vence en menos de 30 días: info (azul).
- Pedido activo en curso.
- Sugerencias IA si todo está al día.

### Adopción
- Mascotas reales de refugios aliados. Puedes filtrar por especie (Perros, Gatos, Aves, Conejos) o ver los Urgentes.
- Para adoptar: selecciona una mascota → "Quiero adoptarla" → formulario con datos personales y situación del hogar → se envía solicitud al refugio.
- Para donar: dentro de cada mascota hay botón "💛 Donar para su cuidado" con montos sugeridos (vacunas, esterilización, alimento) → se agrega al carrito y se paga normal.
- Las donaciones van directamente al refugio. El timeline en Mis Pedidos muestra: Confirmada → Transferida al refugio → Impacto generado.
- Requiere cuenta para adoptar. Las donaciones también requieren cuenta.

### Donaciones
- Se agregan al carrito como cualquier producto.
- En Mis Pedidos aparecen con badge "❤️ Donación" y mensaje especial "🌟 ¡Eres increíble! Tu donación va directo al refugio".
- Timeline de donación: 3 pasos (Confirmada → Transferida → Impacto generado), distinto al de productos físicos.
- Múltiples necesidades por mascota: vacunas ($15), esterilización ($35), alimento ($25) — el usuario puede elegir cuál apoyar.

### Foto de perfil
- En Perfil → toca el avatar → selecciona foto desde la galería o cámara.
- La foto se redimensiona automáticamente a máx 400px para ahorrar espacio.
- Se sube al bucket 'avatars' de Supabase Storage.
- Si no has subido foto, se muestra avatar automático con tus iniciales y un color único.

### Razas
- Tenemos más de 160 razas: 74+ perros, 42+ gatos, 23 aves, 22 conejos, 30 peces, 22 reptiles y otras.
- Al registrar una mascota debes seleccionar primero la especie para que aparezcan las razas disponibles.
- Si no encuentras la raza exacta, puedes escribir manualmente o seleccionar "Mestizo/Mixto".

### Centro de ayuda
- Disponible en la sección Ayuda de la app (ícono 🎧 en el menú).
- Tiene preguntas frecuentes organizadas por categoría: Pedidos, Veterinarios, App y cuenta, Pagos.
- Botón directo a WhatsApp para casos urgentes.
- También puedes hablar con PetBot (este chat) para respuestas instantáneas.

### Alertas inteligentes (campana 🔔 en Home)
- Toca la campana en la pantalla principal para ver todas tus alertas.
- Tipos de alerta: vacuna vencida (rojo 🔴), vacuna próxima en 7 días (amarillo 🟡), vacuna en 30 días (azul 🔵).
- También muestra si tienes un pedido activo en curso.
- Si todo está al día, aparecen sugerencias IA personalizadas.
- Las alertas se generan en tiempo real desde los datos de tus mascotas.

### Cross-sell y servicios relacionados
- En cada sección de la app verás un carrusel "También disponible" con otros servicios.
- Por ejemplo: en Veterinarios puedes ver Adopción; en Adopción puedes ver la Tienda.
- Los servicios en "próximamente" (Guardería, Grooming, Paseos, Seguros, Wearables) ya están visibles pero no activados.

### PetBot (este chat)
- Soy PetBot, el asistente inteligente de e-PetPlace con IA.
- Respondo preguntas sobre la app, mascotas, salud animal y servicios.
- Disponible 24/7, gratis para todos los usuarios.
- Puedo orientarte sobre el índice de salud de tu mascota, cómo registrar vacunas, cómo hacer pedidos, etc.
- Para temas complejos, urgencias médicas o problemas con pagos, escala a WhatsApp humano: +573208408790.

### Soporte
- WhatsApp: +573208408790 (Lun-Sab 8am-8pm)
- Email: satorilatam@gmail.com
- Centro de ayuda: sección Ayuda en la app (ícono 🎧).
- Tiempo de respuesta: menos de 2 horas en horario de atención.

### Cuenta y acceso
- Registro con email/contraseña o Google.
- Recuperación de contraseña por email (enlace de 1 hora de validez).
- Si iniciaste sesión con Google, no verás la opción de cambiar contraseña en tu perfil (es normal).
- Modo invitado: puede navegar tienda, ver vets y adopción sin cuenta.
- Onboarding post-registro: agrega primera mascota y ubicación (puedes hacerlo después).
- Al registrarse: pedidos y citas hechos como invitado se migran automáticamente.
- Para cerrar sesión: ve a Perfil → botón "Cerrar sesión" al fondo.
`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders });

  try {
    const { messages, contexto } = await req.json();
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('API key no configurada');

    const systemPrompt = `Eres PetBot, el asistente inteligente de e-PetPlace. Eres amable, empático y experto en mascotas y en la app.
Respondes en español, de forma concisa y útil (máx 3 párrafos cortos).
Nunca inventas información. Si algo no está en tu conocimiento, dices que lo verificarás y sugieres WhatsApp: +573208408790.
Usa emojis con moderación para ser más cercano 🐾.

CONTEXTO DEL USUARIO EN ESTE MOMENTO:
- Página actual: ${contexto?.pagina ?? 'desconocida'}
- Email: ${contexto?.email ?? 'invitado'}
- Mascotas registradas: ${contexto?.mascotas ?? 'ninguna'}
- Pedidos activos: ${contexto?.pedidosActivos ?? 'ninguno'}

Adapta tu respuesta al contexto — si está en Mis Pedidos, prioriza info de pedidos. Si está en Mascotas, prioriza info de mascotas y salud.

CONOCIMIENTO DE LA APP:
${KNOWLEDGE}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text ?? 'Lo siento, intenta de nuevo.';
    return new Response(JSON.stringify({ text }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
