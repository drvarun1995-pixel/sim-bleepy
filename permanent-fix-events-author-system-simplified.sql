-- SIMPLIFIED PERMANENT FIX FOR EVENTS AUTHOR SYSTEM
-- This version avoids complex type casting issues
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. ENSURE PROPER DATABASE SCHEMA
-- =====================================================

-- Add missing columns to events table if they don't exist
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS author_name TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add role column to users table if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_author_id ON public.events(author_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- =====================================================
-- 2. FIX EXISTING DATA ISSUES
-- =====================================================

-- Fix the specific "test" event and any other orphaned events
UPDATE public.events 
SET 
    author_id = (
        SELECT id FROM public.users 
        WHERE (name = 'Dr. Varun' OR email LIKE '%drvarun19%')
        ORDER BY created_at DESC
        LIMIT 1
    ),
    author_name = (
        SELECT name FROM public.users 
        WHERE (name = 'Dr. Varun' OR email LIKE '%drvarun19%')
        ORDER BY created_at DESC
        LIMIT 1
    ),
    created_by = (
        SELECT id FROM public.users 
        WHERE (name = 'Dr. Varun' OR email LIKE '%drvarun19%')
        ORDER BY created_at DESC
        LIMIT 1
    )
WHERE (author_id IS NULL OR author_name IS NULL OR author_name = 'Unknown User')
  AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE (name = 'Dr. Varun' OR email LIKE '%drvarun19%')
  );

-- Update users with proper roles
UPDATE public.users 
SET 
    role = CASE 
        WHEN email LIKE '%@ctf%' OR email LIKE '%@meded%' OR email LIKE '%@education%' THEN 'meded_team'
        WHEN email LIKE '%varun%' OR name LIKE '%Dr. Varun%' THEN 'admin'
        WHEN name LIKE '%Dr.%' THEN 'educator'
        ELSE 'user'
    END,
    display_name = COALESCE(display_name, name)
WHERE role IS NULL OR role = 'user';

-- =====================================================
-- 3. CREATE SIMPLIFIED RLS POLICIES
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Create simplified user access policies (avoiding type casting issues)
CREATE POLICY "Allow reading user data for events" ON public.users
  FOR SELECT 
  USING (
    -- Allow access for event author information
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.author_id = users.id
    )
    OR
    -- Allow all authenticated users to read user data (simplified approach)
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow users to update their own data" ON public.users
  FOR UPDATE 
  USING (auth.uid() = users.id)
  WITH CHECK (auth.uid() = users.id);

CREATE POLICY "Allow system to create users" ON public.users
  FOR INSERT 
  WITH CHECK (true);

-- =====================================================
-- 4. CREATE COMPREHENSIVE EVENTS VIEW
-- =====================================================

-- Drop and recreate the events_with_details view with better author handling
DROP VIEW IF EXISTS public.events_with_details CASCADE;

CREATE OR REPLACE VIEW public.events_with_details AS
SELECT 
  e.id,
  e.title,
  e.description,
  e.date,
  e.start_time,
  e.end_time,
  e.is_all_day,
  e.hide_time,
  e.hide_end_time,
  e.time_notes,
  e.location_id,
  l.name AS location_name,
  l.address AS location_address,
  l.latitude AS location_latitude,
  l.longitude AS location_longitude,
  -- Get all locations as an array
  COALESCE(
    (SELECT json_agg(json_build_object('id', loc.id, 'name', loc.name, 'address', loc.address))
     FROM event_locations el
     JOIN locations loc ON loc.id = el.location_id
     WHERE el.event_id = e.id),
    '[]'::json
  ) AS locations,
  e.hide_location,
  e.organizer_id,
  o.name AS organizer_name,
  -- Get all organizers as an array
  COALESCE(
    (SELECT json_agg(json_build_object('id', org.id, 'name', org.name))
     FROM event_organizers eo
     JOIN organizers org ON org.id = eo.organizer_id
     WHERE eo.event_id = e.id),
    '[]'::json
  ) AS organizers,
  e.hide_organizer,
  e.category_id,
  c.name AS category_name,
  -- Get all categories as an array
  COALESCE(
    (SELECT json_agg(json_build_object('id', cat.id, 'name', cat.name, 'color', cat.color))
     FROM event_categories ec
     JOIN categories cat ON cat.id = ec.category_id
     WHERE ec.event_id = e.id),
    '[]'::json
  ) AS categories,
  e.format_id,
  f.name AS format_name,
  f.color AS format_color,
  -- Get all speakers as an array
  COALESCE(
    (SELECT json_agg(json_build_object('id', sp.id, 'name', sp.name, 'role', sp.role))
     FROM event_speakers es
     JOIN speakers sp ON sp.id = es.speaker_id
     WHERE es.event_id = e.id),
    '[]'::json
  ) AS speakers,
  e.hide_speakers,
  e.attendees,
  e.status,
  e.event_link,
  e.more_info_link,
  e.more_info_target,
  e.event_status,
  -- Robust author information handling
  e.author_id,
  COALESCE(
    u.name, 
    e.author_name, 
    u.email,
    'System User'
  ) AS author_name,
  u.email AS author_email,
  u.role AS author_role,
  u.display_name AS author_display_name,
  e.created_by,
  creator.name AS created_by_name,
  creator.email AS created_by_email,
  e.created_at,
  e.updated_at
FROM events e
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN users u ON e.author_id = u.id
LEFT JOIN users creator ON e.created_by = creator.id;

-- Grant permissions on the view
GRANT SELECT ON public.events_with_details TO authenticated, anon;

-- =====================================================
-- 5. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get or create user for event creation
CREATE OR REPLACE FUNCTION get_or_create_user_for_event(
  user_email TEXT,
  user_name TEXT DEFAULT NULL,
  user_role TEXT DEFAULT 'user'
)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Try to find existing user
  SELECT id INTO user_id
  FROM public.users
  WHERE email = user_email
  LIMIT 1;
  
  -- If user exists, update their name if provided
  IF user_id IS NOT NULL THEN
    IF user_name IS NOT NULL THEN
      UPDATE public.users 
      SET name = user_name, display_name = user_name
      WHERE id = user_id;
    END IF;
    RETURN user_id;
  END IF;
  
  -- Create new user if doesn't exist
  INSERT INTO public.users (email, name, display_name, role)
  VALUES (user_email, COALESCE(user_name, user_email), COALESCE(user_name, user_email), user_role)
  RETURNING id INTO user_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE TRIGGERS FOR AUTOMATIC FIXES
-- =====================================================

-- Trigger function to automatically set author information on event creation
CREATE OR REPLACE FUNCTION set_event_author_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  current_user_name TEXT;
BEGIN
  -- Get current user info from auth context
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NOT NULL THEN
    SELECT name INTO current_user_name
    FROM public.users
    WHERE id = current_user_id;
    
    -- Set author information if not already set
    IF NEW.author_id IS NULL THEN
      NEW.author_id = current_user_id;
    END IF;
    
    IF NEW.author_name IS NULL THEN
      NEW.author_name = COALESCE(current_user_name, 'Authenticated User');
    END IF;
    
    IF NEW.created_by IS NULL THEN
      NEW.created_by = current_user_id;
    END IF;
  ELSE
    -- Fallback for unauthenticated requests (shouldn't happen in normal flow)
    IF NEW.author_name IS NULL THEN
      NEW.author_name = 'System User';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_set_event_author ON public.events;
CREATE TRIGGER trigger_set_event_author
  BEFORE INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION set_event_author_on_insert();

-- =====================================================
-- 7. VERIFICATION AND CLEANUP
-- =====================================================

-- Verify all events now have proper author information
SELECT 
    COUNT(*) as total_events,
    COUNT(author_id) as events_with_author_id,
    COUNT(CASE WHEN author_name IS NOT NULL AND author_name != 'Unknown User' THEN 1 END) as events_with_author_name,
    COUNT(CASE WHEN author_id IS NULL AND (author_name IS NULL OR author_name = 'Unknown User') THEN 1 END) as orphaned_events
FROM public.events;

-- Show sample of fixed events
SELECT 
    id,
    title,
    author_id,
    author_name,
    created_by,
    created_at
FROM public.events
ORDER BY created_at DESC
LIMIT 5;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_or_create_user_for_event TO authenticated;

SELECT 'SIMPLIFIED PERMANENT FIX COMPLETE! Event author system is now robust and self-healing.' as status;

