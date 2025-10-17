-- Check if policies exist for all required tables
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(cmd, ', ') as operations
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'Authenticated users%'
GROUP BY tablename
ORDER BY tablename;

-- Check if meded_team is in policies for organizers table specifically
SELECT 
    'organizers table policies' as description,
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'organizers'
  AND policyname LIKE 'Authenticated users%';












