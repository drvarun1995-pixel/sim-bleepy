-- Enhance Booking Features Migration
-- Adds support for: cancellation deadlines, role restrictions, manual approval, and pending status

-- Add new columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS cancellation_deadline_hours INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS allowed_roles TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_mode TEXT DEFAULT 'auto' CHECK (approval_mode IN ('auto', 'manual'));

-- Update event_bookings status constraint to include 'pending'
ALTER TABLE event_bookings DROP CONSTRAINT IF EXISTS event_bookings_status_check;
ALTER TABLE event_bookings ADD CONSTRAINT event_bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'waitlist', 'cancelled', 'attended', 'no-show'));

-- Add index for pending bookings for better query performance
CREATE INDEX IF NOT EXISTS idx_event_bookings_pending 
ON event_bookings(event_id, status) 
WHERE status = 'pending' AND deleted_at IS NULL;

-- Add index for role-based queries
CREATE INDEX IF NOT EXISTS idx_events_allowed_roles 
ON events USING GIN (allowed_roles) 
WHERE allowed_roles IS NOT NULL;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN ('cancellation_deadline_hours', 'allowed_roles', 'approval_mode')
ORDER BY column_name;


