import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

/**
 * Verifica no Redis se o orderId já foi processado.
 */
export async function isDuplicateOrder(orderId) {
  if (!orderId) return false;

  const key = `order:${orderId}`;
  
  // Tenta gravar com trava de 24h (86400 segundos) se a chave não existir (NX)
  const setSuccess = await redis.set(key, 'processed', { ex: 86400, nx: true });

  // Se setSuccess for null/false, significa que a chave já existia (pedido duplicado)
  return !setSuccess;
}