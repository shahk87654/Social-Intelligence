import Link from "next/link";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const capabilities = [
  ["01", "Discover", "Track public conversation across social platforms, articles, websites, and reviews as it happens."],
  ["02", "Understand", "Turn raw mentions into sentiment, quality, duplicate, and risk signals your team can trust."],
  ["03", "Act", "Route the intelligence that matters through alerts, reports, webhooks, and the read-only API."],
] as const;

const workflow = [
  ["01", "Connect your sources", "Bring your own provider credentials and configure the platforms, keywords, and projects that matter."],
  ["02", "Launch a focused scan", "Search one topic or build a reusable monitoring brief with precise source targets."],
  ["03", "Read the operating picture", "Review coverage, sentiment, source quality, engagement, volume, and duplicate signals."],
  ["04", "Move the work forward", "Create alerts, share reports, invite teammates, or connect intelligence to existing workflows."],
] as const;

const snapshots = [
  ["01", "Command center", "/snapshots/overview.png"],
  ["02", "Global search", "/snapshots/global-search.png"],
  ["03", "Signal response", "/snapshots/alerts.png"],
  ["04", "Executive delivery", "/snapshots/reports.png"],
] as const;

const faqs = [
  ["Do I need to provide my own API keys?", "Yes. Your workspace can securely connect its own SerpAPI and Resend credentials, giving your team control over provider usage and billing."],
  ["Can multiple people use one workspace?", "Yes. Invite teammates into the organization workspace and share projects, reports, alerts, and source history with the appropriate access."],
  ["What data does Signal / Intel monitor?", "The platform is built for public-source monitoring across supported social targets, search results, websites, articles, and review signals."],
  ["Can I export or connect the results?", "Yes. Use scheduled PDF or CSV reports, signed webhooks, or the read-only API to move intelligence into existing workflows."],
] as const;

function SectionHeading({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="neo-heading">
      <span className="neo-eyebrow">{eyebrow}</span>
      <h2>{children}</h2>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className={`${display.variable} ${sans.variable} ${mono.variable} neo-shell`}>
      <div className="neo-noise" aria-hidden="true" />
      <div className="neo-orbit neo-orbit-a" aria-hidden="true" />
      <div className="neo-orbit neo-orbit-b" aria-hidden="true" />

      <nav className="neo-nav">
        <Link href="/" className="neo-brand" aria-label="Signal / Intel home">
          <img src="/logo.png?v=5" alt="Signal / Intel" width={401} height={140} />
        </Link>
        <div className="neo-nav-links">
          <a href="#product">Intelligence</a>
          <a href="#workflow">Workflow</a>
          <a href="#console">Inside console</a>
          <Link href="/login">Sign in</Link>
          <Link href="/signup" className="neo-nav-cta">Start monitoring <span>↗</span></Link>
        </div>
      </nav>

      <section className="neo-hero">
        <div className="neo-hero-copy">
          <div className="neo-live"><span /> PUBLIC WEB / LIVE INTELLIGENCE</div>
          <h1>See the signal<br /><em>before</em> it becomes noise.</h1>
          <div className="neo-wave" aria-hidden="true">
            <svg viewBox="0 0 520 52" fill="none"><path d="M0 26H56L68 26L80 9L94 43L108 18L122 34L136 26H194L207 26L221 4L236 48L251 20L266 32L280 26H335L348 26L360 14L374 38L388 26H520" /></svg>
          </div>
          <p className="neo-hero-subtitle">Signal / Intel turns the public web into a live operating picture for teams that need to know what is changing, why it matters, and what to do next.</p>
          <div className="neo-actions">
            <Link href="/signup" className="neo-button neo-button-primary">Create your workspace <span>↗</span></Link>
            <Link href="/login" className="neo-button neo-button-ghost">Open console</Link>
          </div>
          <div className="neo-trust"><span>Public sources only</span><i /> <span>Organization-scoped</span><i /> <span>Audit-ready</span></div>
        </div>

        <div className="neo-hero-art" aria-label="Signal / Intel live workspace preview">
          <div className="neo-radar"><span className="neo-radar-sweep" /><span className="neo-radar-dot dot-one" /><span className="neo-radar-dot dot-two" /><span className="neo-radar-dot dot-three" /></div>
          <div className="neo-console">
            <div className="neo-console-top"><div><small>LIVE WORKSPACE</small><strong>Market pulse</strong></div><span className="neo-status"><b /> Operational</span></div>
            <div className="neo-console-grid">
              <div><small>MENTIONS</small><strong>12.8k</strong><em>+18.4%</em></div>
              <div><small>SOURCES</small><strong>426</strong><em>4 channels</em></div>
              <div><small>RISK INDEX</small><strong className="amber">LOW</strong><em>stable this week</em></div>
            </div>
            <div className="neo-console-chart"><div className="chart-label"><span>CONVERSATION VOLUME</span><b>+32%</b></div><div className="chart-bars">{[22, 34, 29, 45, 39, 58, 52, 72, 64, 86, 78, 100].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div>
            <div className="neo-console-events"><div><span className="event-dot green" /> New competitor mention detected <b>Review</b></div><div><span className="event-dot red" /> Sentiment threshold crossed <b className="critical">Critical</b></div></div>
          </div>
          <div className="neo-floating-tag"><span /> SIGNAL DETECTED <b>2m ago</b></div>
        </div>
      </section>

      <section id="product" className="neo-section neo-capabilities">
        <SectionHeading eyebrow="One operating picture">From public mentions to confident action.</SectionHeading>
        <div className="neo-capability-list">{capabilities.map(([number, title, description]) => <article key={number}><span className="neo-index">{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section id="workflow" className="neo-band">
        <div className="neo-section neo-workflow"><SectionHeading eyebrow="The workflow">A practical path from question to decision.</SectionHeading><div className="neo-workflow-list">{workflow.map(([number, title, description]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></div>
      </section>

      <section className="neo-section neo-usecases"><SectionHeading eyebrow="Built for the whole signal chain">One workspace for every team that needs context.</SectionHeading><div className="neo-usecase-grid"><article><span>Brand / comms</span><h3>Find the narrative<br />before it finds you.</h3><p>Spot emerging shifts and give leadership a defensible view of reputation.</p></article><article><span>Market intelligence</span><h3>See where the<br />category is moving.</h3><p>Track competitors, products, and momentum across the public web.</p></article><article><span>Customer experience</span><h3>Catch the issue<br />before it compounds.</h3><p>Surface recurring friction and high-value praise while it is still actionable.</p></article></div></section>

      <section id="console" className="neo-console-section"><div className="neo-section"><div className="neo-console-heading"><SectionHeading eyebrow="Inside the console">A real workspace for the work after discovery.</SectionHeading><Link href="/signup" className="neo-text-link">Explore the workspace <span>↗</span></Link></div><div className="neo-snapshot-grid">{snapshots.map(([number, title, image]) => <article key={number}><div className="neo-snapshot-label"><span>{number}</span>{title}<b>↗</b></div><img src={image} alt={`${title} application screen`} width={1440} height={900} /><div className="neo-snapshot-scan" /></article>)}</div></div></section>

      <section className="neo-section neo-stats"><SectionHeading eyebrow="Designed for accountable decisions">The signal is only useful when your team can move on it.</SectionHeading><div className="neo-stat-grid"><div><strong>4+</strong><span>Public source types in one monitoring workflow.</span></div><div><strong>1</strong><span>Shared workspace for projects, reports, alerts, and history.</span></div><div><strong>0</strong><span>Private credentials exposed to the browser after saving.</span></div><div><strong>24/7</strong><span>A durable record of the conversations shaping your market.</span></div></div></section>

      <section className="neo-band"><div className="neo-section neo-coverage"><SectionHeading eyebrow="Source coverage">A wider view of the conversations that matter.</SectionHeading><div className="neo-coverage-grid"><div><span>01 / SOCIAL</span><h3>Social platforms</h3><p>Monitor public Facebook pages and Instagram targets with focused collection options.</p></div><div><span>02 / WEB</span><h3>Web discovery</h3><p>Find relevant articles and websites through keyword-driven public search.</p></div><div><span>03 / REVIEWS</span><h3>Reviews and feedback</h3><p>Keep customer sentiment and public review signals beside broader market context.</p></div><div><span>04 / SCHEMA</span><h3>Normalized records</h3><p>Compare source, author, content, dates, engagement, sentiment, and quality in one schema.</p></div></div></div></section>

      <section className="neo-section neo-security"><SectionHeading eyebrow="Control layer">Your workspace stays yours.</SectionHeading><div className="neo-security-grid"><div><strong>AES</strong><p>Integration credentials encrypted at rest.</p></div><div><strong>ORG</strong><p>Data scoped to each workspace.</p></div><div><strong>API</strong><p>Read-only access for downstream tools.</p></div><div><strong>OWN</strong><p>Bring your own provider credentials.</p></div></div></section>

      <section className="neo-section neo-faq"><SectionHeading eyebrow="Questions, answered">A clearer way to get started.</SectionHeading><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="neo-closing"><div><span className="neo-eyebrow">Ready when you are</span><h2>Build your listening post.</h2></div><Link href="/signup" className="neo-button neo-button-primary">Create a workspace <span>↗</span></Link></section>

      <footer className="neo-footer"><div className="neo-footer-top"><div><Link href="/" className="neo-brand"><img src="/logo.png?v=5" alt="Signal / Intel" width={401} height={140} /></Link><p>A focused intelligence workspace for teams that need to understand public conversation and act with confidence.</p></div><div><b>Product</b><Link href="/signup">Create workspace</Link><Link href="/login">Open console</Link><Link href="/#workflow">How it works</Link></div><div><b>Company</b><Link href="/about">About Signal / Intel</Link><Link href="/contact">Contact us</Link><Link href="/security">Security</Link></div><div><b>Legal</b><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/accessibility">Accessibility</Link></div></div><div className="neo-footer-bottom"><span>© 2026 Signal / Intel</span><span><i /> Systems operational</span></div></footer>
    </main>
  );
}
