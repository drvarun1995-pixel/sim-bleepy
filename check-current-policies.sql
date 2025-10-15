-- Check current RLS policies for events table
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'events'
  AND policyname LIKE 'Authenticated users%'
ORDER BY cmd;

-- Check if meded role is still in policies
SELECT 
    'Current policies check' as description,
    COUNT(*) as total_policies,
    STRING_AGG(DISTINCT 
        CASE 
            WHEN with_check LIKE '%meded%' THEN 'meded_included'
            WHEN with_check LIKE '%meded_team%' THEN 'meded_team_included'
            ELSE 'other'
        END, ', '
    ) as role_coverage
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'Authenticated users%'
  AND tablename = 'events';

