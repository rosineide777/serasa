// lib/deduplication.js
// Armazenamento simples em memória para evitar requisições duplicadas

const processedEvents = new Set();
const CLEANUP_INTERVAL = 3600000; // Limpa a memória a cada 1 hora

setInterval(() => {
  processedEvents.clear();
}, CLEANUP_INTERVAL);

export async function isDuplicateOrder(eventId) {
  if (!eventId) return false;
  
  if (processedEvents.has(eventId)) {
    return true; // É duplicado
  }
  
  processedEvents.add(eventId);
  return false; // Não é duplicado
}