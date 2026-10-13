
import { extractTrackingId } from '../lib/tracking.js';
import { isDuplicateOrder } from '../lib/deduplication.js';
import { validateWebhookAuth } from '../lib/auth.js';
import { sendBeMobPostback } from './bemob-postback.js';
import { sendTikTokConversion } from './conversions/tiktok.js';
import { sendMetaConversion } from './conversions/meta.js';
import { sendGoogleConversion } from './conversions/google.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    if (!validateWebhookAuth(req)) {
      return res.status(401).json({
        success: false,
        error: 'Assinatura do webhook inválida'
      });
    }

    const body = req.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        error: 'Corpo da requisição inválido'
      });
    }

    const status = String(
      body.order_status || body.status || ''
    ).toLowerCase();

    if (!['paid', 'approved'].includes(status)) {
      return res.status(200).json({
        success: true,
        message: 'Pedido ignorado: status não aprovado.'
      });
    }

    const orderId = String(
      body.order_id || body.id || ''
    );

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Identificador do pedido ausente'
      });
    }

    const subid = extractTrackingId(body);

    const rawValue =
      body.Commissions?.charge_amount ??
      body.price ??
      body.order?.price ??
      0;

    const numericValue = Number(rawValue);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valor do pedido inválido'
      });
    }

    const value = body.Commissions?.charge_amount != null
      ? numericValue / 100
      : numericValue;

    const customer =
      body.Customer ||
      body.customer ||
      body.CustomerData ||
      {};

    const customerData = {
      email: customer.email || '',
      phone: customer.mobile || customer.phone || '',
      ip: customer.ip ||
        String(req.headers['x-forwarded-for'] || '')
          .split(',')[0]
          .trim(),
      userAgent: req.headers['user-agent'] || '',
      value,
      currency: body.currency || 'BRL',
      orderId,
      subid
    };

    if (await isDuplicateOrder(orderId)) {
      return res.status(200).json({
        success: true,
        message: 'Pedido já processado anteriormente.'
      });
    }

    const results = await Promise.allSettled([
      sendBeMobPostback({ subid, value, orderId }),
      sendTikTokConversion(customerData),
      sendMetaConversion(customerData),
      sendGoogleConversion(customerData)
    ]);

    const destinations = ['BeMob', 'TikTok', 'Meta', 'Google'];

    const failures = results
      .map((result, index) => {
        if (result.status === 'rejected') {
          console.error(
            `Falha no envio para ${destinations[index]}:`,
            result.reason
          );
          return destinations[index];
        }

        return null;
      })
      .filter(Boolean);

    return res.status(200).json({
      success: failures.length === 0,
      orderId,
      message: failures.length === 0
        ? 'Processamento concluído.'
        : 'Webhook recebido, mas houve falha em um ou mais destinos.',
      failedDestinations: failures
    });
  } catch (error) {
    console.error('Erro ao processar webhook Kiwify:', error);

    return res.status(500).json({
      success: false,
      error: 'Erro interno ao processar o webhook.'
    });
  }
}
