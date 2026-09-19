import "dotenv/config";
import express from "express";
import { chromium } from "playwright";
import { createScanRun, dispatchWebhookEvent, evaluateAlerts, finishScanRun, reserveSerpSearches, upsertPosts } from "./db.js";
import * as facebook from "./scrapers/facebook.js";
import * as instagram from "./scrapers/instagram.js";
import * as google from "./scrapers/google.js";
import * as reviews from "./scrapers/reviews.js";
import { verifyScraperRequest } from "./scraper-auth.js";

// Adding a platform later: implement scrapers/<name>.js with the same
// `search(keyword, targets, { browser })` contract and add it here.
// Nothing on the dashboard side needs to change.
const PLATFORM_REGISTRY = {
  facebook,
  instagram,
};

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (req.path === "/health") return next();
  try {
    if (!verifyScraperRequest(req)) return res.status(401).json({ error: "Unauthorized scraper request." });
    return next();
  } catch (error) {
    console.error("scraper authentication is not configured:", error);
    return res.status(503).json({ error: "Scraper authentication is not configured." });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/scrape", async (req, res) => {
  const { keyword, platforms, targets = {}, organizationId, serpApiKey } = req.body || {};

  if (!keyword || typeof keyword !== "string" || !Number.isInteger(Number(organizationId))) {
    return res.status(400).json({ error: "keyword (string) is required" });
  }
  const requestedPlatforms = (platforms && platforms.length ? platforms : Object.keys(PLATFORM_REGISTRY))
    .filter((p) => ["facebook", "instagram", "article", "website"].includes(p));

  if (requestedPlatforms.length === 0) {
    return res.status(400).json({ error: "no valid platforms requested" });
  }

  let scanRunId;
  try {
    scanRunId = await createScanRun(keyword, requestedPlatforms, Number(organizationId));
  } catch (err) {
    console.error("unable to create scan run:", err);
    return res.status(503).json({
      error: "Database unavailable. Start PostgreSQL and initialize db/schema.sql.",
    });
  }

  // Respond immediately; the scan runs in the background and rows show up
  // in the DB as they're found. Dashboard polls /api/posts + scan status.
  res.json({ scanRunId, status: "running" });

  runScan(scanRunId, keyword, requestedPlatforms, targets, Number(organizationId), serpApiKey).catch((err) => {
    console.error("scan failed:", err);
    Promise.all([
      finishScanRun(scanRunId, { status: "failed", error: err.message }),
      evaluateAlerts(keyword, "failed", 0, Number(organizationId)),
    ]).catch((alertError) => console.error("failed to record scan failure alert:", alertError));
  });
});

app.get("/scan/:id", async (req, res) => {
  try {
    const organizationId = Number(req.query.organizationId);
    if (!Number.isInteger(organizationId)) return res.status(400).json({ error: "organizationId is required" });
    const { pool } = await import("./db.js");
    const { rows } = await pool.query("SELECT * FROM scan_runs WHERE id = $1 AND organization_id = $2", [req.params.id, organizationId]);
    if (!rows.length) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("unable to read scan status:", err);
    res.status(503).json({
      error: "Database unavailable. Start PostgreSQL and initialize db/schema.sql.",
    });
  }
});

async function runScan(scanRunId, keyword, platforms, targets, organizationId, serpApiKey) {
  const hasTargets = ["facebook", "instagram"].some((platform) => targets[platform]?.length);
  const browser = hasTargets ? await chromium.launch({ headless: true }) : null;
  let totalFound = 0;
  try {
    if (!hasTargets) {
      const monthlyLimit = parseInt(process.env.SERPAPI_MONTHLY_LIMIT || "250", 10);
      const quotaOverride = /^(1|true|yes)$/i.test(process.env.SERPAPI_IGNORE_MONTHLY_LIMIT || "");
      const reserveSearch = () => quotaOverride || reserveSerpSearches(1, monthlyLimit);
      const reviewRequested = platforms.includes("google_review");
      const webPlatforms = platforms.filter((platform) => platform !== "google_review");
      let webPosts = [];
      let webNote = null;
      if (webPlatforms.length) {
        const reserved = await reserveSearch();
        if (!reserved) {
          if (!reviewRequested) {
            throw new Error(`SerpAPI monthly search limit reached (${monthlyLimit})`);
          }
          webNote = `Web discovery skipped because the SerpAPI monthly limit was reached (${monthlyLimit}).`;
        } else {
          try {
            ({ posts: webPosts, note: webNote } = await google.search(keyword, webPlatforms, serpApiKey));
          } catch (error) {
            if (!reviewRequested) throw error;
            webNote = `Web discovery unavailable: ${error.message}`;
          }
        }
      }
      const { posts: reviewPosts, note: reviewNote } = reviewRequested
        ? await reviews.search(keyword, {
            beforeRequest: reserveSearch,
            dataId: targets.google_review?.[0],
            apiKey: serpApiKey,
          })
        : { posts: [], note: null };
      const posts = [...webPosts, ...reviewPosts];
      const note = [webNote, reviewNote].filter(Boolean).join(" ");
      if (note) console.log("[google]", note);
      totalFound += await upsertPosts(scanRunId, keyword, posts, organizationId);
    } else {
      for (const platform of platforms) {
        const scraper = PLATFORM_REGISTRY[platform];
        const { posts, note } = await scraper.search(keyword, targets[platform] || [], { browser });
        if (note) console.log(`[${platform}]`, note);
        totalFound += await upsertPosts(scanRunId, keyword, posts, organizationId);
      }
    }
    await finishScanRun(scanRunId, { status: "completed", postsFound: totalFound });
    await evaluateAlerts(keyword, "completed", totalFound, organizationId);
    await dispatchWebhookEvent(organizationId, "scan.completed", { scanRunId, keyword, postsFound: totalFound });
  } finally {
    if (browser) await browser.close();
  }
}

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`scraper service listening on :${port}`));
