-- Multiple evidence files per teaching-portfolio session/learning entry.

CREATE TABLE IF NOT EXISTS public.teaching_portfolio_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.teaching_portfolio_files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT,
  file_size BIGINT DEFAULT 0,
  file_type TEXT,
  mime_type TEXT,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teaching_portfolio_evidence_entry_id
  ON public.teaching_portfolio_evidence(entry_id);

CREATE INDEX IF NOT EXISTS idx_teaching_portfolio_evidence_user_id
  ON public.teaching_portfolio_evidence(user_id);

ALTER TABLE public.teaching_portfolio_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages teaching portfolio evidence" ON public.teaching_portfolio_evidence;
CREATE POLICY "Service role manages teaching portfolio evidence"
  ON public.teaching_portfolio_evidence
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.teaching_portfolio_evidence IS
  'One or more evidence files for a teaching_portfolio_files session/learning row';

INSERT INTO public.teaching_portfolio_evidence (
  entry_id,
  user_id,
  filename,
  original_filename,
  file_size,
  file_type,
  mime_type,
  file_path,
  created_at
)
SELECT
  f.id,
  f.user_id,
  COALESCE(f.filename, 'evidence'),
  f.original_filename,
  COALESCE(f.file_size, 0),
  f.file_type,
  f.mime_type,
  f.file_path,
  COALESCE(f.created_at, NOW())
FROM public.teaching_portfolio_files f
WHERE f.file_path IS NOT NULL
  AND f.file_path <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.teaching_portfolio_evidence e
    WHERE e.entry_id = f.id
      AND e.file_path = f.file_path
  );
