-- Create platform_settings table to store download password and other platform-wide settings
-- This table stores settings that can be managed by admins, MedEd Team, and CTF

CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  encrypted_value TEXT, -- For storing encrypted password (reversible encryption for admin viewing)
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(setting_key);

-- Note: The download password must be set via the admin interface after deployment
-- No default password is set for security reasons

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for API routes using supabaseAdmin)
-- Authorization is handled at the API layer, not database layer
-- This matches the application's architecture pattern (NextAuth + API routes)
CREATE POLICY "Service role full access to platform_settings"
  ON platform_settings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

