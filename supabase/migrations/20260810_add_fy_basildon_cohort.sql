-- Optional: allow a true DB cohort value for Basildon-Only.
-- Until applied, Basildon hub content is stored under fy1 topic slugs
-- trust-induction / local-systems and presented as the Basildon-Only section.
ALTER TABLE fy_topics DROP CONSTRAINT IF EXISTS fy_topics_cohort_check;
ALTER TABLE fy_topics
  ADD CONSTRAINT fy_topics_cohort_check
  CHECK (cohort IN ('general', 'basildon', 'fy1', 'fy2'));
