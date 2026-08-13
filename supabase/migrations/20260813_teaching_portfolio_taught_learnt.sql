-- Taught / Learnt teaching portfolio columns.
-- Existing rows map to Taught; titles backfilled from display_name / original_filename.

ALTER TABLE public.teaching_portfolio_files
  ADD COLUMN IF NOT EXISTS entry_kind TEXT;

ALTER TABLE public.teaching_portfolio_files
  ADD COLUMN IF NOT EXISTS session_title TEXT;

ALTER TABLE public.teaching_portfolio_files
  ADD COLUMN IF NOT EXISTS session_time TEXT;

ALTER TABLE public.teaching_portfolio_files
  ADD COLUMN IF NOT EXISTS taught_to TEXT;

ALTER TABLE public.teaching_portfolio_files
  ADD COLUMN IF NOT EXISTS learning_type TEXT;

ALTER TABLE public.teaching_portfolio_files
  ADD COLUMN IF NOT EXISTS provider TEXT;

UPDATE public.teaching_portfolio_files
SET
  entry_kind = COALESCE(NULLIF(entry_kind, ''), 'taught'),
  session_title = COALESCE(
    NULLIF(session_title, ''),
    NULLIF(display_name, ''),
    NULLIF(original_filename, ''),
    'Untitled'
  );

ALTER TABLE public.teaching_portfolio_files
  ALTER COLUMN entry_kind SET DEFAULT 'taught';

UPDATE public.teaching_portfolio_files
SET entry_kind = 'taught'
WHERE entry_kind IS NULL;

ALTER TABLE public.teaching_portfolio_files
  ALTER COLUMN entry_kind SET NOT NULL;

ALTER TABLE public.teaching_portfolio_files
  DROP CONSTRAINT IF EXISTS teaching_portfolio_files_entry_kind_check;

ALTER TABLE public.teaching_portfolio_files
  ADD CONSTRAINT teaching_portfolio_files_entry_kind_check
  CHECK (entry_kind IN ('taught', 'learnt'));

CREATE INDEX IF NOT EXISTS idx_teaching_portfolio_files_entry_kind
  ON public.teaching_portfolio_files(entry_kind);

CREATE INDEX IF NOT EXISTS idx_teaching_portfolio_files_activity_date
  ON public.teaching_portfolio_files(activity_date);

COMMENT ON COLUMN public.teaching_portfolio_files.entry_kind IS 'taught = session delivered, learnt = course or learning completed';
COMMENT ON COLUMN public.teaching_portfolio_files.session_title IS 'Teaching session or learning activity title';
COMMENT ON COLUMN public.teaching_portfolio_files.session_time IS 'Optional time of session or activity';
COMMENT ON COLUMN public.teaching_portfolio_files.taught_to IS 'Audience for taught sessions';
COMMENT ON COLUMN public.teaching_portfolio_files.learning_type IS 'Type of learnt activity: course, conference, workshop, e-learning, other';
COMMENT ON COLUMN public.teaching_portfolio_files.provider IS 'Optional provider for learnt activities';
