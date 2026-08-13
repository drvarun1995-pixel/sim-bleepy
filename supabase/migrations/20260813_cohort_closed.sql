-- Mark academic cohorts closed once every year-group finish date has passed.

ALTER TABLE public.academic_cohorts
  ADD COLUMN IF NOT EXISTS is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
