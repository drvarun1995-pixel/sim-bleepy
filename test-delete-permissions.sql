-- =====================================================
-- TEST DELETE PERMISSIONS - RUN EACH SECTION ONE AT A TIME
-- =====================================================

-- SECTION 1: Check if you're authenticated
SELECT 
    auth.uid() as your_user_id,
    auth.email() as your_email;
-- You should see your user ID and email

-- SECTION 2: Check if you exist in users table and your role
SELECT 
    id,
    email,
    role,
    created_at
FROM public.users
WHERE id = auth.uid();
-- You should see your user with role = 'admin'

-- SECTION 3: Try to manually delete a test category
-- First, create a test category
INSERT INTO public.categories (name, slug, description, color)
VALUES ('TEST DELETE ME', 'test-delete-me', 'This is a test', '#FF0000')
RETURNING *;
-- Copy the 'id' from the result

-- SECTION 4: Now try to delete it (replace 'PASTE-ID-HERE' with the actual ID from above)
DELETE FROM public.categories 
WHERE id = 'PASTE-ID-HERE';
-- If this works, the problem is in the frontend code
-- If this FAILS, you'll see an error message about permissions

-- SECTION 5: Check what policies exist on categories
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'categories';

-- SECTION 6: If nothing works, temporarily disable RLS to test
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.formats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers DISABLE ROW LEVEL SECURITY;

-- Now try deleting from the web app. If it works, the issue is RLS policies.
-- DON'T FORGET TO RE-ENABLE RLS AFTER TESTING:
-- ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.formats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;






