"use client";

import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Overview", icon: "▦" },
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
    <aside className="border-b border-slate-200 bg-white/90 px-4 py-5 backdrop-blur-xl lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-7">
      <a href="/" className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white shadow-lg shadow-blue-500/20">
          SI
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight text-slate-900">Signal / Intel</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">HQ research console</div>
        </div>
      </a>

      <div className="mt-8 flex items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40" />
        Systems operational
      </div>

      <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <a
              key={link.href}
              href={link.href}
              className={`flex min-w-fit items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                active
                  ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-base ${active ? "bg-white text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                {link.icon}
              </span>
              {link.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 p-4 lg:block">
        <div className="text-xs font-semibold text-slate-800">Public-source monitoring</div>
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
