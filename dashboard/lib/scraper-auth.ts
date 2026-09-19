import crypto from "node:crypto";

function secret() {
  const value = process.env.SCRAPER_SHARED_SECRET;
  if (!value || value.length < 32) throw new Error("SCRAPER_SHARED_SECRET must be at least 32 characters.");
  return value;
}

export function signScraperRequest(timestamp: string, body: string) {
  return crypto.createHmac("sha256", secret()).update(`${timestamp}.${body}`).digest("hex");
}

export function scraperHeaders(body: string) {
  const timestamp = String(Date.now());
  return {
    "Content-Type": "application/json",
    "X-Scraper-Timestamp": timestamp,
    "X-Scraper-Signature": signScraperRequest(timestamp, body),
  };
}
