import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getIntegrationKey } from "@/lib/integrations";
import { scraperHeaders } from "@/lib/scraper-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const body = await req.json();
    const scraperUrl = process.env.SCRAPER_URL || "http://localhost:4000";
    const serpApiKey = await getIntegrationKey(user.organization_id, "serpapi");
    if (!serpApiKey) return NextResponse.json({ error: "Add your SerpAPI key in Settings before starting a scan." }, { status: 400 });

    const requestBody = JSON.stringify({ ...body, organizationId: user.organization_id, serpApiKey });
    const resp = await fetch(`${scraperUrl}/scrape`, {
      method: "POST",
      headers: scraperHeaders(requestBody),
      body: requestBody,
    });
    const text = await resp.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : { error: `Scraper returned status ${resp.status}` };
    } catch {
      data = { error: `Scraper returned an invalid response (status ${resp.status})` };
    }
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error("Failed to start scrape", error);
    return NextResponse.json(
      { error: "Scraper unavailable. Start the scraper service and PostgreSQL." },
      { status: 503 }
    );
  }
}
