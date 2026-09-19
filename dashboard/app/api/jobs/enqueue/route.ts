import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const secret = process.env.REPORT_WORKER_SECRET;
  if (!secret || req.headers.get("x-report-worker-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized job producer." }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const jobType = body.jobType === "report_schedule" ? body.jobType : null;
    if (!jobType) return NextResponse.json({ error: "Unsupported job type." }, { status: 400 });
    const result = await pool.query(
      "INSERT INTO background_jobs (job_type, payload) VALUES ($1, $2) RETURNING id, status, created_at",
      [jobType, body.payload || {}]
    );
    return NextResponse.json({ job: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Failed to enqueue job", error);
    return NextResponse.json({ error: "Unable to enqueue job." }, { status: 503 });
  }
}
