import crypto from 'crypto';

export async function sendMetaConversion({ email, phone, ip, userAgent, value, currency, orderId }) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('Meta: Credenciais não configuradas nas variáveis de ambiente.');
    return;
  }

  const hashedEmail = email ? crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex') : '';
  const hashedPhone = phone ? crypto.createHash('sha256').update(phone.replace(/\D/g, '')).digest('hex') : '';

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: orderId,
        action_source: 'website',
        user_data: {
          em: [hashedEmail],
          ph: [hashedPhone],
          client_ip_address: ip,
          client_user_agent: userAgent
        },
        custom_data: {
          value: Number(value),
          currency: currency || 'BRL'
        }
      }
    ]
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    console.log('Meta S2S Response:', result);
  } catch (err) {
    console.error('Erro ao enviar evento para o Meta:', err);
  }
}