export async function enviarCompraTikTok({
  eventId,
  orderId,
  amount,
  currency = "BRL",
  email,
  phone,
  ip,
  userAgent
}) {
  const pixelCode = process.env.TIKTOK_PIXEL_CODE;
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

  if (!pixelCode || !accessToken) {
    throw new Error("Credenciais do TikTok não configuradas.");
  }

  if (!eventId || !orderId || !Number.isFinite(Number(amount))) {
    throw new Error("Dados da compra inválidos.");
  }

  const user = {};

  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (ip) user.ip = ip;
  if (userAgent) user.user_agent = userAgent;

  const payload = {
    event_source: "web",
    event_source_id: pixelCode,
    data: [
      {
        event: "CompletePayment",
        event_time: Math.floor(Date.now() / 1000),
        event_id: String(eventId),
        user,
        properties: {
          currency,
          value: Number(amount),
          order_id: String(orderId)
        }
      }
    ]
  };

  const response = await fetch(
    "https://business-api.tiktok.com/open_api/v1.3/event/track/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    }
  );

  const result = await response.json();

  if (!response.ok || result.code !== 0) {
    throw new Error("O TikTok não confirmou o envio da conversão.");
  }

  return { success: true };
}