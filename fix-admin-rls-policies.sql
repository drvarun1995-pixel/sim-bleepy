-- Fix RLS policies to allow admin access to all data
-- This script adds admin-specific policies that allow the service role to bypass RLS

-- Add admin policy for users table - allow service role to read all users
CREATE POLICY "Service role can read all users" ON users
  FOR SELECT USING (auth.role() = 'service_role');

-- Add admin policy for attempts table - allow service role to read all attempts  
CREATE POLICY "Service role can read all attempts" ON attempts
  FOR SELECT USING (auth.role() = 'service_role');

-- Add admin policy for attempt_events table - allow service role to read all events
CREATE POLICY "Service role can read all attempt events" ON attempt_events
  FOR SELECT USING (auth.role() = 'service_role');

-- Note: Stations table already has "Stations are publicly readable" policy, so no change needed
