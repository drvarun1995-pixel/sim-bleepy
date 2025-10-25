-- Check what formats currently exist in your database
SELECT 
    id,
    name,
    slug,
    description,
    color,
    created_at
FROM formats 
ORDER BY name;


