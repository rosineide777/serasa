/**
 * Valida o token configurado para o webhook da Kiwify.
 */
export function validateWebhookAuth(req) {
  const webhookSecret = process.env.KIWIFY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('KIWIFY_WEBHOOK_SECRET não configurado.');
    return false;
  }

  const query = req.query || {};

  const receivedToken =
    query.signature ||
    query.token ||
    query.secret ||
    req.headers['x-kiwify-token'];

  if (typeof receivedToken !== 'string') {
    return false;
  }

  return receivedToken === webhookSecret;
}