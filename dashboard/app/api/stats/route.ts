import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const org = user.organization_id;
    const [totals, byPlatform, topKeywords, recentRun, sentiment, trend] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total_posts,
                COALESCE(SUM(likes),0)::int AS total_likes,
                COALESCE(SUM(comments),0)::int AS total_comments,
                COALESCE(SUM(shares),0)::int AS total_shares
         FROM posts WHERE organization_id = $1`, [org]
      ),
      pool.query(
        `SELECT platform, COUNT(*)::int AS count FROM posts WHERE organization_id = $1 GROUP BY platform`, [org]
      ),
      pool.query(
        `SELECT matched_keyword, COUNT(*)::int AS count
         FROM posts WHERE organization_id = $1 GROUP BY matched_keyword ORDER BY count DESC LIMIT 5`, [org]
      ),
      pool.query(
        `SELECT id, keyword, platforms, status, posts_found, started_at, finished_at
         FROM scan_runs WHERE organization_id = $1 ORDER BY started_at DESC LIMIT 1`, [org]
      ),
      pool.query(`SELECT sentiment, COUNT(*)::int AS count FROM posts WHERE organization_id = $1 GROUP BY sentiment ORDER BY count DESC`, [org]),
      pool.query(
        `SELECT date_trunc('day', COALESCE(post_date, scraped_at))::date AS day,
                COUNT(*)::int AS mentions,
                COALESCE(SUM(likes), 0)::int AS likes,
                COALESCE(SUM(comments), 0)::int AS comments,
                COALESCE(SUM(shares), 0)::int AS shares
         FROM posts WHERE organization_id = $1
         AND COALESCE(post_date, scraped_at) >= now() - interval '30 days'
         GROUP BY day ORDER BY day`, [org]
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
