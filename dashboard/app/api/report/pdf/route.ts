import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const COLORS = {
  navy: "#10233f",
  blue: "#2563eb",
  cyan: "#0ea5e9",
  ink: "#172033",
  muted: "#64748b",
  line: "#dbe4ef",
  soft: "#f4f7fb",
  white: "#ffffff",
};

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function drawFooter(doc: PDFKit.PDFDocument, pageNumber: number) {
  const pageBottom = doc.page.height - 32;
  doc.save().strokeColor(COLORS.line).moveTo(48, pageBottom - 12).lineTo(547, pageBottom - 12).stroke();
  doc.fontSize(8).fillColor(COLORS.muted)
    .text("SIGNAL / INTEL  |  CONFIDENTIAL", 48, pageBottom - 2, { lineBreak: false })
    .text(`PAGE ${pageNumber}`, 480, pageBottom - 2, { width: 67, align: "right", lineBreak: false });
  doc.restore();
}

function sectionTitle(doc: PDFKit.PDFDocument, eyebrow: string, heading: string) {
  doc.fontSize(8).fillColor(COLORS.blue).text(eyebrow.toUpperCase(), { characterSpacing: 1.2 });
  doc.moveDown(0.25).fontSize(17).fillColor(COLORS.navy).text(heading);
  doc.moveDown(0.35).strokeColor(COLORS.line).moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.8);
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const user = await getCurrentUser();
    const workerAuthorized = Boolean(process.env.REPORT_WORKER_SECRET && req.headers.get("x-report-worker-secret") === process.env.REPORT_WORKER_SECRET);
    const organizationId = user?.organization_id || (workerAuthorized ? Number(sp.get("organizationId")) : NaN);
    if (!Number.isInteger(organizationId)) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const keyword = sp.get("keyword")?.trim() || null;
    const platform = sp.get("platform");
    const params: string[] = [];
    const conditions: string[] = [`organization_id = $1`];
    params.push(String(organizationId));

    if (keyword) {
      params.push(`%${keyword}%`);
      conditions.push(`(matched_keyword ILIKE $${params.length} OR content ILIKE $${params.length} OR author_name ILIKE $${params.length})`);
    }
    if (platform && platform !== "all") {
      params.push(platform);
      conditions.push(`platform = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT platform, post_url, author_name, content, matched_keyword, post_date,
              likes, comments, shares, scraped_at
       FROM posts ${where} ORDER BY scraped_at DESC LIMIT 500`,
      params
    );

    const counts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.platform] = (acc[row.platform] || 0) + 1;
      return acc;
    }, {});
    const engagement = rows.reduce(
      (acc, row) => ({
        likes: acc.likes + (row.likes || 0),
        comments: acc.comments + (row.comments || 0),
        shares: acc.shares + (row.shares || 0),
      }),
      { likes: 0, comments: 0, shares: 0 }
    );

    const doc = new PDFDocument({ margin: 48, size: "A4", bufferPages: true, info: {
      Title: "Social Listening Intelligence Report",
      Author: "Signal / Intel",
      Subject: "Public source monitoring report",
    }});
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const finished = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

    doc.rect(0, 0, doc.page.width, 280).fill(COLORS.navy);
    doc.circle(535, 40, 115).fill("#173b67");
    doc.circle(475, 220, 78).fill("#123052");
    doc.fontSize(10).fillColor("#8cc8ff").text("SIGNAL / INTEL", 48, 54, { characterSpacing: 2 });
    doc.fontSize(30).fillColor(COLORS.white).text("Social Listening", 48, 105);
    doc.fontSize(30).fillColor(COLORS.white).text("Intelligence Report", 48, 140);
    doc.fontSize(11).fillColor("#b9c8dc").text(
      keyword ? `Monitoring brief  /  ${keyword}` : "Executive monitoring brief",
      48,
      198
    );
    doc.fontSize(9).fillColor("#b9c8dc").text(
      `${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}  |  Public source coverage`,
      48,
      222
    );
    doc.y = 318;

    sectionTitle(doc, "01  Executive snapshot", "Signal overview");
    const cards = [
      ["MENTIONS", compactNumber(rows.length)],
      ["LIKES", compactNumber(engagement.likes)],
      ["COMMENTS", compactNumber(engagement.comments)],
      ["SHARES", compactNumber(engagement.shares)],
    ];
    const cardWidth = 117;
    cards.forEach(([label, value], index) => {
      const x = 48 + index * 125;
      doc.roundedRect(x, doc.y, cardWidth, 62, 8).fill(COLORS.soft);
      doc.fontSize(8).fillColor(COLORS.muted).text(label, x + 12, doc.y + 12, { characterSpacing: 0.8 });
      doc.fontSize(20).fillColor(COLORS.navy).text(value, x + 12, doc.y + 31);
    });
    doc.y += 86;
    doc.fontSize(10).fillColor(COLORS.muted).text(
      rows.length
        ? "This report consolidates public signals into a concise view of source coverage and visible engagement."
        : "No matching public sources were found for this report scope.",
      { width: 495, lineGap: 3 }
    );
    doc.moveDown(1.2);

    sectionTitle(doc, "02  Coverage", "Source distribution");
    const platformEntries = Object.entries(counts);
    if (!platformEntries.length) {
      doc.fontSize(10).fillColor(COLORS.muted).text("No platform data available.");
    } else {
      platformEntries.forEach(([name, count], index) => {
        const y = doc.y;
        const barWidth = 330;
        const fillWidth = Math.max(8, (count / rows.length) * barWidth);
        doc.fontSize(10).fillColor(COLORS.ink).text(titleCase(name), 48, y);
        doc.fontSize(10).fillColor(COLORS.muted).text(`${count} source${count === 1 ? "" : "s"}`, 430, y, { width: 117, align: "right" });
        doc.roundedRect(48, y + 18, barWidth, 7, 3).fill(COLORS.line);
        doc.roundedRect(48, y + 18, fillWidth, 7, 3).fill(index % 2 ? COLORS.cyan : COLORS.blue);
        doc.y = y + 42;
      });
    }

    doc.addPage();
    sectionTitle(doc, "03  Source intelligence", "Detailed mentions");
    rows.forEach((row, index) => {
      if (doc.y > 685) {
        doc.addPage();
        sectionTitle(doc, "03  Source intelligence", "Detailed mentions");
      }
      const startY = doc.y;
      doc.roundedRect(48, startY, 6, 54, 3).fill(index % 2 ? COLORS.cyan : COLORS.blue);
      doc.fontSize(8).fillColor(COLORS.blue).text(titleCase(row.platform), 66, startY + 2, { characterSpacing: 0.6 });
      doc.fontSize(10).fillColor(COLORS.ink).text(row.author_name || "Unknown source", 66, startY + 16, { width: 350 });
      doc.fontSize(8).fillColor(COLORS.muted).text(
        [row.post_date ? new Date(row.post_date).toLocaleDateString() : null,
          row.likes != null ? `${row.likes} likes` : null,
          row.comments != null ? `${row.comments} comments` : null,
          row.shares != null ? `${row.shares} shares` : null].filter(Boolean).join("  |  "),
        66,
        startY + 34,
        { width: 450 }
      );
      doc.fontSize(9).fillColor(COLORS.muted).text((row.content || "No preview available").slice(0, 420), 66, startY + 55, { width: 450, lineGap: 2 });
      doc.fontSize(8).fillColor(COLORS.blue).text(row.post_url, 66, doc.y + 4, { width: 450, link: row.post_url, underline: true });
      doc.moveDown(1.1);
    });

    const pageRange = doc.bufferedPageRange();
    for (let pageIndex = 0; pageIndex < pageRange.count; pageIndex += 1) {
      doc.switchToPage(pageRange.start + pageIndex);
      doc.rect(0, 0, doc.page.width, 9).fill(COLORS.blue);
      drawFooter(doc, pageIndex + 1);
    }
    doc.end();
    const pdf = await finished;
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"signal-intel-report.pdf\"",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to generate PDF report", error);
    return new Response("Unable to generate report.", { status: 500 });
  }
}
