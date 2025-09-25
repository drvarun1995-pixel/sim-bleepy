-- Check if all stations exist in the database
-- Run this query in your Supabase SQL Editor

-- 1. Check all stations currently in the database
SELECT 
    slug,
    title
FROM stations 
ORDER BY slug;

-- 2. Check specifically for our 4 expected stations
SELECT 
    CASE 
        WHEN slug = 'chest-pain' THEN '✅ Chest Pain'
        WHEN slug = 'falls-assessment' THEN '✅ Falls Assessment'
        WHEN slug = 'shortness-of-breath' THEN '✅ Shortness of Breath'
        WHEN slug = 'joint-pain-assessment' THEN '✅ Joint Pain Assessment'
        ELSE '❌ Unexpected: ' || slug
    END as station_status,
    slug,
    title
FROM stations 
WHERE slug IN ('chest-pain', 'falls-assessment', 'shortness-of-breath', 'joint-pain-assessment')
ORDER BY slug;

-- 3. Count total stations
SELECT COUNT(*) as total_stations FROM stations;

-- 4. Check if joint-pain-assessment specifically exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM stations WHERE slug = 'joint-pain-assessment') 
        THEN '✅ joint-pain-assessment EXISTS' 
        ELSE '❌ joint-pain-assessment MISSING' 
    END as joint_pain_status;

-- 5. Show any other stations that might exist
SELECT 
    'Other stations found:' as note,
    slug,
    title
FROM stations 
WHERE slug NOT IN ('chest-pain', 'falls-assessment', 'shortness-of-breath', 'joint-pain-assessment')
ORDER BY slug;
