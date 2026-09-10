-- ============================================================================
-- Repeating events: series table + link columns on events
-- Paste into the Supabase SQL editor and run once.
-- Do not recreate events_with_details. The app reads series fields from events.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'fortnightly', 'monthly')),
  interval INTEGER NOT NULL DEFAULT 1,
  until_date DATE,
  occurrence_count INTEGER,
  skip_weekends BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.event_series IS
  'Rule used when creating a repeating teaching series. Each date is a normal events row.';

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.event_series(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS series_index INTEGER;

CREATE INDEX IF NOT EXISTS idx_events_series_id
  ON public.events (series_id)
  WHERE series_id IS NOT NULL;

COMMENT ON COLUMN public.events.series_id IS
  'Shared id for repeating copies of the same teaching session. NULL = standalone event.';
COMMENT ON COLUMN public.events.series_index IS
  '1-based position of this date inside the series.';

ALTER TABLE public.event_series ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE 'Repeating events SQL applied. New events can now store series_id / series_index.';
END $$;
