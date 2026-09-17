import Link from "next/link";

const capabilities = [
  ["01", "Discover", "Track public conversations across social platforms, articles, websites, and reviews."],
  ["02", "Understand", "Turn raw mentions into sentiment, quality, duplicate, and risk signals."],
  ["03", "Act", "Route important intelligence to your team through alerts, reports, and webhooks."],
];

const useCases = [
  ["Brand and communications", "Spot emerging narratives, understand sentiment shifts, and give leadership a defensible view of reputation."],
  ["Market intelligence", "Track competitors, product conversations, and category momentum across the public web."],
  ["Customer experience", "Surface recurring issues and high-value praise before they disappear into the feed."],
];

const workflow = [
  ["01", "Connect your sources", "Bring your own SerpAPI and Resend credentials, then configure the public platforms, keywords, and projects that matter to your team."],
  ["02", "Launch a focused scan", "Search one topic or build a reusable monitoring brief. Narrow discovery with specific Facebook pages, Instagram targets, or source filters."],
  ["03", "Read the operating picture", "Review coverage, sentiment, source quality, engagement, volume trends, duplicate signals, and the context behind every mention."],
  ["04", "Move the work forward", "Create alerts, share reports, invite teammates, connect webhooks, or use the read-only API to bring intelligence into existing workflows."],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <section className="relative isolate border-b border-white/10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_5%,rgba(34,211,238,0.18),transparent_28rem),radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.2),transparent_30rem)]" />
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-slate-950">
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-4 ring-slate-950" />SI
            </span>
            <span><span className="block text-sm font-semibold tracking-tight">Signal / Intel</span><span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">Market intelligence</span></span>
          </Link>
          <div className="flex items-center gap-3"><Link href="/login" className="hidden px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:block">Sign in</Link><Link href="/signup" className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">Start monitoring</Link></div>
        </nav>

        <div className="mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-20 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:px-8 lg:pb-32 lg:pt-28">
          <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Public intelligence, operationalized</p><h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-tight sm:text-7xl">See the signal before it becomes noise.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">Signal / Intel gives teams a clear, accountable view of what the public web is saying about their brand, market, and competitors.</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/signup" className="rounded-lg bg-blue-500 px-5 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400">Create your workspace</Link><Link href="/login" className="rounded-lg border border-white/15 px-5 py-3.5 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-300/50 hover:text-white">Open console</Link></div><p className="mt-5 text-xs text-slate-500">Bring your own SerpAPI and Resend keys. Your workspace, your data, your controls.</p></div>
          <div className="relative"><div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 shadow-2xl shadow-blue-950/40 backdrop-blur"><div className="rounded-xl border border-white/10 bg-slate-900 p-5"><div className="flex items-center justify-between border-b border-white/10 pb-4"><div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Live workspace</div><div className="mt-1 text-sm font-semibold">Market pulse</div></div><span className="flex items-center gap-2 text-[11px] text-emerald-300"><i className="h-2 w-2 rounded-full bg-emerald-400" />Operational</span></div><div className="grid grid-cols-3 gap-3 py-5"><div className="rounded-lg bg-white/[0.05] p-3"><div className="text-[10px] uppercase text-slate-500">Mentions</div><div className="mt-2 text-2xl font-semibold">12.8k</div><div className="mt-1 text-[10px] text-emerald-300">+18.4%</div></div><div className="rounded-lg bg-white/[0.05] p-3"><div className="text-[10px] uppercase text-slate-500">Sources</div><div className="mt-2 text-2xl font-semibold">426</div><div className="mt-1 text-[10px] text-slate-400">Across 4 channels</div></div><div className="rounded-lg bg-white/[0.05] p-3"><div className="text-[10px] uppercase text-slate-500">Risk</div><div className="mt-2 text-2xl font-semibold text-amber-300">Low</div><div className="mt-1 text-[10px] text-slate-400">Stable this week</div></div></div><div className="space-y-2"><div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-3 text-xs"><span className="text-slate-300">Conversation volume increased</span><span className="text-emerald-300">+32%</span></div><div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-3 text-xs"><span className="text-slate-300">New competitor mention detected</span><span className="text-cyan-300">Review</span></div></div></div></div><div className="absolute -bottom-5 -left-6 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-xs text-cyan-100 shadow-xl backdrop-blur"><span className="font-semibold">Signal detected</span><span className="ml-2 text-cyan-200/60">2m ago</span></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8"><div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">One operating picture</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">From public mentions to confident action.</h2></div><div className="grid gap-4 sm:grid-cols-3">{capabilities.map(([number, title, description]) => <div key={number} className="border-t border-white/15 pt-5"><div className="text-xs font-mono text-cyan-300">{number}</div><h3 className="mt-8 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{description}</p></div>)}</div></div></section>

      <section className="border-y border-white/10 bg-slate-900/70">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">How it works</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">A practical workflow from question to decision.</h2><p className="mt-5 text-base leading-7 text-slate-400">Start with the question your team needs answered. Signal / Intel keeps the collection, analysis, and follow-through in one auditable workspace.</p></div>
          <div className="mt-14 grid gap-x-8 gap-y-12 md:grid-cols-2">{workflow.map(([number, title, description]) => <div key={number} className="relative border-l border-white/15 pl-7"><span className="absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white ring-8 ring-slate-900">{number}</span><h3 className="text-xl font-semibold">{title}</h3><p className="mt-3 max-w-md text-sm leading-7 text-slate-400">{description}</p></div>)}</div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Built for the whole signal chain</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">One workspace for every team that needs context.</h2><p className="mt-5 text-base leading-7 text-slate-400">Replace scattered screenshots, manual searches, and disconnected alerts with a shared operating picture that your team can inspect and act on.</p></div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">{useCases.map(([title, description]) => <div key={title} className="bg-slate-950 p-7"><div className="h-1 w-8 rounded-full bg-blue-500" /><h3 className="mt-8 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{description}</p></div>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">Designed for accountable decisions</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">The signal is only useful when your team can move on it.</h2></div><div className="grid gap-8 sm:grid-cols-2"><div className="border-l border-cyan-300/40 pl-5"><div className="text-3xl font-semibold text-white">4+</div><p className="mt-2 text-sm leading-6 text-slate-400">Public source types in one monitoring workflow.</p></div><div className="border-l border-cyan-300/40 pl-5"><div className="text-3xl font-semibold text-white">1</div><p className="mt-2 text-sm leading-6 text-slate-400">Shared workspace for projects, reports, alerts, and history.</p></div><div className="border-l border-cyan-300/40 pl-5"><div className="text-3xl font-semibold text-white">0</div><p className="mt-2 text-sm leading-6 text-slate-400">Private credentials exposed to the browser after saving.</p></div><div className="border-l border-cyan-300/40 pl-5"><div className="text-3xl font-semibold text-white">24/7</div><p className="mt-2 text-sm leading-6 text-slate-400">A durable record of the conversations shaping your market.</p></div></div></div></section>

      <section className="border-y border-white/10 bg-white/[0.03]"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-6 py-16 sm:flex-row sm:items-center lg:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Ready when you are</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Build your listening post.</h2></div><Link href="/signup" className="rounded-lg bg-white px-5 py-3.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">Create a workspace</Link></div></section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© 2026 Signal / Intel</span><div className="flex gap-5"><Link href="/privacy" className="transition hover:text-white">Privacy</Link><Link href="/terms" className="transition hover:text-white">Terms</Link><Link href="/login" className="transition hover:text-white">Sign in</Link></div></footer>
    </main>
  );

}
