-- Fix Supabase Security Issues
-- This script safely handles existing policies and fixes security issues

-- First, let's check what policies already exist and only create missing ones
-- We'll use IF NOT EXISTS approach where possible

-- Enable RLS on gamification tables (safe to run multiple times)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them properly
-- This ensures we have the correct policies without conflicts

-- Drop existing policies for user_achievements
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can update their own achievements" ON public.user_achievements;

-- Drop existing policies for user_levels
DROP POLICY IF EXISTS "Users can view their own levels" ON public.user_levels;
DROP POLICY IF EXISTS "Users can insert their own levels" ON public.user_levels;
DROP POLICY IF EXISTS "Users can update their own levels" ON public.user_levels;

-- Drop existing policies for user_skills
DROP POLICY IF EXISTS "Users can view their own skills" ON public.user_skills;
DROP POLICY IF EXISTS "Users can insert their own skills" ON public.user_skills;
DROP POLICY IF EXISTS "Users can update their own skills" ON public.user_skills;

-- Drop existing policies for user_streaks
DROP POLICY IF EXISTS "Users can view their own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Users can insert their own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Users can update their own streaks" ON public.user_streaks;

-- Drop existing policies for xp_transactions
DROP POLICY IF EXISTS "Users can view their own XP transactions" ON public.xp_transactions;
DROP POLICY IF EXISTS "Users can insert their own XP transactions" ON public.xp_transactions;

-- Drop existing policies for achievements
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.achievements;

-- Now create the policies properly
-- Achievements table (read-only for all users)
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements
    FOR SELECT USING (true);

-- User achievements (users can only see their own)
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" ON public.user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- User levels (users can only see their own)
CREATE POLICY "Users can view their own levels" ON public.user_levels
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own levels" ON public.user_levels
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own levels" ON public.user_levels
    FOR UPDATE USING (auth.uid() = user_id);

-- User skills (users can only see their own)
CREATE POLICY "Users can view their own skills" ON public.user_skills
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills" ON public.user_skills
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills" ON public.user_skills
    FOR UPDATE USING (auth.uid() = user_id);

-- User streaks (users can only see their own)
CREATE POLICY "Users can view their own streaks" ON public.user_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" ON public.user_streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON public.user_streaks
    FOR UPDATE USING (auth.uid() = user_id);

-- XP transactions (users can only see their own)
CREATE POLICY "Users can view their own XP transactions" ON public.xp_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP transactions" ON public.xp_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix function security by setting search_path
ALTER FUNCTION public.cleanup_expired_tokens() SET search_path = '';
ALTER FUNCTION public.log_consent_change(TEXT, TEXT, TEXT) SET search_path = '';
ALTER FUNCTION public.log_data_access(TEXT, TEXT, TEXT) SET search_path = '';
ALTER FUNCTION public.get_usage_summary(TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) SET search_path = '';
ALTER FUNCTION public.calculate_level_from_xp(INTEGER) SET search_path = '';
ALTER FUNCTION public.check_achievements(UUID) SET search_path = '';
ALTER FUNCTION public.award_xp(UUID, INTEGER, VARCHAR(50), UUID, VARCHAR(50), TEXT) SET search_path = '';
ALTER FUNCTION public.update_users_updated_at() SET search_path = '';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Security fixes applied successfully!';
END $$;
