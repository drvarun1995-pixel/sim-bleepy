-- Fix Challenges Table Security
-- First, let's check the table structure and create appropriate policies

-- Enable RLS on challenges table
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Create a basic policy that allows all authenticated users to access challenges
-- (Adjust this based on your actual table structure)
CREATE POLICY "Authenticated users can view challenges" ON public.challenges
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert challenges" ON public.challenges
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update challenges" ON public.challenges
    FOR UPDATE USING (auth.role() = 'authenticated');

-- If you need more restrictive access, you can modify these policies later
-- based on your actual table structure and business requirements
