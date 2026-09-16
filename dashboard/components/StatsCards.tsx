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
    { label: "Total results", value: totals.total_posts, tone: "text-blue-400" },
    { label: "Facebook", value: platformCount("facebook"), tone: "text-sky-400" },
    { label: "Instagram", value: platformCount("instagram"), tone: "text-pink-400" },
    { label: "Articles", value: platformCount("article"), tone: "text-amber-400" },
    { label: "Websites", value: platformCount("website"), tone: "text-emerald-400" },
    { label: "Reviews", value: platformCount("google_review"), tone: "text-indigo-400" },
    { label: "Likes", value: totals.total_likes, tone: "text-rose-400" },
    { label: "Comments", value: totals.total_comments, tone: "text-violet-400" },
    { label: "Shares", value: totals.total_shares, tone: "text-cyan-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="panel p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-500">{c.label}</div>
          <div className={`mt-2 text-2xl font-semibold tracking-tight ${c.tone}`}>{c.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
