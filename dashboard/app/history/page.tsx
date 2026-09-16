"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Scan = { id: number; keyword: string; platforms: string[]; status: string; error: string | null; started_at: string; finished_at: string | null; posts_found: number };

export default function HistoryPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/history").then(async (response) => {
      const data = await response.json();
      if (!response.ok) setError(data.error || "Unable to load scan history.");
      else setScans(data.scans);
    }).catch(() => setError("Unable to load scan history."));
  }, []);

  return <div className="min-h-screen lg:pl-64"><Sidebar /><main className="mx-auto min-h-screen max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <header className="mb-8"><p className="eyebrow">Activity log</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Scan history</h1><p className="mt-2 text-sm text-slate-500">Review every search, its result count, status, and any errors.</p></header>
    {error && <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <section className="panel overflow-hidden">
      <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-[11px] uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-5 py-4">Search</th><th className="px-5 py-4">Platforms</th><th className="px-5 py-4">Started</th><th className="px-5 py-4">Results</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Error</th></tr></thead><tbody>{scans.map((scan) => <tr key={scan.id} className="border-t border-slate-100"><td className="px-5 py-4 font-medium text-slate-800">{scan.keyword}</td><td className="px-5 py-4 capitalize text-slate-500">{scan.platforms.join(" · ")}</td><td className="px-5 py-4 whitespace-nowrap text-slate-500">{new Date(scan.started_at).toLocaleString()}</td><td className="px-5 py-4 text-slate-700">{scan.posts_found.toLocaleString()}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${scan.status === "completed" ? "bg-emerald-50 text-emerald-700" : scan.status === "failed" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{scan.status}</span></td><td className="max-w-xs px-5 py-4 text-xs text-red-600">{scan.error || "—"}</td></tr>)}</tbody></table></div>
      {!scans.length && !error && <p className="p-8 text-sm text-slate-400">No scans have been recorded yet.</p>}
    </section>
  </main></div>;
}
