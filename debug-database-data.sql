-- Debug script to check if there's actual data in the database
-- Run this in your Supabase SQL Editor to see what's in the tables

-- Check users table
SELECT 'Users Table' as table_name, COUNT(*) as count FROM users;
SELECT 'Sample Users' as info, id, email, name FROM users LIMIT 5;

-- Check stations table  
SELECT 'Stations Table' as table_name, COUNT(*) as count FROM stations;
SELECT 'Sample Stations' as info, slug, title FROM stations LIMIT 5;

-- Check attempts table
SELECT 'Attempts Table' as table_name, COUNT(*) as count FROM attempts;
SELECT 'Sample Attempts' as info, id, user_id, station_slug FROM attempts LIMIT 5;

-- Check if user_id in attempts matches users table
SELECT 'User ID Mismatch Check' as info, 
  COUNT(*) as total_attempts,
  COUNT(u.id) as attempts_with_valid_users
FROM attempts a
LEFT JOIN users u ON a.user_id = u.id;

-- Check if station_slug in attempts matches stations table
SELECT 'Station Slug Mismatch Check' as info,
  COUNT(*) as total_attempts, 
  COUNT(s.slug) as attempts_with_valid_stations
FROM attempts a
LEFT JOIN stations s ON a.station_slug = s.slug;

