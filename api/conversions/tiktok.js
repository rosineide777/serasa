import crypto from 'crypto';

export async function sendTikTokConversion({ email, phone, ip, userAgent, value, currency, orderId }) {
  const pixelCode = process.env.TIKTOK_PIXEL_ID;
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

  if (!pixelCode || !accessToken) {
    console.warn('TikTok: Credenciais não configuradas nas variáveis de ambiente.');
    return;
  }

  const hashedEmail = email ? crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex') : '';
  const hashedPhone = phone ? crypto.createHash('sha256').update(phone.replace(/\D/g, '')).digest('hex') : '';

  const payload = {
    pixel_code: pixelCode,
    event: 'CompletePayment',
    event_id: orderId,
    timestamp: new Date().toISOString(),
    context: {
      user: {
        email: hashedEmail,
        phone_number: hashedPhone,
        ip: ip,
        user_agent: userAgent
      }
    },
    properties: {
      value: Number(value),
      currency: currency || 'BRL'
    }
  };

  try {
    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': accessToken
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    console.log('TikTok S2S Response:', result);
  } catch (err) {
    console.error('Erro ao enviar evento para o TikTok:', err);
  }
}