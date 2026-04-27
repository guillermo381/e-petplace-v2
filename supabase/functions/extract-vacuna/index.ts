const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const { imageBase64, mediaType } = await req.json()

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 requerido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key no configurada' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('API key length:', apiKey.length)
    console.log('Image size:', imageBase64.length)

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType ?? 'image/jpeg',
                data: imageBase64,
              }
            },
            {
              type: 'text',
              text: `Eres un experto en carnets de vacunación veterinaria latinoamericanos.
Esta imagen muestra un carnet de vacunas con columnas: FECHA, TIPO-LOTE, FIRMA.
Extrae TODAS las vacunas que puedas leer y devuelve un array JSON.
El formato de fechas en el carnet es DD/MM/YY o DD/ENE/YY etc (meses en español abreviados).
Convierte todas las fechas a formato YYYY-MM-DD.

Responde SOLO con este JSON sin texto adicional ni backticks:
{"vacunas":[{"nombre":"","fecha_aplicada":"YYYY-MM-DD","fecha_proxima":"YYYY-MM-DD","veterinario":""}]}

Notas importantes:
- El nombre de la vacuna está en TIPO-LOTE (ej: Rabisin, Nobivac, etc)
- La fecha próxima generalmente es 1 año después de la aplicada
- El veterinario/clínica está en la cabecera de cada sección (ej: CPA TEUSAQUILLO)
- Si no puedes leer un dato déjalo vacío
- ENE=enero=01, FEB=02, MAR=03, ABR=04, MAY=05, JUN=06, JUL=07, AGO=08, SEP=09, OCT=10, NOV=11, DIC=12`
            }
          ]
        }]
      })
    })

    console.log('Anthropic status:', anthropicRes.status)
    const responseText = await anthropicRes.text()
    console.log('Anthropic response:', responseText)

    if (!anthropicRes.ok) {
      return new Response(JSON.stringify({ error: `Anthropic ${anthropicRes.status}`, detail: responseText }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = JSON.parse(responseText)
    const text = data.content?.[0]?.text ?? '{}'
    const clean = text.replace(/```json|```/g, '').trim()

    let parsed: { vacunas: unknown[] } = { vacunas: [] }
    try {
      const json = JSON.parse(clean)
      if (json.vacunas) {
        parsed = json
      } else if (json.nombre) {
        parsed = { vacunas: [json] }
      }
    } catch { parsed = { vacunas: [] } }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Error:', String(err))
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
