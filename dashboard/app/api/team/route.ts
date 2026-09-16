import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

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
    return NextResponse.json({ members: result.rows, organization: user.organization_name, role: user.role });
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
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/signup?invite=${token}`;
    if (process.env.RESEND_API_KEY && process.env.REPORT_FROM_EMAIL) {
      const resend = await import("resend");
      const client = new resend.Resend(process.env.RESEND_API_KEY);
      const result = await client.emails.send({ from: process.env.REPORT_FROM_EMAIL, to: email, subject: `Join ${user.organization_name} on Signal / Intel`, text: `You have been invited to join ${user.organization_name}. Accept your invitation: ${inviteUrl}` });
      if (result.error) throw new Error(result.error.message);
    }
    return NextResponse.json({ invited: true, inviteUrl, emailSent: Boolean(process.env.RESEND_API_KEY && process.env.REPORT_FROM_EMAIL) }, { status: 201 });
  } catch (error) {
    console.error("Failed to invite team member", error);
    return NextResponse.json({ error: "Unable to create team invitation." }, { status: 503 });
  }
}
