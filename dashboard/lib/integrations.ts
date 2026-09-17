import crypto from "node:crypto";
import { pool } from "@/lib/db";

type Provider = "resend" | "serpapi";

function encryptionKey() {
  const value = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!value) throw new Error("INTEGRATION_ENCRYPTION_KEY must be configured.");
  return crypto.createHash("sha256").update(value).digest();
}

export function encryptIntegrationKey(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptIntegrationKey(value: string) {
  const [ivText, tagText, encryptedText] = value.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64url")), decipher.final()]).toString("utf8");
}

export async function getIntegrationKey(organizationId: number, provider: Provider) {
  const result = await pool.query(
    "SELECT encrypted_key FROM organization_integrations WHERE organization_id = $1 AND provider = $2",
    [organizationId, provider]
  );
  return result.rows[0] ? decryptIntegrationKey(result.rows[0].encrypted_key) : null;
}

export async function saveIntegrationKey(organizationId: number, provider: Provider, key: string) {
  await pool.query(
    `INSERT INTO organization_integrations (organization_id, provider, encrypted_key)
     VALUES ($1, $2, $3)
     ON CONFLICT (organization_id, provider) DO UPDATE SET encrypted_key = EXCLUDED.encrypted_key, updated_at = now()`,
    [organizationId, provider, encryptIntegrationKey(key)]
  );
}

export async function deleteIntegrationKey(organizationId: number, provider: Provider) {
  await pool.query("DELETE FROM organization_integrations WHERE organization_id = $1 AND provider = $2", [organizationId, provider]);
}