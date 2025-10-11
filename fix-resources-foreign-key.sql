-- =====================================================
-- FIX RESOURCES TABLE FOREIGN KEY CONSTRAINT
-- =====================================================
-- The uploaded_by field was pointing to auth.users (Supabase auth)
-- but we're using NextAuth, so it should point to public.users

-- Drop the old foreign key constraint
ALTER TABLE public.resources 
DROP CONSTRAINT IF EXISTS resources_uploaded_by_fkey;

-- Add new foreign key constraint pointing to public.users
ALTER TABLE public.resources 
ADD CONSTRAINT resources_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) 
REFERENCES public.users(id) 
ON DELETE SET NULL;

-- Verify the constraint was updated
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.resources'::regclass
AND conname = 'resources_uploaded_by_fkey';























