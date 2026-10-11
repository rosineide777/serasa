
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      success: false,
      message: "Método não permitido."
    });
  }

  try {
    const payload = req.body;

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return res.status(400).json({
        success: false,
        message: "Payload inválido."
      });
    }

    const event = payload.webhook_event_type;
    const orderId = payload.order_id;
    const status = payload.order_status;

    // Não registrar dados pessoais ou informações de pagamento.
    console.log("[KIWIFY_WEBHOOK]", {
      received: true,
      event: typeof event === "string" ? event : "unknown",
      orderId: typeof orderId === "string" ? orderId : null,
      status: typeof status === "string" ? status : "unknown",
      timestamp: new Date().toISOString()
    });

    if (typeof event !== "string" || typeof orderId !== "string" || !orderId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Evento ou identificador do pedido inválido."
      });
    }

    if (event !== "order_approved" || status !== "paid") {
      return res.status(200).json({
        success: true,
        processed: false,
        message: "Evento recebido; não é uma compra aprovada."
      });
    }

    // A venda ainda não é processada: faltam autenticação,
    // deduplicação persistente e conexão com os provedores.
    return res.status(200).json({
      success: true,
      processed: false,
      order_id: orderId,
      message: "Compra aprovada recebida; processamento pendente."
    });
  } catch (error) {
    console.error("[KIWIFY_WEBHOOK] Erro interno:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao receber o webhook."
    });
  }
}
