-- Create cron_tasks table to track processed cron jobs and prevent duplication
CREATE TABLE IF NOT EXISTS cron_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL, -- 'feedback_invites' or 'certificates_auto_generate'
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- null for feedback invites (batch), set for certificates
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  run_at TIMESTAMPTZ NOT NULL, -- When the task should run (event end time)
  processed_at TIMESTAMPTZ, -- When the task was actually processed
  idempotency_key TEXT NOT NULL, -- Unique key for email sending (event_id + user_id + task_type + run_at)
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(idempotency_key)
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_cron_tasks_task_type_status_run_at ON cron_tasks(task_type, status, run_at);
CREATE INDEX IF NOT EXISTS idx_cron_tasks_event_id ON cron_tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_cron_tasks_idempotency_key ON cron_tasks(idempotency_key);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cron_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cron_tasks_updated_at
  BEFORE UPDATE ON cron_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_cron_tasks_updated_at();

-- Comments
COMMENT ON TABLE cron_tasks IS 'Tracks cron job tasks to prevent duplication and enable idempotent email sending';
COMMENT ON COLUMN cron_tasks.task_type IS 'Type of cron task: feedback_invites or certificates_auto_generate';
COMMENT ON COLUMN cron_tasks.idempotency_key IS 'Unique key for idempotency: event_id|user_id|task_type|run_at_date';
COMMENT ON COLUMN cron_tasks.run_at IS 'When the task should run (typically event end time)';
COMMENT ON COLUMN cron_tasks.processed_at IS 'When the task was actually processed by cron job';

