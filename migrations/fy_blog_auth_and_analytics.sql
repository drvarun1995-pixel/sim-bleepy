-- Foundation Year: members-only page flag + blog reading analytics

ALTER TABLE fy_pages
  ADD COLUMN IF NOT EXISTS requires_auth BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN fy_pages.requires_auth IS
  'When true, page is for logged-in users only and must stay out of search engines.';

-- Lock Basildon hospital induction (both cohort copies share the same slug)
UPDATE fy_pages
SET requires_auth = true,
    updated_at = NOW()
WHERE slug = 'trust-induction-basildon-hospital';

CREATE TABLE IF NOT EXISTS fy_blog_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES fy_pages(id) ON DELETE CASCADE,
  page_slug TEXT NOT NULL,
  page_title TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  active_seconds INTEGER NOT NULL DEFAULT 0,
  max_scroll_percent INTEGER NOT NULL DEFAULT 0,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fy_blog_sessions_page_id ON fy_blog_sessions(page_id);
CREATE INDEX IF NOT EXISTS idx_fy_blog_sessions_user_email ON fy_blog_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_fy_blog_sessions_started_at ON fy_blog_sessions(started_at DESC);

CREATE TABLE IF NOT EXISTS fy_blog_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES fy_blog_sessions(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES fy_pages(id) ON DELETE CASCADE,
  page_slug TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('click', 'download', 'outbound', 'image')),
  event_label TEXT,
  event_href TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fy_blog_events_page_id ON fy_blog_events(page_id);
CREATE INDEX IF NOT EXISTS idx_fy_blog_events_session_id ON fy_blog_events(session_id);
CREATE INDEX IF NOT EXISTS idx_fy_blog_events_created_at ON fy_blog_events(created_at DESC);

ALTER TABLE fy_blog_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fy_blog_events ENABLE ROW LEVEL SECURITY;
