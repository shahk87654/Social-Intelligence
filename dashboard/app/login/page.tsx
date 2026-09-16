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
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="panel w-full max-w-md p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white">SI</div>
          <div><div className="font-semibold text-slate-900">Signal / Intel</div><div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Research console</div></div>
        </div>
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sign in to your workspace</h1>
        <p className="mt-2 text-sm text-slate-500">Access private monitoring projects and collected intelligence.</p>
        {error && <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input required type="email" className="field" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input required type="password" className="field" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">New to Signal / Intel? <a className="font-semibold text-blue-600" href="/signup">Create an account</a></p>
      </section>
    </main>
  );
}
