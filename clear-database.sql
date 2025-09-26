-- Clear all user data from Supabase database
-- WARNING: This will delete ALL user data permanently

-- Delete email verification tokens
DELETE FROM email_verification_tokens;

-- Delete password reset tokens (if they exist)
DELETE FROM password_reset_tokens;

-- Delete user sessions (if they exist)
DELETE FROM user_sessions;

-- Delete all users
DELETE FROM users;

-- Reset any auto-increment sequences (if applicable)
-- Note: Supabase uses UUIDs, so this may not be necessary

-- Verify tables are empty
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'email_verification_tokens' as table_name, COUNT(*) as row_count FROM email_verification_tokens
UNION ALL
SELECT 'password_reset_tokens' as table_name, COUNT(*) as row_count FROM password_reset_tokens
UNION ALL
SELECT 'user_sessions' as table_name, COUNT(*) as row_count FROM user_sessions;
