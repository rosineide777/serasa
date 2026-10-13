
import crypto from 'crypto';

/**
 * Valida a assinatura do webhook da Kiwify.
 */
export function validateWebhookAuth(req) {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET;
  const query = req.query || {};

  console.log('Formato dos parâmetros:', {
    chaves: Object.keys(query),
    assinaturaTipo: typeof query.assinatura,
    assinaturaArray: Array.isArray(query.assinatura),
    signatureTipo: typeof query.signature,
    signatureArray: Array.isArray(query.signature)
  });

  let signature = query.signature || query.assinatura;

  if (Array.isArray(signature)) {
    signature = signature[0];
  }

  if (signature && typeof signature === 'object') {
    signature =
      signature.value ||
      signature.signature ||
      signature.assinatura ||
      '';
  }

  if (!signature && req.url) {
    try {
      const url = new URL(req.url, 'https://localhost');
      signature =
        url.searchParams.get('signature') ||
        url.searchParams.get('assinatura') ||
        '';
    } catch {
      console.error('Falha ao interpretar a URL.');
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

  if (!secret || !req.body || typeof signature !== 'string') {
    console.error('Segredo, corpo ou assinatura ausente.');
    return false;
  }

  if (!/^[a-f0-9]{40}$/i.test(signature)) {
    console.error('Formato da assinatura não corresponde a 40 caracteres hexadecimais.');
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
