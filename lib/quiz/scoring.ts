/**
 * Quiz Scoring System
 * Calculates points based on correctness, speed, difficulty, and streaks
 */

export interface ScoringParams {
  isCorrect: boolean
  timeTakenSeconds: number
  difficulty: 'easy' | 'medium' | 'hard'
  currentStreak: number
}

export interface ScoringResult {
  basePoints: number
  speedBonus: number
  difficultyMultiplier: number
  streakMultiplier: number
  totalPoints: number
}

const BASE_POINTS = 100
const TIMEOUT_SECONDS = 60

// Difficulty multipliers
const DIFFICULTY_MULTIPLIERS = {
  easy: 1.0,
  medium: 1.3,
  hard: 1.6,
}

// Streak multipliers
const STREAK_MULTIPLIERS = {
  NONE: 1.0,      // 0-2 correct
  LOW: 1.2,       // 3-4 correct
  MEDIUM: 1.5,    // 5-9 correct
  HIGH: 2.0,       // 10+ correct
}

/**
 * Calculate speed bonus based on time taken
 * NOTE: Speed bonuses are disabled - always returns 0
 */
function calculateSpeedBonus(timeTakenSeconds: number): number {
  return 0 // Speed bonuses removed - only correct answers give points
}

/**
 * Get streak multiplier based on current streak
 */
function getStreakMultiplier(streak: number): number {
  if (streak >= 10) {
    return STREAK_MULTIPLIERS.HIGH
  } else if (streak >= 5) {
    return STREAK_MULTIPLIERS.MEDIUM
  } else if (streak >= 3) {
    return STREAK_MULTIPLIERS.LOW
  }
  return STREAK_MULTIPLIERS.NONE
}

/**
 * Calculate total points for an answer
 */
export function calculateScore(params: ScoringParams): ScoringResult {
  const { isCorrect, timeTakenSeconds, difficulty, currentStreak } = params

  // If incorrect, return 0 points
  if (!isCorrect) {
    return {
      basePoints: 0,
      speedBonus: 0,
      difficultyMultiplier: 1,
      streakMultiplier: 1,
      totalPoints: 0,
    }
  }

  // Calculate components
  const basePoints = BASE_POINTS
  const speedBonus = 0 // Speed bonuses removed
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty]
  const streakMultiplier = getStreakMultiplier(currentStreak)

  // Formula: Base Points × Difficulty Multiplier × Streak Multiplier
  // Speed bonuses removed - only correct answers give points
  const totalPoints = Math.round(
    basePoints * difficultyMultiplier * streakMultiplier
  )

  return {
    basePoints,
    speedBonus,
    difficultyMultiplier,
    streakMultiplier,
    totalPoints,
  }
}

/**
 * Get speed tier name for display
 * NOTE: Speed bonuses are disabled, but this function is kept for compatibility
 */
export function getSpeedTier(timeTakenSeconds: number): string {
  if (timeTakenSeconds > TIMEOUT_SECONDS) {
    return 'timeout'
  }
  // Speed bonuses removed - all answers within time limit are treated the same
  return 'on_time'
}


