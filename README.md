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
