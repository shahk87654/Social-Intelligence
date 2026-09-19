"use client";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") || ""; const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [done, setDone] = useState(false);
  async function submit(e: FormEvent) { e.preventDefault(); const r = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) }); const d = await r.json(); if (!r.ok) setError(d.error); else setDone(true); }
  return <main className="flex min-h-screen items-center justify-center px-4"><div className="w-full max-w-md"><p className="eyebrow">Account recovery</p><h1 className="mt-2 text-3xl font-semibold">Choose a new password.</h1>{error && <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}{done ? <p className="mt-6 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Password updated. <a className="font-semibold" href="/login">Sign in</a>.</p> : <form onSubmit={submit} className="mt-6 space-y-4"><input required minLength={8} type="password" className="field" placeholder="New password (8+ characters)" value={password} onChange={e => setPassword(e.target.value)} /><button disabled={!token} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Update password</button></form>}</div></main>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center px-4"><p>Loading...</p></main>}><ResetPasswordForm /></Suspense>;
}
