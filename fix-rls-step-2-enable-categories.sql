-- =====================================================
-- STEP 2: ENABLE RLS ON CATEGORIES TABLE
-- =====================================================
-- This is the safest table to start with

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create safe policies for categories
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_update_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON public.categories;

-- Allow public read access (for events display)
CREATE POLICY "categories_select_policy" ON public.categories 
  FOR SELECT USING (true);

-- Allow authenticated users to manage categories
CREATE POLICY "categories_insert_policy" ON public.categories 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "categories_update_policy" ON public.categories 
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "categories_delete_policy" ON public.categories 
  FOR DELETE TO authenticated USING (true);

-- Verify
SELECT 'Categories RLS enabled and policies created' as status;
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories';
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories';
