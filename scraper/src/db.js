import pg from "pg";
import "dotenv/config";

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function createScanRun(keyword, platforms) {
  const { rows } = await pool.query(
    `INSERT INTO scan_runs (keyword, platforms, status) VALUES ($1, $2, 'running') RETURNING id`,
    [keyword, platforms]
  );
  return rows[0].id;
}

export async function finishScanRun(id, { status, error = null, postsFound = 0 }) {
  await pool.query(
    `UPDATE scan_runs SET status = $2, error = $3, posts_found = $4, finished_at = now() WHERE id = $1`,
    [id, status, error, postsFound]
  );
}

// Upsert on (platform, post_url) so re-scanning doesn't duplicate rows;
// engagement counts are refreshed on conflict since they change over time.
export async function upsertPosts(scanRunId, keyword, posts) {
  let count = 0;
  for (const p of posts) {
    const parsedDate = p.postDate ? new Date(String(p.postDate).replace(/[\u200e\u200f\u202a-\u202e]/g, "")) : null;
    const postDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null;
    await pool.query(
      `INSERT INTO posts
         (scan_run_id, platform, post_url, author_name, author_url, group_name, group_url, content,
          matched_keyword, post_date, likes, comments, shares)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (platform, post_url) DO UPDATE SET
         likes = EXCLUDED.likes,
         comments = EXCLUDED.comments,
         shares = EXCLUDED.shares,
         group_name = EXCLUDED.group_name,
         group_url = EXCLUDED.group_url,
         content = EXCLUDED.content,
         scraped_at = now()`,
      [
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
      ]
    );
    count++;
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
