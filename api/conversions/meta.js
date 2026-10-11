import crypto from "node:crypto";

function sha256(value) {
  return crypto
    .createHash("sha256")
    .update(String(value).trim().toLowerCase())
    .digest("hex");
}

export async function enviarCompraMeta({
  eventId,
  orderId,
  amount,
  currency = "BRL",
  email,
  phone,
  clientIp,
  userAgent,
  eventSourceUrl
}) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const apiVersion = process.env.META_API_VERSION || "v23.0";

  if (!pixelId || !accessToken) {
    throw new Error("Credenciais da Meta não configuradas.");
  }

  if (!eventId || !orderId || !Number.isFinite(Number(amount))) {
    throw new Error("Dados da compra inválidos.");
  }

  const userData = {};

  if (email) userData.em = [sha256(email)];
  if (phone) userData.ph = [sha256(phone)];
  if (clientIp) userData.client_ip_address = clientIp;
  if (userAgent) userData.client_user_agent = userAgent;

  const event = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: String(eventId),
    action_source: "website",
    user_data: userData,
    custom_data: {
      currency,
      value: Number(amount),
      order_id: String(orderId)
    }
  };

  if (eventSourceUrl) {
    event.event_source_url = eventSourceUrl;
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: [event]
      }),
      signal: AbortSignal.timeout(10000)
    }
  );

  const result = await response.json();

  if (!response.ok || result.events_received < 1) {
    throw new Error("A Meta não confirmou o recebimento da conversão.");
  }

  return { success: true };
}