-- Real Basildon-Only cohort for Foundation Year
ALTER TABLE fy_topics DROP CONSTRAINT IF EXISTS fy_topics_cohort_check;
ALTER TABLE fy_topics
  ADD CONSTRAINT fy_topics_cohort_check
  CHECK (cohort IN ('general', 'basildon', 'fy1', 'fy2'));

UPDATE fy_topics
SET cohort = 'basildon', updated_at = NOW()
WHERE cohort = 'fy1'
  AND slug IN ('trust-induction', 'local-systems');
