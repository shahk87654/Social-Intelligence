import crypto from "node:crypto";
import { pool } from "@/lib/db";

export type Provider =
  | "resend"
  | "serpapi"
  | "slack"
  | "microsoft_teams"
  | "meta_graph"
  | "google_business_profile";

export type ProviderConfig = Record<string, string>;

export const PROVIDER_FIELDS: Record<Provider, string[]> = {
  resend: ["apiKey"],
  serpapi: ["apiKey"],
  slack: ["webhookUrl"],
  microsoft_teams: ["webhookUrl"],
  meta_graph: ["accessToken", "pageId"],
  google_business_profile: ["accessToken", "accountId", "locationId"],
};

export function validateProviderConfig(provider: Provider, input: unknown): ProviderConfig {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("A provider configuration is required.");
  const config: ProviderConfig = {};
  for (const field of PROVIDER_FIELDS[provider]) {
    const value = (input as Record<string, unknown>)[field];
    if (typeof value === "string" && value.trim()) config[field] = value.trim();
  }
  const required = provider === "meta_graph" ? ["accessToken", "pageId"] : provider === "google_business_profile" ? ["accessToken", "accountId"] : PROVIDER_FIELDS[provider];
  if (required.some((field) => !config[field])) throw new Error(`Missing required ${provider} configuration.`);
  if (["slack", "microsoft_teams"].includes(provider)) {
    let url: URL;
    try { url = new URL(config.webhookUrl); } catch { throw new Error("Webhook URL must be valid HTTPS."); }
    if (url.protocol !== "https:") throw new Error("Webhook URL must use HTTPS.");
    if (provider === "slack" && !(url.hostname === "slack.com" || url.hostname.endsWith(".slack.com"))) throw new Error("Slack webhook URL must be hosted by slack.com.");
    if (provider === "microsoft_teams" && !(/(^|\.)microsoft\.com$/.test(url.hostname) || /(^|\.)office\.com$/.test(url.hostname))) throw new Error("Teams webhook URL must be hosted by Microsoft.");
  }
  return config;
}

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

export async function getIntegrationKey(organizationId: number, provider: Provider): Promise<string | null> {
  const result = await pool.query(
    "SELECT encrypted_key FROM organization_integrations WHERE organization_id = $1 AND provider = $2",
    [organizationId, provider]
  );
  return result.rows[0] ? decryptIntegrationKey(result.rows[0].encrypted_key) : null;
}

export async function getIntegrationConfig(organizationId: number, provider: Provider): Promise<ProviderConfig | null> {
  const value = await getIntegrationKey(organizationId, provider);
  if (!value) return null;
  try { return JSON.parse(value) as ProviderConfig; } catch { return { apiKey: value }; }
}

export async function saveIntegrationKey(organizationId: number, provider: Provider, key: string) {
  await pool.query(
    `INSERT INTO organization_integrations (organization_id, provider, encrypted_key)
     VALUES ($1, $2, $3)
     ON CONFLICT (organization_id, provider) DO UPDATE SET encrypted_key = EXCLUDED.encrypted_key, updated_at = now()`,
    [organizationId, provider, encryptIntegrationKey(key)]
  );
}

export async function saveIntegrationConfig(organizationId: number, provider: Provider, config: ProviderConfig) {
  return saveIntegrationKey(organizationId, provider, JSON.stringify(config));
}

export async function deleteIntegrationKey(organizationId: number, provider: Provider) {
  await pool.query("DELETE FROM organization_integrations WHERE organization_id = $1 AND provider = $2", [organizationId, provider]);
}