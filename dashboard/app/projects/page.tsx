"use client";

import { FormEvent, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Project = { id: number; name: string; description: string | null; keywords: string[]; platforms: string[]; created_at: string };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({ name: "", description: "", keywords: "", platforms: ["facebook", "instagram", "article"] });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/projects");
    const data = await response.json();
    if (!response.ok) setError(data.error || "Unable to load projects.");
    else setProjects(data.projects);
  }
  useEffect(() => { load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, keywords: form.keywords.split(",").map((item) => item.trim()).filter(Boolean) }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Unable to create project.");
    else {
      setForm({ name: "", description: "", keywords: "", platforms: ["facebook", "instagram", "article"] });
      await load();
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this monitoring project?")) return;
    await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
    await load();
  }

  function togglePlatform(platform: string) {
    setForm((current) => ({ ...current, platforms: current.platforms.includes(platform) ? current.platforms.filter((item) => item !== platform) : [...current.platforms, platform] }));
  }

  return (
    <div className="min-h-screen lg:pl-64"><Sidebar /><main className="mx-auto min-h-screen max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-8"><p className="eyebrow">Monitoring workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Saved projects</h1><p className="mt-2 text-sm text-slate-500">Save recurring brand, competitor, campaign, and crisis searches so your team can launch them consistently.</p></header>
      {error && <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <section className="panel p-6"><p className="eyebrow">New project</p><h2 className="mt-1 text-lg font-semibold text-slate-900">Create a monitoring brief</h2><form onSubmit={submit} className="mt-5 space-y-4">
          <input required className="field" placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="field min-h-24 resize-y" placeholder="What are you monitoring?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input required className="field" placeholder="Keywords, comma-separated" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
          <div><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Platforms</div><div className="flex flex-wrap gap-2">{["facebook", "instagram", "article", "website"].map((platform) => <button type="button" key={platform} onClick={() => togglePlatform(platform)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${form.platforms.includes(platform) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{platform}</button>)}</div></div>
          <button className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white">Save project</button>
        </form></section>
        <section className="panel overflow-hidden"><div className="border-b border-slate-100 px-6 py-5"><p className="eyebrow">Your library</p><h2 className="mt-1 text-lg font-semibold text-slate-900">Monitoring projects</h2></div>{projects.length === 0 ? <p className="p-6 text-sm text-slate-400">No saved projects yet.</p> : <div className="grid gap-4 p-6 md:grid-cols-2">{projects.map((project) => <article key={project.id} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-slate-900">{project.name}</h3><button onClick={() => remove(project.id)} className="text-xs font-semibold text-red-600">Delete</button></div><p className="mt-2 min-h-10 text-sm text-slate-500">{project.description || "No description provided."}</p><div className="mt-4 flex flex-wrap gap-2">{project.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{keyword}</span>)}</div><p className="mt-4 text-xs capitalize text-slate-400">{project.platforms.join(" · ")}</p></article>)}</div>}</section>
      </div>
    </main></div>
  );
}
