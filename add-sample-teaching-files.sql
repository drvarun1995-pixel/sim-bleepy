-- Add sample teaching files with recent dates for testing
-- Run this in Supabase SQL Editor

-- First, check if we have any events to link to
SELECT 'Available Events' as info, id, title, date FROM events ORDER BY date DESC LIMIT 5;

-- Insert sample resources with recent teaching dates
INSERT INTO resources (
  title,
  description,
  category,
  file_type,
  file_size,
  teaching_date,
  upload_date,
  taught_by,
  is_active,
  download_url,
  uploaded_by
) VALUES 
(
  'Cardiovascular Assessment Guide',
  'Comprehensive guide for cardiovascular system examination including heart sounds, murmurs, and pulse assessment techniques.',
  'clinical-skills',
  'application/pdf',
  2457600, -- 2.4 MB
  CURRENT_DATE - INTERVAL '5 days', -- 5 days ago
  CURRENT_DATE - INTERVAL '6 days',
  'Dr. Sarah Johnson',
  true,
  '/uploads/sample-cv-assessment.pdf',
  'admin'
),
(
  'Respiratory Examination Checklist',
  'Step-by-step checklist for respiratory system examination with common findings and differential diagnoses.',
  'clinical-skills',
  'application/pdf',
  1830400, -- 1.8 MB
  CURRENT_DATE - INTERVAL '3 days', -- 3 days ago
  CURRENT_DATE - INTERVAL '4 days',
  'Dr. Michael Chen',
  true,
  '/uploads/sample-respiratory-exam.pdf',
  'admin'
),
(
  'OSCE Station Practice Videos',
  'Video recordings of common OSCE stations with expert commentary and scoring rubrics.',
  'osce-revision',
  'video/mp4',
  52428800, -- 50 MB
  CURRENT_DATE - INTERVAL '1 day', -- 1 day ago
  CURRENT_DATE - INTERVAL '2 days',
  'Dr. Emma Wilson',
  true,
  '/uploads/sample-osce-videos.mp4',
  'admin'
),
(
  'Bedside Teaching Session Notes',
  'Clinical teaching notes from recent bedside teaching sessions covering common presentations.',
  'bedside-teaching',
  'application/pdf',
  1024000, -- 1 MB
  CURRENT_DATE - INTERVAL '7 days', -- 7 days ago
  CURRENT_DATE - INTERVAL '8 days',
  'Dr. James Brown',
  true,
  '/uploads/sample-bedside-notes.pdf',
  'admin'
),
(
  'Foundation Year Teaching Materials',
  'Essential teaching materials for foundation year doctors including clinical guidelines and protocols.',
  'core-teachings',
  'application/pdf',
  3145728, -- 3 MB
  CURRENT_DATE - INTERVAL '2 days', -- 2 days ago
  CURRENT_DATE - INTERVAL '3 days',
  'Dr. Lisa Davis',
  true,
  '/uploads/sample-fy-materials.pdf',
  'admin'
);

-- Now link these resources to some events (if events exist)
-- First, get some recent events
WITH recent_events AS (
  SELECT id, title FROM events 
  WHERE date >= CURRENT_DATE - INTERVAL '14 days'
  ORDER BY date DESC
  LIMIT 3
),
sample_resources AS (
  SELECT id, title FROM resources 
  WHERE teaching_date >= CURRENT_DATE - INTERVAL '7 days'
  ORDER BY teaching_date DESC
  LIMIT 5
)
-- Link resources to events (many-to-many relationship)
INSERT INTO resource_events (resource_id, event_id)
SELECT 
  sr.id as resource_id,
  re.id as event_id
FROM sample_resources sr
CROSS JOIN recent_events re
ON CONFLICT (resource_id, event_id) DO NOTHING;

-- Check what we created
SELECT 'Created Resources' as info,
  r.id,
  r.title,
  r.teaching_date,
  r.category,
  r.is_active,
  COUNT(re.event_id) as linked_events_count
FROM resources r
LEFT JOIN resource_events re ON r.id = re.resource_id
WHERE r.teaching_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY r.id, r.title, r.teaching_date, r.category, r.is_active
ORDER BY r.teaching_date DESC;
