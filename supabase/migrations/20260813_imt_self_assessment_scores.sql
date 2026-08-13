-- Per-user IMT self-assessment tracker (not official scoring).

CREATE TABLE IF NOT EXISTS public.imt_self_assessment_scores (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  postgraduate INTEGER NOT NULL DEFAULT 0,
  presentations INTEGER NOT NULL DEFAULT 0,
  publications INTEGER NOT NULL DEFAULT 0,
  teaching_experience INTEGER NOT NULL DEFAULT 0,
  training_in_teaching INTEGER NOT NULL DEFAULT 0,
  qi INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.imt_self_assessment_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages imt self assessment scores" ON public.imt_self_assessment_scores;

CREATE POLICY "Service role manages imt self assessment scores"
  ON public.imt_self_assessment_scores
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.imt_self_assessment_scores IS 'Saved IMT self-assessment point picker under Others, not official scoring.';
