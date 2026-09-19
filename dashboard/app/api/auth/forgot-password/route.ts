import { NextResponse } from "next/server";
import { checkRateLimit, issueAuthToken } from "@/lib/auth";
import { pool } from "@/lib/db";
import { createMailer } from "@/lib/mailer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!(await checkRateLimit(`forgot:${ip}:${email}`, 5))) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }
  const user = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (user.rowCount) {
    try {
      const token = await issueAuthToken(user.rows[0].id, "password_reset");
      const url = `${process.env.APP_URL || new URL(req.url).origin}/reset-password?token=${encodeURIComponent(token)}`;
      const { sendAuthEmail } = await createMailer();
      await sendAuthEmail(email, "Reset your Signal / Intel password", `Reset your password using this link (valid for 1 hour):\n\n${url}`);
    } catch (error) {
      console.error("Password reset email failed", error);
    }
  }
  return NextResponse.json({ message: "If an account exists for that email, a reset link has been sent." });
}
