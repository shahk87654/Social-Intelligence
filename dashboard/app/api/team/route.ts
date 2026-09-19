import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser, recordAuditEvent } from "@/lib/auth";
import { pool } from "@/lib/db";
import { getIntegrationKey } from "@/lib/integrations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, om.role, om.created_at
       FROM organization_members om JOIN users u ON u.id = om.user_id
       WHERE om.organization_id = $1 ORDER BY om.created_at`,
      [user.organization_id]
    );
    return NextResponse.json({ members: result.rows, organization: user.organization_name, role: user.role, userId: user.id });
  } catch (error) {
    console.error("Failed to load team", error);
    return NextResponse.json({ error: "Unable to load team." }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Only workspace admins can invite members." }, { status: 403 });
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    const token = randomBytes(24).toString("hex");
    await pool.query(
      `INSERT INTO organization_invites (organization_id, email, role, token, expires_at)
       VALUES ($1, $2, 'member', $3, now() + interval '7 days')`,
      [user.organization_id, email, token]
    );
    await recordAuditEvent({ organizationId: user.organization_id, actorId: user.id, action: "team.invitation_created", resourceType: "organization_invite", metadata: { email } });
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/signup?invite=${token}`;
    const resendApiKey = await getIntegrationKey(user.organization_id, "resend");
    if (resendApiKey && process.env.REPORT_FROM_EMAIL) {
      const resend = await import("resend");
      const client = new resend.Resend(resendApiKey);
      const result = await client.emails.send({ from: process.env.REPORT_FROM_EMAIL, to: email, subject: `Join ${user.organization_name} on Signal / Intel`, text: `You have been invited to join ${user.organization_name}. Accept your invitation: ${inviteUrl}` });
      if (result.error) throw new Error(result.error.message);
    }
    return NextResponse.json({ invited: true, inviteUrl, emailSent: Boolean(resendApiKey && process.env.REPORT_FROM_EMAIL) }, { status: 201 });
  } catch (error) {
    console.error("Failed to invite team member", error);
    return NextResponse.json({ error: "Unable to create team invitation." }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Only workspace admins can manage members." }, { status: 403 });
  const body = await req.json();
  const memberId = Number(body.userId);
  const role = body.role === "admin" || body.role === "member" ? body.role : null;
  if (!Number.isInteger(memberId) || !role) return NextResponse.json({ error: "A valid member and role are required." }, { status: 400 });
  if (memberId === user.id && role !== "admin") return NextResponse.json({ error: "You cannot remove your own admin access." }, { status: 400 });
  const result = await pool.query("UPDATE organization_members SET role = $1 WHERE organization_id = $2 AND user_id = $3 RETURNING user_id", [role, user.organization_id, memberId]);
  if (!result.rowCount) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  await recordAuditEvent({ organizationId: user.organization_id, actorId: user.id, action: "team.member_role_updated", resourceType: "organization_member", resourceId: memberId, metadata: { role } });
  return NextResponse.json({ updated: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Only workspace admins can remove members." }, { status: 403 });
  const memberId = Number(new URL(req.url).searchParams.get("userId"));
  if (!Number.isInteger(memberId) || memberId === user.id) return NextResponse.json({ error: "A valid member other than yourself is required." }, { status: 400 });
  const target = await pool.query("SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2", [user.organization_id, memberId]);
  if (target.rows[0]?.role === "admin") {
    const admins = await pool.query("SELECT COUNT(*)::int AS count FROM organization_members WHERE organization_id = $1 AND role = 'admin'", [user.organization_id]);
    if (admins.rows[0].count <= 1) return NextResponse.json({ error: "The organization must retain at least one admin." }, { status: 400 });
  }
  const result = await pool.query("DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2", [user.organization_id, memberId]);
  if (!result.rowCount) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  await recordAuditEvent({ organizationId: user.organization_id, actorId: user.id, action: "team.member_removed", resourceType: "organization_member", resourceId: memberId });
  return NextResponse.json({ deleted: true });
}
