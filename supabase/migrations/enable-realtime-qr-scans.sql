-- Enable realtime for qr_code_scans table
-- This allows the table to send real-time updates when data changes

-- Enable realtime for qr_code_scans table
ALTER PUBLICATION supabase_realtime ADD TABLE qr_code_scans;

-- Add comment for documentation
COMMENT ON TABLE qr_code_scans IS 'QR code scans table with realtime enabled for live attendance updates';
