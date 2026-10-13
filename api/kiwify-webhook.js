import { extractTrackingId } from '../lib/tracking.js';
import { validateWebhookAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    // 1. Valida a assinatura de segurança do webhook
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

    // 2. Verifica se a compra foi paga/aprovada
    const status = String(
      body.order_status || body.status || ''
    ).toLowerCase();

    if (!['paid', 'approved'].includes(status)) {
      return res.status(200).json({
        success: true,
        message: 'Pedido ignorado: status não aprovado.'
      });
    }

    const orderId = String(body.order_id || body.id || '');

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Identificador do pedido ausente'
      });
    }

    // 3. Extrai o ID de rastreamento do BeMob (clickid / subid / src)
    const subid = extractTrackingId(body);

    if (!subid) {
      console.log('Nenhum tracking ID (clickid/src) encontrado no webhook.');
      return res.status(200).json({
        success: true,
        message: 'Sem tracking ID para disparar postback'
      });
    }

    // 4. Extrai o valor da comissão/venda
    const rawValue =
      body.Commissions?.charge_amount ??
      body.price ??
      body.order?.price ??
      0;

    const numericValue = Number(rawValue);
    const value = body.Commissions?.charge_amount != null
      ? (numericValue / 100).toFixed(2)
      : numericValue.toFixed(2);

    // 5. Pega a URL do Postback do BeMob configurada na Vercel
    const bemobBaseUrl = process.env.BEMOB_POSTBACK_URL;

    if (!bemobBaseUrl) {
      console.error('BEMOB_POSTBACK_URL não configurada nas variáveis de ambiente.');
      return res.status(500).json({
        success: false,
        error: 'Configuração do BeMob ausente no servidor'
      });
    }

    // Monta a URL de Postback para o BeMob
    const separator = bemobBaseUrl.includes('?') ? '&' : '?';
    const postbackUrl = `${bemobBaseUrl}${separator}cid=${encodeURIComponent(subid)}&payout=${value}&txid=${encodeURIComponent(orderId)}`;

    console.log(`Disparando Postback para o BeMob: ${postbackUrl}`);

    // Dispara o Postback S2S para o BeMob
    const response = await fetch(postbackUrl);

    if (!response.ok) {
      throw new Error(`Erro ao enviar Postback BeMob (Status: ${response.status})`);
    }

    console.log('Postback enviado com sucesso para o BeMob!');

    return res.status(200).json({
      success: true,
      orderId,
      message: 'Postback enviado ao BeMob com sucesso.'
    });

  } catch (error) {
    console.error('Erro ao processar webhook Kiwify:', error);

    return res.status(500).json({
      success: false,
      error: 'Erro interno ao processar o webhook.'
    });
  }
}