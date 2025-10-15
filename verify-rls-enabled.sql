-- ============================================================================
-- VERIFY RLS ENABLED ON ALL TABLES
-- ============================================================================
-- This script verifies that RLS is properly enabled on all required tables
-- and that each table has the necessary policies
--
-- Run this after applying the RLS security fixes
-- ============================================================================

-- Show header
SELECT '========================================' as "Verification Report";
SELECT 'RLS Status for All Tables' as "Report Type";
SELECT NOW() as "Generated At";
SELECT '========================================' as "Separator";

-- ============================================================================
-- MAIN VERIFICATION QUERY
-- ============================================================================
-- Shows RLS status and policy count for all required tables

SELECT 
    t.schemaname as "Schema",
    t.tablename as "Table Name",
    CASE 
        WHEN t.rowsecurity THEN '✅ Enabled'
        ELSE '❌ DISABLED'
    END as "RLS Status",
    (
        SELECT COUNT(*)
        FROM pg_policies p
        WHERE p.schemaname = t.schemaname 
        AND p.tablename = t.tablename
    ) as "Policy Count",
    CASE 
        WHEN t.rowsecurity AND (
            SELECT COUNT(*)
            FROM pg_policies p
            WHERE p.schemaname = t.schemaname 
            AND p.tablename = t.tablename
        ) > 0 THEN '✅ OK'
        WHEN NOT t.rowsecurity THEN '❌ RLS DISABLED'
        ELSE '⚠️  NO POLICIES'
    END as "Status"
FROM pg_tables t
WHERE t.schemaname = 'public'
    AND t.tablename IN (
        -- Events system
        'events', 'categories', 'formats', 'locations', 'organizers', 'speakers',
        -- Junction tables
        'event_speakers', 'event_locations', 'event_organizers', 'event_categories',
        -- Resources and communication
        'resources', 'contact_messages', 'announcements',
        -- Other
        'stations', 'achievements',
        -- Gamification
        'user_levels', 'user_achievements', 'user_skills', 'user_streaks', 
        'xp_transactions', 'user_preferences'
    )
ORDER BY 
    CASE 
        WHEN NOT t.rowsecurity THEN 1
        WHEN (SELECT COUNT(*) FROM pg_policies p WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename) = 0 THEN 2
        ELSE 3
    END,
    t.tablename;

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================

SELECT '========================================' as "Summary";

SELECT 
    COUNT(*) as "Total Tables Checked",
    SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) as "Tables with RLS Enabled",
    SUM(CASE WHEN NOT rowsecurity THEN 1 ELSE 0 END) as "Tables with RLS DISABLED"
FROM pg_tables t
WHERE t.schemaname = 'public'
    AND t.tablename IN (
        'events', 'categories', 'formats', 'locations', 'organizers', 'speakers',
        'event_speakers', 'event_locations', 'event_organizers', 'event_categories',
        'resources', 'contact_messages', 'announcements', 'stations',
        'achievements', 'user_levels', 'user_achievements', 'user_skills', 
        'user_streaks', 'xp_transactions', 'user_preferences'
    );

-- ============================================================================
-- POLICY DETAILS
-- ============================================================================

SELECT '========================================' as "Policy Details";

SELECT 
    schemaname as "Schema",
    tablename as "Table",
    policyname as "Policy Name",
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
        ELSE cmd::text
    END as "Command",
    CASE 
        WHEN policyname LIKE '%Service role%' THEN '✅ Service Role'
        WHEN policyname LIKE '%Public%' THEN '📖 Public Read'
        ELSE '👤 User Policy'
    END as "Policy Type"
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'events', 'categories', 'formats', 'locations', 'organizers', 'speakers',
        'event_speakers', 'event_locations', 'event_organizers', 'event_categories',
        'resources', 'contact_messages', 'announcements', 'stations',
        'achievements', 'user_levels', 'user_achievements', 'user_skills', 
        'user_streaks', 'xp_transactions', 'user_preferences'
    )
ORDER BY tablename, policyname;

-- ============================================================================
-- VIEWS VERIFICATION
-- ============================================================================

SELECT '========================================' as "Views Status";

SELECT 
    viewname as "View Name",
    viewowner as "Owner",
    '✅ Exists' as "Status"
FROM pg_views
WHERE schemaname = 'public'
    AND viewname IN ('events_with_details', 'categories_with_counts', 'formats_with_counts')
ORDER BY viewname;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================

SELECT '========================================' as "Expected Results";
SELECT 'Total Tables: 21' as "Expectation";
SELECT 'Tables with RLS Enabled: 21' as "Expectation";
SELECT 'Tables with RLS DISABLED: 0' as "Expectation";
SELECT 'Minimum Policies: 21 (one per table)' as "Expectation";
SELECT 'Views: 3 (all should exist)' as "Expectation";
SELECT '========================================' as "End of Report";

-- ============================================================================
-- TROUBLESHOOTING QUERIES
-- ============================================================================
-- Uncomment these if you need to troubleshoot specific issues

-- Find tables missing RLS:
-- SELECT tablename 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND rowsecurity = false
--   AND tablename IN ('events', 'categories', 'formats', ...);

-- Find tables without policies:
-- SELECT t.tablename
-- FROM pg_tables t
-- WHERE t.schemaname = 'public'
--   AND NOT EXISTS (
--     SELECT 1 FROM pg_policies p 
--     WHERE p.schemaname = t.schemaname 
--     AND p.tablename = t.tablename
--   )
--   AND t.tablename IN ('events', 'categories', 'formats', ...);

-- Show full policy definitions:
-- SELECT schemaname, tablename, policyname, 
--        pg_get_expr(qual, (schemaname||'.'||tablename)::regclass) as using_expression,
--        pg_get_expr(with_check, (schemaname||'.'||tablename)::regclass) as with_check_expression
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

