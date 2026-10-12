import { extractTrackingId } from '../lib/tracking.js';
import { isDuplicateOrder } from '../lib/deduplication.js';
import { validateWebhookAuth } from '../lib/auth.js';
import { sendBeMobPostback } from './bemob-postback.js';
import { sendTikTokConversion } from './conversions/tiktok.js';
import { sendMetaConversion } from './conversions/meta.js';
import { sendGoogleConversion } from './conversions/google.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  if (!validateWebhookAuth(req)) {
    return res.status(401).json({ error: 'Autenticação inválida' });
  }

  try {
    const body = req.body;

    // Processa apenas vendas aprovadas / pagas
    const status = body.order_status || body.status;
    if (status !== 'paid' && status !== 'approved') {
      return res.status(200).json({ message: 'Status do pedido ignorado.' });
    }

    const orderId = body.order_id || body.id || '';

    // Verifica se esta ordem já foi processada
    if (isDuplicateOrder(orderId)) {
      return res.status(200).json({ message: 'Pedido já processado anteriormente.' });
    }

    const subid = extractTrackingId(body);
    const value = body.Commissions?.charge_amount ? body.Commissions.charge_amount / 100 : (body.price || 0);
    const currency = 'BRL';

    const customerData = {
      email: body.Customer?.email || '',
      phone: body.Customer?.mobile || body.Customer?.phone || '',
      ip: body.Customer?.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
      value,
      currency,
      orderId,
      subid
    };

    // Dispara em paralelo o postback do BeMob e as APIs do TikTok, Meta e Google
    await Promise.allSettled([
      sendBeMobPostback({ subid, value, orderId }),
      sendTikTokConversion(customerData),
      sendMetaConversion(customerData),
      sendGoogleConversion(customerData)
    ]);

    return res.status(200).json({ success: true, message: 'Evento S2S processado com sucesso.' });
  } catch (error) {
    console.error('Erro ao processar o webhook da Kiwify:', error);
    return res.status(500).json({ error: 'Erro interno do servidor S2S.' });
  }
}