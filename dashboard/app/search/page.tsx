"use client";

import { FormEvent, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Results = { posts: { id: number; platform: string; author_name: string | null; content: string | null }[]; projects: { id: number; name: string; description: string | null }[]; reports: { id: number; file_name: string; recipient_email: string; generated_at: string }[] };

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>({ posts: [], projects: [], reports: [] });
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (!response.ok) setError(data.error || "Unable to search.");
    else setResults(data);
    setSearched(true);
  }

  return <div className="min-h-screen lg:pl-64"><Sidebar /><main className="mx-auto min-h-screen max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <header className="mb-8"><p className="eyebrow">Workspace search</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Search everything</h1><p className="mt-2 text-sm text-slate-500">Find mentions, projects, and generated reports from one place.</p></header>
    <form onSubmit={search} className="panel flex gap-3 p-4"><input autoFocus required className="field" placeholder="Search content, author, keyword, project, or report..." value={query} onChange={(e) => setQuery(e.target.value)} /><button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Search</button></form>
    {error && <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {searched && <div className="mt-8 space-y-6"><section className="panel p-6"><p className="eyebrow">Mentions</p><div className="mt-4 space-y-3">{results.posts.map((post) => <a key={post.id} href={`/posts/${post.id}`} className="block rounded-xl border border-slate-100 p-4 hover:border-blue-200 hover:bg-blue-50/40"><div className="text-xs font-semibold capitalize text-blue-600">{post.platform} · {post.author_name || "Unknown source"}</div><p className="mt-1 line-clamp-2 text-sm text-slate-600">{post.content || "No content preview"}</p></a>)}{!results.posts.length && <p className="text-sm text-slate-400">No mention matches.</p>}</div></section><section className="grid gap-6 md:grid-cols-2"><div className="panel p-6"><p className="eyebrow">Projects</p><div className="mt-4 space-y-3">{results.projects.map((project) => <a key={project.id} href="/projects" className="block rounded-xl bg-slate-50 p-4"><strong className="text-sm text-slate-800">{project.name}</strong><p className="mt-1 text-xs text-slate-500">{project.description || "No description"}</p></a>)}{!results.projects.length && <p className="text-sm text-slate-400">No project matches.</p>}</div></div><div className="panel p-6"><p className="eyebrow">Reports</p><div className="mt-4 space-y-3">{results.reports.map((report) => <a key={report.id} href={`/api/reports/${report.id}`} className="block rounded-xl bg-slate-50 p-4"><strong className="text-sm text-slate-800">{report.file_name}</strong><p className="mt-1 text-xs text-slate-500">{report.recipient_email} · {new Date(report.generated_at).toLocaleDateString()}</p></a>)}{!results.reports.length && <p className="text-sm text-slate-400">No report matches.</p>}</div></div></section></div>}
  </main></div>;
}
