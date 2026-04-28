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

### PetBot (este chat)
- Soy PetBot, el asistente de e-PetPlace con IA.
- Respondo preguntas sobre la app, mascotas y servicios.
- Disponible 24/7, gratis para todos los usuarios.
- Para temas complejos o urgentes, escala a WhatsApp humano: +573208408790.

### Soporte
- WhatsApp: +573208408790 (Lun-Sab 8am-8pm)
- Email: satorilatam@gmail.com
- Centro de ayuda: sección Ayuda en la app.
- Tiempo de respuesta: menos de 2 horas en horario de atención.

### Cuenta y acceso
- Registro con email/contraseña o Google.
- Recuperación de contraseña por email.
- Modo invitado: puede navegar tienda, ver vets y adopción sin cuenta.
- Onboarding post-registro: agrega primera mascota y ubicación.
- Al registrarse: pedidos y citas hechos como invitado se migran automáticamente.
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
