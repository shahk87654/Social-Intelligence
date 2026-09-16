import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const scraperUrl = process.env.SCRAPER_URL || "http://localhost:4000";
    const resp = await fetch(`${scraperUrl}/scan/${params.id}?organizationId=${user.organization_id}`);
    const text = await resp.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : { error: `Scraper returned status ${resp.status}` };
    } catch {
      data = { error: `Scraper returned an invalid response (status ${resp.status})` };
    }
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error("Failed to read scan status", error);
    return NextResponse.json(
      { error: "Scraper unavailable. Start the scraper service and PostgreSQL." },
      { status: 503 }
    );
  }
}
