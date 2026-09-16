"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

const widgetLabels = { stats: "Coverage cards", analytics: "Analytics charts", mentions: "Discovered sources", scan: "Scan launcher", sources: "Source filters" };

export default function SettingsPage() {
  const [widgets, setWidgets] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  useEffect(() => { fetch("/api/preferences").then((response) => response.json()).then((data) => setWidgets(data.widgets || {})); }, []);
  async function save() { await fetch("/api/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ widgets }) }); setSaved(true); setTimeout(() => setSaved(false), 1800); }
  return <div className="min-h-screen lg:pl-64"><Sidebar /><main className="mx-auto min-h-screen max-w-[900px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><header className="mb-8"><p className="eyebrow">Workspace preferences</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Dashboard settings</h1><p className="mt-2 text-sm text-slate-500">Choose the widgets that matter most to your daily monitoring workflow.</p></header><section className="panel p-6"><div className="space-y-3">{Object.entries(widgetLabels).map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-xl border border-slate-100 p-4"><span className="text-sm font-medium text-slate-700">{label}</span><input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-blue-600" checked={widgets[key] !== false} onChange={(e) => setWidgets({ ...widgets, [key]: e.target.checked })} /></label>)}</div><div className="mt-6 flex items-center justify-end gap-3">{saved && <span className="text-sm text-emerald-600">Saved</span>}<button onClick={save} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Save preferences</button></div></section></main></div>;
}
