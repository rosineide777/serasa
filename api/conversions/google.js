export async function sendGoogleConversion({ value, currency, orderId, subid }) {
  const conversionId = process.env.GOOGLE_CONVERSION_ID;
  const apiSecret = process.env.GOOGLE_API_SECRET;

  if (!conversionId || !apiSecret) {
    console.warn('Google: Credenciais não configuradas nas variáveis de ambiente.');
    return;
  }

  const payload = {
    client_id: subid || orderId,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: orderId,
          value: Number(value),
          currency: currency || 'BRL'
        }
      }
    ]
  };

  try {
    const response = await fetch(`https://www.google-analytics.com/mp/collect?api_secret=${apiSecret}&measurement_id=${conversionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('Google S2S enviado com status:', response.status);
  } catch (err) {
    console.error('Erro ao enviar evento para o Google:', err);
  }
}