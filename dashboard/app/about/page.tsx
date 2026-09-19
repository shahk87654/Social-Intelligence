import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <img src="/logo.png?v=4" alt="Social Intelligence" width={401} height={140} className="h-auto w-44 object-contain object-left" />
          </Link>
          <Link href="/signup" className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950">Create a workspace</Link>
        </div>
      </header>
      <section className="mx-auto max-w-4xl px-6 py-24 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">About Signal / Intel</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-6xl">Public conversation, made operational.</h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-400">
          Signal / Intel helps teams turn publicly available conversation into a focused operating picture. We combine source discovery, practical analysis, collaboration, and accountable delivery in one workspace.
        </p>
        <div className="mt-16 grid gap-5 sm:grid-cols-3">
          {[
            ["Public by design", "We monitor supported public sources and avoid private accounts, credential sharing, and CAPTCHA bypasses."],
            ["Built for teams", "Organization workspaces keep projects, credentials, reports, and decisions together with clear access boundaries."],
            ["Ready to connect", "Bring your provider keys and connect reports, signed webhooks, APIs, and future workflow integrations."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{text}</p>
            </article>
          ))}
        </div>
        <div className="mt-16 border-t border-white/10 pt-8 text-sm text-slate-400">
          <p>Have a question about security, data boundaries, or integrations?</p>
          <a href="mailto:hello@signalintel.com" className="mt-3 inline-block font-semibold text-cyan-300">Contact the team</a>
        </div>
      </section>
    </main>
  );
}
