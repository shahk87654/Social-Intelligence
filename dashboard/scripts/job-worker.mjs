import pg from "pg";
import "dotenv/config";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const workerId = `worker-${process.pid}`;
const interval = Number(process.env.JOB_WORKER_INTERVAL_MS || 5000);

async function claimJob() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE background_jobs
       SET status = 'running', attempts = attempts + 1, locked_at = now(), locked_by = $1, updated_at = now()
       WHERE id = (
         SELECT id FROM background_jobs
         WHERE (status = 'queued' AND available_at <= now())
            OR (status = 'running' AND locked_at < now() - interval '10 minutes')
         ORDER BY available_at, created_at
         FOR UPDATE SKIP LOCKED LIMIT 1
       )
       RETURNING *`,
      [workerId]
    );
    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function runJob(job) {
  if (job.job_type !== "report_schedule") throw new Error(`Unsupported job type: ${job.job_type}`);
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const secret = process.env.REPORT_WORKER_SECRET;
  if (!secret) throw new Error("REPORT_WORKER_SECRET is required.");
  const response = await fetch(`${appUrl}/api/report-schedules/run`, { method: "POST", headers: { "x-report-worker-secret": secret } });
  if (!response.ok) throw new Error(`Report worker returned ${response.status}: ${await response.text()}`);
}

async function processOnce() {
  const job = await claimJob();
  if (!job) return false;
  try {
    await runJob(job);
    await pool.query("UPDATE background_jobs SET status = 'succeeded', completed_at = now(), locked_at = NULL, locked_by = NULL, updated_at = now() WHERE id = $1", [job.id]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const terminal = job.attempts >= job.max_attempts;
    await pool.query(
      `UPDATE background_jobs SET status = $2, available_at = now() + (power(2, greatest(attempts - 1, 0)) * interval '1 minute'), last_error = $3, locked_at = NULL, locked_by = NULL, updated_at = now() WHERE id = $1`,
      [job.id, terminal ? "dead_letter" : "queued", message]
    );
    console.error(`[job-worker] job ${job.id} failed: ${message}`);
  }
  return true;
}

console.log(`[job-worker] ${workerId} started`);
while (true) {
  try {
    if (!(await processOnce())) await new Promise((resolve) => setTimeout(resolve, interval));
  } catch (error) {
    console.error("[job-worker]", error);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}
