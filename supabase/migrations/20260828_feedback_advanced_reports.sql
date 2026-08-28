-- Private bucket for generated advanced feedback PDFs.
-- Access is via Next.js APIs using the service role.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('feedback-reports', 'feedback-reports', false, 10485760)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.feedback_advanced_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.feedback_forms(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_advanced_reports_form_created
  ON public.feedback_advanced_reports (form_id, created_at DESC);

ALTER TABLE public.feedback_advanced_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can select feedback advanced reports" ON public.feedback_advanced_reports;
DROP POLICY IF EXISTS "Service role can insert feedback advanced reports" ON public.feedback_advanced_reports;

CREATE POLICY "Service role can select feedback advanced reports"
  ON public.feedback_advanced_reports FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert feedback advanced reports"
  ON public.feedback_advanced_reports FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
