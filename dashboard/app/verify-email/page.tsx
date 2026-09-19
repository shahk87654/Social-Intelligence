"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyEmailContent() {
  const token = useSearchParams().get("token") || ""; const [message, setMessage] = useState("Verifying your email…");
  useEffect(() => { fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).then(async r => { const d = await r.json(); setMessage(r.ok ? "Email verified. You can continue to your dashboard." : d.error); }); }, [token]);
  return <main className="flex min-h-screen items-center justify-center px-4"><div className="w-full max-w-md text-center"><p className="eyebrow">Email verification</p><h1 className="mt-2 text-3xl font-semibold">{message}</h1><a className="mt-6 inline-block text-blue-600" href="/dashboard">Continue</a></div></main>;
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center px-4"><p>Verifying your email...</p></main>}><VerifyEmailContent /></Suspense>;
}
