/**
 * Extrai o subid / click_id do payload enviado pela Kiwify.
 */
export function extractTrackingId(body) {
  if (!body) return '';

  // 1. Tenta obter o src enviado diretamente ou na estrutura de Tracking da Kiwify
  const src = body.src || body.Tracking?.src || body.tracking_source || '';

  if (src) {
    return src.trim();
  }

  // 2. Fallback caso a Kiwify envie em parâmetros customizados (ex: Sck / Utm)
  const sck = body.sck || body.Tracking?.sck || '';
  if (sck) return sck.trim();

  return '';
}