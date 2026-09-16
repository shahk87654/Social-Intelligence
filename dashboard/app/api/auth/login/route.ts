import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const result = await pool.query("SELECT id, password_hash FROM users WHERE email = $1", [email]);
    if (!result.rowCount || !(await verifyPassword(password, result.rows[0].password_hash))) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }
    await createSession(result.rows[0].id);
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 503 });
  }
}
