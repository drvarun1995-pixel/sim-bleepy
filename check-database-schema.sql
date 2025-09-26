-- Check if the 'used' column exists in password_reset_tokens table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'password_reset_tokens' 
ORDER BY ordinal_position;
