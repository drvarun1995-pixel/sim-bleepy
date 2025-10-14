-- Update RLS Policies for MedEd Team and CTF roles
-- These roles need access to event management and contact messages

-- ============================================================================
-- HELPER FUNCTION: Check if user can manage events
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.user_can_manage_events(uuid);

-- Create function to check if user has event management permissions
CREATE OR REPLACE FUNCTION public.user_can_manage_events(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id 
    AND role IN ('admin', 'meded_team', 'ctf')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Check if user can view contact messages
-- ============================================================================

DROP FUNCTION IF EXISTS public.user_can_view_contact_messages(uuid);

CREATE OR REPLACE FUNCTION public.user_can_view_contact_messages(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id 
    AND role IN ('admin', 'meded_team', 'ctf')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE EVENTS TABLE POLICIES
-- ============================================================================

-- Drop existing event policies
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

-- Create new policies with support for new roles
CREATE POLICY "Event managers can insert events"
    ON public.events FOR INSERT
    WITH CHECK (public.user_can_manage_events(auth.uid()));

CREATE POLICY "Event managers can update events"
    ON public.events FOR UPDATE
    USING (public.user_can_manage_events(auth.uid()));

CREATE POLICY "Event managers can delete events"
    ON public.events FOR DELETE
    USING (public.user_can_manage_events(auth.uid()));

-- ============================================================================
-- UPDATE CATEGORIES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Event managers can manage categories"
    ON public.categories FOR ALL
    USING (public.user_can_manage_events(auth.uid()))
    WITH CHECK (public.user_can_manage_events(auth.uid()));

-- ============================================================================
-- UPDATE FORMATS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage formats" ON public.formats;

CREATE POLICY "Event managers can manage formats"
    ON public.formats FOR ALL
    USING (public.user_can_manage_events(auth.uid()))
    WITH CHECK (public.user_can_manage_events(auth.uid()));

-- ============================================================================
-- UPDATE LOCATIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage locations" ON public.locations;

CREATE POLICY "Event managers can manage locations"
    ON public.locations FOR ALL
    USING (public.user_can_manage_events(auth.uid()))
    WITH CHECK (public.user_can_manage_events(auth.uid()));

-- ============================================================================
-- UPDATE ORGANIZERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can insert organizers" ON public.organizers;
DROP POLICY IF EXISTS "Admins can update organizers" ON public.organizers;
DROP POLICY IF EXISTS "Admins can delete organizers" ON public.organizers;

CREATE POLICY "Event managers can insert organizers"
    ON public.organizers FOR INSERT
    WITH CHECK (public.user_can_manage_events(auth.uid()));

CREATE POLICY "Event managers can update organizers"
    ON public.organizers FOR UPDATE
    USING (public.user_can_manage_events(auth.uid()));

CREATE POLICY "Event managers can delete organizers"
    ON public.organizers FOR DELETE
    USING (public.user_can_manage_events(auth.uid()));

-- ============================================================================
-- UPDATE SPEAKERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage speakers" ON public.speakers;

CREATE POLICY "Event managers can manage speakers"
    ON public.speakers FOR ALL
    USING (public.user_can_manage_events(auth.uid()))
    WITH CHECK (public.user_can_manage_events(auth.uid()));

-- ============================================================================
-- UPDATE EVENT_CATEGORIES TABLE POLICIES (junction table)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage event categories junction" ON public.event_categories;

CREATE POLICY "Event managers can manage event categories"
    ON public.event_categories FOR ALL
    USING (public.user_can_manage_events(auth.uid()))
    WITH CHECK (public.user_can_manage_events(auth.uid()));

-- ============================================================================
-- UPDATE EVENT_LOCATIONS TABLE POLICIES (junction table)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage event locations junction" ON public.event_locations;

CREATE POLICY "Event managers can manage event locations"
    ON public.event_locations FOR ALL
    USING (public.user_can_manage_events(auth.uid()))
    WITH CHECK (public.user_can_manage_events(auth.uid()));

-- ============================================================================
-- UPDATE EVENT_ORGANIZERS TABLE POLICIES (junction table)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage event organizers junction" ON public.event_organizers;

CREATE POLICY "Event managers can manage event organizers"
    ON public.event_organizers FOR ALL
    USING (public.user_can_manage_events(auth.uid()))
    WITH CHECK (public.user_can_manage_events(auth.uid()));

-- ============================================================================
-- UPDATE EVENT_SPEAKERS TABLE POLICIES (junction table)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage event speakers" ON public.event_speakers;

CREATE POLICY "Event managers can manage event speakers"
    ON public.event_speakers FOR ALL
    USING (public.user_can_manage_events(auth.uid()))
    WITH CHECK (public.user_can_manage_events(auth.uid()));

-- ============================================================================
-- HELPER FUNCTION: Check if user can manage resources
-- ============================================================================

DROP FUNCTION IF EXISTS public.user_can_manage_resources(uuid);

CREATE OR REPLACE FUNCTION public.user_can_manage_resources(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id 
    AND role IN ('admin', 'educator', 'meded_team', 'ctf')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE RESOURCES TABLE POLICIES
-- ============================================================================

-- Drop existing policies (they may be using auth.role() incorrectly)
DROP POLICY IF EXISTS "Allow admin/educator insert" ON public.resources;
DROP POLICY IF EXISTS "Allow admin/educator update" ON public.resources;
DROP POLICY IF EXISTS "Allow admin/educator delete" ON public.resources;

-- Create new policies that check the user role from users table
CREATE POLICY "Educators can insert resources"
    ON public.resources FOR INSERT
    WITH CHECK (public.user_can_manage_resources(auth.uid()));

CREATE POLICY "Educators can update resources"
    ON public.resources FOR UPDATE
    USING (public.user_can_manage_resources(auth.uid()));

CREATE POLICY "Educators can delete resources"
    ON public.resources FOR DELETE
    USING (public.user_can_manage_resources(auth.uid()));

-- ============================================================================
-- UPDATE CONTACT_MESSAGES TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can delete contact messages" ON public.contact_messages;

-- Create new policies for contact messages
CREATE POLICY "Authorized users can view contact messages"
    ON public.contact_messages FOR SELECT
    USING (public.user_can_view_contact_messages(auth.uid()));

CREATE POLICY "Authorized users can update contact messages"
    ON public.contact_messages FOR UPDATE
    USING (public.user_can_view_contact_messages(auth.uid()));

CREATE POLICY "Authorized users can delete contact messages"
    ON public.contact_messages FOR DELETE
    USING (public.user_can_view_contact_messages(auth.uid()));

-- Anyone can insert (for contact form submissions)
CREATE POLICY "Anyone can submit contact messages"
    ON public.contact_messages FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify policies were created
DO $$
DECLARE
  policy_count integer;
BEGIN
  -- Count policies for events table
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'events'
  AND policyname LIKE '%Event managers%';
  
  RAISE NOTICE 'Events policies created: %', policy_count;
  
  -- Count contact_messages policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'contact_messages'
  AND policyname LIKE '%Authorized users%';
  
  RAISE NOTICE 'Contact messages policies created: %', policy_count;
  
  RAISE NOTICE '✅ RLS policies updated successfully!';
  RAISE NOTICE 'MedEd Team and CTF now have access to:';
  RAISE NOTICE '  - Event management (create, edit, delete)';
  RAISE NOTICE '  - Categories, formats, locations, organizers, speakers';
  RAISE NOTICE '  - Contact messages (view, update, delete)';
  RAISE NOTICE '  - Resources management (upload, edit, delete)';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: All educator permissions are also available to MedEd Team and CTF';
END $$;

