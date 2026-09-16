import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const scraperUrl = process.env.SCRAPER_URL || "http://localhost:4000";

    const resp = await fetch(`${scraperUrl}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
