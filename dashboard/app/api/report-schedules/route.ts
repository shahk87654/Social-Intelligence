import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseSchedule(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const recipientEmail = typeof body.recipientEmail === "string" ? body.recipientEmail.trim() : "";
  const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
  const platform = typeof body.platform === "string" ? body.platform : "all";
  if (!name || !recipientEmail || !validEmail(recipientEmail)) throw new Error("Enter a schedule name and a valid email address.");
  if (!["all", "facebook", "instagram", "article", "website", "google_review"].includes(platform)) throw new Error("Choose a valid platform.");
  return { name, recipientEmail, keyword: keyword || null, platform };
}

export async function GET() {
  try {
    const [schedules, reports] = await Promise.all([
      pool.query(
        `SELECT id, name, recipient_email, keyword, platform, enabled, next_run_at, last_run_at, last_status, last_error, created_at
         FROM report_schedules ORDER BY created_at DESC`
      ),
      pool.query(
        `SELECT id, schedule_id, recipient_email, keyword, platform, status, error, file_name, generated_at
         FROM generated_reports ORDER BY generated_at DESC LIMIT 50`
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
    const body = await req.json() as Record<string, unknown>;
    const { name, recipientEmail, keyword, platform } = parseSchedule(body);
    const result = await pool.query(
      `INSERT INTO report_schedules (name, recipient_email, keyword, platform, next_run_at)
       VALUES ($1, $2, $3, $4, now()) RETURNING *`,
      [name, recipientEmail, keyword, platform]
    );
    return NextResponse.json({ schedule: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create report schedule.";
    console.error("Failed to create report schedule", error);
    return NextResponse.json({ error: message }, { status: message.startsWith("Enter") || message.startsWith("Choose") ? 400 : 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "A valid schedule id is required." }, { status: 400 });
    if (typeof body.enabled !== "boolean") return NextResponse.json({ error: "Enabled must be a boolean." }, { status: 400 });
    const result = await pool.query(
      `UPDATE report_schedules SET enabled = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [body.enabled, id]
    );
    if (!result.rowCount) return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
    return NextResponse.json({ schedule: result.rows[0] });
  } catch (error) {
    console.error("Failed to update report schedule", error);
    return NextResponse.json({ error: "Unable to update report schedule." }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!Number.isInteger(id)) return NextResponse.json({ error: "A valid schedule id is required." }, { status: 400 });
    const result = await pool.query("DELETE FROM report_schedules WHERE id = $1", [id]);
    if (!result.rowCount) return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Failed to delete report schedule", error);
    return NextResponse.json({ error: "Unable to delete report schedule." }, { status: 503 });
  }
}
