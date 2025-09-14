-- Check what's actually in the database for existing records
-- Run this in Supabase SQL Editor

-- Check the specific user that appears in attempts
SELECT 'User Data Check' as info, id, email, name, created_at, updated_at 
FROM users 
WHERE id = '0404b204-af4c-48ea-bbe8-a35fea1cd0f2';

-- Check the chest-pain station
SELECT 'Station Data Check' as info, slug, title 
FROM stations 
WHERE slug = 'chest-pain';

-- Check all users
SELECT 'All Users' as info, COUNT(*) as count FROM users;
SELECT 'Sample Users' as info, id, email, name FROM users LIMIT 5;

-- Check all stations  
SELECT 'All Stations' as info, COUNT(*) as count FROM stations;
SELECT 'Sample Stations' as info, slug, title FROM stations LIMIT 5;

