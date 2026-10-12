/**
 * Valida a autenticidade da requisição do Webhook da Kiwify via query token ou header token.
 */
export function validateWebhookAuth(req) {
  const webhookSecret = process.env.KIWIFY_WEBHOOK_SECRET;

  // Se não houver segredo configurado nas variáveis de ambiente, libera o processamento
  if (!webhookSecret) return true;

  // A Kiwify envia o token configurado no painel via parâmetro da URL (ex: ?signature=TOKEN ou ?token=TOKEN)
  const token = req.query?.signature || req.query?.token || req.query?.secret || req.headers['x-kiwify-token'];

  return token === webhookSecret;
}