"use client";

import { FormEvent, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Schedule = {
  id: number;
  name: string;
  recipient_email: string;
  keyword: string | null;
  platform: string;
  enabled: boolean;
  next_run_at: string;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
};

type Report = {
  id: number;
  schedule_id: number | null;
  recipient_email: string;
  keyword: string | null;
  platform: string;
  status: string;
  error: string | null;
  file_name: string;
  generated_at: string;
};

async function readData<T>(response: Response): Promise<T & { error?: string }> {
  const data = await response.json().catch(() => ({}));
  return data as T & { error?: string };
}

function date(value: string | null) {
  return value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—";
}

export default function ReportsPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [form, setForm] = useState({ name: "", recipientEmail: "", recipients: "", ccRecipients: "", keyword: "", platform: "all", frequency: "daily", timezone: "UTC", reportFormat: "pdf", emailSubject: "", emailMessage: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/report-schedules", { cache: "no-store" });
    const data = await readData<{ schedules: Schedule[]; reports: Report[] }>(response);
    if (!response.ok) setError(data.error || "Unable to load report center.");
    else {
      setSchedules(data.schedules);
      setReports(data.reports);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createSchedule(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const response = await fetch("/api/report-schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        recipients: form.recipients.split(",").map((value) => value.trim()).filter(Boolean),
        ccRecipients: form.ccRecipients.split(",").map((value) => value.trim()).filter(Boolean),
      }),
    });
    const data = await readData<{ error?: string }>(response);
    if (!response.ok) setError(data.error || "Unable to create schedule.");
    else {
      setForm({ name: "", recipientEmail: "", recipients: "", ccRecipients: "", keyword: "", platform: "all", frequency: "daily", timezone: "UTC", reportFormat: "pdf", emailSubject: "", emailMessage: "" });
      await load();
    }
    setSaving(false);
  }

  async function toggleSchedule(schedule: Schedule) {
    const response = await fetch("/api/report-schedules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: schedule.id, enabled: !schedule.enabled }),
    });
    if (!response.ok) {
      const data = await readData<{ error?: string }>(response);
      setError(data.error || "Unable to update schedule.");
    } else await load();
  }

  async function deleteSchedule(id: number) {
    if (!window.confirm("Delete this report schedule?")) return;
    const response = await fetch(`/api/report-schedules?id=${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await readData<{ error?: string }>(response);
      setError(data.error || "Unable to delete schedule.");
    } else await load();
  }

  return (
    <div className="min-h-screen lg:pl-64">
      <Sidebar />
      <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

      <header className="mb-8">
        <p className="eyebrow">Automation center</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Scheduled reports</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">Generate a fresh PDF every 24 hours and deliver it to a specific inbox. Schedules run automatically while the report worker is online.</p>
      </header>

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <section className="panel p-6">
          <div className="mb-5"><p className="eyebrow">New automation</p><h2 className="mt-1 text-lg font-semibold text-slate-900">Create a 24-hour delivery</h2></div>
          <form onSubmit={createSchedule} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Schedule name<input required className="field mt-2" placeholder="Daily executive brief" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="block text-sm font-medium text-slate-700">Recipient email<input required type="email" className="field mt-2" placeholder="team@example.com" value={form.recipientEmail} onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })} /></label>
            <input className="field" placeholder="Additional recipients, comma-separated" value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })} />
            <input className="field" placeholder="CC recipients, comma-separated" value={form.ccRecipients} onChange={(e) => setForm({ ...form, ccRecipients: e.target.value })} />
            <label className="block text-sm font-medium text-slate-700">Keyword scope<span className="mt-1 block text-xs font-normal text-slate-400">Leave blank to include every collected source.</span><input className="field mt-2" placeholder="brand, campaign, product..." value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} /></label>
            <label className="block text-sm font-medium text-slate-700">Platform<select className="select-field mt-2 w-full" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}><option value="all">All platforms</option><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="article">Articles</option><option value="website">Websites</option><option value="google_review">Google reviews</option></select></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Frequency<select className="select-field mt-2 w-full" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}><option value="daily">Every 24 hours</option><option value="weekly">Every 7 days</option></select></label><label className="block text-sm font-medium text-slate-700">Time zone<select className="select-field mt-2 w-full" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}><option>UTC</option><option>Asia/Karachi</option><option>America/New_York</option><option>Europe/London</option></select></label></div>
            <label className="block text-sm font-medium text-slate-700">Report format<select className="select-field mt-2 w-full" value={form.reportFormat} onChange={(e) => setForm({ ...form, reportFormat: e.target.value })}><option value="pdf">PDF</option><option value="csv">CSV</option></select></label>
            <input className="field" placeholder="Custom email subject (optional)" value={form.emailSubject} onChange={(e) => setForm({ ...form, emailSubject: e.target.value })} />
            <textarea className="field min-h-20 resize-y" placeholder="Custom email message (optional)" value={form.emailMessage} onChange={(e) => setForm({ ...form, emailMessage: e.target.value })} />
            <button disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50">{saving ? "Creating…" : "Create schedule"}</button>
          </form>
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-800">The first report is due immediately after creation. After each successful or failed attempt, the next run is scheduled exactly 24 hours later.</div>
        </section>

        <section className="space-y-6">
          <div className="panel overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-5"><p className="eyebrow">Active automations</p><h2 className="mt-1 text-lg font-semibold text-slate-900">Delivery schedules</h2></div>
            {loading ? <p className="p-6 text-sm text-slate-400">Loading schedules…</p> : schedules.length === 0 ? <p className="p-6 text-sm text-slate-400">No schedules yet. Create your first daily delivery.</p> : <div className="divide-y divide-slate-100">{schedules.map((schedule) => <div key={schedule.id} className="p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-slate-900">{schedule.name}</h3><p className="mt-1 text-sm text-slate-500">{schedule.recipient_email}</p></div><button onClick={() => toggleSchedule(schedule)} className={`rounded-full px-3 py-1 text-xs font-semibold ${schedule.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{schedule.enabled ? "Enabled" : "Paused"}</button></div><div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-3"><div><span className="block uppercase tracking-wider text-slate-400">Scope</span><strong className="mt-1 block text-slate-700">{schedule.keyword || "All sources"} · {schedule.platform}</strong></div><div><span className="block uppercase tracking-wider text-slate-400">Next run</span><strong className="mt-1 block text-slate-700">{date(schedule.next_run_at)}</strong></div><div><span className="block uppercase tracking-wider text-slate-400">Last status</span><strong className={`mt-1 block ${schedule.last_status === "failed" ? "text-red-600" : "text-slate-700"}`}>{schedule.last_status || "Waiting for first run"}</strong></div></div>{schedule.last_error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{schedule.last_error}</p>}<button onClick={() => deleteSchedule(schedule.id)} className="mt-4 text-xs font-semibold text-red-600 hover:text-red-800">Delete schedule</button></div>)}</div>}
          </div>
          <div className="panel overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-5"><p className="eyebrow">Audit trail</p><h2 className="mt-1 text-lg font-semibold text-slate-900">Generated reports</h2></div>
            {reports.length === 0 ? <p className="p-6 text-sm text-slate-400">Reports will appear here after the worker sends the first delivery.</p> : <div className="divide-y divide-slate-100">{reports.map((report) => <div key={report.id} className="flex items-center justify-between gap-4 px-6 py-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{report.file_name || "Failed report run"}</p><p className="mt-1 text-xs text-slate-400">{date(report.generated_at)} · {report.recipient_email}</p>{report.error && <p className="mt-1 text-xs text-red-600">{report.error}</p>}</div>{report.status === "sent" && <a href={`/api/reports/${report.id}`} className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">Download</a>}</div>)}</div>}
          </div>
        </section>
      </div>
      </main>
    </div>
  );
}
