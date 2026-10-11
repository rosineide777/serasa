export async function enviarConversaoBeMob({
  clickId,
  orderId,
  payout,
  currency = "BRL"
}) {
  const postbackUrl = process.env.BEMOB_POSTBACK_URL;

  if (!postbackUrl) {
    throw new Error("BEMOB_POSTBACK_URL não configurada.");
  }

  if (
    typeof clickId !== "string" ||
    !clickId.trim() ||
    typeof orderId !== "string" ||
    !orderId.trim()
  ) {
    throw new Error("Click ID ou identificador do pedido inválido.");
  }

  const url = new URL(postbackUrl);

  url.searchParams.set("cid", clickId);
  url.searchParams.set("payout", String(Number(payout) || 0));
  url.searchParams.set("txid", orderId);
  url.searchParams.set("currency", currency);

  const response = await fetch(url.toString(), {
    method: "GET",
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`Falha no postback BeMob: HTTP ${response.status}`);
  }

  return { success: true };
}

export default async function handler(req, res) {
  return res.status(501).json({
    success: false,
    message: "Endpoint ainda não conectado ao webhook da Kiwify."
  });
}