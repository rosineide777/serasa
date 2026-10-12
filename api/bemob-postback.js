export async function sendBeMobPostback({ subid, value, orderId }) {
  if (!subid) {
    console.warn('BeMob Postback: subid não informado.');
    return;
  }

  const bemobDomain = process.env.BEMOB_POSTBACK_DOMAIN;
  if (!bemobDomain) {
    console.warn('BeMob Postback: Domínio do BeMob não configurado nas variáveis de ambiente.');
    return;
  }

  // Monta a URL de postback do BeMob usando o subid (cid) e valor da venda
  const url = `http://${bemobDomain}/postback?cid=${encodeURIComponent(subid)}&payout=${encodeURIComponent(value)}&txid=${encodeURIComponent(orderId)}`;

  try {
    const response = await fetch(url, { method: 'GET' });
    console.log('BeMob Postback enviado com sucesso, status:', response.status);
  } catch (err) {
    console.error('Erro ao enviar postback para o BeMob:', err);
  }
}