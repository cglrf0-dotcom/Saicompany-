const SYSTEM_PROMPT = `Eres SAI, el asistente de SAI Company. Responde siempre en español, de forma clara, breve y útil. Si no tienes datos reales del workspace, indícalo y ofrece una guía práctica.`;

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método no permitido.' });
  }

  const message = typeof request.body?.message === 'string' ? request.body.message.trim() : '';
  if (!message || message.length > 4_000) {
    return response.status(400).json({ error: 'Envía un mensaje de hasta 4.000 caracteres.' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return response.status(503).json({ error: 'El asistente aún no está configurado.' });
  }

  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        instructions: SYSTEM_PROMPT,
        input: message,
      }),
    });

    const result = await openaiResponse.json();
    if (!openaiResponse.ok) {
      console.error('OpenAI request failed:', result?.error?.message || openaiResponse.status);
      return response.status(502).json({ error: 'No fue posible obtener una respuesta del modelo.' });
    }

    const text = result.output_text?.trim();
    if (!text) {
      return response.status(502).json({ error: 'El modelo no devolvió texto.' });
    }
    return response.status(200).json({ message: text });
  } catch (error) {
    console.error('Chat request failed:', error);
    return response.status(500).json({ error: 'Error al conectar con el asistente.' });
  }
}
