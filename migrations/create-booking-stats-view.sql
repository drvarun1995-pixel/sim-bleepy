-- ============================================================================
-- CREATE BOOKING STATISTICS VIEW
-- ============================================================================
-- This migration creates a view for easy access to booking statistics
-- 
-- Features:
-- - Shows booking counts by status for each event
-- - Calculates available slots based on capacity
-- - Only includes events with booking enabled
-- - Optimized for admin dashboard queries
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Creating Booking Statistics View';
  RAISE NOTICE '========================================';
END $$;

-- Create or replace the booking statistics view
CREATE OR REPLACE VIEW event_booking_stats AS
SELECT 
  e.id as event_id,
  e.title,
  e.date,
  e.start_time,
  e.end_time,
  e.booking_capacity,
  e.booking_enabled,
  e.booking_button_label,
  e.booking_deadline_hours,
  e.allow_waitlist,
  
  -- Booking counts by status
  COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END) as confirmed_count,
  COUNT(CASE WHEN eb.status = 'waitlist' THEN 1 END) as waitlist_count,
  COUNT(CASE WHEN eb.status = 'cancelled' THEN 1 END) as cancelled_count,
  COUNT(CASE WHEN eb.status = 'attended' THEN 1 END) as attended_count,
  COUNT(CASE WHEN eb.status = 'no-show' THEN 1 END) as no_show_count,
  
  -- Total bookings (excluding cancelled)
  COUNT(CASE WHEN eb.status IN ('confirmed', 'waitlist', 'attended', 'no-show') THEN 1 END) as total_bookings,
  
  -- Available slots calculation
  CASE 
    WHEN e.booking_capacity IS NULL THEN NULL  -- Unlimited capacity
    ELSE GREATEST(0, e.booking_capacity - COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END))
  END as available_slots,
  
  -- Capacity utilization percentage
  CASE 
    WHEN e.booking_capacity IS NULL THEN NULL
    WHEN e.booking_capacity = 0 THEN 0
    ELSE ROUND(
      (COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END)::DECIMAL / e.booking_capacity) * 100, 
      1
    )
  END as capacity_utilization_percent,
  
  -- Booking status summary
  CASE 
    WHEN e.booking_capacity IS NULL THEN 'unlimited'
    WHEN COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END) >= e.booking_capacity THEN 'full'
    WHEN COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END) >= (e.booking_capacity * 0.8) THEN 'almost_full'
    ELSE 'available'
  END as booking_status

FROM events e
LEFT JOIN event_bookings eb ON e.id = eb.event_id
WHERE e.booking_enabled = TRUE  -- Only show events with booking enabled
GROUP BY 
  e.id, 
  e.title, 
  e.date, 
  e.start_time, 
  e.end_time, 
  e.booking_capacity, 
  e.booking_enabled,
  e.booking_button_label,
  e.booking_deadline_hours,
  e.allow_waitlist;

-- Add comment
COMMENT ON VIEW event_booking_stats IS 'Provides booking statistics and capacity information for events with booking enabled';

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Booking Statistics View Created Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'View: event_booking_stats';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  - Booking counts by status (confirmed, waitlist, cancelled, etc.)';
  RAISE NOTICE '  - Available slots calculation';
  RAISE NOTICE '  - Capacity utilization percentage';
  RAISE NOTICE '  - Booking status summary (available, almost_full, full, unlimited)';
  RAISE NOTICE '  - Only includes events with booking enabled';
  RAISE NOTICE '  - Optimized for admin dashboard queries';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage examples:';
  RAISE NOTICE '  - Get all events with booking stats';
  RAISE NOTICE '  - Filter by booking status (full events, available events)';
  RAISE NOTICE '  - Calculate capacity utilization';
  RAISE NOTICE '========================================';
END $$;

