import CONFIG from "@/config";

function readTokens(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORDER_ACCESS_TOKENS) || "{}");
  } catch {
    return {};
  }
}

export function rememberOrderAccess(orderId: number, accessToken?: string) {
  if (!orderId || !accessToken) return;
  const tokens = readTokens();
  tokens[String(orderId)] = accessToken;
  localStorage.setItem(CONFIG.STORAGE_KEYS.ORDER_ACCESS_TOKENS, JSON.stringify(tokens));
}

export function getOrderAccessToken(orderId?: number) {
  if (!orderId) return "";
  return readTokens()[String(orderId)] || "";
}

export function orderAccessHeaders(orderId?: number) {
  const headers: Record<string, string> = {};
  const token = typeof window !== "undefined" ? localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN) : "";
  const orderAccessToken = getOrderAccessToken(orderId);
  if (token) headers.Authorization = `Bearer ${token}`;
  if (orderAccessToken) headers["X-Order-Access-Token"] = orderAccessToken;
  return headers;
}
