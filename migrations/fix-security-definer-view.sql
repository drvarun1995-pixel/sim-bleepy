-- Fix SECURITY DEFINER issue on event_booking_stats view
-- This migration recreates the view without SECURITY DEFINER to ensure proper RLS enforcement

-- Drop the existing view
DROP VIEW IF EXISTS event_booking_stats;

-- Recreate the view without SECURITY DEFINER
-- This ensures RLS policies are enforced based on the querying user's permissions
CREATE VIEW event_booking_stats AS
SELECT 
    e.id as event_id,
    e.title,
    e.date,
    e.start_time,
    e.end_time,
    e.booking_enabled,
    e.booking_capacity,
    e.booking_button_label,
    e.booking_deadline_hours,
    e.allow_waitlist,
    
    -- Booking statistics
    COUNT(CASE WHEN eb.status = 'confirmed' AND eb.deleted_at IS NULL THEN 1 END) as confirmed_count,
    COUNT(CASE WHEN eb.status = 'waitlist' AND eb.deleted_at IS NULL THEN 1 END) as waitlist_count,
    COUNT(CASE WHEN eb.status = 'cancelled' AND eb.deleted_at IS NULL THEN 1 END) as cancelled_count,
    COUNT(CASE WHEN eb.status = 'attended' AND eb.deleted_at IS NULL THEN 1 END) as attended_count,
    COUNT(CASE WHEN eb.status = 'no-show' AND eb.deleted_at IS NULL THEN 1 END) as no_show_count,
    COUNT(CASE WHEN eb.deleted_at IS NULL THEN 1 END) as total_bookings,
    
    -- Available slots calculation
    CASE 
        WHEN e.booking_capacity IS NULL THEN NULL
        ELSE GREATEST(0, e.booking_capacity - COUNT(CASE WHEN eb.status = 'confirmed' AND eb.deleted_at IS NULL THEN 1 END))
    END as available_slots,
    
    -- Capacity utilization percentage
    CASE 
        WHEN e.booking_capacity IS NULL OR e.booking_capacity = 0 THEN NULL
        ELSE ROUND(
            (COUNT(CASE WHEN eb.status = 'confirmed' AND eb.deleted_at IS NULL THEN 1 END)::DECIMAL / e.booking_capacity) * 100, 
            2
        )
    END as capacity_utilization_percent

FROM events e
LEFT JOIN event_bookings eb ON e.id = eb.event_id
WHERE e.booking_enabled = true
GROUP BY e.id, e.title, e.date, e.start_time, e.end_time, e.booking_enabled, e.booking_capacity, e.booking_button_label, e.booking_deadline_hours, e.allow_waitlist
ORDER BY e.date ASC, e.start_time ASC;

-- Grant appropriate permissions to authenticated users
GRANT SELECT ON event_booking_stats TO authenticated;

-- Add RLS policy for the view (though views inherit RLS from underlying tables)
-- This ensures that users can only see booking stats for events they have access to
ALTER VIEW event_booking_stats SET (security_invoker = true);

-- Verify the view was created correctly
SELECT 
    schemaname, 
    viewname, 
    definition 
FROM pg_views 
WHERE viewname = 'event_booking_stats';
