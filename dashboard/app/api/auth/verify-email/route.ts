import { NextResponse } from "next/server";
import { consumeAuthToken } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  const userId = await consumeAuthToken(token, "email_verification");
  if (!userId) return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });
  await pool.query("UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = $1", [userId]);
  return NextResponse.json({ verified: true });
}
