-- Check the complete policy conditions to see which roles are allowed
SELECT 
    policyname,
    cmd,
    roles,
    -- Show the complete USING clause
    CASE 
        WHEN qual IS NOT NULL THEN qual
        ELSE 'No USING clause'
    END as using_clause,
    -- Show the complete WITH CHECK clause  
    CASE 
        WHEN with_check IS NOT NULL THEN with_check
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'events'
  AND policyname LIKE 'Authenticated users%'
ORDER BY cmd;

-- Check if meded_team is specifically mentioned in any policy
SELECT 
    'meded_team check' as description,
    COUNT(*) as policies_mentioning_meded_team
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'Authenticated users%'
  AND (
    with_check LIKE '%meded_team%' 
    OR qual LIKE '%meded_team%'
  );

