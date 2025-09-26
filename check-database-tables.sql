-- Check what tables exist in your Supabase database
-- Run this first to see the actual table structure

-- Check all tables in the public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if specific tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as users_table;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as email_verification_tokens_table;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as password_reset_tokens_table;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as user_sessions_table;

-- Check row counts for existing tables
SELECT 
    'users' as table_name, 
    COUNT(*) as row_count 
FROM users
UNION ALL
SELECT 
    'email_verification_tokens' as table_name, 
    COUNT(*) as row_count 
FROM email_verification_tokens
UNION ALL
SELECT 
    'password_reset_tokens' as table_name, 
    COUNT(*) as row_count 
FROM password_reset_tokens
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public');
