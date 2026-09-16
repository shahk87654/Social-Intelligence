import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Bearer API key required." }, { status: 401 });
    const key = crypto.createHash("sha256").update(token).digest("hex");
    const auth = await pool.query("SELECT id, organization_id FROM api_keys WHERE key_hash = $1", [key]);
    if (!auth.rowCount) return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
    await pool.query("UPDATE api_keys SET last_used_at = now() WHERE id = $1", [auth.rows[0].id]);
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 25), 100);
    const result = await pool.query(
      `SELECT id, platform, post_url, author_name, content, matched_keyword, sentiment,
              source_quality_score, tags, scraped_at
       FROM posts WHERE organization_id = $2 ORDER BY scraped_at DESC LIMIT $1`,
      [limit, auth.rows[0].organization_id]
    );
    return NextResponse.json({ data: result.rows, count: result.rowCount });
  } catch (error) {
    console.error("API posts request failed", error);
    return NextResponse.json({ error: "Unable to load API data." }, { status: 503 });
  }
}
