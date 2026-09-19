"use client";



import { FormEvent, useEffect, useState } from "react";

import Sidebar from "@/components/Sidebar";



export default function IntegrationsPage() {

  const [data, setData] = useState<{ keys: { id: number; name: string; key_prefix: string; created_at: string }[]; webhooks: { id: number; name: string; endpoint_url: string; events: string[]; enabled: boolean }[]; deliveries: { id: number; webhook_name: string; event: string; status: string; attempts: number; error_message: string | null }[]; credentials: { provider: string; updated_at: string }[] }>({ keys: [], webhooks: [], deliveries: [], credentials: [] });

  const [keyName, setKeyName] = useState("");

  const [webhook, setWebhook] = useState({ name: "", endpointUrl: "" });

  const [secret, setSecret] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const providers = [
    { id: "slack", label: "Slack", fields: [["webhookUrl", "Incoming webhook URL"]] },
    { id: "microsoft_teams", label: "Microsoft Teams", fields: [["webhookUrl", "Workflow/webhook URL"]] },
    { id: "meta_graph", label: "Meta Graph API", fields: [["accessToken", "User/page access token"], ["pageId", "Page ID"]] },
    { id: "google_business_profile", label: "Google Business Profile", fields: [["accessToken", "OAuth access token"], ["accountId", "Business account ID"], ["locationId", "Location ID (optional)"]] },
  ] as const;
  const [providerValues, setProviderValues] = useState<Record<string, Record<string, string>>>({});
  const [providerBusy, setProviderBusy] = useState<string | null>(null);

  async function saveProvider(provider: string) {
    setProviderBusy(provider);
    const response = await fetch(`/api/integrations/providers/${provider}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(providerValues[provider] || {}) });
    const result = await response.json();
    if (!response.ok) setError(result.error); else { setSecret(null); await load(); }
    setProviderBusy(null);
  }

  async function testProvider(provider: string) {
    setProviderBusy(provider);
    const response = await fetch(`/api/integrations/providers/${provider}`, { method: "POST" });
    const result = await response.json();
    setError(response.ok ? `${provider} connection test succeeded.` : result.error);
    setProviderBusy(null);
  }

  async function removeProvider(provider: string) {
    await fetch(`/api/integrations/providers/${provider}`, { method: "DELETE" });
    await load();
  }

  async function load() { const response = await fetch("/api/integrations"); const result = await response.json(); if (!response.ok) setError(result.error); else setData(result); }

  useEffect(() => { load(); }, []);

  async function createKey(event: FormEvent) { event.preventDefault(); const response = await fetch("/api/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "key", name: keyName }) }); const result = await response.json(); if (!response.ok) setError(result.error); else { setSecret(result.key); setKeyName(""); await load(); } }

  async function createWebhook(event: FormEvent) { event.preventDefault(); const response = await fetch("/api/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "webhook", ...webhook }) }); const result = await response.json(); if (!response.ok) setError(result.error); else { setSecret(result.secret); setWebhook({ name: "", endpointUrl: "" }); await load(); } }

  async function remove(type: string, id: number) { await fetch(`/api/integrations?type=${type}&id=${id}`, { method: "DELETE" }); await load(); }

  async function replay(id: number) { const response = await fetch("/api/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "replay", deliveryId: id }) }); if (!response.ok) { const result = await response.json(); setError(result.error); } await load(); }

  return <div className="min-h-screen lg:pl-64"><Sidebar /><main className="mx-auto min-h-screen max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><header className="mb-8"><p className="eyebrow">Developer tools</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Integrations</h1><p className="mt-2 text-sm text-slate-500">Connect services owned by your organization. Secrets are encrypted server-side and never displayed again.</p></header>{error && <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}{secret && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Copy this secret now:</strong><code className="mt-2 block break-all">{secret}</code><button onClick={() => setSecret(null)} className="mt-3 text-xs font-semibold underline">Dismiss</button></div>}<section className="panel mb-6 p-6"><p className="eyebrow">Provider connections</p><h2 className="mt-1 text-lg font-semibold text-slate-900">Slack, Teams, Meta, and Google Business Profile</h2><div className="mt-5 grid gap-4 md:grid-cols-2">{providers.map((provider) => { const configured = data.credentials?.some((credential) => credential.provider === provider.id); const values = providerValues[provider.id] || {}; return <div key={provider.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><h3 className="font-medium text-slate-900">{provider.label}</h3>{configured && <span className="text-xs font-semibold uppercase text-emerald-600">Connected</span>}</div><div className="mt-3 space-y-2">{provider.fields.map(([field, label]) => <input key={field} type={field.toLowerCase().includes("token") ? "password" : "text"} className="field" placeholder={label} value={values[field] || ""} onChange={(e) => setProviderValues({ ...providerValues, [provider.id]: { ...values, [field]: e.target.value } })} />)}</div><div className="mt-3 flex gap-2"><button onClick={() => saveProvider(provider.id)} disabled={providerBusy === provider.id} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{providerBusy === provider.id ? "Saving…" : "Save"}</button>{configured && <><button onClick={() => testProvider(provider.id)} disabled={providerBusy === provider.id} className="rounded-xl border px-3 py-2 text-xs font-semibold">Test</button><button onClick={() => removeProvider(provider.id)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">Remove</button></>}</div></div>; })}</div></section><div className="grid gap-6 md:grid-cols-2"><section className="panel p-6"><p className="eyebrow">API access</p><h2 className="mt-1 text-lg font-semibold text-slate-900">Keys</h2><form onSubmit={createKey} className="mt-5 flex gap-2"><input required className="field" placeholder="Analytics integration" value={keyName} onChange={(e) => setKeyName(e.target.value)} /><button className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white">Create</button></form><div className="mt-5 space-y-2">{data.keys.map((key) => <div key={key.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-xs"><span>{key.name} · {key.key_prefix}…</span><button onClick={() => remove("key", key.id)} className="font-semibold text-red-600">Revoke</button></div>)}</div></section><section className="panel p-6"><p className="eyebrow">Event delivery</p><h2 className="mt-1 text-lg font-semibold text-slate-900">Webhooks</h2><form onSubmit={createWebhook} className="mt-5 space-y-3"><input required className="field" placeholder="Webhook name" value={webhook.name} onChange={(e) => setWebhook({ ...webhook, name: e.target.value })} /><input required type="url" className="field" placeholder="https://example.com/events" value={webhook.endpointUrl} onChange={(e) => setWebhook({ ...webhook, endpointUrl: e.target.value })} /><button className="w-full rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Register webhook</button></form><div className="mt-5 space-y-2">{data.webhooks.map((hook) => <div key={hook.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-xs"><span className="truncate">{hook.name} · {hook.endpoint_url}</span><button onClick={() => remove("webhook", hook.id)} className="font-semibold text-red-600">Delete</button></div>)}</div></section></div><section className="panel mt-6 p-6"><p className="eyebrow">Delivery history</p><h2 className="mt-1 text-lg font-semibold text-slate-900">Recent webhook attempts</h2><div className="mt-5 space-y-2">{data.deliveries.map((delivery) => <div key={delivery.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-xs"><span>{delivery.webhook_name} · {delivery.event} · {delivery.status} ({delivery.attempts} attempts){delivery.error_message && ` · ${delivery.error_message}`}</span><button onClick={() => replay(delivery.id)} className="font-semibold text-blue-600">Replay</button></div>)}</div></section></main></div>;

}
