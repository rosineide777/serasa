export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      success: false,
      message: "Método não permitido."
    });
  }

  const payload = req.body;

  if (!payload || typeof payload !== "object") {
    return res.status(400).json({
      success: false,
      message: "Payload inválido."
    });
  }

  const event = payload.webhook_event_type;
  const status = payload.order_status;
  const orderId = payload.order_id;

  if (event !== "order_approved" || status !== "paid") {
    return res.status(200).json({
      success: true,
      processed: false,
      message: "Evento recebido, mas não é uma compra aprovada."
    });
  }

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: "Identificador do pedido ausente."
    });
  }

  return res.status(200).json({
    success: true,
    processed: false,
    message: "Compra aprovada recebida. Integrações ainda não configuradas."
  });
}