import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Sign in required.", { status: 401 });
    const result = await pool.query(
      `SELECT gr.file_name, gr.pdf_data
       FROM generated_reports gr
       JOIN report_schedules rs ON rs.id = gr.schedule_id
       WHERE gr.id = $1 AND gr.status = 'sent' AND rs.organization_id = $2`,
      [Number(params.id), user.organization_id]
    );
    if (!result.rowCount || !result.rows[0].pdf_data) return new NextResponse("Report not found.", { status: 404 });
    return new Response(new Uint8Array(result.rows[0].pdf_data), {
      headers: {
        "Content-Type": result.rows[0].file_name.endsWith(".csv") ? "text/csv; charset=utf-8" : "application/pdf",
        "Content-Disposition": `attachment; filename="${result.rows[0].file_name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to download generated report", error);
    return new NextResponse("Unable to download report.", { status: 503 });
  }
}
