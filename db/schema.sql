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
    organization_id INTEGER,
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
    organization_id INTEGER,
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
    UNIQUE (organization_id, platform, post_url)
);

ALTER TABLE scan_runs ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS organization_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_scan_runs_org ON scan_runs(organization_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_org ON posts(organization_id, scraped_at DESC);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS group_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sentiment TEXT NOT NULL DEFAULT 'neutral';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC(5, 4) NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_spam BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_quality_score INTEGER NOT NULL DEFAULT 50;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_fingerprint TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS note TEXT;

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
CREATE INDEX IF NOT EXISTS idx_posts_sentiment ON posts(sentiment);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_posts_content_fingerprint ON posts(content_fingerprint);


CREATE TABLE IF NOT EXISTS report_schedules (
    id              SERIAL PRIMARY KEY,
    organization_id INTEGER,
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

ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'daily';
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS report_format TEXT NOT NULL DEFAULT 'pdf';
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS recipients TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS cc_recipients TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS email_subject TEXT;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS email_message TEXT;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS organization_id INTEGER;

-- Foundational identity tables are declared before tables that reference them.
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
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS dashboard_preferences (
    user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    widgets      JSONB NOT NULL DEFAULT '{"stats":true,"analytics":true,"mentions":true}'::jsonb,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
    id              SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    key_prefix      TEXT NOT NULL,
    key_hash        TEXT NOT NULL UNIQUE,
    created_by      INTEGER NOT NULL REFERENCES users(id),
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhooks (
    id              SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    endpoint_url    TEXT NOT NULL,
    secret          TEXT NOT NULL,
    events          TEXT[] NOT NULL DEFAULT '{}',
    enabled         BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id              BIGSERIAL PRIMARY KEY,
    webhook_id      INTEGER NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event           TEXT NOT NULL,
    payload         JSONB NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
    attempts        INTEGER NOT NULL DEFAULT 0,
    response_status INTEGER,
    error_message   TEXT,
    next_attempt_at TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks(organization_id, enabled);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_org ON webhook_deliveries(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON webhook_deliveries(status, next_attempt_at);

CREATE TABLE IF NOT EXISTS background_jobs (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    job_type        TEXT NOT NULL,
    payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
    status          TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'dead_letter')),
    attempts        INTEGER NOT NULL DEFAULT 0,
    max_attempts    INTEGER NOT NULL DEFAULT 5,
    available_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    locked_at       TIMESTAMPTZ,
    locked_by      TEXT,
    last_error      TEXT,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_background_jobs_claim ON background_jobs(status, available_at);
CREATE INDEX IF NOT EXISTS idx_background_jobs_org ON background_jobs(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS organization_integrations (
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider       TEXT NOT NULL CHECK (provider IN ('resend', 'serpapi', 'slack', 'microsoft_teams', 'meta_graph', 'google_business_profile')),
    encrypted_key  TEXT NOT NULL,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (organization_id, provider)
);

DO $$
BEGIN
    ALTER TABLE organization_integrations DROP CONSTRAINT IF EXISTS organization_integrations_provider_check;
    ALTER TABLE organization_integrations ADD CONSTRAINT organization_integrations_provider_check
      CHECK (provider IN ('resend', 'serpapi', 'slack', 'microsoft_teams', 'meta_graph', 'google_business_profile'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS auth_tokens (
    id              BIGSERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,
    token_type      TEXT NOT NULL CHECK (token_type IN ('password_reset', 'email_verification')),
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_lookup ON auth_tokens(token_hash, token_type, expires_at);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
    key                 TEXT PRIMARY KEY,
    attempts            INTEGER NOT NULL DEFAULT 0,
    window_started_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS audit_events (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action          TEXT NOT NULL,
    resource_type   TEXT NOT NULL,
    resource_id     TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_events_org_created ON audit_events(organization_id, created_at DESC);

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
UPDATE scan_runs SET organization_id = (SELECT id FROM organizations ORDER BY id LIMIT 1) WHERE organization_id IS NULL;
UPDATE posts SET organization_id = (SELECT organization_id FROM scan_runs WHERE scan_runs.id = posts.scan_run_id) WHERE organization_id IS NULL;
UPDATE report_schedules SET organization_id = (SELECT id FROM organizations ORDER BY id LIMIT 1) WHERE organization_id IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scan_runs_organization_id_fkey') THEN
        ALTER TABLE scan_runs ADD CONSTRAINT scan_runs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_organization_id_fkey') THEN
        ALTER TABLE posts ADD CONSTRAINT posts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'report_schedules_organization_id_fkey') THEN
        ALTER TABLE report_schedules ADD CONSTRAINT report_schedules_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_platform_post_url_key;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_org_platform_url ON posts(organization_id, platform, post_url);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS alert_rules (
    id              SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    rule_type       TEXT NOT NULL CHECK (rule_type IN ('new_mention', 'negative_sentiment', 'volume_spike', 'scan_failure')),
    keyword        TEXT,
    threshold      INTEGER,
    enabled         BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
    id              SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    rule_id         INTEGER REFERENCES alert_rules(id) ON DELETE SET NULL,
    title           TEXT NOT NULL,
    message         TEXT NOT NULL,
    severity        TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_org ON alert_rules(organization_id, enabled);
CREATE INDEX IF NOT EXISTS idx_alerts_org ON alerts(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS support_tickets (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    subject         TEXT NOT NULL,
    message         TEXT NOT NULL,
    priority        TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    admin_reply     TEXT,
    replied_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    replied_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS admin_reply TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS replied_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_support_tickets_org ON support_tickets(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, created_at DESC);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id           BIGSERIAL PRIMARY KEY,
    ticket_id    BIGINT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    author_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author_name  TEXT NOT NULL,
    author_email TEXT NOT NULL,
    author_type  TEXT NOT NULL CHECK (author_type IN ('customer', 'support')),
    body         TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON support_ticket_messages(ticket_id, created_at ASC);
