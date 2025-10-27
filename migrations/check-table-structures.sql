-- =====================================================
-- CHECK ACTUAL TABLE STRUCTURES
-- =====================================================
-- Let's see what columns actually exist in each table
-- =====================================================

-- Check speakers table structure
SELECT 'SPEAKERS TABLE' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'speakers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check organizers table structure
SELECT 'ORGANIZERS TABLE' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'organizers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check categories table structure
SELECT 'CATEGORIES TABLE' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'categories' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check formats table structure
SELECT 'FORMATS TABLE' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'formats' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check locations table structure
SELECT 'LOCATIONS TABLE' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'locations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check teaching_requests table structure
SELECT 'TEACHING_REQUESTS TABLE' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'teaching_requests' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check file_requests table structure
SELECT 'FILE_REQUESTS TABLE' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'file_requests' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check announcements table structure
SELECT 'ANNOUNCEMENTS TABLE' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'announcements' AND table_schema = 'public'
ORDER BY ordinal_position;




