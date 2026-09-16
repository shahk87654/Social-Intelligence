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

## Setup guide for beginners

Follow these steps in order. If a command fails, do not skip the error:
copy the complete error message and check the troubleshooting section below.

### Step 1: Install the required software

Install these programs before doing anything else:

1. **Node.js 20 or newer**: https://nodejs.org/
2. **PostgreSQL 14 or newer**: https://www.postgresql.org/download/
3. **Git** (optional, but useful): https://git-scm.com/downloads

After installing Node.js, open a new PowerShell window and confirm it works:

```powershell
node --version
npm --version
```

Both commands must print a version number. PostgreSQL must also be running.
On Windows, you can start it from the Services app by starting the service
whose name begins with `postgresql`.

### Step 2: Open the project folder

Open PowerShell and run:

```powershell
cd "d:\social-intel-dashboard"
```

If your project is in a different folder, replace the path with your actual
project folder.

### Step 3: Create the database

PostgreSQL needs an empty database for this app. Run:

```powershell
createdb social_intel
psql social_intel -f db\schema.sql
```

If PostgreSQL asks for a password, enter the password you chose when
installing PostgreSQL. These commands only need to be run once.

### Step 4: Configure the scraper

Create the scraper's private environment file by copying the example:

```powershell
Copy-Item scraper\.env.example scraper\.env
```

Open `scraper\.env` in a text editor. At minimum, check these values:

```text
DATABASE_URL=postgres://localhost:5432/social_intel
PORT=4000
SERPAPI_KEY=your-search-provider-key
```

Replace `your-search-provider-key` with your real provider key. Never paste
that key into the README, Git, screenshots, or chat. The `.env` file is private
and must stay on your computer.

Install the scraper packages and its browser:

```powershell
cd scraper
npm install
npx playwright install chromium
cd ..
```

### Step 5: Configure the dashboard

Create the dashboard's private environment file:

```powershell
Copy-Item dashboard\.env.example dashboard\.env
```

The default values work when PostgreSQL and the scraper run on this computer:

```text
DATABASE_URL=postgres://localhost:5432/social_intel
SCRAPER_URL=http://localhost:4000
```

Install the dashboard packages:

```powershell
cd dashboard
npm install
cd ..
```

### Step 6: Start the scraper

Keep this PowerShell window open. Run:

```powershell
cd "d:\social-intel-dashboard\scraper"
npm run dev
```

The scraper is now running on `http://localhost:4000`. Do not close this
window while using the app.

### Step 7: Start the dashboard

Open a **second** PowerShell window and run:

```powershell
cd "d:\social-intel-dashboard\dashboard"
npm run dev
```

Open http://localhost:3000 in your browser. Enter a keyword and click
**Scan**. If port 3000 is already being used, Next.js may show a different
URL, such as http://localhost:3001; open the URL printed in the terminal.

When no targets are supplied, the scraper uses public Google results for
Facebook and Instagram. You can also provide specific public Facebook Page
URLs or Instagram hashtags/profiles.

### Step 8: Stop the app

In each terminal running the app, press:

```text
Ctrl+C
```

Stop the dashboard and scraper separately. Your database records remain in
PostgreSQL when the services are stopped.

### Common problems

- **`node` or `npm` is not recognized**: install Node.js, close PowerShell,
  open a new PowerShell window, and try again.
- **`createdb` or `psql` is not recognized**: add PostgreSQL's `bin` folder to
  your Windows PATH, or run the commands from the PostgreSQL SQL Shell.
- **`password authentication failed`**: fix the PostgreSQL password or update
  `DATABASE_URL` in both `.env` files.
- **`database "social_intel" does not exist`**: repeat Step 3.
- **`EADDRINUSE` or port already in use**: another copy is running. Close it
  with `Ctrl+C`, or use the alternate URL printed by Next.js.
- **The scan returns no results**: Facebook and Instagram limit logged-out
  visitors. Try a known public Page/profile, verify `SERPAPI_KEY`, and wait
  for the scan to finish.
- **Never-ending browser errors**: run
  `npx playwright install chromium` from the `scraper` folder again.

## Scheduled reports

## Accounts and Phase 1 workspace features

The dashboard now starts with a private account and workspace flow:

- Create an account at `http://localhost:3000/signup`
- Sign in at `http://localhost:3000/login`
- Use **Projects** to save reusable monitoring briefs
- Use **Scan history** to review previous scans
- Open any source author from the overview to view its post detail page
- Use **Global search** to search mentions, projects, and generated reports

The Phase 1 account schema creates an organization and admin membership for
each new account. Team invitations and additional member management are
reserved for the next collaboration phase.

The dashboard includes a full Reports workspace at
`http://localhost:3000/reports`. From there you can create a schedule with a
recipient email, keyword scope, and platform filter. The first delivery is due
immediately; every later delivery is scheduled 24 hours after the previous
attempt. Sent PDFs are retained in the database and can be downloaded from the
report history.

### Configure Resend email delivery

Apply the updated schema after pulling this feature:

```powershell
psql social_intel -f db\schema.sql
```

Create a Resend account, create an API key, and verify the domain or sender
address you will use. Then add these values to `dashboard\.env`:

```text
APP_URL=http://localhost:3000
REPORT_WORKER_SECRET=use-a-long-random-secret
RESEND_API_KEY=re_xxxxxxxxx
REPORT_FROM_EMAIL=reports@your-verified-domain.com
```

The sender address must belong to a verified Resend domain (or use the sender
address Resend provides for testing). Do not commit the API key.

### Run the report worker

Keep the dashboard running, then open another PowerShell window:

```powershell
cd "d:\social-intel-dashboard\dashboard"
npm run reports:worker
```

The worker checks for due schedules every minute and sends each due PDF once.
For production, run this command under PM2, systemd, Windows Task Scheduler,
or another process manager so it restarts automatically. The worker is
intentionally separate from the Next.js web process because serverless and
web-request lifecycles do not guarantee a 24-hour timer.

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
