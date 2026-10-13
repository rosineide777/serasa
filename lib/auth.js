
import crypto from 'crypto';

/**
 * Valida a assinatura do webhook da Kiwify.
 */
export function validateWebhookAuth(req) {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET;

  if (!secret || !req.body) {
    console.error('Segredo ou corpo do webhook ausente.');
    return false;
  }

  const query = req.query || {};
  const signature = query.signature || query.assinatura;

  if (
    typeof signature !== 'string' ||
    !/^[a-f0-9]{40}$/i.test(signature)
  ) {
    console.error('Assinatura Kiwify ausente ou inválida.');
    return false;
  }

  const expected = crypto
    .createHmac('sha1', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  const receivedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}
