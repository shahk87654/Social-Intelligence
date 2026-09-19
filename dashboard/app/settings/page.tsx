"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

const widgetLabels = { stats: "Coverage cards", analytics: "Analytics charts", mentions: "Discovered sources", scan: "Scan launcher", sources: "Source filters" };

export default function SettingsPage() {
  const [widgets, setWidgets] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useState<"light" | "dark">(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light");
  const [credentials, setCredentials] = useState<Record<string, boolean>>({});
  const [keys, setKeys] = useState({ resend: "", serpapi: "" });
  const [credentialSaved, setCredentialSaved] = useState<string | null>(null);
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    Promise.all([fetch("/api/preferences").then((response) => response.json()), fetch("/api/integrations").then((response) => response.json())]).then(([preferenceData, integrationData]) => {
      setWidgets(preferenceData.widgets || {});
      setTheme(preferenceData.theme || "light");
      setCredentials(Object.fromEntries((integrationData.credentials || []).map((item: { provider: string }) => [item.provider, true])));
    });
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("signal-theme", theme);
  }, [theme]);
  async function save() {
    await fetch("/api/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ widgets, theme }) });
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  }
  async function saveKey(provider: "resend" | "serpapi") {
    setCredentialError(null);
    const response = await fetch("/api/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "credential", provider, value: keys[provider] }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setCredentialError(data.error || `Unable to save the ${provider} key.`); return; }
    setCredentials({ ...credentials, [provider]: true }); setKeys({ ...keys, [provider]: "" }); setCredentialSaved(provider); setTimeout(() => setCredentialSaved(null), 1800);
  }
  async function removeKey(provider: "resend" | "serpapi") {
    await fetch(`/api/integrations?provider=${provider}`, { method: "DELETE" });
    setCredentials({ ...credentials, [provider]: false });
  }
  return <div className="min-h-screen lg:pl-64"><Sidebar /><main className="mx-auto min-h-screen max-w-[900px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><header className="mb-8"><p className="eyebrow">Workspace preferences</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Dashboard settings</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Control the workspace surface and connect the services your team owns.</p></header><section className="panel p-6"><div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-700"><div><h2 className="font-semibold text-slate-900 dark:text-white">Appearance</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose how the console looks on this device.</p></div><select className="select-field" value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark")}><option value="light">Light</option><option value="dark">Dark</option></select></div><div className="space-y-3">{Object.entries(widgetLabels).map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-700"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span><input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-blue-600" checked={widgets[key] !== false} onChange={(e) => setWidgets({ ...widgets, [key]: e.target.checked })} /></label>)}</div><div className="mt-6 flex items-center justify-end gap-3">{saved && <span className="text-sm text-emerald-600">Saved</span>}<button onClick={save} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Save preferences</button></div></section><section className="panel mt-6 p-6"><div className="mb-6"><p className="eyebrow">Private credentials</p><h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Connect your services</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Keys are encrypted before they are stored and never shown again.</p></div>{credentialError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{credentialError}</div>}<div className="space-y-5">{([['serpapi', 'SerpAPI', 'Required to discover public web and Google review results.'], ['resend', 'Resend', 'Required for invitations and scheduled report delivery.']] as const).map(([provider, label, description]) => <div key={provider} className="rounded-xl border border-slate-100 p-4 dark:border-slate-700"><div className="flex items-start justify-between gap-4"><div><h3 className="font-medium text-slate-900 dark:text-white">{label}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p></div>{credentials[provider] && <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Connected</span>}</div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input type="password" className="field" placeholder={credentials[provider] ? "Enter a new key to replace it" : `Paste your ${label} API key`} value={keys[provider]} onChange={(e) => setKeys({ ...keys, [provider]: e.target.value })} /><button onClick={() => saveKey(provider)} disabled={!keys[provider]} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-slate-950">{credentialSaved === provider ? "Saved" : "Save key"}</button>{credentials[provider] && <button onClick={() => removeKey(provider)} className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600">Remove</button>}</div></div>)}</div></section></main></div>;
}
