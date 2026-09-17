function platformForUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname === "facebook.com" || hostname.endsWith(".facebook.com")) return "facebook";
    if (hostname === "instagram.com" || hostname.endsWith(".instagram.com")) return "instagram";
    if (/(news|times|post|journal|herald|tribune|gazette|reuters|bbc|cnn|forbes|bloomberg)\./i.test(hostname)) {
      return "article";
    }
    return "website";
  } catch {
    return null;
  }
}

function extractCount(text, labels) {
  const labelPattern = labels.join("|");
  const match = text.match(new RegExp(`([\\d,.]+)\\s*([KM])?\\s*(?:${labelPattern})`, "i"));
  if (!match) return null;
  const value = Number.parseFloat(match[1].replace(/,/g, ""));
  if (!Number.isFinite(value)) return null;
  const multiplier = match[2]?.toUpperCase() === "M" ? 1_000_000 : match[2] ? 1_000 : 1;
  return Math.round(value * multiplier);
}

function addResults(found, seen, results, expectedPlatform) {
  for (const result of results) {
    const resultUrl = result.link;
    const resultPlatform = platformForUrl(resultUrl);
    if (resultPlatform !== expectedPlatform || seen.has(resultUrl)) continue;
    seen.add(resultUrl);
    const text = [result.title, result.snippet].filter(Boolean).join(" — ");

    found.push({
      platform: resultPlatform,
      postUrl: resultUrl,
      authorName: result.title || null,
      authorUrl: resultUrl,
      content: text.slice(0, 5000),
      postDate: result.date || null,
      likes: extractCount(text, ["likes?", "reactions?"]),
      comments: extractCount(text, ["comments?"]),
      shares: extractCount(text, ["shares?"]),
    });
  }
}

/**
 * Discover public Facebook and Instagram URLs through SerpAPI's Google
 * results. SerpAPI handles the search-engine interaction; this service only
 * consumes the returned public links and snippets.
 */
export async function search(keyword, platforms, providedApiKey) {
  const apiKey = providedApiKey || process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error("SERPAPI_KEY is not configured");

  const found = [];
  const requested = new Set(platforms);
  const params = new URLSearchParams({
    engine: "google",
    q: keyword,
    num: "20",
    api_key: apiKey,
  });
  const response = await fetch(`https://serpapi.com/search.json?${params}`);
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || `SerpAPI returned HTTP ${response.status}`);
  }

  const seen = new Set();
  for (const result of data.organic_results || []) {
    const platform = platformForUrl(result.link);
    if (!platform || !requested.has(platform) || seen.has(result.link)) continue;
    addResults(found, seen, [result], platform);
  }

  return { posts: found, note: `SerpAPI found ${found.length} public result(s).` };
}
