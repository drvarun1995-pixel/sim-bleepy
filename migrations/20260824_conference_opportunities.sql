-- Conference presentation opportunities (external poster/oral calls).
-- Access is enforced in Next.js APIs. RLS is service-role only.

CREATE TABLE IF NOT EXISTS public.conference_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    adapter_key TEXT NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_run_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conference_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    organising_body TEXT,
    start_date DATE,
    end_date DATE,
    location_text TEXT,
    city TEXT,
    nation TEXT CHECK (
      nation IS NULL OR nation IN (
        'england', 'scotland', 'wales', 'ni', 'uk_wide', 'international'
      )
    ),
    format TEXT CHECK (
      format IS NULL OR format IN ('in_person', 'virtual', 'hybrid')
    ),
    abstract_open_at TIMESTAMPTZ,
    abstract_deadline TIMESTAMPTZ,
    results_date_text TEXT,
    submission_status TEXT NOT NULL DEFAULT 'upcoming' CHECK (
      submission_status IN ('open', 'upcoming', 'closed')
    ),
    status_override TEXT CHECK (
      status_override IS NULL OR status_override IN ('open', 'upcoming', 'closed', 'archived')
    ),
    poster_accepted BOOLEAN,
    oral_accepted BOOLEAN,
    eligible_work_types TEXT[] NOT NULL DEFAULT '{}',
    eligible_career_levels TEXT[] NOT NULL DEFAULT '{}',
    abstract_word_limit INTEGER,
    submission_requirements TEXT,
    conference_fee TEXT,
    submission_fee TEXT,
    prize_info TEXT,
    publication_info TEXT,
    recognition_level TEXT CHECK (
      recognition_level IS NULL OR recognition_level IN (
        'local', 'regional', 'national', 'international'
      )
    ),
    official_page_url TEXT,
    submission_page_url TEXT,
    canonical_url TEXT UNIQUE,
    poster_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_type TEXT NOT NULL DEFAULT 'staff' CHECK (source_type IN ('staff', 'scraped')),
    source_id UUID REFERENCES public.conference_sources(id) ON DELETE SET NULL,
    ingest_payload JSONB,
    verification_confidence NUMERIC,
    last_verified_at TIMESTAMPTZ,
    publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (
      publication_status IN ('draft', 'pending_review', 'published', 'archived', 'rejected')
    ),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT,
    deadline_not_stated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conference_opportunities_publication
  ON public.conference_opportunities(publication_status);
CREATE INDEX IF NOT EXISTS idx_conference_opportunities_deadline
  ON public.conference_opportunities(abstract_deadline);
CREATE INDEX IF NOT EXISTS idx_conference_opportunities_canonical
  ON public.conference_opportunities(canonical_url);
CREATE INDEX IF NOT EXISTS idx_conference_opportunities_work_types
  ON public.conference_opportunities USING GIN (eligible_work_types);
CREATE INDEX IF NOT EXISTS idx_conference_opportunities_career
  ON public.conference_opportunities USING GIN (eligible_career_levels);
CREATE INDEX IF NOT EXISTS idx_conference_opportunities_search
  ON public.conference_opportunities (name, organising_body);

CREATE TABLE IF NOT EXISTS public.conference_opportunity_specialties (
    opportunity_id UUID NOT NULL REFERENCES public.conference_opportunities(id) ON DELETE CASCADE,
    specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
    PRIMARY KEY (opportunity_id, specialty_id)
);

CREATE INDEX IF NOT EXISTS idx_conference_opportunity_specialties_specialty
  ON public.conference_opportunity_specialties(specialty_id);

CREATE TABLE IF NOT EXISTS public.conference_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.conference_opportunities(id) ON DELETE CASCADE,
    workflow_status TEXT NOT NULL DEFAULT 'saved' CHECK (
      workflow_status IN ('saved', 'planning', 'submitted', 'accepted', 'rejected', 'presented')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_conference_saves_user
  ON public.conference_saves(user_id);

CREATE TABLE IF NOT EXISTS public.conference_ingest_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.conference_sources(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    items_found INTEGER NOT NULL DEFAULT 0,
    items_created INTEGER NOT NULL DEFAULT 0,
    items_updated INTEGER NOT NULL DEFAULT 0,
    items_queued INTEGER NOT NULL DEFAULT 0,
    error TEXT
);

ALTER TABLE public.conference_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_opportunity_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_ingest_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role conference_sources" ON public.conference_sources;
CREATE POLICY "Service role conference_sources"
    ON public.conference_sources FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role conference_opportunities" ON public.conference_opportunities;
CREATE POLICY "Service role conference_opportunities"
    ON public.conference_opportunities FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role conference_opportunity_specialties" ON public.conference_opportunity_specialties;
CREATE POLICY "Service role conference_opportunity_specialties"
    ON public.conference_opportunity_specialties FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role conference_saves" ON public.conference_saves;
CREATE POLICY "Service role conference_saves"
    ON public.conference_saves FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role conference_ingest_runs" ON public.conference_ingest_runs;
CREATE POLICY "Service role conference_ingest_runs"
    ON public.conference_ingest_runs FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

INSERT INTO public.conference_sources (name, base_url, adapter_key, enabled)
VALUES (
  'British Geriatrics Society',
  'https://www.bgs.org.uk/abstracts',
  'bgs_abstracts',
  true
)
ON CONFLICT (adapter_key) DO NOTHING;

INSERT INTO public.specialties (name, slug, description, display_order, is_active)
VALUES
  ('Geriatrics', 'geriatrics', 'Older people''s medicine and geriatric care', 80, true),
  ('Medical Education', 'medical-education', 'Medical education, teaching, and faculty development', 81, true),
  ('Multi-specialty / General', 'multi-specialty-general', 'Opportunities relevant across specialties', 82, true)
ON CONFLICT (slug) DO NOTHING;
