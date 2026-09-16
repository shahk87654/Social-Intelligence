import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

export const SESSION_COOKIE = "signal_session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number) {
  const id = randomUUID();
  await pool.query(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, now() + interval '30 days')",
    [id, userId]
  );
  cookies().set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function destroySession() {
  const id = cookies().get(SESSION_COOKIE)?.value;
  if (id) await pool.query("DELETE FROM sessions WHERE id = $1", [id]);
  cookies().delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const id = cookies().get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, om.organization_id, om.role, o.name AS organization_name
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     JOIN organization_members om ON om.user_id = u.id
     JOIN organizations o ON o.id = om.organization_id
     WHERE s.id = $1 AND s.expires_at > now()
     LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}
