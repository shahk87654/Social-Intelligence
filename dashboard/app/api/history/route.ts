import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const result = await pool.query(
      `SELECT id, keyword, platforms, status, error, started_at, finished_at, posts_found
       FROM scan_runs WHERE organization_id = $1 ORDER BY started_at DESC LIMIT 100`, [user.organization_id]
    );
    return NextResponse.json({ scans: result.rows });
  } catch (error) {
    console.error("Failed to load scan history", error);
    return NextResponse.json({ error: "Unable to load scan history." }, { status: 503 });
  }
}
