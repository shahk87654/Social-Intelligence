"use client";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function submit(e: FormEvent) { e.preventDefault(); setError(""); const r = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); const d = await r.json(); if (!r.ok) setError(d.error); else setMessage(d.message); }
  return <main className="flex min-h-screen items-center justify-center px-4"><div className="w-full max-w-md"><p className="eyebrow">Account recovery</p><h1 className="mt-2 text-3xl font-semibold">Reset your password.</h1><p className="mt-3 text-sm text-slate-500">Enter your email and we’ll send a secure reset link.</p>{error && <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}{message ? <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : <form onSubmit={submit} className="mt-6 space-y-4"><input required type="email" className="field" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} /><button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">Send reset link</button></form>}<p className="mt-6 text-center text-sm"><a className="text-blue-600" href="/login">Back to sign in</a></p></div></main>;
}
