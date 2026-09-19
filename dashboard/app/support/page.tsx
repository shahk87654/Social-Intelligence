"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Ticket = { id: number; subject: string; message: string; priority: string; status: string; created_at: string; name?: string; email?: string; organization_name?: string };
type TicketMessage = { id: number; ticket_id: number; author_id: number | null; author_name: string; author_type: "customer" | "support"; body: string; created_at: string };

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [form, setForm] = useState({ subject: "", priority: "normal", message: "" });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [replyStatus, setReplyStatus] = useState<Record<number, string>>({});

  async function loadTickets() {
    const response = await fetch("/api/support", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setTickets(data.tickets || []);
      setMessages(data.messages || []);
      setIsAdmin(Boolean(data.isAdmin));
    }
    setLoading(false);
  }

  useEffect(() => { loadTickets(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || "Unable to create support ticket.");
    else {
      setForm({ subject: "", priority: "normal", message: "" });
      setNotice(`Ticket #${data.ticket.id} sent to the Support team.`);
      await loadTickets();
    }
    setSaving(false);
  }

  async function updateTicket(ticket: Ticket, reopen = false) {
    setError(null);
    setNotice(null);
    const body = reopen
      ? { id: ticket.id, action: "reopen", reply: replies[ticket.id] || "" }
      : { id: ticket.id, reply: replies[ticket.id] || "", status: replyStatus[ticket.id] || "in_progress" };
    const response = await fetch("/api/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || "Unable to update ticket.");
    else {
      setNotice(reopen ? `Ticket #${ticket.id} reopened.` : `Reply saved for ticket #${ticket.id}.`);
      setReplies({ ...replies, [ticket.id]: "" });
      await loadTickets();
    }
  }

  const visibleTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tickets;
    return tickets.filter((ticket) => String(ticket.id).includes(term) || ticket.subject.toLowerCase().includes(term) || ticket.email?.toLowerCase().includes(term) || ticket.organization_name?.toLowerCase().includes(term));
  }, [tickets, search]);

  return (
    <div className="min-h-screen lg:pl-60">
      <Sidebar />
      <main className="mx-auto min-h-screen max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-8">
          <p className="eyebrow">Support desk</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">How can we help?</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Every ticket keeps its complete conversation history. Search by ticket number, subject, requester, or organization.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="panel p-6">
            <div className="mb-5"><p className="eyebrow">New request</p><h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Raise a support ticket</h2></div>
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {notice && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
            <form onSubmit={submit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Subject<input required minLength={3} maxLength={160} className="field mt-2" placeholder="Report delivery is failing" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Priority<select className="select-field mt-2 w-full" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">What happened?<textarea required minLength={10} maxLength={5000} className="field mt-2 min-h-40 resize-y" placeholder="Tell us what you expected, what happened, and how we can reproduce it." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
              <button disabled={saving} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50">{saving ? "Sending…" : "Send to Support"}</button>
            </form>
          </section>
          <section className="panel overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-700"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">{isAdmin ? "Support queue" : "Your requests"}</p><h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{isAdmin ? "Tickets from your workspace" : "Ticket history"}</h2></div><input className="field max-w-[220px] py-2 text-xs" placeholder="Search #123..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
            {loading ? <p className="p-6 text-sm text-slate-400">Loading tickets…</p> : visibleTickets.length === 0 ? <p className="p-6 text-sm text-slate-400">No matching support tickets.</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{visibleTickets.map((ticket) => <article key={ticket.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-400">#{ticket.id}{ticket.email ? ` · ${ticket.email}` : ""}{ticket.organization_name ? ` · ${ticket.organization_name}` : ""}</p><h3 className="mt-1 font-semibold text-slate-900 dark:text-white">{ticket.subject}</h3></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">{ticket.status.replace("_", " ")}</span></div><div className="mt-4 space-y-3">{messages.filter((message) => message.ticket_id === ticket.id).map((message) => <div key={message.id} className={`rounded-lg p-3 ${message.author_type === "support" ? "border border-cyan-100 bg-cyan-50 dark:border-cyan-900/50 dark:bg-cyan-950/30" : "bg-slate-50 dark:bg-slate-800/60"}`}><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{message.author_type === "support" ? "Support team" : message.author_name}</p><time className="text-[10px] text-slate-400">{new Date(message.created_at).toLocaleString()}</time></div><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{message.body}</p></div>)}</div><p className="mt-3 text-xs text-slate-400">{ticket.priority} priority</p>{!isAdmin && ticket.status === "closed" && <button type="button" onClick={() => updateTicket(ticket, true)} className="mt-4 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/40">Request reopen</button>}{isAdmin && <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800"><textarea className="field min-h-24 resize-y" placeholder="Write a reply to this requester..." value={replies[ticket.id] || ""} onChange={(e) => setReplies({ ...replies, [ticket.id]: e.target.value })} /><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><select className="select-field" value={replyStatus[ticket.id] || ticket.status} onChange={(e) => setReplyStatus({ ...replyStatus, [ticket.id]: e.target.value })}><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option><option value="open">Open</option></select><button type="button" onClick={() => updateTicket(ticket)} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 dark:bg-white dark:text-slate-950">Reply and save</button></div></div>}</article>)}</div>}
          </section>
        </div>
      </main>
    </div>
  );
}
