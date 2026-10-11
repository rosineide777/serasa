export async function enviarCompraGoogle({
  orderId,
  amount,
  currency = "BRL",
  conversionDateTime,
  email
}) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const conversionActionId = process.env.GOOGLE_ADS_CONVERSION_ACTION_ID;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const accessToken = process.env.GOOGLE_ADS_ACCESS_TOKEN;

  if (
    !customerId ||
    !conversionActionId ||
    !developerToken ||
    !accessToken
  ) {
    throw new Error("Credenciais do Google Ads não configuradas.");
  }

  if (
    !orderId ||
    !Number.isFinite(Number(amount)) ||
    Number(amount) < 0
  ) {
    throw new Error("Dados da compra inválidos.");
  }

  // O envio real depende da configuração da ação de conversão
  // e da autenticação OAuth da conta Google Ads.
  return {
    success: false,
    configured: false,
    message:
      "Envio pendente: precisamos configurar OAuth, ação de conversão e atribuição do clique."
  };
}