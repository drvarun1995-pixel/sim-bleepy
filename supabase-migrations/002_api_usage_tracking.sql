-- API Usage Tracking Schema
-- This table tracks real-time API usage for cost monitoring and analytics

CREATE TABLE IF NOT EXISTS api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('hume', 'openai')),
  service TEXT NOT NULL CHECK (service IN ('asr', 'tts', 'chat', 'embeddings', 'emotion')),
  tokens_used INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  cost_gbp DECIMAL(10,4) NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_session_id ON api_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON api_usage(provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage(service);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_cost ON api_usage(cost_gbp);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_api_usage_session_provider_service ON api_usage(session_id, provider, service);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_provider ON api_usage(created_at, provider);

-- RLS Policies
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Students can only see their own usage
CREATE POLICY "Students can view own api usage" ON api_usage
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

-- Educators can see usage for their cohorts
CREATE POLICY "Educators can view cohort api usage" ON api_usage
  FOR SELECT USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN cohort_members cm ON s.user_id = cm.user_id
      JOIN cohorts c ON cm.cohort_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- Admins can see all usage
CREATE POLICY "Admins can view all api usage" ON api_usage
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to get usage summary
CREATE OR REPLACE FUNCTION get_usage_summary(
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL,
  target_session_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_cost', COALESCE(SUM(cost_gbp), 0),
    'total_tokens', COALESCE(SUM(tokens_used), 0),
    'total_duration', COALESCE(SUM(duration_ms), 0),
    'provider_breakdown', jsonb_build_object(
      'hume', jsonb_build_object(
        'cost', COALESCE(SUM(CASE WHEN provider = 'hume' THEN cost_gbp ELSE 0 END), 0),
        'tokens', COALESCE(SUM(CASE WHEN provider = 'hume' THEN tokens_used ELSE 0 END), 0),
        'duration', COALESCE(SUM(CASE WHEN provider = 'hume' THEN duration_ms ELSE 0 END), 0)
      ),
      'openai', jsonb_build_object(
        'cost', COALESCE(SUM(CASE WHEN provider = 'openai' THEN cost_gbp ELSE 0 END), 0),
        'tokens', COALESCE(SUM(CASE WHEN provider = 'openai' THEN tokens_used ELSE 0 END), 0),
        'duration', COALESCE(SUM(CASE WHEN provider = 'openai' THEN duration_ms ELSE 0 END), 0)
      )
    ),
    'service_breakdown', jsonb_build_object(
      'asr', jsonb_build_object(
        'cost', COALESCE(SUM(CASE WHEN service = 'asr' THEN cost_gbp ELSE 0 END), 0),
        'duration', COALESCE(SUM(CASE WHEN service = 'asr' THEN duration_ms ELSE 0 END), 0)
      ),
      'tts', jsonb_build_object(
        'cost', COALESCE(SUM(CASE WHEN service = 'tts' THEN cost_gbp ELSE 0 END), 0),
        'duration', COALESCE(SUM(CASE WHEN service = 'tts' THEN duration_ms ELSE 0 END), 0)
      ),
      'chat', jsonb_build_object(
        'cost', COALESCE(SUM(CASE WHEN service = 'chat' THEN cost_gbp ELSE 0 END), 0),
        'tokens', COALESCE(SUM(CASE WHEN service = 'chat' THEN tokens_used ELSE 0 END), 0)
      ),
      'embeddings', jsonb_build_object(
        'cost', COALESCE(SUM(CASE WHEN service = 'embeddings' THEN cost_gbp ELSE 0 END), 0),
        'tokens', COALESCE(SUM(CASE WHEN service = 'embeddings' THEN tokens_used ELSE 0 END), 0)
      ),
      'emotion', jsonb_build_object(
        'cost', COALESCE(SUM(CASE WHEN service = 'emotion' THEN cost_gbp ELSE 0 END), 0),
        'tokens', COALESCE(SUM(CASE WHEN service = 'emotion' THEN tokens_used ELSE 0 END), 0)
      )
    )
  ) INTO result
  FROM api_usage
  WHERE (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date)
    AND (target_session_id IS NULL OR session_id = target_session_id);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get real-time metrics
CREATE OR REPLACE FUNCTION get_realtime_metrics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH recent_usage AS (
    SELECT COUNT(*) as active_sessions, SUM(cost_gbp) as current_cost
    FROM api_usage
    WHERE created_at >= NOW() - INTERVAL '1 minute'
  ),
  daily_usage AS (
    SELECT SUM(cost_gbp) as daily_cost
    FROM api_usage
    WHERE created_at >= NOW() - INTERVAL '1 day'
  )
  SELECT jsonb_build_object(
    'active_sessions', COALESCE(recent_usage.active_sessions, 0),
    'current_cost_per_minute', COALESCE(recent_usage.current_cost, 0),
    'estimated_daily_cost', COALESCE(daily_usage.daily_cost, 0)
  ) INTO result
  FROM recent_usage, daily_usage;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_usage_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_realtime_metrics TO authenticated;
