-- Check your current user's role and ID
SELECT 
  p.id,
  p.email,
  p.role,
  p.name
FROM profiles p
WHERE p.id = auth.uid();

-- Check if you're admin or staff
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')) 
    THEN 'You are Admin/Staff - can see all bookings'
    ELSE 'You are Regular User - can only see your own bookings'
  END as permission_status;









