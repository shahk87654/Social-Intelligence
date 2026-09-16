"use client";

import { FormEvent, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Comparison = { label: string; mentions: number; likes: number; comments: number; shares: number; positive: number; negative: number; share_of_voice: number };

export default function ComparisonPage() {
  const [form, setForm] = useState({ left: "", right: "" });
  const [rows, setRows] = useState<Comparison[]>([]);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch(`/api/comparison?left=${encodeURIComponent(form.left)}&right=${encodeURIComponent(form.right)}`);
    const data = await response.json();
    if (!response.ok) setError(data.error || "Unable to compare keywords.");
    else { setRows(data.comparison); setError(null); }
  }
  return <div className="min-h-screen lg:pl-64"><Sidebar /><main className="mx-auto min-h-screen max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><header className="mb-8"><p className="eyebrow">Competitive intelligence</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Compare signals</h1><p className="mt-2 text-sm text-slate-500">Compare share of voice, engagement, and sentiment for two tracked keywords.</p></header><form onSubmit={submit} className="panel grid gap-3 p-5 md:grid-cols-[1fr_1fr_auto]"><input required className="field" placeholder="Brand or keyword A" value={form.left} onChange={(e) => setForm({ ...form, left: e.target.value })} /><input required className="field" placeholder="Brand or keyword B" value={form.right} onChange={(e) => setForm({ ...form, right: e.target.value })} /><button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Compare</button></form>{error && <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}<section className="panel mt-6 overflow-hidden">{rows.length ? <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">Keyword</th><th className="px-5 py-4">Share of voice</th><th className="px-5 py-4">Mentions</th><th className="px-5 py-4">Engagement</th><th className="px-5 py-4">Positive</th><th className="px-5 py-4">Negative</th></tr></thead><tbody>{rows.map((row) => <tr key={row.label} className="border-t border-slate-100"><td className="px-5 py-5 font-semibold text-slate-800">{row.label}</td><td className="px-5 py-5"><div className="flex items-center gap-3"><div className="h-2 w-28 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${row.share_of_voice}%` }} /></div>{row.share_of_voice}%</div></td><td className="px-5 py-5 text-slate-700">{row.mentions}</td><td className="px-5 py-5 text-slate-700">{row.likes + row.comments + row.shares}</td><td className="px-5 py-5 text-emerald-600">{row.positive}</td><td className="px-5 py-5 text-red-600">{row.negative}</td></tr>)}</tbody></table></div> : <p className="p-8 text-sm text-slate-400">Run a comparison to see the relative conversation share.</p>}</section></main></div>;
}
