import pg from "pg";
import "dotenv/config";
import crypto from "node:crypto";

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const positiveWords = ["good", "great", "excellent", "love", "success", "win", "helpful", "happy", "positive"];
const negativeWords = ["bad", "hate", "terrible", "angry", "scam", "fraud", "broken", "negative", "complaint", "problem"];

function tokens(content) {
  return String(content || "").toLowerCase();
}

function classifySentiment(content) {
  const text = tokens(content);
  const positive = positiveWords.filter((word) => text.includes(word)).length;
  const negative = negativeWords.filter((word) => text.includes(word)).length;
  return negative > positive ? "negative" : positive > negative ? "positive" : "neutral";
}

function sentimentScore(content) {
  const text = tokens(content);
  const positive = positiveWords.filter((word) => text.includes(word)).length;
  const negative = negativeWords.filter((word) => text.includes(word)).length;
  return Math.max(-1, Math.min(1, (positive - negative) / 5));
}

function isSpam(content) {
  const text = tokens(content);
  return text.length > 0 && (text.includes("buy now") || text.includes("click here") || text.includes("limited offer"));
}

function sourceQuality(post) {
  const engagement = Number(post.likes || 0) + Number(post.comments || 0) * 2 + Number(post.shares || 0) * 3;
  return Math.max(10, Math.min(100, 40 + Math.min(35, Math.round(Math.log10(engagement + 1) * 12)) + (post.authorName ? 15 : 0) + (post.postUrl ? 10 : 0)));
}

function contentFingerprint(post) {
  const normalized = `${post.authorName || ""}|${post.content || ""}`
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length >= 40 ? crypto.createHash("sha256").update(normalized).digest("hex") : null;
}

async function dispatchWebhookEvent(organizationId, event, data) {
  const { rows } = await pool.query(
    `SELECT endpoint_url, secret FROM webhooks
     WHERE organization_id = $1 AND enabled = true AND ($2 = ANY(events) OR cardinality(events) = 0)`,
    [organizationId, event]
  );
  const payload = JSON.stringify({ event, data, occurredAt: new Date().toISOString() });
  await Promise.allSettled(rows.map(async (webhook) => {
    const signature = crypto.createHmac("sha256", webhook.secret).update(payload).digest("hex");
    try {
      const response = await fetch(webhook.endpoint_url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-webhook-signature": `sha256=${signature}` },
        body: payload,
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.error(`webhook delivery failed for ${webhook.endpoint_url}:`, error.message);
    }
  }));
}

export async function createScanRun(keyword, platforms, organizationId) {
  const { rows } = await pool.query(
    `INSERT INTO scan_runs (organization_id, keyword, platforms, status) VALUES ($1, $2, $3, 'running') RETURNING id`,
    [organizationId, keyword, platforms]
  );
  return rows[0].id;
}

export async function finishScanRun(id, { status, error = null, postsFound = 0 }) {
  await pool.query(
    `UPDATE scan_runs SET status = $2, error = $3, posts_found = $4, finished_at = now() WHERE id = $1`,
    [id, status, error, postsFound]
  );
}

export async function evaluateAlerts(keyword, status, postsFound = 0, organizationId) {
  const { rows: rules } = await pool.query(
    `SELECT id, organization_id, name, rule_type, keyword, threshold
     FROM alert_rules WHERE enabled = true AND organization_id = $1`,
    [organizationId]
  );
  for (const rule of rules) {
    if (rule.keyword && !keyword.toLowerCase().includes(String(rule.keyword).toLowerCase())) continue;
    let shouldAlert = false;
    let message = "";
    let severity = "info";
    if (rule.rule_type === "scan_failure" && status === "failed") {
      shouldAlert = true;
      message = `The scan for "${keyword}" failed.`;
      severity = "critical";
    } else if (rule.rule_type === "new_mention" && postsFound > 0) {
      shouldAlert = true;
      message = `${postsFound} new mention${postsFound === 1 ? "" : "s"} found for "${keyword}".`;
    } else if (rule.rule_type === "volume_spike" && postsFound >= (rule.threshold || 10)) {
      shouldAlert = true;
      message = `${postsFound} mentions found for "${keyword}", above the configured threshold.`;
      severity = "warning";
    } else if (rule.rule_type === "negative_sentiment") {
      const negative = await pool.query(
        `SELECT COUNT(*)::int AS count FROM posts
         WHERE organization_id = $2 AND sentiment = 'negative' AND scraped_at >= now() - interval '24 hours'
         AND ($1::text IS NULL OR matched_keyword ILIKE '%' || $1 || '%')`,
        [rule.keyword, organizationId]
      );
      if (negative.rows[0].count >= (rule.threshold || 1)) {
        shouldAlert = true;
        message = `${negative.rows[0].count} negative mention${negative.rows[0].count === 1 ? "" : "s"} detected in the last 24 hours.`;
        severity = "critical";
      }
    }
    if (shouldAlert) {
      await pool.query(
        `INSERT INTO alerts (organization_id, rule_id, title, message, severity)
         SELECT $1, $2, $3, $4, $5
         WHERE NOT EXISTS (
           SELECT 1 FROM alerts WHERE organization_id = $1 AND rule_id = $2 AND message = $4 AND created_at >= now() - interval '1 hour'
         )`,
        [rule.organization_id, rule.id, rule.name, message, severity]
      );
      void dispatchWebhookEvent(organizationId, "alert.created", { ruleId: rule.id, title: rule.name, message, severity })
        .catch((error) => console.error("alert webhook dispatch failed:", error.message));
    }
  }
}

// Upsert on (platform, post_url) so re-scanning doesn't duplicate rows;
// engagement counts are refreshed on conflict since they change over time.
export async function upsertPosts(scanRunId, keyword, posts, organizationId) {
  let count = 0;
  for (const p of posts) {
    const parsedDate = p.postDate ? new Date(String(p.postDate).replace(/[\u200e\u200f\u202a-\u202e]/g, "")) : null;
    const postDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null;
    const fingerprint = contentFingerprint(p);
    const duplicate = fingerprint
      ? (await pool.query(
          "SELECT EXISTS (SELECT 1 FROM posts WHERE organization_id = $1 AND content_fingerprint = $2 AND post_url <> $3) AS duplicate",
          [organizationId, fingerprint, p.postUrl]
        )).rows[0].duplicate
      : false;
    await pool.query(
      `INSERT INTO posts
         (organization_id, scan_run_id, platform, post_url, author_name, author_url, group_name, group_url, content,
          matched_keyword, post_date, likes, comments, shares, sentiment, sentiment_score,
          is_duplicate, is_spam, source_quality_score, content_fingerprint)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (organization_id, platform, post_url) DO UPDATE SET
         likes = EXCLUDED.likes,
         comments = EXCLUDED.comments,
         shares = EXCLUDED.shares,
         group_name = EXCLUDED.group_name,
         group_url = EXCLUDED.group_url,
         content = EXCLUDED.content,
         sentiment = EXCLUDED.sentiment,
         sentiment_score = EXCLUDED.sentiment_score,
         is_duplicate = EXCLUDED.is_duplicate,
         is_spam = EXCLUDED.is_spam,
         source_quality_score = EXCLUDED.source_quality_score,
         content_fingerprint = EXCLUDED.content_fingerprint,
         scraped_at = now()`,
      [
        organizationId,
        scanRunId,
        p.platform,
        p.postUrl,
        p.authorName ?? null,
        p.authorUrl ?? null,
        p.groupName ?? null,
        p.groupUrl ?? null,
        p.content ?? null,
        keyword,
        postDate,
        p.likes ?? null,
        p.comments ?? null,
        p.shares ?? null,
        classifySentiment(p.content),
        sentimentScore(p.content),
        duplicate,
        isSpam(p.content),
        sourceQuality(p),
        fingerprint,
      ]
    );
    count++;
    void dispatchWebhookEvent(organizationId, "mention.created", {
      platform: p.platform,
      postUrl: p.postUrl,
      keyword,
      sentiment: classifySentiment(p.content),
    }).catch((error) => console.error("mention webhook dispatch failed:", error.message));
  }

  return count;
}

export async function reserveSerpSearches(searches, monthlyLimit) {
  const client = await pool.connect();
  const month = new Date().toISOString().slice(0, 7) + "-01";
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO serpapi_usage (month, searches)
       VALUES ($1, $2)
       ON CONFLICT (month) DO UPDATE
       SET searches = serpapi_usage.searches + EXCLUDED.searches
       WHERE serpapi_usage.searches + EXCLUDED.searches <= $3
       RETURNING searches`,
      [month, searches, monthlyLimit]
    );
    await client.query("COMMIT");
    return rows.length > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
