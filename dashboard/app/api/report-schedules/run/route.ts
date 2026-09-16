import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { createMailer } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function runSchedule(schedule: {
  id: number;
  recipient_email: string;
  keyword: string | null;
  platform: string;
}) {
  const baseUrl = process.env.APP_URL;
  if (!baseUrl) throw new Error("APP_URL must be configured for scheduled reports.");
  const url = new URL("/api/report/pdf", baseUrl);
  if (schedule.keyword) url.searchParams.set("keyword", schedule.keyword);
  url.searchParams.set("platform", schedule.platform);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`PDF generation failed with status ${response.status}.`);
  const pdf = Buffer.from(await response.arrayBuffer());
  const fileName = `signal-intel-${new Date().toISOString().slice(0, 10)}.pdf`;
  const { sendReport } = createMailer();
  await sendReport(
    schedule.recipient_email,
    `Signal / Intel report${schedule.keyword ? ` — ${schedule.keyword}` : ""}`,
    pdf,
    fileName
  );
  await pool.query(
    `INSERT INTO generated_reports (schedule_id, recipient_email, keyword, platform, file_name, pdf_data)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [schedule.id, schedule.recipient_email, schedule.keyword, schedule.platform, fileName, pdf]
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
      `SELECT id, recipient_email, keyword, platform
       FROM report_schedules
       WHERE enabled = true AND next_run_at <= now()
       ORDER BY next_run_at
       FOR UPDATE SKIP LOCKED`
    );
    const results: Array<{ id: number; status: string; error?: string }> = [];
    for (const schedule of rows) {
      await client.query(
        `UPDATE report_schedules SET next_run_at = now() + interval '24 hours', last_run_at = now(), last_status = 'running', last_error = null, updated_at = now()
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
