-- =====================================================
-- FILE REQUESTS SYSTEM - RLS Policies
-- =====================================================
-- This script creates Row Level Security policies for the file_requests system
-- Based on the role-based access control requirements

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own file requests" ON public.file_requests;
DROP POLICY IF EXISTS "Users can create file requests" ON public.file_requests;
DROP POLICY IF EXISTS "Admins can view all file requests" ON public.file_requests;
DROP POLICY IF EXISTS "Admins can update file requests" ON public.file_requests;
DROP POLICY IF EXISTS "Admins can delete file requests" ON public.file_requests;
DROP POLICY IF EXISTS "Service role full access" ON public.file_requests;

-- Create helper function to check if user can view file requests
CREATE OR REPLACE FUNCTION can_view_file_requests(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get user role
    SELECT role INTO user_role
    FROM public.users
    WHERE email = user_email;
    
    -- Check if user has permission
    RETURN user_role IN ('admin', 'ctf', 'educator', 'meded_team');
END;
$$ LANGUAGE plpgsql;

-- Create helper function to check if user can manage file requests
CREATE OR REPLACE FUNCTION can_manage_file_requests(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get user role
    SELECT role INTO user_role
    FROM public.users
    WHERE email = user_email;
    
    -- Check if user has permission
    RETURN user_role IN ('admin', 'ctf', 'educator', 'meded_team');
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for file_requests table

-- 1. Users can view their own file requests
CREATE POLICY "Users can view their own file requests" ON public.file_requests
    FOR SELECT USING (
        auth.jwt() ->> 'email' = user_email
    );

-- 2. Users can create file requests
CREATE POLICY "Users can create file requests" ON public.file_requests
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'email' = user_email
    );

-- 3. Admins, CTF, Educators, and MedEd Team can view all file requests
CREATE POLICY "Admins can view all file requests" ON public.file_requests
    FOR SELECT USING (
        can_view_file_requests(auth.jwt() ->> 'email')
    );

-- 4. Admins, CTF, Educators, and MedEd Team can update file requests
CREATE POLICY "Admins can update file requests" ON public.file_requests
    FOR UPDATE USING (
        can_manage_file_requests(auth.jwt() ->> 'email')
    );

-- 5. Admins, CTF, Educators, and MedEd Team can delete file requests
CREATE POLICY "Admins can delete file requests" ON public.file_requests
    FOR DELETE USING (
        can_manage_file_requests(auth.jwt() ->> 'email')
    );

-- 6. Service role has full access (for API operations)
CREATE POLICY "Service role full access" ON public.file_requests
    FOR ALL USING (
        auth.role() = 'service_role'
    );

-- Create indexes for better RLS performance
CREATE INDEX IF NOT EXISTS idx_file_requests_user_email_rls ON public.file_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_file_requests_status_rls ON public.file_requests(status);

-- Create function to get user's file request count
CREATE OR REPLACE FUNCTION get_user_file_request_count(user_email_param TEXT)
RETURNS INTEGER AS $$
DECLARE
    request_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO request_count
    FROM public.file_requests
    WHERE user_email = user_email_param;
    
    RETURN COALESCE(request_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get admin file request summary
CREATE OR REPLACE FUNCTION get_admin_file_request_summary()
RETURNS TABLE (
    total_requests BIGINT,
    pending_requests BIGINT,
    in_progress_requests BIGINT,
    completed_requests BIGINT,
    rejected_requests BIGINT,
    recent_requests BIGINT,
    my_assigned_requests BIGINT
) AS $$
DECLARE
    current_user_email TEXT;
BEGIN
    current_user_email := auth.jwt() ->> 'email';
    
    RETURN QUERY
    SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
        COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress_requests,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_requests,
        COUNT(*) FILTER (WHERE assigned_to = (
            SELECT id FROM public.users WHERE email = current_user_email
        )) as my_assigned_requests
    FROM public.file_requests;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user can access specific request
CREATE OR REPLACE FUNCTION can_access_file_request(request_id UUID, user_email_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    request_user_email TEXT;
    user_role TEXT;
BEGIN
    -- Get the request owner's email
    SELECT user_email INTO request_user_email
    FROM public.file_requests
    WHERE id = request_id;
    
    -- If request doesn't exist, return false
    IF request_user_email IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- If user owns the request, they can access it
    IF request_user_email = user_email_param THEN
        RETURN TRUE;
    END IF;
    
    -- Get user role
    SELECT role INTO user_role
    FROM public.users
    WHERE email = user_email_param;
    
    -- Check if user has admin access
    RETURN user_role IN ('admin', 'ctf', 'educator', 'meded_team');
END;
$$ LANGUAGE plpgsql;

-- Create function to get requests with access control
CREATE OR REPLACE FUNCTION get_accessible_file_requests(user_email_param TEXT)
RETURNS TABLE (
    id UUID,
    user_email TEXT,
    user_name TEXT,
    file_name TEXT,
    description TEXT,
    additional_info TEXT,
    event_title TEXT,
    event_date DATE,
    status TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get user role
    SELECT role INTO user_role
    FROM public.users
    WHERE email = user_email_param;
    
    -- Return appropriate data based on role
    IF user_role IN ('admin', 'ctf', 'educator', 'meded_team') THEN
        -- Admins can see all requests
        RETURN QUERY
        SELECT 
            fr.id,
            fr.user_email,
            fr.user_name,
            fr.file_name,
            fr.description,
            fr.additional_info,
            fr.event_title,
            fr.event_date,
            fr.status,
            fr.admin_notes,
            fr.created_at,
            fr.updated_at
        FROM public.file_requests fr
        ORDER BY fr.created_at DESC;
    ELSE
        -- Regular users can only see their own requests
        RETURN QUERY
        SELECT 
            fr.id,
            fr.user_email,
            fr.user_name,
            fr.file_name,
            fr.description,
            fr.additional_info,
            fr.event_title,
            fr.event_date,
            fr.status,
            fr.admin_notes,
            fr.created_at,
            fr.updated_at
        FROM public.file_requests fr
        WHERE fr.user_email = user_email_param
        ORDER BY fr.created_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION can_view_file_requests(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_file_requests(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_file_request_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_file_request_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_file_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_accessible_file_requests(TEXT) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION can_view_file_requests(TEXT) IS 'Checks if a user can view file requests based on their role';
COMMENT ON FUNCTION can_manage_file_requests(TEXT) IS 'Checks if a user can manage file requests based on their role';
COMMENT ON FUNCTION get_user_file_request_count(TEXT) IS 'Returns the count of file requests for a specific user';
COMMENT ON FUNCTION get_admin_file_request_summary() IS 'Returns summary statistics for file requests (admin only)';
COMMENT ON FUNCTION can_access_file_request(UUID, TEXT) IS 'Checks if a user can access a specific file request';
COMMENT ON FUNCTION get_accessible_file_requests(TEXT) IS 'Returns file requests accessible to a specific user based on their role';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'File requests RLS policies created successfully!';
    RAISE NOTICE 'Policies: Users can view/create their own, Admins can view/update/delete all';
    RAISE NOTICE 'Helper functions: can_view_file_requests, can_manage_file_requests, get_user_file_request_count, get_admin_file_request_summary, can_access_file_request, get_accessible_file_requests';
    RAISE NOTICE 'Access control: Students can only see their own requests, Admins/CTF/Educators/MedEd can see all';
END $$;




