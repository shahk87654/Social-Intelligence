"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Event = { id: string; action: string; resource_type: string; resource_id: string | null; metadata: Record<string, unknown>; created_at: string; actor_name: string | null; actor_email: string | null };

export default function AuditLogsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/audit-logs").then(async (r) => { const data = await r.json(); if (!r.ok) setError(data.error); else setEvents(data.events || []); }); }, []);
  return <div className="min-h-screen lg:pl-64"><Sidebar /><main className="mx-auto min-h-screen max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><header className="mb-8"><p className="eyebrow">Workspace governance</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Audit log</h1><p className="mt-2 text-sm text-slate-500">Administrative activity for this organization.</p></header>{error ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : <section className="panel divide-y divide-slate-100 overflow-hidden">{events.length ? events.map((event) => <div key={event.id} className="px-6 py-4"><div className="flex items-center justify-between gap-4"><span className="text-sm font-semibold text-slate-800">{event.action}</span><time className="text-xs text-slate-400">{new Date(event.created_at).toLocaleString()}</time></div><p className="mt-1 text-xs text-slate-500">{event.actor_name || event.actor_email || "System"} · {event.resource_type}{event.resource_id ? ` #${event.resource_id}` : ""}</p></div>) : <p className="px-6 py-8 text-sm text-slate-500">No administrative activity recorded yet.</p>}</section>}</main></div>;
}
