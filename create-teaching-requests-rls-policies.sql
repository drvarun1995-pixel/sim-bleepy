-- =====================================================
-- TEACHING REQUESTS SYSTEM - RLS Policies
-- =====================================================
-- This script creates Row Level Security policies for the teaching_requests system
-- Based on the role-based access control requirements

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own teaching requests" ON public.teaching_requests;
DROP POLICY IF EXISTS "Users can create teaching requests" ON public.teaching_requests;
DROP POLICY IF EXISTS "Admins can view all teaching requests" ON public.teaching_requests;
DROP POLICY IF EXISTS "Admins can update teaching requests" ON public.teaching_requests;
DROP POLICY IF EXISTS "Admins can delete teaching requests" ON public.teaching_requests;
DROP POLICY IF EXISTS "Service role full access" ON public.teaching_requests;

-- Create helper function to check if user can view teaching requests
CREATE OR REPLACE FUNCTION can_view_teaching_requests(user_email TEXT)
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

-- Create helper function to check if user can manage teaching requests
CREATE OR REPLACE FUNCTION can_manage_teaching_requests(user_email TEXT)
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

-- RLS Policies for teaching_requests table

-- 1. Users can view their own teaching requests
CREATE POLICY "Users can view their own teaching requests" ON public.teaching_requests
    FOR SELECT USING (
        auth.jwt() ->> 'email' = user_email
    );

-- 2. Users can create teaching requests
CREATE POLICY "Users can create teaching requests" ON public.teaching_requests
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'email' = user_email
    );

-- 3. Admins, CTF, Educators, and MedEd Team can view all teaching requests
CREATE POLICY "Admins can view all teaching requests" ON public.teaching_requests
    FOR SELECT USING (
        can_view_teaching_requests(auth.jwt() ->> 'email')
    );

-- 4. Admins, CTF, Educators, and MedEd Team can update teaching requests
CREATE POLICY "Admins can update teaching requests" ON public.teaching_requests
    FOR UPDATE USING (
        can_manage_teaching_requests(auth.jwt() ->> 'email')
    );

-- 5. Admins, CTF, Educators, and MedEd Team can delete teaching requests
CREATE POLICY "Admins can delete teaching requests" ON public.teaching_requests
    FOR DELETE USING (
        can_manage_teaching_requests(auth.jwt() ->> 'email')
    );

-- 6. Service role has full access (for API operations)
CREATE POLICY "Service role full access" ON public.teaching_requests
    FOR ALL USING (
        auth.role() = 'service_role'
    );

-- Create indexes for better RLS performance
CREATE INDEX IF NOT EXISTS idx_teaching_requests_user_email_rls ON public.teaching_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_teaching_requests_status_rls ON public.teaching_requests(status);
CREATE INDEX IF NOT EXISTS idx_teaching_requests_categories_rls ON public.teaching_requests USING GIN(categories);

-- Create function to get user's teaching request count
CREATE OR REPLACE FUNCTION get_user_teaching_request_count(user_email_param TEXT)
RETURNS INTEGER AS $$
DECLARE
    request_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO request_count
    FROM public.teaching_requests
    WHERE user_email = user_email_param;
    
    RETURN COALESCE(request_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get admin teaching request summary
CREATE OR REPLACE FUNCTION get_admin_teaching_request_summary()
RETURNS TABLE (
    total_requests BIGINT,
    pending_requests BIGINT,
    in_progress_requests BIGINT,
    completed_requests BIGINT,
    rejected_requests BIGINT,
    recent_requests BIGINT,
    my_assigned_requests BIGINT,
    upcoming_scheduled BIGINT
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
        )) as my_assigned_requests,
        COUNT(*) FILTER (WHERE scheduled_date >= CURRENT_DATE AND status IN ('pending', 'in-progress')) as upcoming_scheduled
    FROM public.teaching_requests;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user can access specific teaching request
CREATE OR REPLACE FUNCTION can_access_teaching_request(request_id UUID, user_email_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    request_user_email TEXT;
    user_role TEXT;
BEGIN
    -- Get the request owner's email
    SELECT user_email INTO request_user_email
    FROM public.teaching_requests
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
CREATE OR REPLACE FUNCTION get_accessible_teaching_requests(user_email_param TEXT)
RETURNS TABLE (
    id UUID,
    user_email TEXT,
    user_name TEXT,
    topic TEXT,
    description TEXT,
    preferred_date DATE,
    preferred_time TIME,
    duration TEXT,
    categories TEXT[],
    format TEXT,
    status TEXT,
    admin_notes TEXT,
    scheduled_date DATE,
    scheduled_time TIME,
    location TEXT,
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
            tr.id,
            tr.user_email,
            tr.user_name,
            tr.topic,
            tr.description,
            tr.preferred_date,
            tr.preferred_time,
            tr.duration,
            tr.categories,
            tr.format,
            tr.status,
            tr.admin_notes,
            tr.scheduled_date,
            tr.scheduled_time,
            tr.location,
            tr.created_at,
            tr.updated_at
        FROM public.teaching_requests tr
        ORDER BY tr.created_at DESC;
    ELSE
        -- Regular users can only see their own requests
        RETURN QUERY
        SELECT 
            tr.id,
            tr.user_email,
            tr.user_name,
            tr.topic,
            tr.description,
            tr.preferred_date,
            tr.preferred_time,
            tr.duration,
            tr.categories,
            tr.format,
            tr.status,
            tr.admin_notes,
            tr.scheduled_date,
            tr.scheduled_time,
            tr.location,
            tr.created_at,
            tr.updated_at
        FROM public.teaching_requests tr
        WHERE tr.user_email = user_email_param
        ORDER BY tr.created_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get requests by category with access control
CREATE OR REPLACE FUNCTION get_teaching_requests_by_category_secure(category_name TEXT, user_email_param TEXT)
RETURNS TABLE (
    id UUID,
    topic TEXT,
    user_name TEXT,
    preferred_date DATE,
    duration TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
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
        -- Admins can see all requests in category
        RETURN QUERY
        SELECT 
            tr.id,
            tr.topic,
            tr.user_name,
            tr.preferred_date,
            tr.duration,
            tr.status,
            tr.created_at
        FROM public.teaching_requests tr
        WHERE category_name = ANY(tr.categories)
        ORDER BY tr.created_at DESC;
    ELSE
        -- Regular users can only see their own requests in category
        RETURN QUERY
        SELECT 
            tr.id,
            tr.topic,
            tr.user_name,
            tr.preferred_date,
            tr.duration,
            tr.status,
            tr.created_at
        FROM public.teaching_requests tr
        WHERE category_name = ANY(tr.categories)
        AND tr.user_email = user_email_param
        ORDER BY tr.created_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get upcoming requests with access control
CREATE OR REPLACE FUNCTION get_upcoming_teaching_requests_secure(days_ahead INTEGER, user_email_param TEXT)
RETURNS TABLE (
    id UUID,
    topic TEXT,
    user_name TEXT,
    scheduled_date DATE,
    scheduled_time TIME,
    duration TEXT,
    location TEXT,
    status TEXT
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
        -- Admins can see all upcoming requests
        RETURN QUERY
        SELECT 
            tr.id,
            tr.topic,
            tr.user_name,
            tr.scheduled_date,
            tr.scheduled_time,
            tr.duration,
            tr.location,
            tr.status
        FROM public.teaching_requests tr
        WHERE 
            tr.scheduled_date IS NOT NULL
            AND tr.scheduled_date >= CURRENT_DATE
            AND tr.scheduled_date <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
            AND tr.status IN ('pending', 'in-progress')
        ORDER BY tr.scheduled_date, tr.scheduled_time;
    ELSE
        -- Regular users can only see their own upcoming requests
        RETURN QUERY
        SELECT 
            tr.id,
            tr.topic,
            tr.user_name,
            tr.scheduled_date,
            tr.scheduled_time,
            tr.duration,
            tr.location,
            tr.status
        FROM public.teaching_requests tr
        WHERE 
            tr.user_email = user_email_param
            AND tr.scheduled_date IS NOT NULL
            AND tr.scheduled_date >= CURRENT_DATE
            AND tr.scheduled_date <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
            AND tr.status IN ('pending', 'in-progress')
        ORDER BY tr.scheduled_date, tr.scheduled_time;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION can_view_teaching_requests(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_teaching_requests(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_teaching_request_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_teaching_request_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_teaching_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_accessible_teaching_requests(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_teaching_requests_by_category_secure(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_teaching_requests_secure(INTEGER, TEXT) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION can_view_teaching_requests(TEXT) IS 'Checks if a user can view teaching requests based on their role';
COMMENT ON FUNCTION can_manage_teaching_requests(TEXT) IS 'Checks if a user can manage teaching requests based on their role';
COMMENT ON FUNCTION get_user_teaching_request_count(TEXT) IS 'Returns the count of teaching requests for a specific user';
COMMENT ON FUNCTION get_admin_teaching_request_summary() IS 'Returns summary statistics for teaching requests (admin only)';
COMMENT ON FUNCTION can_access_teaching_request(UUID, TEXT) IS 'Checks if a user can access a specific teaching request';
COMMENT ON FUNCTION get_accessible_teaching_requests(TEXT) IS 'Returns teaching requests accessible to a specific user based on their role';
COMMENT ON FUNCTION get_teaching_requests_by_category_secure(TEXT, TEXT) IS 'Returns teaching requests by category with access control';
COMMENT ON FUNCTION get_upcoming_teaching_requests_secure(INTEGER, TEXT) IS 'Returns upcoming teaching requests with access control';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Teaching requests RLS policies created successfully!';
    RAISE NOTICE 'Policies: Users can view/create their own, Admins can view/update/delete all';
    RAISE NOTICE 'Helper functions: can_view_teaching_requests, can_manage_teaching_requests, get_user_teaching_request_count, get_admin_teaching_request_summary, can_access_teaching_request, get_accessible_teaching_requests, get_teaching_requests_by_category_secure, get_upcoming_teaching_requests_secure';
    RAISE NOTICE 'Access control: Students can only see their own requests, Admins/CTF/Educators/MedEd can see all';
END $$;




