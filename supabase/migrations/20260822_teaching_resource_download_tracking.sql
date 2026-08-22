-- Event-level tracking for Resources for Teaching.
-- Separate from public.download_tracking (study resources / /downloads).

CREATE TABLE IF NOT EXISTS public.teaching_resource_download_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES public.teaching_resources(id) ON DELETE CASCADE,
    resource_name TEXT NOT NULL,
    category TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_name TEXT,
    file_size BIGINT,
    file_type TEXT,
    download_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teaching_dl_track_resource
  ON public.teaching_resource_download_tracking(resource_id);
CREATE INDEX IF NOT EXISTS idx_teaching_dl_track_timestamp
  ON public.teaching_resource_download_tracking(download_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_teaching_dl_track_email
  ON public.teaching_resource_download_tracking(user_email);
CREATE INDEX IF NOT EXISTS idx_teaching_dl_track_category
  ON public.teaching_resource_download_tracking(category);

ALTER TABLE public.teaching_resource_download_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can select teaching download tracking" ON public.teaching_resource_download_tracking;
DROP POLICY IF EXISTS "Service role can insert teaching download tracking" ON public.teaching_resource_download_tracking;

CREATE POLICY "Service role can select teaching download tracking"
    ON public.teaching_resource_download_tracking FOR SELECT
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert teaching download tracking"
    ON public.teaching_resource_download_tracking FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.teaching_resource_download_tracking IS
  'Per-download log for Resources for Teaching. Do not mix with download_tracking (study resources).';
