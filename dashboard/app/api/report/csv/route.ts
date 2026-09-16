import { NextRequest } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function csv(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const user = await getCurrentUser();
    const workerAuthorized = Boolean(process.env.REPORT_WORKER_SECRET && req.headers.get("x-report-worker-secret") === process.env.REPORT_WORKER_SECRET);
    const organizationId = user?.organization_id || (workerAuthorized ? Number(sp.get("organizationId")) : NaN);
    if (!Number.isInteger(organizationId)) return new Response("Sign in required.", { status: 401 });
    const keyword = sp.get("keyword")?.trim() || null;
    const platform = sp.get("platform");
    const params: string[] = [];
    const conditions: string[] = [`organization_id = $1`];
    params.push(String(organizationId));
    if (keyword) { params.push(`%${keyword}%`); conditions.push(`(matched_keyword ILIKE $${params.length} OR content ILIKE $${params.length})`); }
    if (platform && platform !== "all") { params.push(platform); conditions.push(`platform = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(`SELECT platform, post_url, author_name, content, matched_keyword, sentiment, likes, comments, shares, scraped_at FROM posts ${where} ORDER BY scraped_at DESC LIMIT 500`, params);
    const headers = ["platform", "post_url", "author_name", "content", "matched_keyword", "sentiment", "likes", "comments", "shares", "scraped_at"];
    const body = [headers, ...result.rows.map((row) => headers.map((header) => csv(row[header])))]
      .map((row) => row.join(",")).join("\r\n");
    return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="signal-intel-report.csv"', "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to generate CSV report", error);
    return new Response("Unable to generate CSV report.", { status: 500 });
  }
}
