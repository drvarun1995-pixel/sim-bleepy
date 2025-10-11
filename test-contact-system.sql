-- Test script to verify the contact system is working
-- Run this after creating the contact_messages table

-- 1. Check if the table exists and has the correct structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contact_messages'
ORDER BY ordinal_position;

-- 2. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'contact_messages';

-- 3. Test insert (this should work for anyone)
INSERT INTO contact_messages (name, email, subject, category, message) VALUES
(
    'Test User',
    'test@example.com',
    'Test Message',
    'general',
    'This is a test message to verify the contact system is working correctly.'
);

-- 4. Check if the message was inserted
SELECT * FROM contact_messages WHERE email = 'test@example.com';

-- 5. Test update (this should only work for admins)
-- Note: This will fail for non-admin users due to RLS
UPDATE contact_messages 
SET status = 'read', admin_notes = 'Test admin note'
WHERE email = 'test@example.com';

-- 6. Verify the update
SELECT * FROM contact_messages WHERE email = 'test@example.com';

-- 7. Clean up test data
DELETE FROM contact_messages WHERE email = 'test@example.com';

-- 8. Verify cleanup
SELECT COUNT(*) as remaining_test_messages FROM contact_messages WHERE email = 'test@example.com';
