-- Create system_logs table for storing application logs
-- This table stores errors, warnings, and important system events

CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  stack TEXT,
  user_id UUID,
  user_email TEXT,
  api_route TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_api_route ON system_logs(api_route);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_email ON system_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- Create a composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_system_logs_level_created_at ON system_logs(level, created_at DESC);

-- Add comments
COMMENT ON TABLE system_logs IS 'Stores system logs, errors, warnings, and important events for admin viewing';
COMMENT ON COLUMN system_logs.level IS 'Log level: error, warn, info, or debug';
COMMENT ON COLUMN system_logs.message IS 'Log message';
COMMENT ON COLUMN system_logs.context IS 'Additional context data as JSON';
COMMENT ON COLUMN system_logs.stack IS 'Stack trace for errors';
COMMENT ON COLUMN system_logs.api_route IS 'API route where the log was created';
COMMENT ON COLUMN system_logs.user_id IS 'ID of the user associated with the log';
COMMENT ON COLUMN system_logs.user_email IS 'Email of the user associated with the log';

-- Enable Row Level Security (only admins can access)
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view logs
CREATE POLICY "Only admins can view system logs"
  ON system_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: System can insert logs (using service role)
-- Service role bypasses RLS, so no insert policy needed

-- Note: For inserts, use supabaseAdmin (service role) which bypasses RLS
-- This is intentional - logs should be writable by the system but readable only by admins

