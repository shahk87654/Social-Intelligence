import { NextResponse } from "next/server";
import { getCurrentUser, recordAuditEvent } from "@/lib/auth";
import {
  getIntegrationConfig,
  PROVIDER_FIELDS,
  Provider,
  saveIntegrationConfig,
  deleteIntegrationKey,
  validateProviderConfig,
} from "@/lib/integrations";

const providers = new Set<Provider>(["slack", "microsoft_teams", "meta_graph", "google_business_profile"]);

function providerFrom(params: { provider: string }) {
  return providers.has(params.provider as Provider) ? params.provider as Provider : null;
}

async function testProvider(provider: Provider, config: Record<string, string>) {
  if (provider === "slack" || provider === "microsoft_teams") {
    const response = await fetch(config.webhookUrl, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "Signal integration test" }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}.`);
    return;
  }
  const url = provider === "meta_graph"
    ? `https://graph.facebook.com/v20.0/${encodeURIComponent(config.pageId)}?fields=id`
    : `https://mybusinessaccountmanagement.googleapis.com/v1/${encodeURIComponent(`accounts/${config.accountId}`)}`;
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${config.accessToken}` },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}.`);
}

export async function GET(_req: Request, { params }: { params: { provider: string } }) {
  const provider = providerFrom(params);
  if (!provider) return NextResponse.json({ error: "Unsupported provider." }, { status: 404 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const config = await getIntegrationConfig(user.organization_id, provider);
  return NextResponse.json({ provider, fields: PROVIDER_FIELDS[provider], configured: Boolean(config) });
}

export async function PUT(req: Request, { params }: { params: { provider: string } }) {
  const provider = providerFrom(params);
  if (!provider) return NextResponse.json({ error: "Unsupported provider." }, { status: 404 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Only workspace admins can manage integrations." }, { status: 403 });
  try {
    const config = validateProviderConfig(provider, await req.json());
    await saveIntegrationConfig(user.organization_id, provider, config);
    await recordAuditEvent({ organizationId: user.organization_id, actorId: user.id, action: "integration.updated", resourceType: "integration", resourceId: provider });
    return NextResponse.json({ provider, configured: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid provider configuration." }, { status: 400 });
  }
}

export async function POST(_req: Request, { params }: { params: { provider: string } }) {
  const provider = providerFrom(params);
  if (!provider) return NextResponse.json({ error: "Unsupported provider." }, { status: 404 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const config = await getIntegrationConfig(user.organization_id, provider);
  if (!config) return NextResponse.json({ error: "Provider is not configured." }, { status: 400 });
  try {
    await testProvider(provider, config);
    return NextResponse.json({ tested: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Provider test failed." }, { status: 502 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { provider: string } }) {
  const provider = providerFrom(params);
  if (!provider) return NextResponse.json({ error: "Unsupported provider." }, { status: 404 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Only workspace admins can manage integrations." }, { status: 403 });
  await deleteIntegrationKey(user.organization_id, provider);
  return NextResponse.json({ deleted: true });
}
