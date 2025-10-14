-- =====================================================
-- SUPABASE SETUP REQUIRED - Run these scripts in order
-- =====================================================

-- 1. CREATE DOWNLOAD TRACKING TABLE
-- Run this first to enable download tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS public.download_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL,
    resource_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    user_name TEXT,
    download_timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    file_size BIGINT,
    file_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_download_tracking_resource_id ON public.download_tracking(resource_id);
CREATE INDEX IF NOT EXISTS idx_download_tracking_user_id ON public.download_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_download_tracking_timestamp ON public.download_tracking(download_timestamp);

-- Enable RLS
ALTER TABLE public.download_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all downloads
CREATE POLICY "Admins can view all downloads" ON public.download_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Users can see their own downloads
CREATE POLICY "Users can view their own downloads" ON public.download_tracking
    FOR SELECT USING (user_id = auth.uid());

-- Anyone can insert download records (for tracking)
CREATE POLICY "Anyone can insert download records" ON public.download_tracking
    FOR INSERT WITH CHECK (true);

-- Function to get download count for a resource
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

-- Grant permissions
GRANT SELECT, INSERT ON public.download_tracking TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_resource_download_count(UUID) TO authenticated, anon;

-- =====================================================
-- 2. ADD LOGIN TRACKING FIELDS TO USERS TABLE
-- Run this to enable user activity tracking
-- =====================================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Update existing users to have a default last_login
UPDATE public.users 
SET last_login = created_at 
WHERE last_login IS NULL;

-- Create index for faster queries on login activity
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_login_count ON public.users(login_count);

-- Grant permissions (if needed)
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES (Optional - to check setup)
-- =====================================================

-- Check if download tracking table exists and has data
-- SELECT COUNT(*) FROM public.download_tracking;

-- Check if users table has the new columns
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'users' AND table_schema = 'public'
-- AND column_name IN ('last_login', 'login_count');

-- Check RLS policies
-- SELECT schemaname, tablename, policyname FROM pg_policies 
-- WHERE tablename = 'download_tracking';
