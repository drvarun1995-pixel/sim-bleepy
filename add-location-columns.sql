-- Add missing columns to locations table
-- Run this in your Supabase SQL editor

-- Add address column
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add latitude column  
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);

-- Add longitude column
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update existing records to have default values if needed
UPDATE locations 
SET address = name 
WHERE address IS NULL OR address = '';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'locations' 
ORDER BY ordinal_position;


