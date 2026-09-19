import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Only workspace admins can view audit logs." }, { status: 403 });
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const result = await pool.query(
    `SELECT ae.id, ae.action, ae.resource_type, ae.resource_id, ae.metadata, ae.created_at,
            u.name AS actor_name, u.email AS actor_email
     FROM audit_events ae LEFT JOIN users u ON u.id = ae.actor_id
     WHERE ae.organization_id = $1 ORDER BY ae.created_at DESC LIMIT $2`,
    [user.organization_id, limit]
  );
  return NextResponse.json({ events: result.rows });
}
