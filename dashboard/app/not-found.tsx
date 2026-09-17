import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      <section className="relative w-full max-w-2xl text-center">
        <Link href="/" className="mx-auto flex w-fit items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-blue-500/20 dark:bg-white dark:text-slate-950">
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-4 ring-slate-50 dark:ring-slate-950" />
            SI
          </span>
          <span className="text-left">
            <span className="block text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Signal / Intel</span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-400">Research console</span>
          </span>
        </Link>

        <div className="panel mt-14 px-6 py-12 sm:px-16 sm:py-16">
          <p className="eyebrow">Signal lost</p>
          <div className="mt-5 font-mono text-8xl font-bold tracking-[-0.08em] text-slate-900 dark:text-white sm:text-9xl">404</div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">This page is outside the signal.</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">The address may be outdated, or the workspace route may have moved.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Back to overview</Link>
            <Link href="/login" className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-300">Sign in</Link>
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-400">Error reference: route_not_found</p>
      </section>
    </main>
  );
}
