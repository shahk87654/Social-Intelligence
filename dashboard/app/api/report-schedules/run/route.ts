import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { createMailer } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function runSchedule(schedule: {
  id: number;
  organization_id: number;
  recipient_email: string;
  keyword: string | null;
  platform: string;
  report_format: string;
  frequency: string;
  recipients: string[];
  cc_recipients: string[];
  email_subject: string | null;
  email_message: string | null;
}) {
  const baseUrl = process.env.APP_URL;
  if (!baseUrl) throw new Error("APP_URL must be configured for scheduled reports.");
  const url = new URL(schedule.report_format === "csv" ? "/api/report/csv" : "/api/report/pdf", baseUrl);
  if (schedule.keyword) url.searchParams.set("keyword", schedule.keyword);
  url.searchParams.set("organizationId", String(schedule.organization_id));
  url.searchParams.set("platform", schedule.platform);
  const response = await fetch(url, { cache: "no-store", headers: { "x-report-worker-secret": process.env.REPORT_WORKER_SECRET || "" } });
  if (!response.ok) throw new Error(`Report generation failed with status ${response.status}.`);
  const fileData = Buffer.from(await response.arrayBuffer());
  const extension = schedule.report_format === "csv" ? "csv" : "pdf";
  const fileName = `signal-intel-${new Date().toISOString().slice(0, 10)}.${extension}`;
  const { sendReport } = await createMailer(schedule.organization_id);
  await sendReport(
    schedule.recipients?.length ? schedule.recipients : [schedule.recipient_email],
    schedule.email_subject || `Signal / Intel report${schedule.keyword ? ` — ${schedule.keyword}` : ""}`,
    fileData,
    fileName,
    schedule.email_message || "Your scheduled Social Intelligence report is attached.",
    schedule.cc_recipients || []
  );
  await pool.query(
    `INSERT INTO generated_reports (schedule_id, recipient_email, keyword, platform, file_name, pdf_data)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [schedule.id, schedule.recipient_email, schedule.keyword, schedule.platform, fileName, fileData]
  );
}

export async function POST(req: Request) {
  const expected = process.env.REPORT_WORKER_SECRET;
  if (!expected || req.headers.get("x-report-worker-secret") !== expected) {
    return NextResponse.json({ error: "Unauthorized report worker." }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `            SELECT id, organization_id, recipient_email, keyword, platform, frequency, report_format, recipients, cc_recipients, email_subject, email_message
       FROM report_schedules
       WHERE enabled = true AND next_run_at <= now()
       ORDER BY next_run_at
       FOR UPDATE SKIP LOCKED`
    );
    const results: Array<{ id: number; status: string; error?: string }> = [];
    for (const schedule of rows) {
      await client.query(
        `UPDATE report_schedules SET next_run_at = now() + CASE WHEN frequency = 'weekly' THEN interval '7 days' ELSE interval '24 hours' END, last_run_at = now(), last_status = 'running', last_error = null, updated_at = now()
         WHERE id = $1`,
        [schedule.id]
      );
      try {
        await runSchedule(schedule);
        await client.query("UPDATE report_schedules SET last_status = 'sent', updated_at = now() WHERE id = $1", [schedule.id]);
        results.push({ id: schedule.id, status: "sent" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown delivery error.";
        await client.query(
          `INSERT INTO generated_reports (schedule_id, recipient_email, keyword, platform, status, error, file_name)
           VALUES ($1, $2, $3, $4, 'failed', $5, '')`,
          [schedule.id, schedule.recipient_email, schedule.keyword, schedule.platform, message]
        );
        await client.query("UPDATE report_schedules SET last_status = 'failed', last_error = $1, updated_at = now() WHERE id = $2", [message, schedule.id]);
        results.push({ id: schedule.id, status: "failed", error: message });
      }
    }
    await client.query("COMMIT");
    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to run scheduled reports", error);
    return NextResponse.json({ error: "Unable to process scheduled reports." }, { status: 503 });
  } finally {
    client.release();
  }
}
