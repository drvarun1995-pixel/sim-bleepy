-- Debug RLS policies for events table
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'events'
  AND policyname LIKE 'Authenticated users%';

-- Check if RLS is enabled on events table
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'events';

-- Check user role and email
SELECT 
    'Current user check' as description,
    auth.jwt() ->> 'email' as jwt_email,
    (
        SELECT role 
        FROM users 
        WHERE email = auth.jwt() ->> 'email'
    ) as user_role;

