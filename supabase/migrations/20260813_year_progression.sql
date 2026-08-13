-- Year progression & academic cohorts (Phases 1–3)
-- Existing ARU / UCL / FY learners are labelled 25-26. Year bumps are applied
-- by admin/cron (emails suppressed for that cohort). This SQL does not send mail.

BEGIN;

-- ---------------------------------------------------------------------------
-- Users: status + cohort
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS academic_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS academic_cohort TEXT,
  ADD COLUMN IF NOT EXISTS academic_status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_progressed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_academic_status_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_academic_status_check
      CHECK (academic_status IN ('active', 'intercalated', 'graduated', 'left'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_academic_status ON public.users (academic_status);
CREATE INDEX IF NOT EXISTS idx_users_academic_cohort ON public.users (academic_cohort);

-- ---------------------------------------------------------------------------
-- Academic cohorts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE,
  name TEXT,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  suppress_emails BOOLEAN NOT NULL DEFAULT FALSE,
  starts_on DATE,
  ends_on DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.academic_cohorts (label, name, is_current, suppress_emails, starts_on, ends_on, notes)
VALUES
  (
    '25-26',
    'Academic year 2025–26',
    TRUE,
    TRUE,
    '2025-09-01',
    '2026-08-31',
    'Existing learners backfilled here. Do not send automatic progression emails.'
  ),
  (
    '26-27',
    'Academic year 2026–27',
    FALSE,
    FALSE,
    '2026-09-01',
    '2027-08-31',
    NULL
  )
ON CONFLICT (label) DO UPDATE
SET
  suppress_emails = EXCLUDED.suppress_emails,
  notes = COALESCE(public.academic_cohorts.notes, EXCLUDED.notes),
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Stage history (one open row per user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  academic_cohort TEXT,
  academic_status TEXT NOT NULL DEFAULT 'active',
  role_type TEXT,
  university TEXT,
  study_year TEXT,
  foundation_year TEXT,
  stage_label TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'backfill',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_stage_history_user ON public.user_stage_history (user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_user_stage_history_open ON public.user_stage_history (user_id) WHERE ended_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stage_history_one_open
  ON public.user_stage_history (user_id)
  WHERE ended_at IS NULL;

-- ---------------------------------------------------------------------------
-- Schedules
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.progression_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cohort_label TEXT,
  next_cohort_label TEXT,
  scope TEXT NOT NULL DEFAULT 'all'
    CHECK (scope IN ('all', 'university', 'year_group', 'cohort', 'selected_users')),
  university TEXT,
  study_year TEXT,
  foundation_year TEXT,
  role_type TEXT,
  user_ids UUID[] NOT NULL DEFAULT '{}',
  recommended_action TEXT NOT NULL DEFAULT 'per_user'
    CHECK (recommended_action IN ('per_user', 'advance', 'fy1', 'graduate', 'intercalated')),
  recommended_exit_action TEXT NOT NULL DEFAULT 'graduate'
    CHECK (recommended_exit_action IN ('graduate', 'fy1', 'intercalated')),
  effective_date DATE NOT NULL,
  reminder_days_after INTEGER NOT NULL DEFAULT 14,
  suppress_emails BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'applying', 'applied', 'cancelled')),
  created_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ,
  applied_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progression_schedules_status_date
  ON public.progression_schedules (status, effective_date);

-- ---------------------------------------------------------------------------
-- Exceptions (repeat / don't bump)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.progression_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.progression_schedules (id) ON DELETE CASCADE,
  exception_type TEXT NOT NULL DEFAULT 'skip'
    CHECK (exception_type IN ('skip', 'repeat_year')),
  reason TEXT,
  created_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progression_exceptions_user ON public.progression_exceptions (user_id);

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.progression_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.progression_schedules (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  from_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  to_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  emails_suppressed BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_due_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  graduate_email_sent_at TIMESTAMPTZ,
  actor_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'admin',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progression_audit_user ON public.progression_audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progression_audit_reminder
  ON public.progression_audit_log (reminder_due_at)
  WHERE reminder_sent_at IS NULL AND emails_suppressed = FALSE;

-- ---------------------------------------------------------------------------
-- Backfill existing ARU / UCL / FY learners → cohort 25-26 (no year bump)
-- ---------------------------------------------------------------------------
UPDATE public.users
SET
  academic_cohort = '25-26',
  academic_status = COALESCE(NULLIF(academic_status, ''), 'active'),
  updated_at = NOW()
WHERE academic_cohort IS NULL
  AND (
    role_type IN ('medical_student', 'foundation_doctor')
    OR (
      role = 'student'
      AND (
        university IN ('ARU', 'UCL')
        OR foundation_year IN ('FY1', 'FY2')
      )
    )
  );

INSERT INTO public.user_stage_history (
  user_id,
  academic_cohort,
  academic_status,
  role_type,
  university,
  study_year,
  foundation_year,
  stage_label,
  started_at,
  source
)
SELECT
  u.id,
  COALESCE(u.academic_cohort, '25-26'),
  COALESCE(u.academic_status, 'active'),
  u.role_type,
  u.university,
  u.study_year,
  u.foundation_year,
  CASE
    WHEN u.role_type = 'foundation_doctor' OR u.foundation_year IN ('FY1', 'FY2')
      THEN COALESCE(u.foundation_year, 'FY')
    WHEN u.university IS NOT NULL AND u.study_year IS NOT NULL
      THEN u.university || ' Year ' || u.study_year
    WHEN u.university IS NOT NULL
      THEN u.university || ' student'
    ELSE 'Learner'
  END,
  NOW(),
  'backfill'
FROM public.users u
WHERE u.academic_cohort = '25-26'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_stage_history h
    WHERE h.user_id = u.id AND h.ended_at IS NULL
  )
  AND (
    u.role_type IN ('medical_student', 'foundation_doctor')
    OR (
      u.role = 'student'
      AND (
        u.university IN ('ARU', 'UCL')
        OR u.foundation_year IN ('FY1', 'FY2')
      )
    )
  );

-- Seed a no-email schedule so 25-26 can be progressed (year +1 / exit) without mail
INSERT INTO public.progression_schedules (
  name,
  cohort_label,
  next_cohort_label,
  scope,
  recommended_action,
  recommended_exit_action,
  effective_date,
  reminder_days_after,
  suppress_emails,
  status,
  notes
)
SELECT
  'Progress existing 25-26 learners',
  '25-26',
  '26-27',
  'cohort',
  'per_user',
  'graduate',
  CURRENT_DATE,
  14,
  TRUE,
  'scheduled',
  'Seeded for existing ARU/UCL/FY learners. Emails suppressed. Apply from Year Progression or wait for daily cron.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.progression_schedules
  WHERE cohort_label = '25-26' AND name = 'Progress existing 25-26 learners'
);

ALTER TABLE public.academic_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progression_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progression_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progression_audit_log ENABLE ROW LEVEL SECURITY;

COMMIT;
