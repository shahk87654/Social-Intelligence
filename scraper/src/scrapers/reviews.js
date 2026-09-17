function serpParams(params, apiKey) {
  return new URLSearchParams({ ...params, api_key: apiKey });
}

async function serpFetch(params, apiKey) {
  const response = await fetch(`https://serpapi.com/search.json?${serpParams(params, apiKey)}`);
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || `SerpAPI returned HTTP ${response.status}`);
  return data;
}

function parseReviewDate(dStr) {
  if (!dStr) return null;
  const s = String(dStr).replace(/[\u200e\u200f\u202a-\u202e]/g, "").trim();
  const now = new Date();
  // Relative times like "2 months ago", "3 days ago", "1 year ago"
  const m = s.match(/^(?:edited\s+)?(\d+|a|an)\s+(minute|hour|day|week|month|year)s?\s+ago$/i);
  if (m) {
    const n = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : 1;
    const unit = m[2].toLowerCase();
    switch (unit) {
      case 'minute': now.setMinutes(now.getMinutes() - n); break;
      case 'hour': now.setHours(now.getHours() - n); break;
      case 'day': now.setDate(now.getDate() - n); break;
      case 'week': now.setDate(now.getDate() - n * 7); break;
      case 'month': now.setMonth(now.getMonth() - n); break;
      case 'year': now.setFullYear(now.getFullYear() - n); break;
    }
    return now.toISOString();
  }
  if (/^today$/i.test(s)) return now.toISOString();
  if (/^yesterday$/i.test(s)) { now.setDate(now.getDate() - 1); return now.toISOString(); }
  const numericDate = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (numericDate) {
    const [, first, second, year] = numericDate;
    const month = Number(second);
    const day = Number(first);
    const parsedNumeric = new Date(Date.UTC(Number(year), month - 1, day));
    if (parsedNumeric.getUTCFullYear() === Number(year) &&
        parsedNumeric.getUTCMonth() === month - 1 &&
        parsedNumeric.getUTCDate() === day) {
      return parsedNumeric.toISOString();
    }
  }
  // Try parsing common absolute date strings
  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  return null;
}

/**
 * Finds a Google Maps place and imports the public review pages exposed by
 * SerpAPI. Pagination is followed when available; API limits still apply.
 */
export async function search(keyword, { beforeRequest, dataId, apiKey: providedApiKey } = {}) {
  const apiKey = providedApiKey || process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error("SERPAPI_KEY is not configured");

  const configuredDataId = dataId?.trim() || process.env.SERPAPI_GOOGLE_MAPS_DATA_ID?.trim();
  let matchedPlaces;
  if (configuredDataId) {
    matchedPlaces = [{ title: keyword, data_id: configuredDataId }];
  } else {
    if (beforeRequest && !(await beforeRequest())) {
      throw new Error("SerpAPI monthly search limit reached");
    }
    let places;
    try {
      places = await serpFetch({ engine: "google_maps", q: keyword, type: "search" }, apiKey);
    } catch (error) {
      if (error.message === "Google hasn't returned any results for this query.") {
        return { posts: [], note: `No Google Maps listing matched "${keyword}".` };
      }
      throw error;
    }
    const maxPlaces = Math.max(1, parseInt(process.env.SERPAPI_MAX_REVIEW_PLACES || "20", 10));
    matchedPlaces = (places.local_results || [])
      .filter((place) => place.place_id)
      .slice(0, maxPlaces);
  }
  if (!matchedPlaces.length) return { posts: [], note: "No Google Maps place found for this query." };

  const found = [];
  const seenReviewUrls = new Set();
  let quotaReached = false;
  for (const place of matchedPlaces) {
    let paginationToken;
    do {
      const params = {
        engine: "google_maps_reviews",
        ...(place.data_id ? { data_id: place.data_id } : { place_id: place.place_id }),
        sort_by: "newest",
      };
      if (paginationToken) params.pagination_token = paginationToken;
      if (beforeRequest && !(await beforeRequest())) {
        quotaReached = true;
        break;
      }
      const data = await serpFetch(params, apiKey);
      for (const review of data.reviews || []) {
        const reviewUrl = review.link || `${place.data_id || place.place_id}:${review.review_id || found.length}`;
        if (seenReviewUrls.has(reviewUrl)) continue;
        seenReviewUrls.add(reviewUrl);
        found.push({
          platform: "google_review",
          postUrl: reviewUrl,
          authorName: review.user?.name || null,
          authorUrl: review.user?.link || null,
          content: review.snippet || review.extracted_snippet?.original || null,
          postDate: parseReviewDate(review.iso_date) || parseReviewDate(review.date) || null,
          likes: review.likes ?? null,
          comments: null,
          shares: null,
        });
      }
      paginationToken = data.serpapi_pagination?.next_page_token;
    } while (paginationToken && !quotaReached);
    if (quotaReached) break;
  }

  return {
    posts: found,
    note: `Google Maps found ${found.length} public review(s) across ${matchedPlaces.length} matching place(s) for ${keyword}.${quotaReached ? " Monthly SerpAPI limit reached; results are partial." : ""}`,
  };
}
