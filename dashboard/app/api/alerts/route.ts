import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

async function current() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function GET() {
  try {
    const user = await current();
    const [alerts, rules] = await Promise.all([
      pool.query(`SELECT id, title, message, severity, read_at, created_at FROM alerts WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 100`, [user.organization_id]),
      pool.query(`SELECT id, name, rule_type, keyword, threshold, enabled, created_at FROM alert_rules WHERE organization_id = $1 ORDER BY created_at DESC`, [user.organization_id]),
    ]);
    return NextResponse.json({ alerts: alerts.rows, rules: rules.rows });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    console.error("Failed to load alerts", error);
    return NextResponse.json({ error: "Unable to load alerts." }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await current();
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const ruleType = typeof body.ruleType === "string" ? body.ruleType : "";
    const keyword = typeof body.keyword === "string" ? body.keyword.trim() || null : null;
    const threshold = body.threshold == null ? null : Number(body.threshold);
    if (!name || !["new_mention", "negative_sentiment", "volume_spike", "scan_failure"].includes(ruleType)) {
      return NextResponse.json({ error: "Enter a rule name and valid rule type." }, { status: 400 });
    }
    const result = await pool.query(
      `INSERT INTO alert_rules (organization_id, name, rule_type, keyword, threshold) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.organization_id, name, ruleType, keyword, Number.isInteger(threshold) ? threshold : null]
    );
    return NextResponse.json({ rule: result.rows[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    console.error("Failed to create alert rule", error);
    return NextResponse.json({ error: "Unable to create alert rule." }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await current();
    const body = await req.json();
    if (body.alertId) {
      await pool.query("UPDATE alerts SET read_at = now() WHERE id = $1 AND organization_id = $2", [Number(body.alertId), user.organization_id]);
      return NextResponse.json({ updated: true });
    }
    await pool.query("UPDATE alert_rules SET enabled = $1 WHERE id = $2 AND organization_id = $3", [Boolean(body.enabled), Number(body.ruleId), user.organization_id]);
    return NextResponse.json({ updated: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    console.error("Failed to update alert", error);
    return NextResponse.json({ error: "Unable to update alert." }, { status: 503 });
  }
}
