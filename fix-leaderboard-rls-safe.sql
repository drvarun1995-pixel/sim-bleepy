-- Safe RLS fix for leaderboard functionality
-- This script handles existing policies gracefully

-- Drop existing policies first (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view their own gamification data" ON user_levels;
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view their own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can view their own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can view their own leaderboard data" ON leaderboards;
DROP POLICY IF EXISTS "Users can view their own challenge participation" ON user_challenges;
DROP POLICY IF EXISTS "Users can view their own XP transactions" ON xp_transactions;

-- Drop existing service role policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Service role can read all user levels" ON user_levels;
DROP POLICY IF EXISTS "Service role can read all user achievements" ON user_achievements;
DROP POLICY IF EXISTS "Service role can read all user skills" ON user_skills;
DROP POLICY IF EXISTS "Service role can read all user streaks" ON user_streaks;
DROP POLICY IF EXISTS "Service role can read all leaderboard data" ON leaderboards;
DROP POLICY IF EXISTS "Service role can read all user challenges" ON user_challenges;
DROP POLICY IF EXISTS "Service role can read all XP transactions" ON xp_transactions;

-- Drop existing public policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Public can read user levels for leaderboard" ON user_levels;
DROP POLICY IF EXISTS "Public can read achievements" ON achievements;
DROP POLICY IF EXISTS "Public can read user achievements for leaderboard" ON user_achievements;
DROP POLICY IF EXISTS "Public can read users for leaderboard" ON users;

-- Now create the policies fresh
-- Service role policies (bypasses RLS completely)
CREATE POLICY "Service role can read all user levels" ON user_levels
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can read all user achievements" ON user_achievements
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can read all user skills" ON user_skills
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can read all user streaks" ON user_streaks
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can read all leaderboard data" ON leaderboards
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can read all user challenges" ON user_challenges
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can read all XP transactions" ON xp_transactions
  FOR SELECT USING (auth.role() = 'service_role');

-- Public read access for leaderboard functionality
CREATE POLICY "Public can read user levels for leaderboard" ON user_levels
  FOR SELECT USING (true);

CREATE POLICY "Public can read achievements" ON achievements
  FOR SELECT USING (true);

CREATE POLICY "Public can read user achievements for leaderboard" ON user_achievements
  FOR SELECT USING (true);

-- Ensure users table is accessible for leaderboard
CREATE POLICY "Public can read users for leaderboard" ON users
  FOR SELECT USING (true);

-- Add policies for user-specific data (users can still see their own)
CREATE POLICY "Users can view their own gamification data" ON user_levels
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own skills" ON user_skills
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own streaks" ON user_streaks
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own leaderboard data" ON leaderboards
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own challenge participation" ON user_challenges
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own XP transactions" ON xp_transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);







