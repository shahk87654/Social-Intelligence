-- Social Intelligence Dashboard schema

CREATE TABLE IF NOT EXISTS search_terms (
    id            SERIAL PRIMARY KEY,
    keyword       TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS serpapi_usage (
    month       DATE PRIMARY KEY,
    searches    INTEGER NOT NULL DEFAULT 0 CHECK (searches >= 0)
);

CREATE TABLE IF NOT EXISTS scan_runs (
    id            SERIAL PRIMARY KEY,
    keyword       TEXT NOT NULL,
    platforms     TEXT[] NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending', -- pending | running | completed | failed
    error         TEXT,
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at   TIMESTAMPTZ,
    posts_found   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS posts (
    id              SERIAL PRIMARY KEY,
    scan_run_id     INTEGER REFERENCES scan_runs(id) ON DELETE SET NULL,
    platform        TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'article', 'website', 'google_review')),
    post_url        TEXT NOT NULL,
    author_name     TEXT,
    author_url      TEXT,
    group_name      TEXT,
    group_url       TEXT,
    content         TEXT,
    matched_keyword TEXT NOT NULL,
    post_date       TIMESTAMPTZ,
    likes           INTEGER DEFAULT 0,
    comments        INTEGER DEFAULT 0,
    shares          INTEGER DEFAULT 0,
    scraped_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (platform, post_url)
);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS group_url TEXT;

DO $$
BEGIN
    ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_platform_check;
    ALTER TABLE posts ADD CONSTRAINT posts_platform_check
      CHECK (platform IN ('facebook', 'instagram', 'article', 'website', 'google_review'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(post_date);
CREATE INDEX IF NOT EXISTS idx_posts_keyword ON posts(matched_keyword);
CREATE INDEX IF NOT EXISTS idx_posts_content_trgm ON posts USING GIN (to_tsvector('english', coalesce(content, '')));

CREATE TABLE IF NOT EXISTS report_schedules (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    keyword         TEXT,
    platform        TEXT NOT NULL DEFAULT 'all',
    enabled         BOOLEAN NOT NULL DEFAULT true,
    next_run_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_run_at     TIMESTAMPTZ,
    last_status     TEXT,
    last_error      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generated_reports (
    id              SERIAL PRIMARY KEY,
    schedule_id     INTEGER REFERENCES report_schedules(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    keyword         TEXT,
    platform        TEXT NOT NULL DEFAULT 'all',
    status          TEXT NOT NULL DEFAULT 'sent',
    error           TEXT,
    file_name       TEXT NOT NULL,
    pdf_data        BYTEA,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_due ON report_schedules(enabled, next_run_at);
CREATE INDEX IF NOT EXISTS idx_generated_reports_schedule ON generated_reports(schedule_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS organizations (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    slug       TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS monitoring_projects (
    id              SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    keywords        TEXT[] NOT NULL DEFAULT '{}',
    platforms       TEXT[] NOT NULL DEFAULT '{}',
    facebook_targets TEXT[] NOT NULL DEFAULT '{}',
    instagram_targets TEXT[] NOT NULL DEFAULT '{}',
    created_by      INTEGER NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_invites (
    id              SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    token           TEXT NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    accepted_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_projects_org ON monitoring_projects(organization_id);
