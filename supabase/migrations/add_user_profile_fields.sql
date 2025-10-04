-- Add user profile fields for personalized onboarding and dashboard
-- This migration adds fields to track user role, educational details, and profile completion

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_type VARCHAR(50);
-- Values: 'medical_student', 'foundation_doctor', 'clinical_fellow', 'specialty_doctor', 'registrar', 'consultant'

ALTER TABLE users ADD COLUMN IF NOT EXISTS university VARCHAR(100);
-- Values: 'ARU', 'UCL', etc.

ALTER TABLE users ADD COLUMN IF NOT EXISTS study_year VARCHAR(20);
-- Values: '1', '2', '3', '4', '5', '6' (UCL only has Year 6)

ALTER TABLE users ADD COLUMN IF NOT EXISTS foundation_year VARCHAR(10);
-- Values: 'FY1', 'FY2'

ALTER TABLE users ADD COLUMN IF NOT EXISTS hospital_trust VARCHAR(200);
-- Hospital or trust name for doctors

ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR(100);
-- Medical specialty for registrars/consultants

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
-- Whether user has completed the onboarding profile

ALTER TABLE users ADD COLUMN IF NOT EXISTS interests JSONB;
-- Array of interest categories selected by user

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;
-- Timestamp when profile was completed

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_skipped_at TIMESTAMP;
-- Last time user skipped profile completion

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_profile_prompt TIMESTAMP;
-- Last time user was prompted to complete profile

ALTER TABLE users ADD COLUMN IF NOT EXISTS show_all_events BOOLEAN DEFAULT FALSE;
-- User preference to show all events instead of filtered ones

-- Create user_preferences table for additional settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  show_all_events BOOLEAN DEFAULT FALSE,
  email_notifications BOOLEAN DEFAULT TRUE,
  weekly_digest BOOLEAN DEFAULT TRUE,
  daily_digest BOOLEAN DEFAULT TRUE,
  reminder_1hour BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);
CREATE INDEX IF NOT EXISTS idx_users_role_type ON users(role_type);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add comment to explain the purpose
COMMENT ON COLUMN users.role_type IS 'User role for personalized content filtering';
COMMENT ON COLUMN users.profile_completed IS 'Whether user has completed onboarding';
COMMENT ON COLUMN users.last_profile_prompt IS 'Last time user was prompted to complete profile (24hr reminder)';
COMMENT ON TABLE user_preferences IS 'User preferences for notifications and event display';
