-- Fix the events_with_details view to include multiple categories
-- Run this in your Supabase SQL Editor

-- Drop the existing view
DROP VIEW IF EXISTS public.events_with_details CASCADE;

-- Recreate the view with multiple categories support
CREATE VIEW public.events_with_details
WITH (security_invoker = true) AS
SELECT 
    e.*,
    c.name as category_name,
    c.color as category_color,
    f.name as format_name,
    f.color as format_color,
    l.name as location_name,
    o.name as organizer_name,
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'id', s.id,
                'name', s.name,
                'role', s.role
            )
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'::json
    ) as speakers,
    -- Add multiple categories from junction table
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'id', cat.id,
                'name', cat.name,
                'color', cat.color
            )
        ) FILTER (WHERE cat.id IS NOT NULL),
        '[]'::json
    ) as categories,
    -- Add multiple locations from junction table
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'id', loc.id,
                'name', loc.name,
                'address', loc.address
            )
        ) FILTER (WHERE loc.id IS NOT NULL),
        '[]'::json
    ) as locations,
    -- Add multiple organizers from junction table
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'id', org.id,
                'name', org.name
            )
        ) FILTER (WHERE org.id IS NOT NULL),
        '[]'::json
    ) as organizers
FROM public.events e
LEFT JOIN public.categories c ON e.category_id = c.id
LEFT JOIN public.formats f ON e.format_id = f.id
LEFT JOIN public.locations l ON e.location_id = l.id
LEFT JOIN public.organizers o ON e.organizer_id = o.id
LEFT JOIN public.event_speakers es ON e.id = es.event_id
LEFT JOIN public.speakers s ON es.speaker_id = s.id
-- Add joins for junction tables
LEFT JOIN public.event_categories ec ON e.id = ec.event_id
LEFT JOIN public.categories cat ON ec.category_id = cat.id
LEFT JOIN public.event_locations el ON e.id = el.event_id
LEFT JOIN public.locations loc ON el.location_id = loc.id
LEFT JOIN public.event_organizers eo ON e.id = eo.event_id
LEFT JOIN public.organizers org ON eo.organizer_id = org.id
GROUP BY e.id, c.name, c.color, f.name, f.color, l.name, o.name;

-- Verify the view was created successfully
SELECT 'events_with_details view recreated successfully' as status;
