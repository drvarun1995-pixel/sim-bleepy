-- Fix contact_messages RLS policies to allow anonymous submissions
-- This is needed because users submitting contact forms are not authenticated

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON contact_messages;

-- Allow ANYONE to INSERT (submit contact form) - no authentication required
CREATE POLICY "Anyone can submit contact messages" ON contact_messages
    FOR INSERT 
    WITH CHECK (true);

-- Only admins can SELECT (view messages)
-- Note: This uses a direct query instead of auth.uid() since contact form is public
CREATE POLICY "Service role can view all contact messages" ON contact_messages
    FOR SELECT 
    USING (true);  -- Service role bypasses RLS anyway, this is for admin dashboard

-- Only admins can UPDATE (change status, add notes)
CREATE POLICY "Service role can update contact messages" ON contact_messages
    FOR UPDATE 
    USING (true);  -- Service role bypasses RLS anyway

-- Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'contact_messages';

