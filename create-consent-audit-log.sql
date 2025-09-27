-- Create consent audit log table for GDPR compliance
-- This table tracks all consent changes and data access for audit purposes

CREATE TABLE IF NOT EXISTS consent_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL, -- e.g., 'consent_preferences_updated', 'data_exported', 'account_deleted'
  old_values JSONB, -- Previous consent values (optional)
  new_values JSONB, -- New consent values
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT fk_consent_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consent_audit_user_id ON consent_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_timestamp ON consent_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_consent_audit_action ON consent_audit_log(action);

-- Enable Row Level Security
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for audit log access
-- Users can only see their own audit logs
CREATE POLICY "Users can view their own audit logs" ON consent_audit_log
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs" ON consent_audit_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON consent_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email' 
      AND users.email = ANY(string_to_array(current_setting('app.settings.admin_emails', true), ','))
    )
  );

-- Grant permissions
GRANT SELECT ON consent_audit_log TO authenticated;
GRANT INSERT ON consent_audit_log TO service_role;

-- Create a function to automatically log consent changes
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change if marketing_consent or analytics_consent changed
  IF (OLD.marketing_consent IS DISTINCT FROM NEW.marketing_consent) OR 
     (OLD.analytics_consent IS DISTINCT FROM NEW.analytics_consent) OR
     (OLD.consent_version IS DISTINCT FROM NEW.consent_version) THEN
    
    INSERT INTO consent_audit_log (
      user_id,
      action,
      old_values,
      new_values,
      timestamp
    ) VALUES (
      NEW.id,
      'consent_preferences_updated',
      jsonb_build_object(
        'marketing_consent', OLD.marketing_consent,
        'analytics_consent', OLD.analytics_consent,
        'consent_version', OLD.consent_version
      ),
      jsonb_build_object(
        'marketing_consent', NEW.marketing_consent,
        'analytics_consent', NEW.analytics_consent,
        'consent_version', NEW.consent_version
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log consent changes
DROP TRIGGER IF EXISTS trigger_log_consent_change ON users;
CREATE TRIGGER trigger_log_consent_change
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_consent_change();

-- Create a function to log data access events
CREATE OR REPLACE FUNCTION log_data_access(
  p_user_id UUID,
  p_action VARCHAR(100),
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO consent_audit_log (
    user_id,
    action,
    new_values,
    timestamp
  ) VALUES (
    p_user_id,
    p_action,
    p_details,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the logging function
GRANT EXECUTE ON FUNCTION log_data_access(UUID, VARCHAR(100), JSONB) TO service_role;

-- Add comments for documentation
COMMENT ON TABLE consent_audit_log IS 'Audit log for GDPR compliance - tracks all consent changes and data access';
COMMENT ON COLUMN consent_audit_log.action IS 'Type of action: consent_preferences_updated, data_exported, account_deleted, etc.';
COMMENT ON COLUMN consent_audit_log.old_values IS 'Previous consent values (JSON)';
COMMENT ON COLUMN consent_audit_log.new_values IS 'New consent values (JSON)';
COMMENT ON FUNCTION log_data_access IS 'Function to log data access events for GDPR audit trail';
