import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import { deleteIntegrationKey, saveIntegrationKey } from "@/lib/integrations";
import { validateWebhookEndpoint } from "@/lib/webhook-security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const [keys, webhooks] = await Promise.all([
      pool.query("SELECT id, name, key_prefix, last_used_at, created_at FROM api_keys WHERE organization_id = $1 ORDER BY created_at DESC", [user.organization_id]),
      pool.query("SELECT id, name, endpoint_url, events, enabled, created_at FROM webhooks WHERE organization_id = $1 ORDER BY created_at DESC", [user.organization_id]),
    ]);
    const credentials = await pool.query(
      "SELECT provider, updated_at FROM organization_integrations WHERE organization_id = $1 ORDER BY provider",
      [user.organization_id]
    );
    return NextResponse.json({ keys: keys.rows, webhooks: webhooks.rows, credentials: credentials.rows });
  } catch (error) {
    console.error("Failed to load integrations", error);
    return NextResponse.json({ error: "Unable to load integrations." }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const body = await req.json();
    if (body.type === "credential") {
      const provider = body.provider === "resend" || body.provider === "serpapi" ? body.provider : null;
      const value = typeof body.value === "string" ? body.value.trim() : "";
      if (!provider || !value) return NextResponse.json({ error: "A supported provider and API key are required." }, { status: 400 });
      await saveIntegrationKey(user.organization_id, provider, value);
      return NextResponse.json({ provider, configured: true }, { status: 201 });
    }
    const type = body.type === "webhook" ? "webhook" : "key";
    if (type === "key") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return NextResponse.json({ error: "API key name is required." }, { status: 400 });
      const raw = `si_${crypto.randomBytes(28).toString("hex")}`;
      await pool.query("INSERT INTO api_keys (organization_id, name, key_prefix, key_hash, created_by) VALUES ($1, $2, $3, $4, $5)", [user.organization_id, name, raw.slice(0, 11), crypto.createHash("sha256").update(raw).digest("hex"), user.id]);
      return NextResponse.json({ key: raw }, { status: 201 });
    }
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const endpointUrl = typeof body.endpointUrl === "string" ? body.endpointUrl.trim() : "";
    if (!name) return NextResponse.json({ error: "Webhook name and HTTPS endpoint are required." }, { status: 400 });
    let safeEndpointUrl: string;
    try {
      safeEndpointUrl = await validateWebhookEndpoint(endpointUrl);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook endpoint is not allowed." }, { status: 400 });
    }
    const secret = crypto.randomBytes(24).toString("hex");
    const events = Array.isArray(body.events) ? body.events : ["mention.created", "scan.completed"];
    const result = await pool.query("INSERT INTO webhooks (organization_id, name, endpoint_url, secret, events) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, endpoint_url, events, enabled, created_at", [user.organization_id, name, safeEndpointUrl, secret, events]);
    return NextResponse.json({ webhook: result.rows[0], secret }, { status: 201 });
  } catch (error) {
    console.error("Failed to create integration", error);
    return NextResponse.json({ error: "Unable to create integration." }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const id = Number(url.searchParams.get("id"));
    const provider = url.searchParams.get("provider");
    if (provider === "resend" || provider === "serpapi") {
      await deleteIntegrationKey(user.organization_id, provider);
      return NextResponse.json({ deleted: true });
    }
    const table = type === "webhook" ? "webhooks" : "api_keys";
    const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 AND organization_id = $2`, [id, user.organization_id]);
    if (!result.rowCount) return NextResponse.json({ error: "Integration not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Failed to delete integration", error);
    return NextResponse.json({ error: "Unable to delete integration." }, { status: 503 });
  }
}
