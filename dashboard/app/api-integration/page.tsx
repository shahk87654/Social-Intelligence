import Link from "next/link";
import Sidebar from "@/components/Sidebar";

const providers = [
  {
    id: "serpapi",
    label: "01 / DISCOVERY",
    name: "SerpAPI",
    description: "Powers keyword search across public articles, websites, and indexed sources.",
    steps: ["Create a SerpAPI account and copy your private API key.", "Open Dashboard settings and save it under Private credentials.", "Run a focused scan to confirm public discovery is working."],
    href: "https://serpapi.com/manage-api-key",
    action: "Get a SerpAPI key",
  },
  {
    id: "meta",
    label: "02 / SOCIAL TARGETS",
    name: "Meta Graph API",
    description: "Adds focused Facebook Page and Instagram target collection to a scan.",
    steps: ["Create a Meta developer app with the required Page or Instagram permissions.", "Prepare a user or page access token, then note the target Page ID.", "Save the token and Page ID in Integrations under Meta Graph API."],
    href: "/integrations",
    action: "Open Meta settings",
  },
  {
    id: "resend",
    label: "03 / DELIVERY",
    name: "Resend",
    description: "Delivers scheduled reports, account email, and other workspace notifications.",
    steps: ["Create a Resend account and generate a restricted API key.", "Save it in Dashboard settings under Private credentials.", "Verify your sending domain before scheduling executive reports."],
    href: "https://resend.com/api-keys",
    action: "Get a Resend key",
  },
];

export default function ApiIntegrationPage() {
  return (
    <div className="min-h-screen lg:pl-64">
      <Sidebar />
      <main className="mx-auto min-h-screen max-w-[1120px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-8 border-b border-slate-200 pb-7 dark:border-slate-800">
          <p className="eyebrow">Developer setup</p>
          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">API integration guide</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Connect the services that power discovery, social targets, reports, and downstream workflows. Your secrets are encrypted server-side and are never returned after saving.</p>
            </div>
            <Link href="/settings" className="w-fit rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300">Open settings</Link>
          </div>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/70 dark:bg-blue-950/20"><span className="text-2xl font-semibold text-blue-700 dark:text-blue-300">01</span><h2 className="mt-3 font-semibold text-slate-900 dark:text-white">Add credentials</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">Use your organization-owned keys so billing and provider access stay under your control.</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><span className="text-2xl font-semibold text-slate-400">02</span><h2 className="mt-3 font-semibold text-slate-900 dark:text-white">Configure targets</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">Add Page IDs, Instagram targets, source filters, and project keywords.</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><span className="text-2xl font-semibold text-slate-400">03</span><h2 className="mt-3 font-semibold text-slate-900 dark:text-white">Test the path</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">Run a scan, send a test provider request, and verify report delivery before going live.</p></div>
        </section>

        <div className="space-y-5">
          {providers.map((provider) => (
            <section id={provider.id} key={provider.id} className="panel overflow-hidden p-6 dark:bg-slate-900/80">
              <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <p className="eyebrow">{provider.label}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{provider.name}</h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{provider.description}</p>
                  <a href={provider.href} target={provider.href.startsWith("http") ? "_blank" : undefined} rel={provider.href.startsWith("http") ? "noreferrer" : undefined} className="mt-5 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-500 dark:text-cyan-300">{provider.action} <span className="ml-1">↗</span></a>
                </div>
                <div className="border-t border-slate-200 pt-5 dark:border-slate-700 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Setup sequence</p>
                  <ol className="mt-4 space-y-4">
                    {provider.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{index + 1}</span><span>{step}</span></li>)}
                  </ol>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/60 dark:bg-amber-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Important security notes</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-amber-900 dark:text-amber-100 md:grid-cols-2">
            <li>Never paste provider keys into scan keywords, reports, or support messages.</li>
            <li>Use restricted keys where the provider supports scoped permissions.</li>
            <li>Rotate a credential immediately if it appears in a log or screenshot.</li>
            <li>Only workspace administrators should manage organization credentials.</li>
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/integrations" className="font-semibold text-blue-700 hover:text-blue-500 dark:text-cyan-300">Manage provider connections ↗</Link>
          <Link href="/settings" className="font-semibold text-blue-700 hover:text-blue-500 dark:text-cyan-300">Manage private credentials ↗</Link>
        </div>
      </main>
    </div>
  );
}
