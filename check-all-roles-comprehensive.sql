-- Comprehensive check of all roles in the database
-- This will show us exactly what roles exist and how many users have each role

-- 1. Check all unique roles with user counts
SELECT 
    role,
    COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY role;

-- 2. Check if specific roles exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE role = 'admin') 
        THEN 'admin role EXISTS'
        ELSE 'admin role DOES NOT EXIST'
    END as admin_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE role = 'educator') 
        THEN 'educator role EXISTS'
        ELSE 'educator role DOES NOT EXIST'
    END as educator_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE role = 'meded_team') 
        THEN 'meded_team role EXISTS'
        ELSE 'meded_team role DOES NOT EXIST'
    END as meded_team_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE role = 'ctf') 
        THEN 'ctf role EXISTS'
        ELSE 'ctf role DOES NOT EXIST'
    END as ctf_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE role = 'student') 
        THEN 'student role EXISTS'
        ELSE 'student role DOES NOT EXIST'
    END as student_status;

-- 3. Show all users with their roles (last 10)
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

