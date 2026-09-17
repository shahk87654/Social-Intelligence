import dns from "node:dns/promises";
import net from "node:net";

function isBlockedIp(address) {
  const normalized = address.toLowerCase();
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  if (net.isIPv6(address)) {
    return normalized === "::" || normalized === "::1" ||
      normalized.startsWith("fc") || normalized.startsWith("fd") ||
      normalized.startsWith("fe8") || normalized.startsWith("fe9") ||
      normalized.startsWith("fea") || normalized.startsWith("feb") ||
      normalized.startsWith("ff");
  }
  return true;
}

export async function validateWebhookEndpoint(endpoint) {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("Webhook endpoint must be a valid HTTPS URL.");
  }
  if (url.protocol !== "https:") throw new Error("Webhook endpoint must use HTTPS.");
  if (url.username || url.password || url.port === "0") throw new Error("Webhook endpoint contains unsupported URL credentials or port.");
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "metadata.google.internal") throw new Error("Webhook endpoint host is not allowed.");
  const records = net.isIP(hostname) ? [{ address: hostname }] : await dns.lookup(hostname, { all: true, verbatim: true });
  if (!records.length || records.some(({ address }) => isBlockedIp(address))) throw new Error("Webhook endpoint must resolve only to a public address.");
  return url.toString();
}
