-- Fix RLS policies for leaderboard functionality
-- This script allows the leaderboard to show all users by adding service role access

-- Add service role policy for user_levels table to allow leaderboard access
CREATE POLICY "Service role can read all user levels" ON user_levels
  FOR SELECT USING (auth.role() = 'service_role');

-- Add service role policy for user_achievements table
CREATE POLICY "Service role can read all user achievements" ON user_achievements
  FOR SELECT USING (auth.role() = 'service_role');

-- Add service role policy for user_skills table  
CREATE POLICY "Service role can read all user skills" ON user_skills
  FOR SELECT USING (auth.role() = 'service_role');

-- Add service role policy for user_streaks table
CREATE POLICY "Service role can read all user streaks" ON user_streaks
  FOR SELECT USING (auth.role() = 'service_role');

-- Add service role policy for leaderboards table
CREATE POLICY "Service role can read all leaderboard data" ON leaderboards
  FOR SELECT USING (auth.role() = 'service_role');

-- Add service role policy for user_challenges table
CREATE POLICY "Service role can read all user challenges" ON user_challenges
  FOR SELECT USING (auth.role() = 'service_role');

-- Add service role policy for xp_transactions table
CREATE POLICY "Service role can read all XP transactions" ON xp_transactions
  FOR SELECT USING (auth.role() = 'service_role');

-- Also add a policy to allow public read access to user_levels for leaderboard
-- This allows the leaderboard API to work without service role
CREATE POLICY "Public can read user levels for leaderboard" ON user_levels
  FOR SELECT USING (true);

-- Add public read access to achievements table for leaderboard
CREATE POLICY "Public can read achievements" ON achievements
  FOR SELECT USING (true);

-- Add public read access to user_achievements for leaderboard
CREATE POLICY "Public can read user achievements for leaderboard" ON user_achievements
  FOR SELECT USING (true);








