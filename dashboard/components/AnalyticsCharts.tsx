"use client";

type Stats = {
  totals: { total_posts: number };
  byPlatform: { platform: string; count: number }[];
  topKeywords: { matched_keyword: string; count: number }[];
};

const colors: Record<string, string> = {
  facebook: "#2563eb",
  instagram: "#db2777",
  article: "#d97706",
  website: "#059669",
};

export default function AnalyticsCharts({ stats }: { stats: Stats | null }) {
  if (!stats) return null;
  const total = Math.max(stats.totals.total_posts, 1);
  const platforms = stats.byPlatform.filter((item) => item.count > 0);
  const topCount = Math.max(...stats.topKeywords.map((item) => item.count), 1);
  let offset = 0;

  return (
    <div className="mb-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hq-card p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="eyebrow">Source distribution</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Where the conversation lives</h2>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">All time</span>
        </div>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative h-44 w-44 shrink-0">
            <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
              <circle cx="21" cy="21" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="5" />
              {platforms.map((item) => {
                const length = (item.count / total) * 100;
                const circle = (
                  <circle
                    key={item.platform}
                    cx="21"
                    cy="21"
                    r="15.9"
                    fill="none"
                    stroke={colors[item.platform] || "#64748b"}
                    strokeWidth="5"
                    strokeDasharray={`${length} ${100 - length}`}
                    strokeDashoffset={-offset}
                    pathLength="100"
                  />
                );
                offset += length;
                return circle;
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <strong className="text-3xl font-semibold text-slate-900">{stats.totals.total_posts.toLocaleString()}</strong>
              <span className="text-[10px] uppercase tracking-widest text-slate-400">mentions</span>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            {platforms.map((item) => (
              <div key={item.platform} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs capitalize text-slate-500">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[item.platform] || "#64748b" }} />
                  {item.platform}
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-900">{item.count.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hq-card p-5 sm:p-6">
        <div className="mb-5">
          <p className="eyebrow">Signal intensity</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Top tracked keywords</h2>
        </div>
        <div className="space-y-4">
          {stats.topKeywords.length === 0 && <p className="text-sm text-slate-400">Run a scan to build keyword intelligence.</p>}
          {stats.topKeywords.map((item, index) => (
            <div key={item.matched_keyword} className="grid grid-cols-[1.25rem_1fr_auto] items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">0{index + 1}</span>
              <div>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-slate-700">{item.matched_keyword}</span>
                  <span className="text-slate-400">{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${(item.count / topCount) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
