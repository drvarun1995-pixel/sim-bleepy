-- Add featured_image column to events table
-- This column stores the storage path to the featured image for the event

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS featured_image TEXT;

-- Add comment to document the column
COMMENT ON COLUMN events.featured_image IS 'Storage path to the featured image for the event (e.g., {eventId}/images/featured.webp)';

