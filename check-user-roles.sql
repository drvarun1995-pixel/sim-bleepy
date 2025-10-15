-- Check all user roles in the database
SELECT 
    role,
    COUNT(*) as user_count
FROM users
WHERE role IS NOT NULL
GROUP BY role
ORDER BY role;

-- Check all unique roles (including NULL)
SELECT 
    CASE 
        WHEN role IS NULL THEN 'NULL (no role set)'
        ELSE role
    END as role_status,
    COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY role;

-- Check specific users and their roles
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

