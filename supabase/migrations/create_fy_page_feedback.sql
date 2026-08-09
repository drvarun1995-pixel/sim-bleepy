-- Foundation Year article helpfulness feedback
BEGIN;

CREATE TABLE IF NOT EXISTS fy_page_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES fy_pages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  helpful BOOLEAN NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (page_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fy_page_feedback_page_id ON fy_page_feedback(page_id);
CREATE INDEX IF NOT EXISTS idx_fy_page_feedback_helpful ON fy_page_feedback(helpful);

ALTER TABLE fy_page_feedback ENABLE ROW LEVEL SECURITY;

COMMIT;
