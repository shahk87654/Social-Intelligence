import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const [totals, byPlatform, topKeywords, recentRun] = await Promise.all([
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
    ]);

    return NextResponse.json({
      totals: totals.rows[0],
      byPlatform: byPlatform.rows,
      topKeywords: topKeywords.rows,
      lastScan: recentRun.rows[0] || null,
    });
  } catch (error) {
    console.error("Failed to load dashboard stats", error);
    return NextResponse.json(
      { error: "Database unavailable. Start PostgreSQL and initialize db/schema.sql." },
      { status: 503 }
    );
  }
}
