import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!user.is_super_admin) return NextResponse.json({ error: "Super admin access required." }, { status: 403 });
  const [summary, users, organizations] = await Promise.all([
    pool.query(`SELECT (SELECT count(*)::int FROM users) AS users, (SELECT count(*)::int FROM organizations) AS organizations, (SELECT count(*)::int FROM posts) AS posts, (SELECT count(*)::int FROM support_tickets WHERE status IN ('open', 'in_progress')) AS open_tickets`),
    pool.query(`SELECT u.id, u.name, u.email, u.is_super_admin, u.created_at, count(DISTINCT om.organization_id)::int AS organization_count, max(o.name) AS organization_name
      FROM users u LEFT JOIN organization_members om ON om.user_id = u.id LEFT JOIN organizations o ON o.id = om.organization_id
      GROUP BY u.id ORDER BY u.created_at DESC LIMIT 250`),
    pool.query(`SELECT o.id, o.name, o.slug, o.created_at, count(DISTINCT om.user_id)::int AS member_count, count(DISTINCT p.id)::int AS post_count
      FROM organizations o LEFT JOIN organization_members om ON om.organization_id = o.id LEFT JOIN posts p ON p.organization_id = o.id
      GROUP BY o.id ORDER BY o.created_at DESC LIMIT 250`),
  ]);
  return NextResponse.json({ summary: summary.rows[0], users: users.rows, organizations: organizations.rows });
}