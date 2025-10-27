-- Check if QR code related tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('event_qr_codes', 'qr_code_scans')
ORDER BY table_name;



