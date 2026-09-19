"use client";

import { usePathname, useRouter } from "next/navigation";

const groups = [
  {
    label: "Monitor",
    links: [
      { href: "/dashboard", label: "Overview", icon: "▦" },
      { href: "/projects", label: "Projects", icon: "◇" },
      { href: "/history", label: "Scan history", icon: "↺" },
      { href: "/search", label: "Global search", icon: "⌕" },
    ],
  },
  {
    label: "Understand",
    links: [
      { href: "/alerts", label: "Alerts", icon: "!" },
      { href: "/comparison", label: "Compare", icon: "⇄" },
      { href: "/executive-reports", label: "Executive view", icon: "◈" },
    ],
  },
  {
    label: "Operate",
    links: [
      { href: "/reports", label: "Reports", icon: "↗" },
      { href: "/team", label: "Team", icon: "♧" },
      { href: "/integrations", label: "Integrations", icon: "⌘" },
      { href: "/settings", label: "Settings", icon: "⚙" },
      { href: "/audit-logs", label: "Audit log", icon: "≡" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="sidebar-scroll border-b border-slate-200/70 bg-white/80 px-4 py-4 backdrop-blur-2xl lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-slate-200/60 lg:px-3 lg:py-5 dark:border-slate-800/80 dark:bg-slate-950/75">
      <a href="/dashboard" className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-100/70 dark:hover:bg-slate-900/70">
        <div className="relative h-9 w-full max-w-[8.5rem] overflow-hidden">
          <img src="/logo.png?v=4" alt="Social Intelligence" width={401} height={140} className="block h-auto w-full object-contain object-left invert dark:invert-0" />
        </div>
      </a>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] px-2.5 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:border-emerald-400/10 dark:bg-emerald-400/[0.04]">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40" />
        Systems operational
      </div>

      <nav className="mt-5 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {groups.map((group) => (
          <div key={group.label} className="flex shrink-0 gap-1 lg:block lg:mt-3 first:lg:mt-0">
            <div className="hidden px-2.5 pb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400/80 lg:block">{group.label}</div>
            <div className="flex gap-1 lg:block">
              {group.links.map((link) => {
                const active = pathname === link.href;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`flex min-w-fit items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
                      active
                        ? "relative bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/5 ring-1 ring-inset ring-blue-200 before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-blue-600 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900 dark:before:bg-cyan-400"
                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white"
                    }`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs ${active ? "bg-white text-blue-600 dark:bg-slate-900 dark:text-blue-400" : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"}`}>
                      {link.icon}
                    </span>
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <button type="button" onClick={signOut} className="mt-auto flex items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-xs font-semibold text-slate-400 transition hover:border-red-100 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-950 dark:hover:bg-red-950/30">
        <span className="text-sm">↪</span>
        Sign out
      </button>
    </aside>
  );
}
