-- =====================================================
-- STEP 3: ENABLE RLS ON FORMATS TABLE
-- =====================================================

-- Enable RLS on formats
ALTER TABLE public.formats ENABLE ROW LEVEL SECURITY;

-- Create safe policies for formats
DROP POLICY IF EXISTS "formats_select_policy" ON public.formats;
DROP POLICY IF EXISTS "formats_insert_policy" ON public.formats;
DROP POLICY IF EXISTS "formats_update_policy" ON public.formats;
DROP POLICY IF EXISTS "formats_delete_policy" ON public.formats;

-- Allow public read access (for events display)
CREATE POLICY "formats_select_policy" ON public.formats 
  FOR SELECT USING (true);

-- Allow authenticated users to manage formats
CREATE POLICY "formats_insert_policy" ON public.formats 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "formats_update_policy" ON public.formats 
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "formats_delete_policy" ON public.formats 
  FOR DELETE TO authenticated USING (true);

-- Verify
SELECT 'Formats RLS enabled and policies created' as status;
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'formats';
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' AND tablename = 'formats';
