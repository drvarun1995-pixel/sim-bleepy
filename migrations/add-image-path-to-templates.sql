-- Add image_path column to certificate_templates table
-- This will store the Supabase Storage path instead of base64 data

ALTER TABLE certificate_templates 
ADD COLUMN image_path TEXT;

-- Add comment to clarify the new column
COMMENT ON COLUMN certificate_templates.image_path IS 'Path to the image file in Supabase Storage (e.g., template-images/1234567890-image.png)';

-- Create an index on image_path for better query performance
CREATE INDEX idx_certificate_templates_image_path ON certificate_templates(image_path);

-- Optional: You can migrate existing data by updating the image_path column
-- based on the background_image data, but for now we'll keep both columns
-- to maintain backward compatibility during the transition








