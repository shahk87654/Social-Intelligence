"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Guide = {
  label: string;
  title: string;
  description: string;
  steps: [string, string, string][];
};

const guides: Record<string, Guide> = {
  "/dashboard": {
    label: "Workspace overview",
    title: "Read your monitoring signal",
    description: "Start scans, watch the latest activity, and move from a high-level signal to the underlying mentions.",
    steps: [
      ["1", "Choose a keyword", "Enter the topic or brand you want to monitor, then choose the sources to scan."],
      ["2", "Start a scan", "Run the scan and wait for the results to be collected from public sources."],
      ["3", "Inspect the signal", "Use the stats, charts, and mention list to spot volume, engagement, and sentiment changes."],
    ],
  },
  "/projects": {
    label: "Monitoring briefs",
    title: "Build reusable projects",
    description: "Save the monitoring setup your team repeats so every scan starts with the right scope.",
    steps: [
      ["1", "Create a project", "Give the brief a clear name and add one or more keywords."],
      ["2", "Set the scope", "Choose platforms and optional public page, profile, or source targets."],
      ["3", "Run or edit", "Use the project as a repeatable starting point and keep its scope current."],
    ],
  },
  "/history": {
    label: "Scan history",
    title: "Review previous scans",
    description: "Use the history view to find completed runs, investigate failures, and reopen collected results.",
    steps: [
      ["1", "Filter the runs", "Narrow the list by keyword, status, or date to find the scan you need."],
      ["2", "Check the outcome", "Open a completed run to see how many posts were found and which sources responded."],
      ["3", "Investigate failures", "Read the error details, adjust the project scope, and run the scan again."],
    ],
  },
  "/search": {
    label: "Global search",
    title: "Find intelligence quickly",
    description: "Search across collected mentions, saved projects, and generated reports from one place.",
    steps: [
      ["1", "Enter a phrase", "Search for a keyword, author, URL, project name, or report filename."],
      ["2", "Review grouped results", "Use the result type to distinguish mentions, projects, and report records."],
      ["3", "Open the source", "Select a result to jump to its detail page or download the matching report."],
    ],
  },
  "/alerts": {
    label: "Alert rules",
    title: "Stay ahead of changes",
    description: "Create rules that surface negative sentiment, new mentions, volume spikes, or scan failures.",
    steps: [
      ["1", "Choose a trigger", "Select the event that should create an alert for your workspace."],
      ["2", "Set the threshold", "Define the keyword, platform, sentiment, or volume threshold that matters."],
      ["3", "Review and act", "Use the alert feed to acknowledge changes and open the related intelligence."],
    ],
  },
  "/comparison": {
    label: "Project comparison",
    title: "Compare coverage and signal",
    description: "Place projects or keywords side by side to see which topics and sources are driving the conversation.",
    steps: [
      ["1", "Select two scopes", "Choose the projects or keyword groups you want to compare."],
      ["2", "Set the period", "Use the date range to compare the same window across both scopes."],
      ["3", "Read the differences", "Compare volume, engagement, sentiment, and platform coverage."],
    ],
  },
  "/reports": {
    label: "Scheduled reports",
    title: "Deliver recurring intelligence",
    description: "Create an automated PDF or CSV delivery for the people who need the signal on a regular cadence.",
    steps: [
      ["1", "Define the delivery", "Name the schedule, add recipients, and choose the keyword and platform scope."],
      ["2", "Choose the format", "Set the frequency, timezone, PDF or CSV format, and optional email message."],
      ["3", "Track the run", "Use the schedule list and generated reports audit trail to confirm delivery or diagnose errors."],
    ],
  },
  "/executive-reports": {
    label: "Executive view",
    title: "Brief decision-makers",
    description: "Turn collected mentions into a concise view of volume, risk, sentiment, engagement, and source coverage.",
    steps: [
      ["1", "Set the period", "Choose the reporting window that matches your leadership update."],
      ["2", "Read the summary", "Review trends, platform mix, sentiment, and the risk watchlist."],
      ["3", "Share the signal", "Use the report actions to export or schedule the view for your stakeholders."],
    ],
  },
  "/team": {
    label: "Team workspace",
    title: "Coordinate the workspace",
    description: "Invite teammates, manage roles, and keep monitoring work organized around one shared workspace.",
    steps: [
      ["1", "Invite a teammate", "Add their email and choose whether they should be an admin or member."],
      ["2", "Review membership", "Check active members and pending invitations from one list."],
      ["3", "Keep access focused", "Use the least-permission role that fits each teammate's responsibilities."],
    ],
  },
  "/integrations": {
    label: "Workspace integrations",
    title: "Connect your delivery tools",
    description: "Manage provider credentials, API keys, and signed webhooks without exposing secrets to the browser.",
    steps: [
      ["1", "Configure a provider", "Add the required credential for the service your workspace uses."],
      ["2", "Create controlled access", "Use API keys for internal tools and webhooks for signed event delivery."],
      ["3", "Test the connection", "Confirm the provider status and review delivery history when available."],
    ],
  },
  "/settings": {
    label: "Workspace settings",
    title: "Tune your console",
    description: "Control dashboard preferences and organization-level settings from one administrative surface.",
    steps: [
      ["1", "Choose your appearance", "Switch between light and dark themes for the working environment."],
      ["2", "Select visible widgets", "Keep the dashboard focused by choosing the panels your team uses most."],
      ["3", "Save preferences", "Apply changes and return to Overview to see the updated workspace."],
    ],
  },
  "/audit-logs": {
    label: "Audit log",
    title: "Trace workspace activity",
    description: "Review administrative and destructive actions recorded for your organization.",
    steps: [
      ["1", "Filter the activity", "Search by action, actor, resource, or date to narrow the audit trail."],
      ["2", "Inspect an event", "Open an entry to see who acted, what changed, and when it happened."],
      ["3", "Use the record", "Keep the event details as an operational reference when reviewing workspace changes."],
    ],
  },
};

const defaultGuide: Guide = {
  label: "Signal / Intel",
  title: "Get oriented",
  description: "Use the workspace to collect public-source intelligence, understand the signal, and deliver it to your team.",
  steps: [
    ["1", "Create a monitoring brief", "Open Projects to save keywords, platforms, and optional source targets."],
    ["2", "Run a scan", "Use Overview to start a scan, then review matching public mentions in the workspace."],
    ["3", "Turn signal into action", "Use Alerts for important changes, Compare for context, and Reports for scheduled delivery."],
  ],
};

export default function HowToGuide() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hidden = pathname === "/" || pathname === "/login" || pathname === "/signup";
  const guide = pathname.startsWith("/posts/") ? {
    label: "Mention detail",
    title: "Investigate one mention",
    description: "Use the detail view to understand the source, preserve context, and add private workspace notes.",
    steps: [
      ["1", "Verify the source", "Check the platform, author, source URL, and collection timestamp."],
      ["2", "Classify the mention", "Review sentiment, source quality, duplicate, spam, and tag indicators."],
      ["3", "Record context", "Add a private note or assignment, then open the original public source when needed."],
    ],
  } : guides[pathname] || defaultGuide;

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open how-to guide"
        className="fixed bottom-5 right-5 z-40 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 dark:bg-white dark:text-slate-950 dark:hover:bg-blue-100"
      >
        ? <span className="ml-1">How to</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:items-center" onMouseDown={() => setOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-to-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="eyebrow">{guide.label}</p>
                <h2 id="how-to-title" className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{guide.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{guide.description}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close how-to guide" className="rounded-lg px-2 py-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">×</button>
            </div>
            <div className="mt-6 space-y-4">
              {guide.steps.map(([number, title, description]) => (
                <div key={number} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">{number}</span>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setOpen(false)} className="mt-7 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Got it</button>
          </section>
        </div>
      )}
    </>
  );
}