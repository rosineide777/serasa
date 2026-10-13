
import crypto from 'crypto';

/**
 * Valida a assinatura do webhook da Kiwify.
 */
export function validateWebhookAuth(req) {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET;

  const query = req.query || {};
  let signature =
    query.signature ||
    query.assinatura;

  // Normaliza a assinatura caso venha como array.
  if (Array.isArray(signature)) {
    signature = signature[0];
  }

  // Normaliza caso venha como objeto.
  if (signature && typeof signature === 'object') {
    signature =
      signature.value ||
      signature.signature ||
      signature.assinatura ||
      '';
  }

  // Alternativa: lê a assinatura diretamente da URL.
  if (!signature && req.url) {
    try {
      const url = new URL(req.url, 'https://localhost');

      signature =
        url.searchParams.get('signature') ||
        url.searchParams.get('assinatura') ||
        '';
    } catch (error) {
      console.error('Não foi possível interpretar a URL.');
      return false;
    }
  }

  console.log('Diagnóstico Kiwify:', {
    secretConfigurado: Boolean(secret),
    assinaturaEncontrada: Boolean(signature),
    tipoAssinatura: typeof signature,
    tamanhoAssinatura:
      typeof signature === 'string' ? signature.length : 0
  });

  if (
    !secret ||
    !req.body ||
    typeof signature !== 'string' ||
    !/^[a-f0-9]{40}$/i.test(signature)
  ) {
    console.error('Segredo, corpo ou formato da assinatura inválido.');
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
