import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const result = user.is_super_admin
    ? await pool.query(
      `SELECT st.id, st.subject, st.message, st.priority, st.status, st.admin_reply, st.replied_at, st.created_at, st.updated_at, st.name, st.email, st.organization_id, o.name AS organization_name
       FROM support_tickets st LEFT JOIN organizations o ON o.id = st.organization_id ORDER BY st.created_at DESC LIMIT 200`
    )
    : user.role === "admin"
    ? await pool.query(
      `SELECT st.id, st.subject, st.message, st.priority, st.status, st.admin_reply, st.replied_at, st.created_at, st.updated_at, st.name, st.email
       FROM support_tickets st WHERE st.organization_id = $1 ORDER BY st.created_at DESC LIMIT 100`, [user.organization_id]
    )
    : await pool.query(
      `SELECT id, subject, message, priority, status, admin_reply, replied_at, created_at, updated_at
       FROM support_tickets WHERE organization_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 25`, [user.organization_id, user.id]
    );
  const messages = result.rows.length
    ? await pool.query(
      `SELECT id, ticket_id, author_id, author_name, author_type, body, created_at
       FROM support_ticket_messages WHERE ticket_id = ANY($1::bigint[]) ORDER BY created_at ASC`,
      [result.rows.map((ticket) => ticket.id)]
    )
    : { rows: [] };
  return NextResponse.json({ tickets: result.rows, messages: messages.rows, isAdmin: user.role === "admin" || user.is_super_admin, isSuperAdmin: user.is_super_admin });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const priority = ["low", "normal", "high", "urgent"].includes(String(body.priority)) ? String(body.priority) : "normal";
    if (subject.length < 3 || subject.length > 160) return NextResponse.json({ error: "Subject must be between 3 and 160 characters." }, { status: 400 });
    if (message.length < 10 || message.length > 5000) return NextResponse.json({ error: "Please provide between 10 and 5,000 characters of detail." }, { status: 400 });
    if (!validEmail(user.email)) return NextResponse.json({ error: "Your account email is not valid." }, { status: 400 });
    const client = await pool.connect();
    let result;
    try {
      await client.query("BEGIN");
      result = await client.query(
        `INSERT INTO support_tickets (organization_id, user_id, name, email, subject, message, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, subject, priority, status, created_at`,
        [user.organization_id, user.id, user.name, user.email, subject, message, priority]
      );
      await client.query(
        `INSERT INTO support_ticket_messages (ticket_id, author_id, author_name, author_email, author_type, body)
         VALUES ($1, $2, $3, $4, 'customer', $5)`, [result.rows[0].id, user.id, user.name, user.email, message]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return NextResponse.json({ ticket: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Failed to create support ticket", error);
    return NextResponse.json({ error: "Unable to create support ticket." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    const id = Number(body.id);
    const reply = typeof body.reply === "string" ? body.reply.trim() : "";
    const status = ["open", "in_progress", "resolved", "closed"].includes(String(body.status)) ? String(body.status) : "in_progress";
    if (!Number.isInteger(id)) return NextResponse.json({ error: "A valid ticket id is required." }, { status: 400 });

    if (body.action === "reopen") {
      const result = await pool.query(
        `UPDATE support_tickets SET status = 'open', updated_at = now()
         WHERE id = $1 AND user_id = $2 AND status = 'closed' RETURNING id, status`, [id, user.id]
      );
      if (!result.rowCount) return NextResponse.json({ error: "Only the requester can reopen a closed ticket." }, { status: 403 });
      await pool.query(
        `INSERT INTO support_ticket_messages (ticket_id, author_id, author_name, author_email, author_type, body)
         VALUES ($1, $2, $3, $4, 'customer', $5)`, [id, user.id, user.name, user.email, reply || "The requester asked to reopen this ticket."]
      );
      return NextResponse.json({ ticket: result.rows[0] });
    }

    if (user.role !== "admin" && !user.is_super_admin) return NextResponse.json({ error: "Only workspace admins can reply to support tickets." }, { status: 403 });
    if (reply.length < 10 || reply.length > 5000) return NextResponse.json({ error: "Reply must be between 10 and 5,000 characters." }, { status: 400 });
    const result = await pool.query(
      `UPDATE support_tickets SET admin_reply = $1, replied_by = $2, replied_at = now(), status = $3, updated_at = now()
       WHERE id = $4 ${user.is_super_admin ? "" : "AND organization_id = $5"} RETURNING id, subject, status, admin_reply, replied_at`,
      user.is_super_admin ? [reply, user.id, status, id] : [reply, user.id, status, id, user.organization_id]
    );
    if (!result.rowCount) return NextResponse.json({ error: "Support ticket not found." }, { status: 404 });
    await pool.query(
      `INSERT INTO support_ticket_messages (ticket_id, author_id, author_name, author_email, author_type, body)
       VALUES ($1, $2, $3, $4, 'support', $5)`, [id, user.id, user.name, user.email, reply]
    );
    return NextResponse.json({ ticket: result.rows[0] });
  } catch (error) {
    console.error("Failed to reply to support ticket", error);
    return NextResponse.json({ error: "Unable to reply to support ticket." }, { status: 503 });
  }
}