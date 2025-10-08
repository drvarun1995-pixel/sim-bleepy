-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active announcements" ON announcements;
DROP POLICY IF EXISTS "Educators and admins can create announcements" ON announcements;
DROP POLICY IF EXISTS "Author and admins can update announcements" ON announcements;
DROP POLICY IF EXISTS "Author and admins can delete announcements" ON announcements;

-- Disable RLS for announcements table since we're using NextAuth and handling permissions in API routes
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, use these policies that work with service role
-- ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (permissions are handled in API routes)
-- CREATE POLICY "Allow all for authenticated users" ON announcements
--   FOR ALL USING (true) WITH CHECK (true);
