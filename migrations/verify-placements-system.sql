-- =====================================================
-- VERIFY PLACEMENTS SYSTEM
-- =====================================================
-- This script verifies that the placements system is
-- properly set up with tables, data, and RLS policies
-- =====================================================

-- 1. Check if tables exist
SELECT 
    'Tables Check' as check_type,
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ PASS - All 3 tables exist'
        ELSE '❌ FAIL - Missing tables. Expected 3, found ' || COUNT(*)::text
    END as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('specialties', 'specialty_pages', 'specialty_documents');

-- 2. List all tables
SELECT 
    'Table: ' || table_name as table_info
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('specialties', 'specialty_pages', 'specialty_documents')
ORDER BY table_name;

-- 3. Check initial data
SELECT 
    'Initial Data Check' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Initial specialty exists'
        ELSE '❌ FAIL - No initial specialty found'
    END as result
FROM specialties
WHERE slug = 'rheumatology';

-- 4. Show initial specialty
SELECT 
    'Initial Specialty' as info_type,
    name,
    slug,
    description,
    is_active
FROM specialties
WHERE slug = 'rheumatology';

-- 5. Check RLS is enabled
SELECT 
    'RLS Check' as check_type,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('specialties', 'specialty_pages', 'specialty_documents')
ORDER BY tablename;

-- 6. Count policies per table
SELECT 
    'Policy Count' as check_type,
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 6 THEN '✅ PASS - Policies configured'
        ELSE '⚠️  WARNING - Expected 6 policies, found ' || COUNT(*)::text
    END as result
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('specialties', 'specialty_pages', 'specialty_documents')
GROUP BY tablename
ORDER BY tablename;

-- 7. List all policies
SELECT 
    'Policy Details' as info_type,
    tablename,
    policyname,
    cmd as operation,
    roles
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('specialties', 'specialty_pages', 'specialty_documents')
ORDER BY tablename, policyname;

-- 8. Check indexes
SELECT 
    'Index Check' as check_type,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename IN ('specialties', 'specialty_pages', 'specialty_documents')
ORDER BY tablename, indexname;

-- 9. Final summary
DO $$
DECLARE
    table_count INT;
    policy_count INT;
    specialty_count INT;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('specialties', 'specialty_pages', 'specialty_documents');
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename IN ('specialties', 'specialty_pages', 'specialty_documents');
    
    -- Count specialties
    SELECT COUNT(*) INTO specialty_count
    FROM specialties;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICATION SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables: % / 3', table_count;
    RAISE NOTICE 'Policies: % / 18 (6 per table)', policy_count;
    RAISE NOTICE 'Specialties: %', specialty_count;
    RAISE NOTICE '';
    
    IF table_count = 3 AND policy_count >= 18 AND specialty_count > 0 THEN
        RAISE NOTICE '✅ ALL CHECKS PASSED!';
        RAISE NOTICE '   System is ready to use.';
    ELSIF table_count = 3 AND specialty_count > 0 THEN
        RAISE NOTICE '⚠️  PARTIAL SETUP';
        RAISE NOTICE '   Tables exist but RLS policies may be missing.';
        RAISE NOTICE '   Run the RLS policies script if needed.';
    ELSE
        RAISE NOTICE '❌ SETUP INCOMPLETE';
        RAISE NOTICE '   Please run the initial migration script first.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

