"use client";

type Stats = {
  totals: { total_posts: number; total_likes: number; total_comments: number; total_shares: number };
  byPlatform: { platform: string; count: number }[];
};

export default function StatsCards({ stats }: { stats: Stats | null }) {
  if (!stats) return null;
  const { totals, byPlatform } = stats;
  const platformCount = (p: string) => byPlatform.find((b) => b.platform === p)?.count ?? 0;

  const cards = [
    { label: "Total results", value: totals.total_posts, tone: "text-slate-950 dark:text-white", accent: "bg-blue-600" },
    { label: "Facebook", value: platformCount("facebook"), tone: "text-slate-800 dark:text-slate-100", accent: "bg-sky-500" },
    { label: "Instagram", value: platformCount("instagram"), tone: "text-slate-800 dark:text-slate-100", accent: "bg-pink-500" },
    { label: "Articles", value: platformCount("article"), tone: "text-slate-800 dark:text-slate-100", accent: "bg-amber-500" },
    { label: "Websites", value: platformCount("website"), tone: "text-slate-800 dark:text-slate-100", accent: "bg-emerald-500" },
    { label: "Reviews", value: platformCount("google_review"), tone: "text-slate-800 dark:text-slate-100", accent: "bg-indigo-500" },
    { label: "Likes", value: totals.total_likes, tone: "text-slate-800 dark:text-slate-100", accent: "bg-rose-500" },
    { label: "Comments", value: totals.total_comments, tone: "text-slate-800 dark:text-slate-100", accent: "bg-violet-500" },
    { label: "Shares", value: totals.total_shares, tone: "text-slate-800 dark:text-slate-100", accent: "bg-cyan-500" },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-9">
      {cards.map((c) => (
        <div key={c.label} className="panel group relative overflow-hidden p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/70 hover:shadow-[0_14px_32px_-20px_rgba(37,99,235,0.45)]">
          <span className={`absolute inset-x-0 top-0 h-0.5 opacity-80 transition group-hover:h-1 ${c.accent}`} />
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{c.label}</div>
          <div className={`mt-2 text-xl font-semibold tracking-tight ${c.tone}`}>{c.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
