-- Check if consent fields exist in users table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN (
    'consent_given', 
    'consent_timestamp', 
    'consent_version', 
    'marketing_consent', 
    'analytics_consent'
)
ORDER BY column_name;

-- Also show all columns in users table to see the full structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
