-- Ensure all users are properly set up and have correct roles
-- Run this in your Supabase SQL Editor

-- Check current user setup
SELECT 
    id,
    email,
    name,
    role,
    created_at,
    CASE 
        WHEN role IS NULL THEN 'MISSING ROLE'
        WHEN role = 'user' THEN 'DEFAULT ROLE'
        ELSE 'HAS ROLE'
    END as role_status
FROM public.users
ORDER BY created_at DESC;

-- Ensure all users have a role (set default if missing)
UPDATE public.users 
SET role = 'user'
WHERE role IS NULL;

-- Set appropriate roles based on email patterns
UPDATE public.users 
SET role = 'meded_team'
WHERE email LIKE '%@ctf%' 
   OR email LIKE '%@meded%'
   OR email LIKE '%@education%'
   OR name LIKE '%Dr.%'
   OR name LIKE '%Varun%';

-- Set admin role for specific users (adjust as needed)
UPDATE public.users 
SET role = 'admin'
WHERE email = 'drvarun19@gmail.com'  -- Adjust this email as needed
   OR email LIKE '%varun%';

-- Verify the changes
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- Check if there are any events still missing author information
SELECT 
    COUNT(*) as events_missing_author
FROM public.events 
WHERE author_id IS NULL 
   OR author_name IS NULL 
   OR author_name = 'Unknown User';

-- Summary
SELECT 'User setup verification complete!' as status;

