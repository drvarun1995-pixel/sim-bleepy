-- Check which gamification tables exist in your database

SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public'
  AND (
    tablename LIKE '%level%' 
    OR tablename LIKE '%xp%' 
    OR tablename LIKE '%achievement%'
    OR tablename LIKE '%streak%'
    OR tablename LIKE '%skill%'
    OR tablename LIKE '%gamif%'
  )
ORDER BY tablename;





























