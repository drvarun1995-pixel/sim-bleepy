-- Add GDPR consent tracking fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS consent_version VARCHAR(10) DEFAULT '1.0';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS analytics_consent BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_consent_given ON users(consent_given);
CREATE INDEX IF NOT EXISTS idx_users_consent_timestamp ON users(consent_timestamp);

-- Update existing users to have consent (assuming they consented when they signed up)
UPDATE users 
SET 
    consent_given = true,
    consent_timestamp = COALESCE(created_at, NOW()),
    consent_version = '1.0',
    marketing_consent = true,
    analytics_consent = true
WHERE consent_given IS NULL OR consent_given = false;

-- Verify the changes
SELECT 
    email,
    consent_given,
    consent_timestamp,
    consent_version,
    marketing_consent,
    analytics_consent,
    created_at
FROM users 
LIMIT 5;
