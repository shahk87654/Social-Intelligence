/**
 * Every platform scraper exports:
 *   async function search(keyword, targets, context) -> NormalizedPost[]
 *
 * NormalizedPost shape (all fields optional except platform/postUrl/content):
 * {
 *   platform: 'facebook' | 'instagram',
 *   postUrl: string,        // canonical, unique per post
 *   authorName: string,
 *   authorUrl: string,
 *   content: string,
 *   postDate: string|null,  // ISO string if parseable, else null
 *   likes: number,
 *   comments: number,
 *   shares: number,
 * }
 *
 * `targets` is an optional array of specific public URLs/handles to scope
 * the search to (e.g. a company's own Page). If empty, the scraper falls
 * back to whatever logged-out keyword search the platform exposes, which
 * for Instagram in particular is effectively nothing (see README).
 *
 * Scrapers must:
 *  - never log in / use session cookies from a real account
 *  - never attempt to bypass a CAPTCHA or login wall — if one appears,
 *    stop and return whatever was already collected
 *  - respect REQUEST_DELAY_MS between navigations
 */

export function parseCount(raw) {
  if (!raw) return 0;
  const s = String(raw).trim().toUpperCase().replace(/,/g, "");
  const m = s.match(/^([\d.]+)([KM]?)$/);
  if (!m) return parseInt(s, 10) || 0;
  const [, num, suffix] = m;
  const n = parseFloat(num);
  if (suffix === "K") return Math.round(n * 1_000);
  if (suffix === "M") return Math.round(n * 1_000_000);
  return Math.round(n);
}

export const delay = (ms) => new Promise((res) => setTimeout(res, ms));
