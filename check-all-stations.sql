-- Simple query to check all stations in your Supabase database
-- Run this in your Supabase SQL Editor

-- Check all stations currently in the database
SELECT 
    slug,
    title
FROM stations 
ORDER BY slug;
