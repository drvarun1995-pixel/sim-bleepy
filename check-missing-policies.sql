-- Check which policies were created and which might be missing
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(cmd, ', ') as operations
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'Authenticated users%'
GROUP BY tablename
ORDER BY tablename;

-- Check if resources table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'resources') 
        THEN '✅ Resources table EXISTS'
        ELSE '❌ Resources table MISSING'
    END as resources_status;

-- Expected policy counts:
-- events: 3 (INSERT, UPDATE, DELETE)
-- categories: 3 (INSERT, UPDATE, DELETE)  
-- formats: 3 (INSERT, UPDATE, DELETE)
-- locations: 3 (INSERT, UPDATE, DELETE)
-- organizers: 3 (INSERT, UPDATE, DELETE)
-- speakers: 3 (INSERT, UPDATE, DELETE)
-- event_categories: 2 (INSERT, DELETE)
-- event_locations: 2 (INSERT, DELETE)
-- event_organizers: 2 (INSERT, DELETE)
-- event_speakers: 2 (INSERT, DELETE)
-- resources: 3 (INSERT, UPDATE, DELETE) - IF EXISTS
-- Total: 30-33 policies












