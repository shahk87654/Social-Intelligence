import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const left = req.nextUrl.searchParams.get("left")?.trim();
    const right = req.nextUrl.searchParams.get("right")?.trim();
    if (!left || !right) return NextResponse.json({ error: "Provide two keywords to compare." }, { status: 400 });
    const result = await pool.query(
      `WITH groups AS (
        SELECT CASE WHEN matched_keyword ILIKE $1 THEN $3 ELSE $4 END AS label,
               COUNT(*)::int AS mentions,
               COALESCE(SUM(likes), 0)::int AS likes,
               COALESCE(SUM(comments), 0)::int AS comments,
               COALESCE(SUM(shares), 0)::int AS shares,
               COUNT(*) FILTER (WHERE sentiment = 'positive')::int AS positive,
               COUNT(*) FILTER (WHERE sentiment = 'negative')::int AS negative
        FROM posts
        WHERE organization_id = $5 AND (matched_keyword ILIKE $1 OR matched_keyword ILIKE $2)
        GROUP BY label
      )
      SELECT label, mentions, likes, comments, shares, positive, negative,
             ROUND((mentions::numeric / NULLIF(SUM(mentions) OVER (), 0)) * 100, 1) AS share_of_voice
      FROM groups ORDER BY mentions DESC`,
      [`%${left}%`, `%${right}%`, left, right, user.organization_id]
    );
    return NextResponse.json({ comparison: result.rows });
  } catch (error) {
    console.error("Failed to compare keywords", error);
    return NextResponse.json({ error: "Unable to load comparison." }, { status: 503 });
  }
}
