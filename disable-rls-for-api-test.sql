-- Temporarily disable RLS to test the API route approach
ALTER TABLE event_bookings DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT COUNT(*) as total_bookings FROM event_bookings;










