"use client";

import { useEffect, useState, useCallback } from "react";
import StatsCards from "@/components/StatsCards";
import Filters, { FilterState } from "@/components/Filters";
import PostTable from "@/components/PostTable";
import AnalyticsCharts from "@/components/AnalyticsCharts";

async function readJson<T>(res: Response): Promise<T & { error?: string }> {
  const text = await res.text();
  if (!text) {
    return { error: `Request failed with status ${res.status}` } as T & { error?: string };
  }

  try {
    return JSON.parse(text) as T & { error?: string };
  } catch {
    return { error: `Request failed with status ${res.status}` } as T & { error?: string };
  }
}

export default function DashboardPage() {
  const [keyword, setKeyword] = useState("");
  const [fbTargets, setFbTargets] = useState(""); // comma-separated Page URLs
  const [igTargets, setIgTargets] = useState(""); // comma-separated hashtags/handles
  const [selectedPlatforms, setSelectedPlatforms] = useState(["facebook", "instagram", "article"]);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, keyword: "" });

  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    q: "",
    platform: "all",
    sort: "post_date",
    order: "desc",
  });

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/stats");
    const data = await readJson<typeof stats>(res);
    if (!res.ok) {
      setApiError(data.error || "Unable to load dashboard stats.");
      return;
    }
    setStats(data);
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      q: filters.q,
      platform: filters.platform,
      sort: filters.sort,
      order: filters.order,
      page: String(page),
      pageSize: "25",
    });
    const res = await fetch(`/api/posts?${params.toString()}`);
    const data = await readJson<{ posts: any[]; total: number }>(res);
    if (!res.ok) {
      setApiError(data.error || "Unable to load posts.");
      setPosts([]);
      setLoading(false);
      return;
    }
    setPosts(data.posts);
    setTotal(data.total);
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function clearAllRecords() {
    const confirmed = window.confirm("Clear all stored records and scan history? This cannot be undone.");
    if (!confirmed) return;

    setClearing(true);
    setApiError(null);

    try {
      const res = await fetch("/api/posts", { method: "DELETE" });
      const data = await readJson<{ error?: string }>(res);
      if (!res.ok) {
        throw new Error(data.error || "Unable to clear records.");
      }

      setPosts([]);
      setTotal(0);
      setPage(1);
      await Promise.all([loadStats(), loadPosts()]);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to clear records.");
    } finally {
      setClearing(false);
    }
  }

  async function runScan() {
    if (!keyword.trim()) return;
    const keywords = [...new Set(keyword.split(",").map((value) => value.trim()).filter(Boolean))];
    setScanning(true);
    setScanProgress({ current: 0, total: keywords.length, keyword: keywords[0] || "" });
    setScanStatus(`Preparing ${keywords.length} search${keywords.length === 1 ? "" : "es"}…`);

    const targets: Record<string, string[]> = {};
    if (fbTargets.trim()) targets.facebook = fbTargets.split(",").map((s) => s.trim()).filter(Boolean);
    if (igTargets.trim()) targets.instagram = igTargets.split(",").map((s) => s.trim()).filter(Boolean);
    if (selectedPlatforms.length === 0) {
      setScanStatus("Select at least one platform before scanning.");
      setScanning(false);
      return;
    }

    try {
      for (let index = 0; index < keywords.length; index += 1) {
        const currentKeyword = keywords[index];
        setScanProgress({ current: index + 1, total: keywords.length, keyword: currentKeyword });
        setScanStatus(`Starting "${currentKeyword}"…`);
        const res = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: currentKeyword,
            platforms: selectedPlatforms,
            targets,
          }),
        });
        const data = await readJson<{ scanRunId?: number; error?: string }>(res);
        if (!res.ok || !data.scanRunId) throw new Error(data.error || `Unable to start "${currentKeyword}"`);

        await new Promise<void>((resolve, reject) => {
          const poll = setInterval(async () => {
            try {
              const r = await fetch(`/api/scan/${data.scanRunId}`);
              const run = await readJson<{ status?: string; posts_found?: number; error?: string }>(r);
              if (!r.ok || !run.status) throw new Error(run.error || "Unable to read scan status.");
              setScanStatus(`${run.status} — ${run.posts_found ?? 0} posts found`);
              if (run.status === "completed" || run.status === "failed") {
                clearInterval(poll);
                if (run.status === "failed") reject(new Error(run.error || `Search failed for "${currentKeyword}"`));
                else resolve();
              }
            } catch (error) {
              clearInterval(poll);
              reject(error);
            }
          }, 3000);
        });
      }
      setScanStatus(`${keywords.length} search${keywords.length === 1 ? "" : "es"} completed`);
      await Promise.all([loadStats(), loadPosts()]);
    } catch (error) {
      setScanStatus(error instanceof Error ? error.message : "Search failed");
    } finally {
      setScanning(false);
      setScanProgress({ current: 0, total: 0, keyword: "" });
    }
  }

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <nav className="mb-10 flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white shadow-lg shadow-blue-500/20">
            SI
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-slate-900">Signal / Intel</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">HQ research console</div>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40" />
          Monitoring systems operational
        </div>
      </nav>
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">
            <span className="h-2 w-2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
            Command center
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Social listening headquarters</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Search public web results and organize mentions across social platforms, articles, and websites.
          </p>
        </div>
        <div className="text-left text-xs text-slate-400 sm:text-right">
          <div className="font-medium text-slate-700">HQ STATUS</div>
          <div className="mt-1">Public sources only · SerpAPI</div>
        </div>
      </header>
      {apiError && (
        <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
          {apiError}
        </div>
      )}

      <section className="panel gradient-border relative mb-8 overflow-hidden p-5 sm:p-7">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">New intelligence query</div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Find signals across the public web</h2>
                <p className="mt-1 text-xs text-slate-500">Use a keyword to find relevant public sources.</p>
          </div>
          {scanning && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">Scanning</span>}
        </div>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <input
            className="field"
            placeholder="Keywords or topics, comma-separated..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <input
            className="field"
            placeholder="Facebook Page URLs (comma-separated, optional)"
            value={fbTargets}
            onChange={(e) => setFbTargets(e.target.value)}
          />
          <input
            className="field"
            placeholder="Instagram hashtags/handles (comma-separated, optional)"
            value={igTargets}
            onChange={(e) => setIgTargets(e.target.value)}
          />
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Platforms</span>
          {[
            ["facebook", "Facebook"],
            ["instagram", "Instagram"],
            ["article", "Articles"],
            ["website", "Websites"],
          ].map(([value, label]) => (
            <label key={value} className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(value)}
                onChange={(event) =>
                  setSelectedPlatforms((current) =>
                    event.target.checked ? [...current, value] : current.filter((platform) => platform !== value)
                  )
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {label}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
            Google Reviews: coming soon
          </div>
          <button
            onClick={runScan}
            disabled={scanning || !keyword.trim()}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {scanning ? "Scanning…" : "Scan"}
            {!scanning && <span className="transition-transform group-hover:translate-x-0.5">→</span>}
          </button>
          {scanStatus && <span className="text-sm text-slate-500">{scanStatus}</span>}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-gray-600">
          Searches use SerpAPI for public indexing. Optional Facebook Page URLs and Instagram hashtags narrow the search.
        </p>
        </div>
      </section>

      {scanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-3 w-3 animate-pulse rounded-full bg-blue-600" />
              <div>
                <h2 className="font-semibold text-slate-900">Processing searches</h2>
                <p className="text-xs text-slate-500">Please keep this window open while results are collected.</p>
              </div>
            </div>
            <div className="mb-2 flex justify-between text-xs text-slate-500">
              <span>Search {scanProgress.current} of {scanProgress.total}</span>
              <span>{scanProgress.keyword}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                style={{ width: `${scanProgress.total ? (scanProgress.current / scanProgress.total) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-4 text-sm text-slate-600">{scanStatus || "Starting…"}</p>
          </div>
        </div>
      )}

      <section className="mb-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Coverage overview</h2>
            <p className="mt-1 text-xs text-slate-400">A snapshot of everything collected so far.</p>
          </div>
        </div>
        <StatsCards stats={stats} />
      </section>

      <AnalyticsCharts stats={stats} />

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Discovered sources</h2>
            <p className="mt-1 text-xs text-slate-400">Filter, sort, and open a source to inspect it.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearAllRecords}
              disabled={clearing || scanning || loading}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {clearing ? "Clearing…" : "Clear all records"}
            </button>
            <a
              href={`/api/report/pdf?keyword=${encodeURIComponent(filters.q)}&platform=${encodeURIComponent(filters.platform)}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Download PDF report
            </a>
            <span className="text-xs text-slate-400">{total.toLocaleString()} results</span>
          </div>
        </div>
        <Filters filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
        <PostTable posts={posts} loading={loading} />

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>Page {page}</span>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30"
              disabled={page * 25 >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
