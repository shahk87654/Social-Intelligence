import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser, recordAuditEvent } from "@/lib/auth";

export const dynamic = "force-dynamic";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseSchedule(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const recipientEmail = typeof body.recipientEmail === "string" ? body.recipientEmail.trim() : "";
  const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
  const platform = typeof body.platform === "string" ? body.platform : "all";
  const frequency = body.frequency === "weekly" ? "weekly" : "daily";
  const timezone = typeof body.timezone === "string" && body.timezone ? body.timezone : "UTC";
  const reportFormat = body.reportFormat === "csv" ? "csv" : "pdf";
  const recipients = Array.isArray(body.recipients) ? body.recipients.filter((value): value is string => typeof value === "string" && validEmail(value)) : [recipientEmail];
  const ccRecipients = Array.isArray(body.ccRecipients) ? body.ccRecipients.filter((value): value is string => typeof value === "string" && validEmail(value)) : [];
  const emailSubject = typeof body.emailSubject === "string" ? body.emailSubject.trim() || null : null;
  const emailMessage = typeof body.emailMessage === "string" ? body.emailMessage.trim() || null : null;
  if (!name || !recipientEmail || !validEmail(recipientEmail)) throw new Error("Enter a schedule name and a valid email address.");
  try { new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(); } catch { throw new Error("Choose a valid IANA timezone."); }
  if (!["all", "facebook", "instagram", "article", "website", "google_review"].includes(platform)) throw new Error("Choose a valid platform.");
  if (!recipients.length) throw new Error("At least one valid recipient email is required.");
  return { name, recipientEmail, keyword: keyword || null, platform, frequency, timezone, reportFormat, recipients, ccRecipients, emailSubject, emailMessage };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const [schedules, reports] = await Promise.all([
      pool.query(
        `SELECT id, name, recipient_email, keyword, platform, enabled, next_run_at, last_run_at, last_status, last_error, created_at
         FROM report_schedules WHERE organization_id = $1 ORDER BY created_at DESC`, [user.organization_id]
      ),
      pool.query(
        `SELECT id, schedule_id, recipient_email, keyword, platform, status, error, file_name, generated_at
         FROM generated_reports gr JOIN report_schedules rs ON rs.id = gr.schedule_id
         WHERE rs.organization_id = $1 ORDER BY gr.generated_at DESC LIMIT 50`, [user.organization_id]
      ),
    ]);
    return NextResponse.json({ schedules: schedules.rows, reports: reports.rows });
  } catch (error) {
    console.error("Failed to load report schedules", error);
    return NextResponse.json({ error: "Unable to load report schedules. Apply db/schema.sql first." }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Only workspace admins can manage report schedules." }, { status: 403 });
    const body = await req.json() as Record<string, unknown>;
    const { name, recipientEmail, keyword, platform, frequency, timezone, reportFormat, recipients, ccRecipients, emailSubject, emailMessage } = parseSchedule(body);
    const result = await pool.query(
      `INSERT INTO report_schedules (organization_id, name, recipient_email, keyword, platform, frequency, timezone, report_format, recipients, cc_recipients, email_subject, email_message, next_run_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now()) RETURNING *`,
      [user.organization_id, name, recipientEmail, keyword, platform, frequency, timezone, reportFormat, recipients, ccRecipients, emailSubject, emailMessage]
    );
    await recordAuditEvent({ organizationId: user.organization_id, actorId: user.id, action: "report_schedule.created", resourceType: "report_schedule", resourceId: result.rows[0].id, metadata: { name } });
    return NextResponse.json({ schedule: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create report schedule.";
    console.error("Failed to create report schedule", error);
    return NextResponse.json({ error: message }, { status: message.startsWith("Enter") || message.startsWith("Choose") ? 400 : 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Only workspace admins can manage report schedules." }, { status: 403 });
    const body = await req.json() as Record<string, unknown>;
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "A valid schedule id is required." }, { status: 400 });
    if (typeof body.enabled !== "boolean") return NextResponse.json({ error: "Enabled must be a boolean." }, { status: 400 });
    const result = await pool.query(
      `UPDATE report_schedules SET enabled = $1, updated_at = now() WHERE id = $2 AND organization_id = $3 RETURNING *`,
      [body.enabled, id, user.organization_id]
    );
    if (!result.rowCount) return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
    await recordAuditEvent({ organizationId: user.organization_id, actorId: user.id, action: "report_schedule.updated", resourceType: "report_schedule", resourceId: id, metadata: { enabled: body.enabled } });
    return NextResponse.json({ schedule: result.rows[0] });
  } catch (error) {
    console.error("Failed to update report schedule", error);
    return NextResponse.json({ error: "Unable to update report schedule." }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Only workspace admins can manage report schedules." }, { status: 403 });
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!Number.isInteger(id)) return NextResponse.json({ error: "A valid schedule id is required." }, { status: 400 });
    const result = await pool.query("DELETE FROM report_schedules WHERE id = $1 AND organization_id = $2", [id, user.organization_id]);
    if (!result.rowCount) return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
    await recordAuditEvent({ organizationId: user.organization_id, actorId: user.id, action: "report_schedule.deleted", resourceType: "report_schedule", resourceId: id });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Failed to delete report schedule", error);
    return NextResponse.json({ error: "Unable to delete report schedule." }, { status: 503 });
  }
}
