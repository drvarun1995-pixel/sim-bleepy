-- Add Basildon-Only cohort to Foundation Year topics
ALTER TABLE fy_topics DROP CONSTRAINT IF EXISTS fy_topics_cohort_check;
ALTER TABLE fy_topics
  ADD CONSTRAINT fy_topics_cohort_check
  CHECK (cohort IN ('general', 'basildon', 'fy1', 'fy2'));
