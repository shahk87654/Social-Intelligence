"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || "Unable to sign in.");
    else router.push("/");
    setLoading(false);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between"><div><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-sm font-black">SI</div><div><div className="font-semibold">Signal / Intel</div><div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Research console</div></div></div><div className="mt-28 max-w-sm"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">Signal over noise</p><h2 className="mt-5 text-5xl font-semibold leading-[1.05]">Know what people are saying.</h2><p className="mt-6 text-base leading-7 text-slate-400">A focused workspace for tracking public conversation, emerging risks, and the stories shaping your market.</p></div></div><p className="text-xs text-slate-500">Private workspace intelligence</p></aside>
      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
        <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">SI</div><div><div className="font-semibold text-slate-900 dark:text-white">Signal / Intel</div><div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Research console</div></div></div>
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Return to your signal room.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">Access private monitoring projects and collected intelligence.</p>
        {error && <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input required type="email" className="field" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input required type="password" className="field" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">New to Signal / Intel? <a className="font-semibold text-blue-600" href="/signup">Create an account</a></p>
        </div>
      </section>
    </main>
  );
}
