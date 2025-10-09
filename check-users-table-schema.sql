-- Check current users table schema
-- This script will show us what columns already exist in the users table

-- Check if users table exists and get its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if role column already exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role'
        ) 
        THEN 'Role column EXISTS' 
        ELSE 'Role column does NOT exist' 
    END as role_column_status;

-- Check current constraints on users table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users';

-- Check if there are any existing indexes on users table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'users';