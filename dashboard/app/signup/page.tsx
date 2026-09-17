"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || "Unable to create account.");
    else router.push("/");
    setLoading(false);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]"><aside className="hidden bg-blue-600 p-12 text-white lg:flex lg:flex-col lg:justify-end"><div className="max-w-md"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">A clearer read on the market</p><h2 className="mt-5 text-5xl font-semibold leading-[1.05]">Build your listening post.</h2><p className="mt-6 text-base leading-7 text-blue-100">Bring your own service keys, invite your team, and turn public conversation into useful decisions.</p></div></aside><section className="flex items-center justify-center px-4 py-10 sm:px-8"><div className="w-full max-w-md"><div className="mb-10 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">SI</div><div><div className="font-semibold text-slate-900 dark:text-white">Signal / Intel</div><div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Research console</div></div></div>
        <p className="eyebrow">Create workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Start monitoring smarter.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">Your account starts with a private admin workspace.</p>
        {error && <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input required className="field" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" className="field" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required minLength={8} type="password" className="field" placeholder="Password (8+ characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 disabled:opacity-50">{loading ? "Creating workspace…" : "Create account"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <a className="font-semibold text-blue-600" href="/login">Sign in</a></p>
        </div></section>
    </main>
  );
}
