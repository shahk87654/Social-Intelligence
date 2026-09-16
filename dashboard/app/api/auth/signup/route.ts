import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      return NextResponse.json({ error: "Enter a name, valid email, and password with at least 8 characters." }, { status: 400 });
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const user = await client.query(
        "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
        [name, email, await hashPassword(password)]
      );
      const slug = `${email.split("@")[0].replace(/[^a-z0-9]+/g, "-")}-${user.rows[0].id}`;
      const organization = await client.query(
        "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id",
        [`${name}'s workspace`, slug]
      );
      await client.query(
        "INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'admin')",
        [organization.rows[0].id, user.rows[0].id]
      );
      await client.query("COMMIT");
      await createSession(user.rows[0].id);
      return NextResponse.json({ authenticated: true }, { status: 201 });
    } catch (error) {
      await client.query("ROLLBACK");
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Signup failed", error);
    return NextResponse.json({ error: "Unable to create account." }, { status: 503 });
  }
}
