import PublicInfoPage from "@/components/PublicInfoPage";

export const metadata = { title: "System status | Signal / Intel", description: "Current Signal / Intel service status." };

export default function StatusPage() {
  return <PublicInfoPage eyebrow="Live operations" title="System status" description="A quick view of the current Signal / Intel service state."><div className="not-prose rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30" /><strong className="text-emerald-800 dark:text-emerald-300">All systems operational</strong></div><p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">Dashboard, authentication, public-source collection, reports, and support are operating normally.</p></div><h2>Service updates</h2><p>For an incident or suspected outage, contact <a href="mailto:support@signalintel.com">support@signalintel.com</a> with the affected workspace, route, and approximate time.</p></PublicInfoPage>;
}