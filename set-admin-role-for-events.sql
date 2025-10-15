-- =====================================================
-- SET ADMIN ROLE FOR EVENTS SYSTEM
-- =====================================================
-- This script checks and sets your admin role so you can delete categories/formats

-- =====================================================
-- STEP 1: Check your current user info
-- =====================================================
SELECT 
    id,
    email,
    role,
    created_at
FROM public.users
WHERE id = auth.uid();

-- If the above shows NULL for role or doesn't show 'admin', continue to Step 2

-- =====================================================
-- STEP 2: Find your user by email and set admin role
-- =====================================================
-- Replace 'your-email@example.com' with your actual email address

UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- =====================================================
-- STEP 3: Verify the change worked
-- =====================================================
SELECT 
    id,
    email,
    role,
    updated_at
FROM public.users
WHERE email = 'your-email@example.com';

-- You should now see role = 'admin'

-- =====================================================
-- STEP 4: Check all admin users (optional)
-- =====================================================
SELECT 
    id,
    email,
    role,
    created_at
FROM public.users
WHERE role = 'admin'
ORDER BY created_at DESC;

-- =====================================================
-- ALTERNATIVE: If you don't know your exact email
-- =====================================================
-- Run this to see all users:
SELECT 
    id,
    email,
    role
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- Then use the UPDATE statement above with the correct email





















































