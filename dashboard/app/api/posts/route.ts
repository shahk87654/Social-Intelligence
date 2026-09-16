import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const platform = sp.get("platform");
    const from = sp.get("from");
    const to = sp.get("to");
    const sort = sp.get("sort") || "post_date";
    const order = sp.get("order") === "asc" ? "asc" : "desc";
    const page = parseInt(sp.get("page") || "1", 10);
    const pageSize = Math.min(parseInt(sp.get("pageSize") || "25", 10), 100);

    const allowedSort = new Set(["post_date", "likes", "comments", "shares", "scraped_at"]);
    const sortCol = allowedSort.has(sort) ? sort : "post_date";

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (q) {
     params.push(`%${q}%`);
     conditions.push(`(content ILIKE $${params.length} OR author_name ILIKE $${params.length})`);
    }
    if (platform && platform !== "all") {
     params.push(platform);
     conditions.push(`platform = $${params.length}`);
    }
    if (from) {
     params.push(from);
     conditions.push(`post_date >= $${params.length}`);
    }
    if (to) {
     params.push(to);
     conditions.push(`post_date <= $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await pool.query(`SELECT COUNT(*) FROM posts ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(pageSize);
    params.push((page - 1) * pageSize);
    const dataResult = await pool.query(
     `SELECT id, platform, post_url, author_name, author_url, group_name, group_url, content, matched_keyword,
             post_date, likes, comments, shares, scraped_at
      FROM posts
      ${whereClause}
      ORDER BY ${sortCol} ${order} NULLS LAST
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
     params
    );

    return NextResponse.json({ total, page, pageSize, posts: dataResult.rows });
  } catch (error) {
    console.error("Failed to load posts", error);
    return NextResponse.json(
     { error: "Database unavailable. Start PostgreSQL and initialize db/schema.sql." },
     { status: 503 }
    );
  }
}
