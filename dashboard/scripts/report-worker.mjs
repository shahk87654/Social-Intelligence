const appUrl = process.env.APP_URL || "http://localhost:3000";
const secret = process.env.REPORT_WORKER_SECRET;
const interval = 60_000;

if (!secret) {
  throw new Error("REPORT_WORKER_SECRET is required.");
}

async function processDueReports() {
  const response = await fetch(`${appUrl}/api/jobs/enqueue`, {
    method: "POST",
    headers: { "x-report-worker-secret": secret, "content-type": "application/json" },
    body: JSON.stringify({ jobType: "report_schedule" }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Worker request failed (${response.status}): ${body}`);
  console.log(`[report-worker] ${new Date().toISOString()} ${body}`);
}

await processDueReports();
setInterval(() => {
  processDueReports().catch((error) => console.error("[report-worker]", error));
}, interval);
