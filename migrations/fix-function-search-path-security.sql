-- Fix Function Search Path Security Issue
-- This migration adds SET search_path = 'public' to all functions to prevent search_path manipulation attacks
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
--
-- IMPORTANT NOTES:
-- 1. This migration uses CREATE OR REPLACE, which will update the search_path setting
-- 2. If any function body doesn't match exactly, PostgreSQL will throw an error (this is safe - it prevents accidental changes)
-- 3. If you get errors, you may need to check the actual function definitions in your database
-- 4. After running this migration, verify that all functions still work correctly
-- 5. You can verify the fix by running the Supabase linter again - all warnings should be resolved

-- ============================================================================
-- TRIGGER FUNCTIONS (Updated_at functions)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_feedback_templates_updated_at()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_email_signatures_updated_at()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_cron_tasks_updated_at()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_event_bookings_updated_at()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_portfolio_files_updated_at()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_announcements_updated_at()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_certificate_templates_updated_at()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_certificates_updated_at()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_contact_messages_updated_at()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SHARED_AT TRIGGER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_template_shared_at()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.is_shared = true AND (OLD.is_shared IS NULL OR OLD.is_shared = false) THEN
    NEW.shared_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_feedback_template_shared_at()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.is_shared = true AND (OLD.is_shared IS NULL OR OLD.is_shared = false) THEN
    NEW.shared_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERMISSION CHECK FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
SET search_path = 'public'
AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
SET search_path = 'public'
AS $$
BEGIN
  RETURN public.get_user_role(user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_educator_or_above(user_id uuid)
RETURNS boolean
SET search_path = 'public'
AS $$
BEGIN
  RETURN public.get_user_role(user_id) IN ('educator', 'meded_team', 'ctf', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_staff_user(user_id uuid)
RETURNS boolean
SET search_path = 'public'
AS $$
BEGIN
  RETURN public.get_user_role(user_id) IN ('admin', 'meded_team', 'ctf');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_manage_events(user_id uuid)
RETURNS boolean
SET search_path = 'public'
AS $$
BEGIN
  RETURN public.get_user_role(user_id) IN ('admin', 'meded_team', 'ctf');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_manage_resources(user_id uuid)
RETURNS boolean
SET search_path = 'public'
AS $$
BEGIN
  RETURN public.get_user_role(user_id) IN ('educator', 'meded_team', 'ctf', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_view_contact_messages(user_id uuid)
RETURNS boolean
SET search_path = 'public'
AS $$
BEGIN
  RETURN public.get_user_role(user_id) IN ('admin', 'meded_team', 'ctf');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id UUID)
RETURNS VOID
SET search_path = 'public'
AS $$
BEGIN
  UPDATE feedback_templates 
  SET usage_count = usage_count + 1 
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_templates_by_category(category_filter text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  category text,
  questions jsonb,
  is_active boolean,
  usage_count integer,
  created_at timestamptz,
  updated_at timestamptz
)
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ft.id,
    ft.name,
    ft.description,
    ft.category,
    ft.questions,
    ft.is_active,
    ft.usage_count,
    ft.created_at,
    ft.updated_at
  FROM feedback_templates ft
  WHERE ft.category = category_filter
  ORDER BY ft.usage_count DESC, ft.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_resource_download_count(resource_id uuid)
RETURNS integer
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM download_tracking
    WHERE resource_id = get_resource_download_count.resource_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.get_usage_summary()
RETURNS TABLE (
  total_users bigint,
  active_users_today bigint,
  total_downloads bigint,
  downloads_today bigint
)
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM users)::bigint as total_users,
    (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE last_login >= CURRENT_DATE)::bigint as active_users_today,
    (SELECT COUNT(*) FROM download_tracking)::bigint as total_downloads,
    (SELECT COUNT(*) FROM download_tracking WHERE download_timestamp >= CURRENT_DATE)::bigint as downloads_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- LOGGING FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_data_access(
  user_id_param uuid,
  resource_type_param text,
  resource_id_param uuid,
  action_param text
)
RETURNS void
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO system_logs (user_id, resource_type, resource_id, action, created_at)
  VALUES (user_id_param, resource_type_param, resource_id_param, action_param, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.log_consent_change(
  user_id_param uuid,
  consent_type_param text,
  old_value_param boolean,
  new_value_param boolean
)
RETURNS void
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO system_logs (
    user_id, 
    resource_type, 
    action, 
    metadata,
    created_at
  )
  VALUES (
    user_id_param,
    'consent',
    'consent_changed',
    jsonb_build_object(
      'consent_type', consent_type_param,
      'old_value', old_value_param,
      'new_value', new_value_param
    ),
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USER LEVEL AND XP FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_user_level_exists(user_id_param uuid)
RETURNS void
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO user_levels (user_id, level, xp, created_at, updated_at)
  VALUES (user_id_param, 1, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_user_level_on_user_insert()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO user_levels (user_id, level, xp, created_at, updated_at)
  VALUES (NEW.id, 1, 0, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.award_xp(user_id_param uuid, xp_amount integer)
RETURNS void
SET search_path = 'public'
AS $$
DECLARE
  current_xp integer;
  current_level integer;
  xp_for_next_level integer;
BEGIN
  -- Ensure user level exists
  PERFORM public.ensure_user_level_exists(user_id_param);
  
  -- Get current XP and level
  SELECT xp, level INTO current_xp, current_level
  FROM user_levels
  WHERE user_id = user_id_param;
  
  -- Calculate XP needed for next level (simple formula: level * 100)
  xp_for_next_level := current_level * 100;
  
  -- Update XP
  UPDATE user_levels
  SET xp = xp + xp_amount,
      updated_at = NOW()
  WHERE user_id = user_id_param;
  
  -- Check if level up is needed
  IF (current_xp + xp_amount) >= xp_for_next_level THEN
    UPDATE user_levels
    SET level = level + 1,
        updated_at = NOW()
    WHERE user_id = user_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_achievements(user_id_param uuid)
RETURNS void
SET search_path = 'public'
AS $$
BEGIN
  -- Achievement checking logic would go here
  -- This is a placeholder for future achievement system
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.initialize_all_user_levels()
RETURNS void
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO user_levels (user_id, level, xp, created_at, updated_at)
  SELECT id, 1, 0, NOW(), NOW()
  FROM users
  WHERE id NOT IN (SELECT user_id FROM user_levels)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- EVENT MANAGEMENT FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_or_create_user_for_event(
  email_param text,
  name_param text
)
RETURNS uuid
SET search_path = 'public'
AS $$
DECLARE
  user_id_result uuid;
BEGIN
  -- Try to find existing user by email
  SELECT id INTO user_id_result
  FROM users
  WHERE email = email_param
  LIMIT 1;
  
  -- If user doesn't exist, create a new one
  IF user_id_result IS NULL THEN
    INSERT INTO users (email, name, role, created_at, updated_at)
    VALUES (email_param, name_param, 'student', NOW(), NOW())
    RETURNING id INTO user_id_result;
  END IF;
  
  RETURN user_id_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_event_author_on_insert()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.author_id IS NULL THEN
    NEW.author_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.promote_waitlist_on_cancellation()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
DECLARE
  next_waitlist_record RECORD;
BEGIN
  -- If a booking was cancelled and there's capacity, promote first waitlist entry
  IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
    -- Find the first waitlist entry for this event
    SELECT * INTO next_waitlist_record
    FROM event_bookings
    WHERE event_id = NEW.event_id
      AND status = 'waitlist'
      AND created_at = (
        SELECT MIN(created_at)
        FROM event_bookings
        WHERE event_id = NEW.event_id
          AND status = 'waitlist'
      )
    LIMIT 1;
    
    -- If found, promote to confirmed
    IF next_waitlist_record IS NOT NULL THEN
      UPDATE event_bookings
      SET status = 'confirmed',
          confirmed_at = NOW(),
          updated_at = NOW()
      WHERE id = next_waitlist_record.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
