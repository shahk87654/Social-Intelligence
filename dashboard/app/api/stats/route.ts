import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const [totals, byPlatform, topKeywords, recentRun, sentiment, trend] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total_posts,
                COALESCE(SUM(likes),0)::int AS total_likes,
                COALESCE(SUM(comments),0)::int AS total_comments,
                COALESCE(SUM(shares),0)::int AS total_shares
         FROM posts`
      ),
      pool.query(
        `SELECT platform, COUNT(*)::int AS count FROM posts GROUP BY platform`
      ),
      pool.query(
        `SELECT matched_keyword, COUNT(*)::int AS count
         FROM posts GROUP BY matched_keyword ORDER BY count DESC LIMIT 5`
      ),
      pool.query(
        `SELECT id, keyword, platforms, status, posts_found, started_at, finished_at
         FROM scan_runs ORDER BY started_at DESC LIMIT 1`
      ),
      pool.query(`SELECT sentiment, COUNT(*)::int AS count FROM posts GROUP BY sentiment ORDER BY count DESC`),
      pool.query(
        `SELECT date_trunc('day', COALESCE(post_date, scraped_at))::date AS day,
                COUNT(*)::int AS mentions,
                COALESCE(SUM(likes), 0)::int AS likes,
                COALESCE(SUM(comments), 0)::int AS comments,
                COALESCE(SUM(shares), 0)::int AS shares
         FROM posts
         WHERE COALESCE(post_date, scraped_at) >= now() - interval '30 days'
         GROUP BY day ORDER BY day`
      ),
    ]);

    return NextResponse.json({
      totals: totals.rows[0],
      byPlatform: byPlatform.rows,
      topKeywords: topKeywords.rows,
      lastScan: recentRun.rows[0] || null,
      sentiment: sentiment.rows,
      trend: trend.rows,
    });
  } catch (error) {
    console.error("Failed to load dashboard stats", error);
    return NextResponse.json(
      { error: "Database unavailable. Start PostgreSQL and initialize db/schema.sql." },
      { status: 503 }
    );
  }
}
