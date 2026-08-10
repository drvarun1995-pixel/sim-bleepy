-- =====================================================
-- Make Basildon-Only a real FY cohort (run in Supabase SQL Editor)
-- =====================================================
-- 1) Allow cohort = 'basildon'
-- 2) Move Basildon topics/pages out of fy1 into basildon
-- =====================================================

BEGIN;

ALTER TABLE fy_topics DROP CONSTRAINT IF EXISTS fy_topics_cohort_check;
ALTER TABLE fy_topics
  ADD CONSTRAINT fy_topics_cohort_check
  CHECK (cohort IN ('general', 'basildon', 'fy1', 'fy2'));

-- Move reserved Basildon topics from fy1 → basildon (if present)
UPDATE fy_topics
SET
  cohort = 'basildon',
  updated_at = NOW()
WHERE cohort = 'fy1'
  AND slug IN ('trust-induction', 'local-systems');

-- Ensure Basildon topic shells exist even if missing
INSERT INTO fy_topics (cohort, name, slug, description, display_order, is_active)
SELECT
  'basildon',
  v.name,
  v.slug,
  v.description,
  v.display_order,
  true
FROM (
  VALUES
    ('Trust induction', 'trust-induction', 'Members-only Basildon Hospital starter induction', 1),
    ('Local systems', 'local-systems', 'Trust-specific systems and local guidance', 2)
) AS v(name, slug, description, display_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM fy_topics t
  WHERE t.cohort = 'basildon'
    AND t.slug = v.slug
);

COMMIT;

-- Quick verify:
-- SELECT cohort, slug, name, is_active FROM fy_topics WHERE cohort = 'basildon' ORDER BY display_order;
-- SELECT p.slug, t.cohort, t.slug AS topic
-- FROM fy_pages p JOIN fy_topics t ON t.id = p.topic_id
-- WHERE p.slug = 'trust-induction-basildon-hospital';
