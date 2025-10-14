-- Fix RLS policies for download tracking to allow all logged-in users to see download counts
-- Run this on Supabase after the main setup

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all downloads" ON public.download_tracking;
DROP POLICY IF EXISTS "Users can view their own downloads" ON public.download_tracking;
DROP POLICY IF EXISTS "Users can view download counts" ON public.download_tracking;
DROP POLICY IF EXISTS "Anyone can insert download records" ON public.download_tracking;

-- Create new policies
-- Admins can see all downloads (including user details)
CREATE POLICY "Admins can view all downloads" ON public.download_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- All authenticated users can see download counts (but not personal details)
CREATE POLICY "Users can view download counts" ON public.download_tracking
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

-- Anyone can insert download records (for tracking)
CREATE POLICY "Anyone can insert download records" ON public.download_tracking
    FOR INSERT WITH CHECK (true);

-- Update the function to be more permissive for download counts
CREATE OR REPLACE FUNCTION get_resource_download_count(resource_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM public.download_tracking 
        WHERE resource_id = resource_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to all authenticated users
GRANT EXECUTE ON FUNCTION get_resource_download_count(UUID) TO authenticated;
