import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const result = await pool.query(
      `SELECT id, platform, post_url, author_name, author_url, group_name, group_url, content, matched_keyword,
              post_date, likes, comments, shares, scraped_at, sentiment, sentiment_score,
              is_duplicate, is_spam, source_quality_score, tags, note, assigned_to
       FROM posts WHERE id = $1 AND organization_id = $2`,
      [Number(params.id), user.organization_id]
    );
    if (!result.rowCount) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    return NextResponse.json({ post: result.rows[0] });
  } catch (error) {
    console.error("Failed to load post detail", error);
    return NextResponse.json({ error: "Unable to load post detail." }, { status: 503 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
      const user = await getCurrentUser();
      if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
      const body = await req.json();
      const tags = Array.isArray(body.tags) ? body.tags.filter((tag: unknown): tag is string => typeof tag === "string" && tag.trim().length > 0).map((tag: string) => tag.trim().slice(0, 40)) : [];
      const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : null;
      const assignedTo = body.assignedTo == null ? null : Number(body.assignedTo);
      const result = await pool.query(
        "UPDATE posts SET tags = $1, note = $2, assigned_to = $3 WHERE id = $4 AND organization_id = $5 RETURNING tags, note, assigned_to",
        [tags, note, Number.isInteger(assignedTo) ? assignedTo : null, Number(params.id), user.organization_id]
      );
      if (!result.rowCount) return NextResponse.json({ error: "Post not found." }, { status: 404 });
      return NextResponse.json({ annotation: result.rows[0] });
    } catch (error) {
      console.error("Failed to update post annotations", error);
      return NextResponse.json({ error: "Unable to update post annotations." }, { status: 503 });
  }
}
