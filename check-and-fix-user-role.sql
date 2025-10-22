-- ============================================================================
-- CHECK AND FIX USER ROLE FOR PROPER RLS ACCESS
-- ============================================================================
-- This script checks your current user's role and sets it to admin if needed
-- ============================================================================

-- Check your current user's role
SELECT 
  auth.uid() as current_user_id,
  p.email,
  p.role,
  CASE 
    WHEN p.role IN ('admin', 'meded_team', 'ctf', 'educator', 'staff') 
    THEN '✅ You have admin access - can see all bookings'
    ELSE '❌ You are regular user - can only see your own bookings'
  END as access_status
FROM profiles p
WHERE p.id = auth.uid();

-- If you need admin access, uncomment and run this:
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE id = auth.uid();

-- Verify the change (run after updating role):
-- SELECT 
--   auth.uid() as current_user_id,
--   p.email,
--   p.role
-- FROM profiles p
-- WHERE p.id = auth.uid();
