
import crypto from 'crypto';

export function validateWebhookAuth(req) {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET;

  let signature =
    req.query?.signature ||
    req.query?.assinatura;

  // Alternativa: ler diretamente a URL recebida.
  if (!signature && req.url) {
    const url = new URL(req.url, 'https://localhost');
    signature =
      url.searchParams.get('signature') ||
      url.searchParams.get('assinatura');
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

  const received = Buffer.from(signature, 'hex');
  const calculated = Buffer.from(expected, 'hex');

  return crypto.timingSafeEqual(received, calculated);
}
