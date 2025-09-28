// Gamification utility functions
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface XPTransaction {
  userId: string;
  xpAmount: number;
  transactionType: string;
  sourceId?: string;
  sourceType?: string;
  description?: string;
}

export interface AchievementCheck {
  userId: string;
  scenarioId?: string;
  score?: number;
  duration?: number;
}

/**
 * Award XP to a user
 */
export async function awardXP(transaction: XPTransaction): Promise<void> {
  try {
    console.log('💰 Calling award_xp RPC with:', transaction);
    
    const { data, error } = await supabase.rpc('award_xp', {
      p_user_id: transaction.userId,
      p_xp_amount: transaction.xpAmount,
      p_transaction_type: transaction.transactionType,
      p_source_id: transaction.sourceId || null,
      p_source_type: transaction.sourceType || null,
      p_description: transaction.description || null
    });

    if (error) {
      console.error('❌ Error awarding XP:', error);
      // Check if it's a function not found error
      if (error.code === '42883') {
        console.error('❌ Gamification functions not found. Please apply the gamification schema first.');
        return; // Don't throw, just log and continue
      }
      throw error;
    }

    console.log('✅ XP awarded successfully:', data);

    // Check for new achievements
    console.log('🔍 Checking for new achievements...');
    await checkAchievements({ userId: transaction.userId });
    console.log('✅ Achievement check completed');
  } catch (error) {
    console.error('❌ Error in awardXP:', error);
    // Don't throw the error to prevent breaking the main flow
    console.error('⚠️ Continuing without XP award due to error');
  }
}

/**
 * Check and award achievements for a user
 */
export async function checkAchievements(check: AchievementCheck): Promise<void> {
  try {
    const { error } = await supabase.rpc('check_achievements', {
      p_user_id: check.userId
    });

    if (error) {
      console.error('Error checking achievements:', error);
      // Don't throw, just log and continue
      if (error.code === '42883') {
        console.error('❌ Achievement checking function not found. Please apply the gamification schema first.');
        return;
      }
      console.error('⚠️ Continuing without achievement check due to error');
    }
  } catch (error) {
    console.error('Error in checkAchievements:', error);
    // Don't throw, just log and continue
    console.error('⚠️ Continuing without achievement check due to error');
  }
}

/**
 * Award XP for completing a scenario
 */
export async function awardScenarioXP(
  userId: string,
  scenarioId: string,
  score: number,
  duration: number,
  isFirstAttempt: boolean = false
): Promise<void> {
  try {
    console.log('🎮 Awarding scenario XP:', { userId, scenarioId, score, duration, isFirstAttempt });
    
    // New XP System Implementation
    // 1. Base XP per Domain Point: Each point scored (out of 12) = 8 XP
    const domainPoints = Math.round((score / 100) * 12); // Convert percentage to domain points
    const baseXP = domainPoints * 8; // 8 XP per domain point
    
    // 2. Completion Bonus: +10 XP for finishing
    const completionBonus = 10;
    
    // 3. Perfect Attempt Bonus: +25 XP for 12/12
    const perfectBonus = domainPoints === 12 ? 25 : 0;
    
    // Calculate total XP
    const totalXP = baseXP + completionBonus + perfectBonus;

    console.log('🎯 New XP Calculation:', {
      domainPoints: domainPoints,
      baseXP: baseXP,
      completionBonus: completionBonus,
      perfectBonus: perfectBonus,
      totalXP: totalXP,
      scorePercentage: score
    });

    // Award the XP
    console.log('🏆 Calling awardXP...');
    await awardXP({
      userId,
      xpAmount: totalXP,
      transactionType: 'scenario_complete',
      sourceId: undefined, // Changed from scenarioId to undefined since it's not a UUID
      sourceType: 'scenario',
      description: `Completed scenario: ${domainPoints}/12 points (${score}%)`
    });
    console.log('✅ awardXP completed');

    // Check for scenario-specific achievements
    console.log('🎖️ Checking scenario achievements...');
    await checkScenarioAchievements(userId, scenarioId, score, duration);
    console.log('✅ Scenario achievements checked');

  } catch (error) {
    console.error('❌ Error awarding scenario XP:', error);
    // Don't throw, just log and continue
    console.error('⚠️ Continuing without scenario XP award due to error');
  }
}

/**
 * Check for scenario-specific achievements
 */
async function checkScenarioAchievements(
  userId: string,
  scenarioId: string,
  score: number,
  duration: number
): Promise<void> {
  try {
    // Get user's attempt history
    const { data: attempts, error: attemptsError } = await supabase
      .from('attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (attemptsError) {
      console.error('Error fetching attempts:', attemptsError);
      return;
    }

    const totalAttempts = attempts?.length || 0;
    const completedAttempts = attempts?.filter(a => a.overall_band) || [];
    const perfectAttempts = completedAttempts.filter(a => {
      const scores = a.scores as any;
      return scores?.overall_pct >= 95;
    });

    // Check for specific achievements
    const achievementChecks = [
      {
        code: 'first_scenario',
        condition: totalAttempts === 1,
        xp: 100
      },
      {
        code: 'perfect_score',
        condition: score >= 95,
        xp: 200
      },
      {
        code: 'speed_demon',
        condition: duration < 300, // Less than 5 minutes
        xp: 200
      },
      {
        code: 'scenario_master',
        condition: totalAttempts >= 50,
        xp: 500
      },
      {
        code: 'perfectionist',
        condition: perfectAttempts.length >= 10,
        xp: 600
      }
    ];

    // Award achievements
    for (const check of achievementChecks) {
      if (check.condition) {
        await awardAchievement(userId, check.code, check.xp);
      }
    }

  } catch (error) {
    console.error('Error checking scenario achievements:', error);
  }
}

/**
 * Award a specific achievement
 */
async function awardAchievement(userId: string, achievementCode: string, xpReward: number): Promise<void> {
  try {
    // Get achievement details
    const { data: achievement, error: achievementError } = await supabase
      .from('achievements')
      .select('*')
      .eq('code', achievementCode)
      .eq('is_active', true)
      .single();

    if (achievementError || !achievement) {
      console.error('Achievement not found:', achievementCode);
      return;
    }

    // Check if user already has this achievement
    const { data: existingAchievement, error: existingError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievement.id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing achievement:', existingError);
      return;
    }

    if (existingAchievement) {
      // Achievement already earned
      return;
    }

    // Award the achievement
    const { error: awardError } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievement.id,
        is_completed: true
      });

    if (awardError) {
      console.error('Error awarding achievement:', awardError);
      return;
    }

    // Award XP for the achievement
    await awardXP({
      userId,
      xpAmount: xpReward,
      transactionType: 'achievement_earned',
      sourceId: achievement.id,
      sourceType: 'achievement',
      description: achievement.name
    });

    console.log(`Achievement awarded: ${achievement.name} to user ${userId}`);

  } catch (error) {
    console.error('Error in awardAchievement:', error);
  }
}

/**
 * Update daily streak
 */
export async function updateDailyStreak(userId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get current streak
    const { data: currentStreak, error: streakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_type', 'daily_practice')
      .single();

    if (streakError && streakError.code !== 'PGRST116') {
      console.error('Error fetching streak:', streakError);
      return;
    }

    const lastActivity = currentStreak?.last_activity_date;
    const currentStreakCount = currentStreak?.current_streak || 0;
    const longestStreak = currentStreak?.longest_streak || 0;

    let newStreakCount = currentStreakCount;

    if (!lastActivity) {
      // First time practicing
      newStreakCount = 1;
    } else {
      const lastActivityDate = new Date(lastActivity);
      const todayDate = new Date(today);
      const daysDifference = Math.floor((todayDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDifference === 1) {
        // Consecutive day
        newStreakCount = currentStreakCount + 1;
      } else if (daysDifference === 0) {
        // Same day, keep current streak
        newStreakCount = currentStreakCount;
      } else {
        // Streak broken, reset to 1
        newStreakCount = 1;
      }
    }

    // Update or create streak record
    const { error: updateError } = await supabase
      .from('user_streaks')
      .upsert({
        user_id: userId,
        streak_type: 'daily_practice',
        current_streak: newStreakCount,
        longest_streak: Math.max(newStreakCount, longestStreak),
        last_activity_date: today,
        streak_start_date: newStreakCount === 1 ? today : currentStreak?.streak_start_date || today,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('Error updating streak:', updateError);
      return;
    }

    // Award streak bonuses
    if (newStreakCount === 7) {
      await awardXP({
        userId,
        xpAmount: 300,
        transactionType: 'streak_bonus',
        description: '7-day practice streak!'
      });
    } else if (newStreakCount === 30) {
      await awardXP({
        userId,
        xpAmount: 1000,
        transactionType: 'streak_bonus',
        description: '30-day practice streak!'
      });
    }

  } catch (error) {
    console.error('Error in updateDailyStreak:', error);
  }
}

/**
 * Get user's gamification summary
 */
export async function getUserGamificationSummary(userId: string) {
  try {
    // Get level data
    const { data: levelData, error: levelError } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get achievement count
    const { count: achievementCount } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true);

    // Get streak data
    const { data: streakData, error: streakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_type', 'daily_practice')
      .single();

    // Get recent XP transactions
    const { data: recentXP, error: xpError } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      level: levelData || { current_level: 1, total_xp: 0, title: 'Medical Student' },
      achievements: achievementCount || 0,
      streak: streakData || { current_streak: 0, longest_streak: 0 },
      recentXP: recentXP || []
    };

  } catch (error) {
    console.error('Error getting gamification summary:', error);
    return {
      level: { current_level: 1, total_xp: 0, title: 'Medical Student' },
      achievements: 0,
      streak: { current_streak: 0, longest_streak: 0 },
      recentXP: []
    };
  }
}
