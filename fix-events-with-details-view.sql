-- Fix the events_with_details view to properly join locations
-- Run this in your Supabase SQL Editor

-- Drop and recreate the view with proper location join
DROP VIEW IF EXISTS public.events_with_details;

CREATE OR REPLACE VIEW public.events_with_details AS
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
    ) as speakers
FROM public.events e
LEFT JOIN public.categories c ON e.category_id = c.id
LEFT JOIN public.formats f ON e.format_id = f.id
LEFT JOIN public.locations l ON e.location_id = l.id
LEFT JOIN public.organizers o ON e.organizer_id = o.id
LEFT JOIN public.event_speakers es ON e.id = es.event_id
LEFT JOIN public.speakers s ON es.speaker_id = s.id
GROUP BY e.id, c.name, c.color, f.name, f.color, l.name, o.name;

-- Grant permissions
GRANT SELECT ON public.events_with_details TO anon, authenticated;

