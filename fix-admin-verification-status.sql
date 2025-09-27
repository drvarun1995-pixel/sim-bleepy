-- Fix admin verification status
-- This script ensures the admin user (drvarun1995@gmail.com) is marked as verified

-- First, let's check the current status
SELECT id, email, name, role, email_verified, created_at 
FROM users 
WHERE email = 'drvarun1995@gmail.com';

-- Update the admin user to be verified
UPDATE users 
SET email_verified = true, updated_at = NOW()
WHERE email = 'drvarun1995@gmail.com';

-- Verify the update
SELECT id, email, name, role, email_verified, created_at, updated_at
FROM users 
WHERE email = 'drvarun1995@gmail.com';

-- Check all users' verification status
SELECT id, email, name, role, email_verified, created_at
FROM users 
ORDER BY created_at DESC;
