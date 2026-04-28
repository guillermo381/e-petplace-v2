const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders });

  try {
    const { messages, contexto } = await req.json();
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('API key no configurada');

    const systemPrompt = `Eres el asistente de soporte de e-PetPlace, una app de mascotas en Ecuador/LatAm.
Eres amable, empático y experto en mascotas. Respondes en español, de forma concisa (máx 3 párrafos cortos).
Nunca inventas información. Si no sabes algo, dices que lo verificarás y sugieres contactar por WhatsApp: +573208408790.

Información del usuario:
- Página actual: ${contexto?.pagina ?? 'desconocida'}
- Email: ${contexto?.email ?? 'invitado'}
- Mascotas: ${contexto?.mascotas ?? 'ninguna'}
- Pedidos activos: ${contexto?.pedidosActivos ?? 'ninguno'}

Servicios de e-PetPlace: Tienda de mascotas, Veterinarios online, Adopción, Guardería (pronto), Grooming (pronto), Paseos (pronto), Seguros (pronto), Wearables (pronto).
Soporte: Lun-Sab 8am-8pm. WhatsApp: +573208408790. Email: satorilatam@gmail.com.
Entregas: 2-5 días hábiles Quito, 5-7 días otras ciudades.`;

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
