
import crypto from 'crypto';

/**
 * Valida a assinatura do webhook da Kiwify.
 */
export function validateWebhookAuth(req) {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET;
  const query = req.query || {};

  let signature = query.signature || query.assinatura;

  // Se houver parâmetros repetidos, usa o último valor.
  if (Array.isArray(signature)) {
    signature = signature[signature.length - 1];
  }

  // Lê diretamente da URL se necessário.
  if (!signature && req.url) {
    try {
      const url = new URL(req.url, 'https://localhost');
      const signatures = url.searchParams.getAll('signature');
      const localized = url.searchParams.getAll('assinatura');
      const values = [...signatures, ...localized];

      signature = values.length
        ? values[values.length - 1]
        : '';
    } catch {
      console.error('Não foi possível interpretar a URL.');
      return false;
    }
  }

  if (
    !secret ||
    !req.body ||
    typeof signature !== 'string' ||
    !/^[a-f0-9]{40}$/i.test(signature)
  ) {
    console.error('Segredo, corpo ou assinatura inválidos.');
    return false;
  }

  const expected = crypto
    .createHmac('sha1', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  const receivedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
}
