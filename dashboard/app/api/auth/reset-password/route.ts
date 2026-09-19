import { NextResponse } from "next/server";
import { consumeAuthToken, hashPassword } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token || password.length < 8) return NextResponse.json({ error: "Use a password with at least 8 characters." }, { status: 400 });
  const userId = await consumeAuthToken(token, "password_reset");
  if (!userId) return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [await hashPassword(password), userId]);
  await pool.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
  return NextResponse.json({ reset: true });
}
