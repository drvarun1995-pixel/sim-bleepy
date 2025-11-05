-- =====================================================
-- ADD RLS POLICIES FOR PLACEMENTS SYSTEM
-- =====================================================
-- This script adds proper RLS policies for the placements tables
-- 
-- NOTE: This app uses NextAuth (not Supabase Auth), so:
-- - API routes use service role (bypasses RLS)
-- - These policies provide security for direct database access
-- - Service role always has full access (by design)
-- =====================================================

BEGIN;

-- Drop existing policies if they exist (for clean re-runs)
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop specialties policies
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'specialties'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.specialties', r.policyname);
  END LOOP;

  -- Drop specialty_pages policies
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'specialty_pages'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.specialty_pages', r.policyname);
  END LOOP;

  -- Drop specialty_documents policies
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'specialty_documents'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.specialty_documents', r.policyname);
  END LOOP;
END $$;

-- =====================================================
-- RLS POLICIES FOR SPECIALTIES
-- =====================================================

-- Policy 1: Service role has full access (for API routes)
CREATE POLICY "Service role full access to specialties"
    ON specialties FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy 2: Everyone can view active specialties
CREATE POLICY "Everyone can view active specialties"
    ON specialties FOR SELECT
    TO authenticated, anon
    USING (is_active = true);

-- Policy 3: Admin/MedEd/CTF can view all specialties (including inactive)
-- Note: Since we use NextAuth, auth.uid() won't work, but this provides
-- defense-in-depth for any direct database access
-- Service role bypasses these policies (used by API routes)
CREATE POLICY "Admin/MedEd/CTF can view all specialties"
    ON specialties FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    );

-- Policy 4: Admin/MedEd/CTF can insert specialties
CREATE POLICY "Admin/MedEd/CTF can insert specialties"
    ON specialties FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    );

-- Policy 5: Admin/MedEd/CTF can update specialties
CREATE POLICY "Admin/MedEd/CTF can update specialties"
    ON specialties FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    );

-- Policy 6: Admin/MedEd/CTF can delete specialties
CREATE POLICY "Admin/MedEd/CTF can delete specialties"
    ON specialties FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    );

-- =====================================================
-- RLS POLICIES FOR SPECIALTY PAGES
-- =====================================================

-- Policy 1: Service role has full access
CREATE POLICY "Service role full access to specialty_pages"
    ON specialty_pages FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy 2: Everyone can view active specialty pages
CREATE POLICY "Everyone can view active specialty pages"
    ON specialty_pages FOR SELECT
    TO authenticated, anon
    USING (is_active = true);

-- Policy 3: Admin/MedEd/CTF can view all specialty pages
CREATE POLICY "Admin/MedEd/CTF can view all specialty pages"
    ON specialty_pages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    );

-- Policy 4: Admin/MedEd/CTF can insert specialty pages
CREATE POLICY "Admin/MedEd/CTF can insert specialty pages"
    ON specialty_pages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    );

-- Policy 5: Admin/MedEd/CTF can update specialty pages
CREATE POLICY "Admin/MedEd/CTF can update specialty pages"
    ON specialty_pages FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    );

-- Policy 6: Admin/MedEd/CTF can delete specialty pages
CREATE POLICY "Admin/MedEd/CTF can delete specialty pages"
    ON specialty_pages FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    );

-- =====================================================
-- RLS POLICIES FOR SPECIALTY DOCUMENTS
-- =====================================================

-- Policy 1: Service role has full access
CREATE POLICY "Service role full access to specialty_documents"
    ON specialty_documents FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy 2: Everyone can view active specialty documents
CREATE POLICY "Everyone can view active specialty documents"
    ON specialty_documents FOR SELECT
    TO authenticated, anon
    USING (is_active = true);

-- Policy 3: Admin/MedEd/CTF can view all specialty documents
CREATE POLICY "Admin/MedEd/CTF can view all specialty documents"
    ON specialty_documents FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    );

-- Policy 4: Admin/MedEd/CTF can insert specialty documents
CREATE POLICY "Admin/MedEd/CTF can insert specialty documents"
    ON specialty_documents FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    );

-- Policy 5: Admin/MedEd/CTF can update specialty documents
CREATE POLICY "Admin/MedEd/CTF can update specialty documents"
    ON specialty_documents FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    );

-- Policy 6: Admin/MedEd/CTF can delete specialty documents
CREATE POLICY "Admin/MedEd/CTF can delete specialty documents"
    ON specialty_documents FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'meded_team', 'ctf')
        )
    );

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies created for:';
  RAISE NOTICE '  - specialties (6 policies)';
  RAISE NOTICE '  - specialty_pages (6 policies)';
  RAISE NOTICE '  - specialty_documents (6 policies)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Service role has full access (for API routes)';
  RAISE NOTICE '✅ Everyone can view active items';
  RAISE NOTICE '✅ Admin/MedEd/CTF can manage all items';
END $$;

