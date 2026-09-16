"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type Post = { id: number; platform: string; post_url: string; author_name: string | null; author_url: string | null; group_name: string | null; content: string | null; matched_keyword: string; post_date: string | null; likes: number | null; comments: number | null; shares: number | null; scraped_at: string; sentiment: string; source_quality_score: number; is_duplicate: boolean; is_spam: boolean; tags: string[]; note: string | null };
type Member = { id: number; name: string; email: string; role: string };

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState("");
  const [note, setNote] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [assignedTo, setAssignedTo] = useState("");
  useEffect(() => {
    Promise.all([fetch(`/api/posts/${params.id}`), fetch("/api/team")]).then(async ([postResponse, teamResponse]) => {
      const data = await postResponse.json();
      const team = await teamResponse.json();
      if (!postResponse.ok) setError(data.error || "Unable to load mention.");
      else {
        setPost(data.post);
        setTags((data.post.tags || []).join(", "));
        setNote(data.post.note || "");
        setAssignedTo(data.post.assigned_to ? String(data.post.assigned_to) : "");
      }
      if (teamResponse.ok) setMembers(team.members || []);
    }).catch(() => setError("Unable to load mention."));
  }, [params.id]);
  async function saveAnnotations() {
    const response = await fetch(`/api/posts/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), note, assignedTo: assignedTo || null }) });
    if (!response.ok) setError("Unable to save annotations.");
    else setError(null);
  }

  return <div className="min-h-screen lg:pl-64"><Sidebar /><main className="mx-auto min-h-screen max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><a href="/" className="text-sm font-semibold text-blue-600 hover:underline">← Back to overview</a>{error && <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}{post && <article className="panel mt-6 p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">{post.platform}</span><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${post.sentiment === "positive" ? "bg-emerald-50 text-emerald-700" : post.sentiment === "negative" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>{post.sentiment}</span></div><span className="text-xs text-slate-400">Collected {new Date(post.scraped_at).toLocaleString()}</span></div><h1 className="mt-5 text-2xl font-semibold text-slate-900">{post.author_name || "Unknown source"}</h1>{post.group_name && <p className="mt-1 text-sm text-slate-500">Group: {post.group_name}</p>}<p className="mt-6 whitespace-pre-wrap text-base leading-8 text-slate-700">{post.content || "No content preview available."}</p><div className="mt-8 grid grid-cols-3 gap-3"><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-400">Likes</div><strong className="mt-1 block text-lg text-slate-800">{post.likes ?? "—"}</strong></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-400">Comments</div><strong className="mt-1 block text-lg text-slate-800">{post.comments ?? "—"}</strong></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-400">Quality score</div><strong className="mt-1 block text-lg text-slate-800">{post.source_quality_score}</strong></div></div><div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-5"><p className="eyebrow">Team annotations</p><input className="field mt-3" placeholder="Tags, comma-separated" value={tags} onChange={(e) => setTags(e.target.value)} /><textarea className="field mt-3 min-h-24 resize-y" placeholder="Private note" value={note} onChange={(e) => setNote(e.target.value)} />{members.length > 0 && <select className="select-field mt-3 w-full" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}><option value="">Unassigned</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.email}</option>)}</select>}<button onClick={saveAnnotations} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Save annotations</button></div><div className="mt-8 flex flex-wrap items-center gap-3"><span className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">Matched: {post.matched_keyword}</span><a target="_blank" rel="noreferrer" href={post.post_url} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Open source ↗</a></div></article>}</main></div>;
}
