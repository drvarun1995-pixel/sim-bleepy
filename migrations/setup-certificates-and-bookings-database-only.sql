-- =====================================================
-- DATABASE SETUP: CERTIFICATES + BOOKINGS + RLS
-- =====================================================
-- This script sets up the database tables and RLS policies only
-- Storage bucket already exists, so this focuses on database setup
-- =====================================================

-- Start transaction for safety
BEGIN;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'SETTING UP CERTIFICATES + BOOKINGS DATABASE';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'This will create:';
  RAISE NOTICE '  ✓ Certificates tables with RLS';
  RAISE NOTICE '  ✓ Booking system with RLS';
  RAISE NOTICE '  ✓ All necessary tables and policies';
  RAISE NOTICE '  ✓ Storage bucket already exists - skipping';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PART 1: CERTIFICATES SYSTEM
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'PART 1/2: Creating Certificates System...';
END $$;

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES event_bookings(id) ON DELETE SET NULL,
  
  -- Template & Generation Info
  template_id TEXT NOT NULL,
  template_name TEXT,
  
  -- Certificate Data (stores the actual values used for generation)
  certificate_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- File Storage
  certificate_url TEXT NOT NULL,
  certificate_filename TEXT NOT NULL,
  
  -- Email Status
  sent_via_email BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_error TEXT,
  
  -- Generation Metadata
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(event_id, user_id)
);

-- Create certificate templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on certificates tables
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- Certificates RLS Policies
CREATE POLICY "Users can view own certificates"
  ON certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all certificates"
  ON certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'educator', 'meded_team', 'ctf')
    )
  );

CREATE POLICY "Staff can create certificates"
  ON certificates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

CREATE POLICY "Staff can update certificates"
  ON certificates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

CREATE POLICY "Admins can delete certificates"
  ON certificates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Certificate Templates RLS Policies
CREATE POLICY "Users can view own templates"
  ON certificate_templates FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all templates"
  ON certificate_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can create templates"
  ON certificate_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates"
  ON certificate_templates FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own templates"
  ON certificate_templates FOR DELETE
  USING (auth.uid() = created_by);

-- =====================================================
-- PART 2: BOOKING SYSTEM
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'PART 2/2: Creating Booking System...';
END $$;

-- Add booking columns to events table (if not exist)
DO $$
BEGIN
  -- Add booking_enabled column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'booking_enabled'
  ) THEN
    ALTER TABLE events ADD COLUMN booking_enabled BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add booking_button_label column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'booking_button_label'
  ) THEN
    ALTER TABLE events ADD COLUMN booking_button_label VARCHAR(50) DEFAULT 'Register';
  END IF;

  -- Add booking_capacity column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'booking_capacity'
  ) THEN
    ALTER TABLE events ADD COLUMN booking_capacity INTEGER;
  END IF;

  -- Add booking_deadline_hours column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'booking_deadline_hours'
  ) THEN
    ALTER TABLE events ADD COLUMN booking_deadline_hours INTEGER DEFAULT 1;
  END IF;

  -- Add allow_waitlist column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'allow_waitlist'
  ) THEN
    ALTER TABLE events ADD COLUMN allow_waitlist BOOLEAN DEFAULT TRUE;
  END IF;

  -- Add confirmation_checkbox_1_text column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'confirmation_checkbox_1_text'
  ) THEN
    ALTER TABLE events ADD COLUMN confirmation_checkbox_1_text TEXT DEFAULT 'I confirm my attendance at this event';
  END IF;

  -- Add confirmation_checkbox_1_required column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'confirmation_checkbox_1_required'
  ) THEN
    ALTER TABLE events ADD COLUMN confirmation_checkbox_1_required BOOLEAN DEFAULT TRUE;
  END IF;

  -- Add confirmation_checkbox_2_text column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'confirmation_checkbox_2_text'
  ) THEN
    ALTER TABLE events ADD COLUMN confirmation_checkbox_2_text TEXT;
  END IF;

  -- Add confirmation_checkbox_2_required column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'confirmation_checkbox_2_required'
  ) THEN
    ALTER TABLE events ADD COLUMN confirmation_checkbox_2_required BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create event_bookings table
CREATE TABLE IF NOT EXISTS event_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Booking details
  booking_status VARCHAR(20) DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'waitlist', 'cancelled', 'attended', 'no_show')),
  booking_notes TEXT,
  
  -- Confirmation checkboxes
  confirmation_1_checked BOOLEAN DEFAULT false,
  confirmation_2_checked BOOLEAN DEFAULT false,
  
  -- Timestamps
  booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  attended_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(event_id, user_id)
);

-- Create booking stats view
CREATE OR REPLACE VIEW booking_stats AS
SELECT 
  e.id as event_id,
  e.title as event_title,
  e.date as event_date,
  e.booking_capacity,
  COUNT(eb.id) as total_bookings,
  COUNT(eb.id) FILTER (WHERE eb.booking_status = 'confirmed') as confirmed_bookings,
  COUNT(eb.id) FILTER (WHERE eb.booking_status = 'waitlist') as waitlist_bookings,
  COUNT(eb.id) FILTER (WHERE eb.booking_status = 'cancelled') as cancelled_bookings,
  COUNT(eb.id) FILTER (WHERE eb.booking_status = 'attended') as attended_bookings,
  CASE 
    WHEN e.booking_capacity IS NULL THEN 'unlimited'
    WHEN COUNT(eb.id) FILTER (WHERE eb.booking_status = 'confirmed') >= e.booking_capacity THEN 'full'
    ELSE 'available'
  END as availability_status
FROM events e
LEFT JOIN event_bookings eb ON e.id = eb.event_id
WHERE e.booking_enabled = true
GROUP BY e.id, e.title, e.date, e.booking_capacity;

-- Enable RLS on booking table
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

-- Event Bookings RLS Policies
CREATE POLICY "Users can view own bookings"
  ON event_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all bookings"
  ON event_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'educator', 'meded_team', 'ctf')
    )
  );

CREATE POLICY "Users can create bookings"
  ON event_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON event_bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookings"
  ON event_bookings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can manage all bookings"
  ON event_bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that all tables were created
SELECT 
  'Tables Created' as check_type,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('certificates', 'certificate_templates', 'event_bookings')
ORDER BY tablename;

-- Check that views were created
SELECT 
  'Views Created' as check_type,
  viewname,
  '✅ CREATED' as status
FROM pg_views
WHERE schemaname = 'public' 
  AND viewname = 'booking_stats';

-- Check that policies were created
SELECT 
  'RLS Policies' as check_type,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('certificates', 'certificate_templates', 'event_bookings')
GROUP BY tablename
ORDER BY tablename;

-- Commit transaction
COMMIT;

-- =====================================================
-- SUMMARY
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ DATABASE SETUP COMPLETE!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 WHAT WAS CREATED:';
  RAISE NOTICE '';
  RAISE NOTICE '🏆 CERTIFICATES SYSTEM:';
  RAISE NOTICE '  ✓ certificates table (with RLS)';
  RAISE NOTICE '  ✓ certificate_templates table (with RLS)';
  RAISE NOTICE '  ✓ 10 RLS policies for security';
  RAISE NOTICE '';
  RAISE NOTICE '📅 BOOKING SYSTEM:';
  RAISE NOTICE '  ✓ 9 booking columns added to events table';
  RAISE NOTICE '  ✓ event_bookings table (with RLS)';
  RAISE NOTICE '  ✓ booking_stats view';
  RAISE NOTICE '  ✓ 6 RLS policies for security';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 SECURITY:';
  RAISE NOTICE '  ✓ All tables have RLS enabled';
  RAISE NOTICE '  ✓ Role-based access control';
  RAISE NOTICE '  ✓ Users can only see their own data';
  RAISE NOTICE '  ✓ Staff can manage all data';
  RAISE NOTICE '';
  RAISE NOTICE '📝 STORAGE:';
  RAISE NOTICE '  ✓ certificates bucket already exists';
  RAISE NOTICE '  ✓ You may need to add storage policies manually';
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Both systems are now ready to use! 🚀';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
END $$;



