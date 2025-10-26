-- ============================================================================
-- FIX ANNOUNCEMENTS RLS POLICIES
-- ============================================================================
-- This script fixes the RLS policies for the announcements system to ensure
-- proper access for different user roles and the service role
-- ============================================================================

-- ============================================================================
-- 1. DROP EXISTING POLICIES
-- ============================================================================

-- Drop all existing policies on announcements table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'announcements'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.announcements', r.policyname);
    END LOOP;
END $$;

-- ============================================================================
-- 2. CREATE PROPER RLS POLICIES
-- ============================================================================

-- Policy 1: Everyone can view active announcements
CREATE POLICY "Everyone can view active announcements"
    ON public.announcements FOR SELECT
    USING (is_active = true);

-- Policy 2: Service role has full access (for API operations)
CREATE POLICY "Service role full access to announcements"
    ON public.announcements FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy 3: Authenticated users can view all announcements (for management)
CREATE POLICY "Authenticated users can view all announcements"
    ON public.announcements FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy 4: Admin, CTF, MedEd team can insert announcements
CREATE POLICY "Admin CTF MedEd can create announcements"
    ON public.announcements FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'ctf', 'meded_team', 'educator')
        )
    );

-- Policy 5: Admin, CTF, MedEd team can update announcements
CREATE POLICY "Admin CTF MedEd can update announcements"
    ON public.announcements FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'ctf', 'meded_team')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'educator'
            AND users.id = announcements.author_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'ctf', 'meded_team')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'educator'
            AND users.id = announcements.author_id
        )
    );

-- Policy 6: Admin, CTF, MedEd team can delete announcements
CREATE POLICY "Admin CTF MedEd can delete announcements"
    ON public.announcements FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'ctf', 'meded_team')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'educator'
            AND users.id = announcements.author_id
        )
    );

-- ============================================================================
-- 3. VERIFY RLS POLICIES
-- ============================================================================

-- Check created policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'announcements';
    
    IF policy_count >= 6 THEN
        RAISE NOTICE '✅ RLS policies created successfully (% found)', policy_count;
    ELSE
        RAISE NOTICE '❌ RLS policy creation may have failed (% found)', policy_count;
    END IF;
END $$;

-- List all policies for verification
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'announcements'
ORDER BY policyname;

-- ============================================================================
-- 4. TEST QUERIES (OPTIONAL - FOR DEBUGGING)
-- ============================================================================

-- Test 1: Check if we can select announcements
DO $$
DECLARE
    announcement_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO announcement_count
    FROM public.announcements;
    
    RAISE NOTICE 'Total announcements in database: %', announcement_count;
END $$;

-- Test 2: Check if we can select with author info
DO $$
DECLARE
    announcement_with_author_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO announcement_with_author_count
    FROM public.announcements a
    LEFT JOIN public.users u ON a.author_id = u.id;
    
    RAISE NOTICE 'Announcements with author info: %', announcement_with_author_count;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 ANNOUNCEMENTS RLS POLICIES FIXED!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Dropped old policies';
    RAISE NOTICE '✅ Created proper role-based policies';
    RAISE NOTICE '✅ Service role has full access for API operations';
    RAISE NOTICE '✅ Admin/CTF/MedEd can manage all announcements';
    RAISE NOTICE '✅ Educators can only manage their own announcements';
    RAISE NOTICE '✅ All users can view active announcements';
    RAISE NOTICE '';
    RAISE NOTICE 'The announcements system should now work properly!';
    RAISE NOTICE '';
END $$;
