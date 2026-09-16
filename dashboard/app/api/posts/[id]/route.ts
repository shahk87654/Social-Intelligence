import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!await getCurrentUser()) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const result = await pool.query(
      `SELECT id, platform, post_url, author_name, author_url, group_name, group_url, content, matched_keyword,
              post_date, likes, comments, shares, scraped_at
       FROM posts WHERE id = $1`,
      [Number(params.id)]
    );
    if (!result.rowCount) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    return NextResponse.json({ post: result.rows[0] });
  } catch (error) {
    console.error("Failed to load post detail", error);
    return NextResponse.json({ error: "Unable to load post detail." }, { status: 503 });
  }
}
