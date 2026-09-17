"use client";

import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview", icon: "▦" },
  { href: "/projects", label: "Projects", icon: "◇" },
  { href: "/history", label: "Scan history", icon: "↺" },
  { href: "/search", label: "Global search", icon: "⌕" },
  { href: "/team", label: "Team", icon: "♧" },
  { href: "/alerts", label: "Alerts", icon: "!" },
  { href: "/comparison", label: "Compare", icon: "⇄" },
  { href: "/settings", label: "Settings", icon: "⚙" },
  { href: "/integrations", label: "Integrations", icon: "⌘" },
  { href: "/reports", label: "Reports", icon: "↗" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="border-b border-slate-200/70 bg-white/75 px-4 py-5 backdrop-blur-2xl lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r lg:border-slate-200/60 lg:px-6 lg:py-7 dark:border-slate-800/80 dark:bg-slate-950/70">
      <a href="/dashboard" className="flex items-center gap-3 px-1">
        <div className="relative h-12 w-full max-w-[9rem] overflow-hidden">
          <img src="/logo.png?v=4" alt="Social Intelligence" width={401} height={140} className="block h-auto w-full object-contain object-left invert dark:invert-0" />
        </div>
      </a>

      <div className="mt-8 flex items-center gap-2 border-y border-slate-200/70 px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:border-slate-800">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40" />
        Systems operational
      </div>

      <div className="mt-6 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</div>
      <nav className="mt-2 flex gap-1 overflow-x-auto lg:flex-col">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <a
              key={link.href}
              href={link.href}
              className={`flex min-w-fit items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                active
                  ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900"
                  : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white"
              }`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-md text-sm ${active ? "bg-white text-blue-600 dark:bg-slate-900 dark:text-blue-400" : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"}`}>
                {link.icon}
              </span>
              {link.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto hidden rounded-xl border border-slate-200 bg-slate-50 p-4 lg:block dark:border-slate-800 dark:bg-slate-900">
        <div className="text-xs font-semibold text-slate-800 dark:text-white">Public-source monitoring</div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Search, organize, and deliver intelligence from the public web.
        </p>
      </div>
      <button type="button" onClick={signOut} className="mt-4 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-700">
        Sign out
      </button>
    </aside>
  );
}
