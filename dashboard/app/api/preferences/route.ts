import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const result = await pool.query("SELECT widgets FROM dashboard_preferences WHERE user_id = $1", [user.id]);
    return NextResponse.json({ widgets: result.rows[0]?.widgets || { stats: true, analytics: true, mentions: true } });
  } catch (error) {
    console.error("Failed to load dashboard preferences", error);
    return NextResponse.json({ error: "Unable to load dashboard preferences." }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const body = await req.json();
    const allowed = ["stats", "analytics", "mentions", "scan", "sources"];
    const widgets = Object.fromEntries(allowed.map((key) => [key, body.widgets?.[key] !== false]));
    await pool.query(
      `INSERT INTO dashboard_preferences (user_id, widgets) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET widgets = EXCLUDED.widgets, updated_at = now()`,
      [user.id, JSON.stringify(widgets)]
    );
    return NextResponse.json({ widgets });
  } catch (error) {
    console.error("Failed to save dashboard preferences", error);
    return NextResponse.json({ error: "Unable to save dashboard preferences." }, { status: 503 });
  }
}
