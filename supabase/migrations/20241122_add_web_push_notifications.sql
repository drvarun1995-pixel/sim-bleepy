-- ============================================================================
-- WEB PUSH NOTIFICATIONS MIGRATION
-- ============================================================================
-- This migration creates tables for Web Push API notifications:
-- - user_push_subscriptions: Store browser push subscriptions
-- - user_notification_preferences: User preferences for notification types
-- - notification_logs: Track sent notifications
-- - Add target_cohorts column to events table
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Creating Web Push Notifications Tables';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 1. USER PUSH SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_info JSONB, -- {browser, os, userAgent}
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(endpoint) -- Prevent duplicate subscriptions
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON user_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON user_push_subscriptions(is_active) WHERE is_active = TRUE;

ALTER TABLE user_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions"
  ON user_push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

COMMENT ON TABLE user_push_subscriptions IS 'Stores browser push notification subscriptions for users';
COMMENT ON COLUMN user_push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN user_push_subscriptions.p256dh IS 'User public key for encryption';
COMMENT ON COLUMN user_push_subscriptions.auth IS 'Authentication secret';

-- ============================================================================
-- 2. USER NOTIFICATION PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  teaching_events BOOLEAN DEFAULT TRUE,
  bookings BOOLEAN DEFAULT TRUE,
  certificates BOOLEAN DEFAULT TRUE,
  feedback BOOLEAN DEFAULT TRUE,
  announcements BOOLEAN DEFAULT TRUE,
  leaderboard_updates BOOLEAN DEFAULT FALSE,
  quiz_reminders BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON user_notification_preferences(user_id);

ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_notification_preferences FOR ALL
  USING (auth.uid() = user_id);

COMMENT ON TABLE user_notification_preferences IS 'User preferences for push notification types';
COMMENT ON COLUMN user_notification_preferences.teaching_events IS 'Enable notifications for teaching events (reminders, updates, cancellations)';
COMMENT ON COLUMN user_notification_preferences.bookings IS 'Enable notifications for booking confirmations, reminders, cancellations';
COMMENT ON COLUMN user_notification_preferences.certificates IS 'Enable notifications when certificates are available';
COMMENT ON COLUMN user_notification_preferences.feedback IS 'Enable feedback request notifications';
COMMENT ON COLUMN user_notification_preferences.announcements IS 'Enable announcement notifications';

-- ============================================================================
-- 3. NOTIFICATION LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  status TEXT DEFAULT 'sent', -- sent, delivered, opened, failed
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- Enable RLS on notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification logs
CREATE POLICY "Users can view own notification logs"
  ON notification_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role can manage all notification logs"
  ON notification_logs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE notification_logs IS 'Tracks sent push notifications for analytics and debugging';
COMMENT ON COLUMN notification_logs.notification_type IS 'Type: event_reminder, event_update, event_cancellation, booking_reminder, certificate_available, feedback_request, announcement';
COMMENT ON COLUMN notification_logs.status IS 'Status: sent, delivered, opened, failed';

-- ============================================================================
-- 4. ADD TARGET_COHORTS TO EVENTS TABLE
-- ============================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS target_cohorts TEXT[];
COMMENT ON COLUMN events.target_cohorts IS 'Array of target cohort identifiers (e.g., ["ARU Year 4", "UCL Year 6", "Foundation Year 1"]). If empty, no push notifications are sent.';

-- ============================================================================
-- 5. TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_push_subscriptions_updated_at
  BEFORE UPDATE ON user_push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Web Push Notifications Migration Complete';
  RAISE NOTICE '========================================';
END $$;

