"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type Post = { platform: string; post_url: string; author_name: string | null; author_url: string | null; group_name: string | null; content: string | null; matched_keyword: string; post_date: string | null; likes: number | null; comments: number | null; shares: number | null; scraped_at: string };

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch(`/api/posts/${params.id}`).then(async (response) => { const data = await response.json(); if (!response.ok) setError(data.error || "Unable to load mention."); else setPost(data.post); }).catch(() => setError("Unable to load mention.")); }, [params.id]);

  return <div className="min-h-screen lg:pl-64"><Sidebar /><main className="mx-auto min-h-screen max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><a href="/" className="text-sm font-semibold text-blue-600 hover:underline">← Back to overview</a>{error && <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}{post && <article className="panel mt-6 p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">{post.platform}</span><span className="text-xs text-slate-400">Collected {new Date(post.scraped_at).toLocaleString()}</span></div><h1 className="mt-5 text-2xl font-semibold text-slate-900">{post.author_name || "Unknown source"}</h1>{post.group_name && <p className="mt-1 text-sm text-slate-500">Group: {post.group_name}</p>}<p className="mt-6 whitespace-pre-wrap text-base leading-8 text-slate-700">{post.content || "No content preview available."}</p><div className="mt-8 grid grid-cols-3 gap-3"><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-400">Likes</div><strong className="mt-1 block text-lg text-slate-800">{post.likes ?? "—"}</strong></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-400">Comments</div><strong className="mt-1 block text-lg text-slate-800">{post.comments ?? "—"}</strong></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-400">Shares</div><strong className="mt-1 block text-lg text-slate-800">{post.shares ?? "—"}</strong></div></div><div className="mt-8 flex flex-wrap items-center gap-3"><span className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">Matched: {post.matched_keyword}</span><a target="_blank" rel="noreferrer" href={post.post_url} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Open source ↗</a></div></article>}</main></div>;
}
