# Social Intelligence Dashboard

Keyword-based monitoring of **publicly visible** Facebook and Instagram posts.
Two independent services, connected only through PostgreSQL:

```
social-intel-dashboard/
├── db/               PostgreSQL schema
├── scraper/          Node.js + Playwright service (writes to DB)
└── dashboard/        Next.js app (reads from DB, triggers scraper via HTTP)
```

## Read this before you run anything

This project deliberately does **not** use logins, cookies from a real
account, CAPTCHA-solving services, or any private/authenticated API. That
constraint is safer and avoids ToS-violation grey areas, but it also means
you are limited to whatever Facebook/Instagram render to a logged-out
visitor — which in practice is **very little**:

- Instagram serves almost nothing to logged-out requests beyond a single
  public profile's most recent grid (no keyword search at all without login).
- Facebook's logged-out search results are heavily throttled, frequently
  interstitial ("log in to continue"), and change often.

So realistically: the Facebook scraper can pull from specific **public Page
URLs you already know** (e.g. a company's own Page) reasonably well; keyword
*search* across all of Facebook/Instagram without login will return sparse
or empty results, and is likely to break as Meta changes markup. I built the
architecture so you can point it at Pages/hashtags you specify, and swap in
a better data source later (official Graph API for Pages you admin, or a
compliant third-party data provider) without touching the dashboard — the
scraper only needs to keep writing rows that match the schema in `db/schema.sql`.

I did not add anything that logs in, solves CAPTCHAs, or hits private
endpoints, per your instructions.

## Setup

1. **Database**
   ```bash
   createdb social_intel
   psql social_intel -f db/schema.sql
   ```

2. **Scraper service**
   ```bash
   cd scraper
   cp .env.example .env   # set DATABASE_URL
   npm install
   npx playwright install chromium
   npm run dev             # starts API on :4000
   ```

3. **Dashboard**
   ```bash
   cd dashboard
   cp .env.example .env   # set DATABASE_URL and SCRAPER_URL
   npm install
   npm run dev              # starts on :3000
   ```

4. Open http://localhost:3000, enter a keyword, and hit **Scan**. When no
   targets are supplied, the scraper uses public Google search results for
   `site:facebook.com` and `site:instagram.com` queries, then categorizes
   matching result URLs by platform. You can still provide specific public
   Facebook Pages or Instagram hashtags/profiles for direct platform scans.

## How a "scan" flows

1. Dashboard `POST /api/scrape { keyword, platforms, targets }`
2. Dashboard API forwards the job to the scraper service (`POST :4000/scrape`)
3. With no explicit targets, the scraper searches public Google result pages
   for Facebook and Instagram URLs, categorizes them by domain, and upserts
   result titles/snippets into `posts` (dedup on `platform + post_url`).
   With explicit targets, it visits the allowed public pages directly.
4. Dashboard polls `/api/posts` — new rows just show up

## Adding a new platform later

Implement `scraper/src/scrapers/<platform>.js` exporting `search(keyword, targets)`
returning an array of `NormalizedPost` (shape in `scraper/src/scrapers/base.js`),
register it in `scraper/src/server.js`'s `PLATFORM_REGISTRY`. Nothing on the
dashboard side needs to change — it's schema-driven, not platform-specific.

## Production deployment guide

### 1. Production prerequisites

- Node.js 20 or newer
- PostgreSQL 14 or newer
- A process manager such as systemd, PM2, or Windows Services
- A reverse proxy with HTTPS, such as Nginx, Caddy, or a cloud load balancer
- A search provider API key configured outside the repository

Run the services under a dedicated operating-system user. Do not run them as
the root or local administrator account.

### 2. Configure PostgreSQL

Create a dedicated database and user:

```sql
CREATE USER social_intel_app WITH PASSWORD 'use-a-long-random-password';
CREATE DATABASE social_intel OWNER social_intel_app;
```

Apply the schema:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Use SSL for remote PostgreSQL connections and restrict the database firewall to
the application host. Back up the database before schema changes and verify
that backups can be restored.

### 3. Configure production secrets

Create environment variables through the process manager or hosting provider.
Do not commit `.env` files, API keys, database passwords, or generated reports.

Scraper variables:

```text
DATABASE_URL=postgres://social_intel_app:PASSWORD@db-host:5432/social_intel?sslmode=require
PORT=4000
SERPAPI_KEY=your-provider-key
SERPAPI_MONTHLY_LIMIT=250
SERPAPI_IGNORE_MONTHLY_LIMIT=false
REQUEST_DELAY_MS=2500
```

Dashboard variables:

```text
DATABASE_URL=postgres://social_intel_app:PASSWORD@db-host:5432/social_intel?sslmode=require
SCRAPER_URL=http://127.0.0.1:4000
```

Keep `SERPAPI_IGNORE_MONTHLY_LIMIT=false` in production. The override exists
only for controlled local testing and does not bypass the provider's own quota.
Rotate the API key immediately if it has ever been exposed.

### 4. Install and build

Install dependencies from the lockfiles:

```bash
cd scraper
npm ci
npx playwright install --with-deps chromium
npm run start
```

Build and start the dashboard separately:

```bash
cd dashboard
npm ci
npm run build
npm run start
```

The scraper should listen only on a private interface or internal network.
Expose the dashboard through the reverse proxy, not the Node.js development
server.

### 5. Run as managed services

Use separate service definitions for the scraper and dashboard. Configure:

- Automatic restart on failure
- A bounded memory limit
- Working directory
- Environment file or secret injection
- Standard output and error logs
- Health checks on ports 4000 and 3000
- Graceful shutdown and deployment timeout

Do not use `npm run dev` in production. Deploy a new release by installing
dependencies, building the dashboard, switching to the new release directory,
and restarting services one at a time.

### 6. Reverse proxy and HTTPS

Proxy public HTTPS traffic to the dashboard on port 3000. Keep port 4000
private; the dashboard calls it through `SCRAPER_URL`. Configure:

- TLS certificates and automatic renewal
- HSTS after HTTPS is verified
- Request body and timeout limits suitable for scan requests
- Access logs without query-string secrets
- Security headers and compressed responses

If the dashboard and scraper are on different hosts, use a private network and
authenticate the scraper endpoint with an internal token before exposing it
outside that network.

### 7. Operational monitoring

Monitor:

- Dashboard and scraper process health
- PostgreSQL connectivity and connection pool saturation
- Scan failures and duration
- SerpAPI monthly usage in `serpapi_usage`
- Database size and backup age
- Playwright/browser launch failures

Useful checks:

```bash
curl -f https://your-domain.example/
curl -f http://127.0.0.1:4000/scan/999999
psql "$DATABASE_URL" -c "SELECT * FROM serpapi_usage ORDER BY month DESC LIMIT 2;"
psql "$DATABASE_URL" -c "SELECT status, count(*) FROM scan_runs GROUP BY status;"
```

The `/scan/:id` 404 response is expected for an unknown ID; use it as a
connectivity check, not as a scan-health result.

### 8. Security and data handling

Only ingest public sources that you are authorized to monitor. Do not add
login automation, CAPTCHA bypasses, private endpoints, or stolen session data.
Restrict report downloads if the dashboard contains sensitive intelligence.
Apply retention rules to `posts` and `scan_runs`, and remove old data through a
reviewed migration or scheduled maintenance job.

Before launch, confirm:

- `.env` files are ignored and absent from Git history
- Production secrets are injected by the host
- HTTPS is working
- PostgreSQL backups restore successfully
- SerpAPI quota alerts are configured
- Google Reviews remains intentionally disabled until its integration is
  re-enabled and tested
