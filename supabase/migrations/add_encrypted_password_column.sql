-- Add encrypted_value column to platform_settings table
-- This allows storing the password in reversible encrypted format for admin viewing
-- while keeping the bcrypt hash for verification

ALTER TABLE platform_settings 
ADD COLUMN IF NOT EXISTS encrypted_value TEXT;

COMMENT ON COLUMN platform_settings.encrypted_value IS 'Encrypted password stored in reversible format for admin viewing. The setting_value column contains the bcrypt hash for verification.';

