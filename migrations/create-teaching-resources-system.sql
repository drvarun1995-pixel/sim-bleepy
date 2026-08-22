-- Resources for Teaching: staff-only media library (CTF / MedEd / educator / admin).
-- Access is enforced in Next.js APIs. RLS is service-role only so PostgREST cannot leak files.
-- Run this in the Supabase SQL editor if the supabase/migrations file has not been applied.

CREATE TABLE IF NOT EXISTS public.teaching_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (
      category IN (
        'ppt-files',
        'graphic-templates',
        'clinical-sounds',
        'sound-effects',
        'photos'
      )
    ),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    preview_path TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    tags_text TEXT NOT NULL DEFAULT '',
    license_source TEXT NOT NULL DEFAULT 'envato',
    license_note TEXT NOT NULL DEFAULT 'Licensed to Bleepy via Envato. For teaching use on Bleepy only — do not redistribute outside the platform.',
    source_url TEXT,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    uploaded_by_name TEXT,
    download_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teaching_resources_category
  ON public.teaching_resources(category);
CREATE INDEX IF NOT EXISTS idx_teaching_resources_active_created
  ON public.teaching_resources(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teaching_resources_uploaded_by
  ON public.teaching_resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_teaching_resources_tags
  ON public.teaching_resources USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_teaching_resources_search
  ON public.teaching_resources (title, file_name, tags_text);

ALTER TABLE public.teaching_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can select teaching resources" ON public.teaching_resources;
DROP POLICY IF EXISTS "Service role can insert teaching resources" ON public.teaching_resources;
DROP POLICY IF EXISTS "Service role can update teaching resources" ON public.teaching_resources;
DROP POLICY IF EXISTS "Service role can delete teaching resources" ON public.teaching_resources;

CREATE POLICY "Service role can select teaching resources"
    ON public.teaching_resources FOR SELECT
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert teaching resources"
    ON public.teaching_resources FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update teaching resources"
    ON public.teaching_resources FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete teaching resources"
    ON public.teaching_resources FOR DELETE
    USING (auth.role() = 'service_role');

COMMENT ON TABLE public.teaching_resources IS
  'Staff teaching media library (PPT, templates, clinical sounds, SFX, photos). Hidden from search engines; staff-only via API.';

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('teaching-resources', 'teaching-resources', false, 52428800)
ON CONFLICT (id) DO NOTHING;
