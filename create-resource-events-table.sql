-- Junction table to link resources with events
-- This allows a resource to be associated with multiple events

CREATE TABLE IF NOT EXISTS public.resource_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique resource-event pairs
  UNIQUE(resource_id, event_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_resource_events_resource_id ON public.resource_events(resource_id);
CREATE INDEX idx_resource_events_event_id ON public.resource_events(event_id);

-- Enable Row Level Security
ALTER TABLE public.resource_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Authenticated users can view resource-event associations
CREATE POLICY "Allow viewing resource-event associations"
ON public.resource_events
FOR SELECT
TO authenticated
USING (true);

-- Admins can insert associations
CREATE POLICY "Allow admin insert resource-event associations"
ON public.resource_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can delete associations
CREATE POLICY "Allow admin delete resource-event associations"
ON public.resource_events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- IMPORTANT: Run this SQL in your Supabase SQL Editor
-- This will create the junction table that links resources to events

