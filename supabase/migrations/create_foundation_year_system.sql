-- Foundation Year resources under Placements
-- Hierarchy: cohort (general|fy1|fy2) → topic → pages

BEGIN;

CREATE TABLE IF NOT EXISTS fy_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort TEXT NOT NULL CHECK (cohort IN ('general', 'fy1', 'fy2')),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cohort, slug)
);

CREATE TABLE IF NOT EXISTS fy_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES fy_topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT,
    featured_image TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(topic_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_fy_topics_cohort ON fy_topics(cohort);
CREATE INDEX IF NOT EXISTS idx_fy_topics_active ON fy_topics(is_active);
CREATE INDEX IF NOT EXISTS idx_fy_topics_slug ON fy_topics(slug);
CREATE INDEX IF NOT EXISTS idx_fy_pages_topic_id ON fy_pages(topic_id);
CREATE INDEX IF NOT EXISTS idx_fy_pages_slug ON fy_pages(slug);
CREATE INDEX IF NOT EXISTS idx_fy_pages_status ON fy_pages(status);

ALTER TABLE fy_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fy_pages ENABLE ROW LEVEL SECURITY;

INSERT INTO fy_topics (cohort, name, slug, description, display_order) VALUES
  ('general', 'Settling at NHS', 'settling-at-nhs', 'Getting started and settling into NHS practice', 1),
  ('general', 'Working on-calls', 'working-on-calls', 'Guidance for on-call shifts and nights', 2),
  ('general', 'Clerking shifts', 'clerking-shifts', 'How to approach clerking and admissions', 3),
  ('general', 'Where to seek support', 'where-to-seek-support', 'Who to contact and when you need help', 4),
  ('fy1', 'Settling at NHS', 'settling-at-nhs', 'FY1-focused guidance for settling into NHS practice', 1),
  ('fy1', 'Working on-calls', 'working-on-calls', 'FY1 guidance for on-call shifts and nights', 2),
  ('fy1', 'Clerking shifts', 'clerking-shifts', 'FY1 approach to clerking and admissions', 3),
  ('fy1', 'Where to seek support', 'where-to-seek-support', 'Support routes for FY1 doctors', 4),
  ('fy2', 'Settling at NHS', 'settling-at-nhs', 'FY2-focused guidance for settling into NHS practice', 1),
  ('fy2', 'Working on-calls', 'working-on-calls', 'FY2 guidance for on-call shifts and nights', 2),
  ('fy2', 'Clerking shifts', 'clerking-shifts', 'FY2 approach to clerking and admissions', 3),
  ('fy2', 'Where to seek support', 'where-to-seek-support', 'Support routes for FY2 doctors', 4)
ON CONFLICT (cohort, slug) DO NOTHING;

COMMIT;
