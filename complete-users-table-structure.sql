-- COMPLETE USERS TABLE STRUCTURE FOR SIM-BLEEPY
-- This recreates the exact users table structure that was deleted

-- Create users table with ALL fields
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    password_hash VARCHAR(255) NOT NULL,
    auth_provider VARCHAR(50) DEFAULT 'email',
    email_verified BOOLEAN DEFAULT FALSE,
    must_change_password BOOLEAN DEFAULT FALSE,
    admin_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Profile fields
    role_type VARCHAR(50),
    university VARCHAR(100),
    study_year VARCHAR(20),
    foundation_year VARCHAR(10),
    hospital_trust VARCHAR(200),
    specialty VARCHAR(100),
    interests JSONB,
    profile_completed BOOLEAN DEFAULT FALSE,
    show_all_events BOOLEAN DEFAULT FALSE,
    
    -- Consent fields
    consent_given BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP WITH TIME ZONE,
    consent_version VARCHAR(10) DEFAULT '1.0',
    marketing_consent BOOLEAN DEFAULT FALSE,
    analytics_consent BOOLEAN DEFAULT FALSE,
    
    -- Profile completion tracking
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    profile_skipped_at TIMESTAMP WITH TIME ZONE,
    last_profile_prompt TIMESTAMP WITH TIME ZONE
);

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    show_all_events BOOLEAN DEFAULT FALSE,
    email_notifications BOOLEAN DEFAULT TRUE,
    weekly_digest BOOLEAN DEFAULT TRUE,
    daily_digest BOOLEAN DEFAULT TRUE,
    reminder_1hour BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_verification_tokens" ON email_verification_tokens FOR ALL USING (true);
CREATE POLICY "Allow all operations on password_reset_tokens" ON password_reset_tokens FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_preferences" ON user_preferences FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);
CREATE INDEX IF NOT EXISTS idx_users_role_type ON users(role_type);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'USERS TABLE STRUCTURE RECREATED SUCCESSFULLY!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Created tables: users, email_verification_tokens, password_reset_tokens, user_preferences';
  RAISE NOTICE 'Created indexes and RLS policies';
  RAISE NOTICE '=====================================================';
END $$;


