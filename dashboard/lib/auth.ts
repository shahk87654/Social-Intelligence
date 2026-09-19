import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

export const SESSION_COOKIE = "signal_session";
export const AUTH_TOKEN_TTL_MS = 60 * 60 * 1000;

export function createRawToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueAuthToken(userId: number, type: "password_reset" | "email_verification") {
  const raw = createRawToken();
  await pool.query(
    "INSERT INTO auth_tokens (user_id, token_hash, token_type, expires_at) VALUES ($1, $2, $3, now() + interval '1 hour')",
    [userId, hashToken(raw), type]
  );
  return raw;
}

export async function consumeAuthToken(raw: string, type: "password_reset" | "email_verification") {
  const result = await pool.query(
    `UPDATE auth_tokens SET used_at = now()
     WHERE token_hash = $1 AND token_type = $2 AND used_at IS NULL AND expires_at > now()
     RETURNING user_id`,
    [hashToken(raw), type]
  );
  return result.rows[0]?.user_id as number | undefined;
}

export async function checkRateLimit(key: string, maxAttempts: number, windowMinutes = 15) {
  const result = await pool.query(
    `INSERT INTO auth_rate_limits (key, attempts, window_started_at)
     VALUES ($1, 1, now())
     ON CONFLICT (key) DO UPDATE SET
       attempts = CASE WHEN auth_rate_limits.window_started_at < now() - ($3 * interval '1 minute')
                       THEN 1 ELSE auth_rate_limits.attempts + 1 END,
       window_started_at = CASE WHEN auth_rate_limits.window_started_at < now() - ($3 * interval '1 minute')
                                THEN now() ELSE auth_rate_limits.window_started_at END
     RETURNING attempts`,
    [key, maxAttempts, windowMinutes]
  );
  return result.rows[0].attempts <= maxAttempts;
}

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
