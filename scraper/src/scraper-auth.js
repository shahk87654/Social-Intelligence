import crypto from "node:crypto";

function secret() {
  const value = process.env.SCRAPER_SHARED_SECRET;
  if (!value || value.length < 32) throw new Error("SCRAPER_SHARED_SECRET must be at least 32 characters.");
  return value;
}

export function verifyScraperRequest(req) {
  const timestamp = req.get("x-scraper-timestamp");
  const signature = req.get("x-scraper-signature");
  const rawBody = JSON.stringify(req.body || {});
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Date.now() - Number(timestamp)) > 5 * 60 * 1000) return false;
  const expected = crypto.createHmac("sha256", secret()).update(`${timestamp}.${rawBody}`).digest("hex");
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
