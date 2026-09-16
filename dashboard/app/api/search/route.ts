import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!await getCurrentUser()) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q) return NextResponse.json({ posts: [], projects: [], reports: [] });
    const term = `%${q}%`;
    const [posts, projects, reports] = await Promise.all([
      pool.query(
        `SELECT id, platform, author_name, content, post_url, scraped_at
         FROM posts WHERE content ILIKE $1 OR author_name ILIKE $1 OR matched_keyword ILIKE $1
         ORDER BY scraped_at DESC LIMIT 20`,
        [term]
      ),
      pool.query(
        `SELECT id, name, description, keywords FROM monitoring_projects
         WHERE name ILIKE $1 OR description ILIKE $1 OR $2 = ANY(keywords)
         ORDER BY updated_at DESC LIMIT 10`,
        [term, q]
      ),
      pool.query(
        `SELECT id, recipient_email, keyword, file_name, generated_at
         FROM generated_reports WHERE recipient_email ILIKE $1 OR keyword ILIKE $1
         ORDER BY generated_at DESC LIMIT 10`,
        [term]
      ),
    ]);
    return NextResponse.json({ posts: posts.rows, projects: projects.rows, reports: reports.rows });
  } catch (error) {
    console.error("Global search failed", error);
    return NextResponse.json({ error: "Unable to search the workspace." }, { status: 503 });
  }
}
