-- Check what QR-related columns exist in events table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
AND (column_name LIKE '%qr%' OR column_name LIKE '%attendance%')
ORDER BY column_name;



