-- Graduate existing 25-26 learners (no emails)
-- Run in Supabase SQL editor AFTER 20260813_year_progression.sql
-- (needs academic_status / academic_cohort / stage history / audit tables).
--
-- What this does:
--   1. Labels student learners as cohort 25-26 (does not change year / university).
--   2. Sets academic_status = graduated for those students.
--   3. Leaves VT NHS (varun.tyagi@nhs.net) and Shantanu Chopde ACTIVE in 25-26.
--   4. Does not touch admin, meded_team, or ctf.
--   5. Writes stage history + audit with emails_suppressed = true.
--   6. Cancels the auto "Progress existing 25-26 learners" job so cron cannot
--      year-bump the two keepers.
--
-- Does NOT send graduate or reminder emails.

BEGIN;

-- ---------------------------------------------------------------------------
-- Keepers (stay active in 25-26)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE keepers ON COMMIT DROP AS
SELECT id, email, name, role
FROM public.users
WHERE
  lower(email) = 'varun.tyagi@nhs.net'
  OR lower(coalesce(name, '')) LIKE '%vt nhs%'
  OR lower(coalesce(name, '')) LIKE '%shantanu%chopde%'
  OR lower(coalesce(email, '')) LIKE '%chopde%';

-- ---------------------------------------------------------------------------
-- Students to graduate (everyone else with role = student)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE to_graduate ON COMMIT DROP AS
SELECT u.id, u.email, u.name, u.role, u.role_type, u.university, u.study_year,
       u.foundation_year, u.academic_status, u.academic_cohort
FROM public.users u
WHERE u.role = 'student'
  AND COALESCE(u.academic_status, 'active') IS DISTINCT FROM 'graduated'
  AND NOT EXISTS (SELECT 1 FROM keepers k WHERE k.id = u.id);

-- Preview keepers (visible in Results)
SELECT 'KEEPER — stay active 25-26' AS action, id, email, name, role
FROM keepers
ORDER BY name;

-- Sanity: keepers must not be in the graduate set
DO $$
DECLARE
  keeper_count INTEGER;
  graduate_count INTEGER;
BEGIN
  SELECT count(*) INTO keeper_count FROM keepers;
  SELECT count(*) INTO graduate_count FROM to_graduate;

  RAISE NOTICE 'Keepers (stay active): %', keeper_count;
  RAISE NOTICE 'Students to graduate: %', graduate_count;

  IF keeper_count < 2 THEN
    RAISE EXCEPTION 'Expected at least 2 keepers (VT NHS, Shantanu Chopde). Found %. Aborting. Check the keepers preview.', keeper_count;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Keepers: 25-26 + active
-- ---------------------------------------------------------------------------
UPDATE public.users u
SET
  academic_cohort = '25-26',
  academic_status = 'active',
  updated_at = NOW()
FROM keepers k
WHERE u.id = k.id
  AND u.role = 'student';

-- ---------------------------------------------------------------------------
-- 2. Other students: 25-26 + graduated (profile year/uni unchanged)
-- ---------------------------------------------------------------------------
UPDATE public.users u
SET
  academic_cohort = '25-26',
  academic_status = 'graduated',
  academic_status_changed_at = NOW(),
  last_progressed_at = NOW(),
  updated_at = NOW()
FROM to_graduate g
WHERE u.id = g.id
  AND u.academic_status IS DISTINCT FROM 'graduated';

-- ---------------------------------------------------------------------------
-- 3. Stage history — keepers (open active row if none)
-- ---------------------------------------------------------------------------
INSERT INTO public.user_stage_history (
  user_id, academic_cohort, academic_status, role_type, university, study_year,
  foundation_year, stage_label, started_at, source
)
SELECT
  u.id,
  '25-26',
  'active',
  u.role_type,
  u.university,
  u.study_year,
  u.foundation_year,
  CASE
    WHEN u.role_type = 'foundation_doctor' OR u.foundation_year IN ('FY1', 'FY2')
      THEN COALESCE(u.foundation_year, 'Foundation Year')
    WHEN u.university IS NOT NULL AND u.study_year IS NOT NULL
      THEN u.university || ' Year ' || u.study_year
    WHEN u.university IS NOT NULL
      THEN u.university || ' student'
    ELSE 'Learner'
  END,
  NOW(),
  'backfill'
FROM public.users u
JOIN keepers k ON k.id = u.id
WHERE u.role = 'student'
  AND NOT EXISTS (
  SELECT 1 FROM public.user_stage_history h
  WHERE h.user_id = u.id AND h.ended_at IS NULL
);

-- ---------------------------------------------------------------------------
-- 4. Stage history — graduates (close open row, open graduated row)
-- ---------------------------------------------------------------------------
UPDATE public.user_stage_history h
SET ended_at = NOW()
WHERE h.ended_at IS NULL
  AND h.user_id IN (SELECT id FROM to_graduate);

INSERT INTO public.user_stage_history (
  user_id, academic_cohort, academic_status, role_type, university, study_year,
  foundation_year, stage_label, started_at, source
)
SELECT
  u.id,
  '25-26',
  'graduated',
  u.role_type,
  u.university,
  u.study_year,
  u.foundation_year,
  CASE
    WHEN u.role_type = 'foundation_doctor' OR u.foundation_year IN ('FY1', 'FY2')
      THEN COALESCE(u.foundation_year, 'Foundation Year') || ' (graduated)'
    WHEN u.university IS NOT NULL AND u.study_year IS NOT NULL
      THEN u.university || ' Year ' || u.study_year || ' (graduated)'
    WHEN u.university IS NOT NULL
      THEN u.university || ' student (graduated)'
    ELSE 'Learner (graduated)'
  END,
  NOW(),
  'sql_graduate_25_26'
FROM public.users u
JOIN to_graduate g ON g.id = u.id;

-- ---------------------------------------------------------------------------
-- 5. Audit (emails suppressed — no mail will be sent from this)
-- ---------------------------------------------------------------------------
INSERT INTO public.progression_audit_log (
  user_id, action, from_snapshot, to_snapshot, emails_suppressed,
  reminder_due_at, source, notes
)
SELECT
  u.id,
  'graduate',
  jsonb_build_object(
    'academic_status', COALESCE(g.academic_status, 'active'),
    'academic_cohort', COALESCE(g.academic_cohort, '25-26'),
    'role_type', g.role_type,
    'university', g.university,
    'study_year', g.study_year,
    'foundation_year', g.foundation_year
  ),
  jsonb_build_object(
    'academic_status', 'graduated',
    'academic_cohort', '25-26',
    'role_type', u.role_type,
    'university', u.university,
    'study_year', u.study_year,
    'foundation_year', u.foundation_year,
    'stage_label', 'graduated'
  ),
  TRUE,
  NULL,
  'sql',
  'Bulk graduate 25-26. Emails suppressed. Keepers: VT NHS, Shantanu Chopde.'
FROM public.users u
JOIN to_graduate g ON g.id = u.id;

-- ---------------------------------------------------------------------------
-- 6. Skip exceptions for keepers + cancel auto year-bump job
-- ---------------------------------------------------------------------------
INSERT INTO public.progression_exceptions (user_id, exception_type, reason)
SELECT k.id, 'skip', 'Keeper — do not auto-progress 25-26'
FROM keepers k
WHERE k.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM public.progression_exceptions e
    WHERE e.user_id = k.id AND e.exception_type = 'skip' AND e.expires_at IS NULL
  );

UPDATE public.progression_schedules
SET
  status = 'cancelled',
  notes = COALESCE(notes, '') || ' Cancelled after bulk graduate of 25-26 (keepers remain active).',
  updated_at = NOW()
WHERE name = 'Progress existing 25-26 learners'
  AND status IN ('draft', 'scheduled', 'applying');

COMMIT;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
SELECT academic_status, count(*) 
FROM public.users
WHERE role = 'student'
GROUP BY academic_status
ORDER BY academic_status;

SELECT name, email, role, academic_cohort, academic_status
FROM public.users
WHERE
  lower(email) = 'varun.tyagi@nhs.net'
  OR lower(coalesce(name, '')) LIKE '%vt nhs%'
  OR lower(coalesce(name, '')) LIKE '%shantanu%chopde%'
  OR lower(coalesce(email, '')) LIKE '%chopde%'
ORDER BY name;
