import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const [summary, sentiment, platforms, risks, trend] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS mentions, COALESCE(SUM(likes + comments + shares), 0)::int AS engagement, COUNT(*) FILTER (WHERE sentiment = 'negative')::int AS negative_mentions, COUNT(DISTINCT matched_keyword)::int AS tracked_keywords FROM posts WHERE organization_id = $1", [user.organization_id]),
      pool.query("SELECT sentiment, COUNT(*)::int AS count FROM posts WHERE organization_id = $1 GROUP BY sentiment ORDER BY count DESC", [user.organization_id]),
      pool.query("SELECT platform, COUNT(*)::int AS count FROM posts WHERE organization_id = $1 GROUP BY platform ORDER BY count DESC", [user.organization_id]),
      pool.query("SELECT id, content, platform, matched_keyword, sentiment, scraped_at FROM posts WHERE organization_id = $1 AND (sentiment = 'negative' OR is_spam = true) ORDER BY scraped_at DESC LIMIT 10", [user.organization_id]),
      pool.query("SELECT date_trunc('day', COALESCE(post_date, scraped_at))::date AS day, COUNT(*)::int AS mentions, COUNT(*) FILTER (WHERE sentiment = 'negative')::int AS negative_mentions FROM posts WHERE organization_id = $1 AND COALESCE(post_date, scraped_at) >= now() - interval '30 days' GROUP BY day ORDER BY day", [user.organization_id]),
    ]);
    return NextResponse.json({ summary: summary.rows[0], sentiment: sentiment.rows, platforms: platforms.rows, risks: risks.rows, trend: trend.rows });
  } catch (error) {
    console.error("Failed to load executive analytics", error);
    return NextResponse.json({ error: "Unable to load executive analytics." }, { status: 503 });
  }
}
