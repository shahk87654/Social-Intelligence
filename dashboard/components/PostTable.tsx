"use client";

type Post = {
  id: number;
  platform: string;
  post_url: string;
  author_name: string | null;
  group_name: string | null;
  group_url: string | null;
  content: string | null;
  post_date: string | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
};

const platformBadge: Record<string, string> = {
  facebook: "bg-sky-500/10 text-sky-300 ring-sky-400/20",
  instagram: "bg-pink-500/10 text-pink-300 ring-pink-400/20",
  article: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
  website: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
  google_review: "bg-indigo-500/10 text-indigo-300 ring-indigo-400/20",
};

export default function PostTable({ posts, loading }: { posts: Post[]; loading: boolean }) {
  if (loading) {
    return <div className="hq-card py-16 text-center text-sm text-slate-400">Loading results…</div>;
  }
  if (posts.length === 0) {
    return <div className="hq-card py-16 text-center text-sm text-slate-400">No results yet. Run a search to populate the dashboard.</div>;
  }

  return (
    <div className="hq-card overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-[0.12em] text-slate-400">
          <tr>
            <th className="px-3 py-2">Platform</th>
            <th className="px-3 py-2">Author</th>
            <th className="px-3 py-2 min-w-[280px]">Content</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2 text-right">Likes</th>
            <th className="px-3 py-2 text-right">Comments</th>
            <th className="px-3 py-2 text-right">Shares</th>
            <th className="px-3 py-2">Link</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
              <td className="px-3 py-2">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ring-1 ${platformBadge[p.platform] || "bg-white/5 text-gray-300 ring-white/10"}`}>
                  {p.platform === "article" ? "Article" : p.platform === "website" ? "Website" : p.platform === "google_review" ? "Google Review" : p.platform}
                </span>
              </td>
              <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-700">
                <a href={`/posts/${p.id}`} className="hover:text-blue-600 hover:underline">{p.author_name || "Unknown source"}</a>
                {p.group_name && <div className="text-[11px] font-normal text-slate-400">Group: {p.group_name}</div>}
              </td>
              <td className="max-w-md truncate px-3 py-3 text-slate-600" title={p.content || ""}>
                {p.content || "No preview available"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-slate-400">
                {p.post_date ? new Date(p.post_date).toLocaleDateString() : "—"}
              </td>
              <td className="px-3 py-2 text-right text-slate-600">{p.likes == null ? "—" : p.likes.toLocaleString()}</td>
              <td className="px-3 py-2 text-right text-slate-600">{p.comments == null ? "—" : p.comments.toLocaleString()}</td>
              <td className="px-3 py-2 text-right text-slate-600">{p.shares == null ? "—" : p.shares.toLocaleString()}</td>
              <td className="px-3 py-2">
                <a href={p.post_url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
                  Open
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
