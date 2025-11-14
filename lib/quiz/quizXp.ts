import { supabaseAdmin } from '@/utils/supabase'

export const QUIZ_XP_LEVEL_STEP = 1000

export type QuizXpReason =
  | 'practice_session'
  | 'practice_bonus'
  | 'challenge_participation'
  | 'challenge_bonus'
  | 'streak_bonus'
  | 'manual_adjustment'

export interface QuizXpSummary {
  user_id: string
  total_xp: number
  current_level: number
  level_progress: number
  xp_to_next: number
  last_awarded_at: string | null
}

interface AwardQuizXpParams {
  userId: string
  amount: number
  reason: QuizXpReason | (string & {})
  sourceType?: string
  sourceId?: string
  metadata?: Record<string, any>
}

export function deriveQuizLevel(totalXp: number) {
  const safeTotal = Math.max(0, totalXp || 0)
  const level = Math.floor(safeTotal / QUIZ_XP_LEVEL_STEP) + 1
  const levelProgress = safeTotal % QUIZ_XP_LEVEL_STEP
  const xpToNext = QUIZ_XP_LEVEL_STEP
  return {
    level,
    levelProgress,
    xpToNext,
  }
}

export async function fetchQuizXp(userId: string): Promise<QuizXpSummary> {
  const { data } = await supabaseAdmin
    .from('quiz_user_xp')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (data) {
    return data as QuizXpSummary
  }

  return {
    user_id: userId,
    total_xp: 0,
    current_level: 1,
    level_progress: 0,
    xp_to_next: QUIZ_XP_LEVEL_STEP,
    last_awarded_at: null,
  }
}

export async function awardQuizXp({
  userId,
  amount,
  reason,
  sourceType,
  sourceId,
  metadata,
}: AwardQuizXpParams) {
  if (!userId || !amount || amount <= 0) {
    return {
      awarded: 0,
      xp: await fetchQuizXp(userId),
    }
  }

  const now = new Date().toISOString()

  const insertPayload: Record<string, any> = {
    user_id: userId,
    amount,
    reason,
    metadata: metadata || {},
    created_at: now,
  }

  if (sourceType && sourceId) {
    insertPayload.source_type = sourceType
    insertPayload.source_id = sourceId
  }

  const { error: transactionError } = await supabaseAdmin
    .from('quiz_xp_transactions')
    .insert(insertPayload)

  if (transactionError) {
    // Ignore duplicate transaction errors (already awarded for this source)
    if (transactionError.code === '23505') {
      return {
        awarded: 0,
        xp: await fetchQuizXp(userId),
        duplicate: true,
      }
    }

    console.error('Failed to insert quiz XP transaction:', transactionError, {
      userId,
      amount,
      reason,
      sourceType,
      sourceId,
    })
    throw transactionError
  }

  const current = await fetchQuizXp(userId)
  const newTotal = (current.total_xp || 0) + amount
  const levelData = deriveQuizLevel(newTotal)

  const { data: updated, error: upsertError } = await supabaseAdmin
    .from('quiz_user_xp')
    .upsert(
      {
        user_id: userId,
        total_xp: newTotal,
        current_level: levelData.level,
        level_progress: levelData.levelProgress,
        xp_to_next: levelData.xpToNext,
        last_awarded_at: now,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (upsertError) {
    console.error('Failed to upsert quiz_user_xp row:', upsertError, {
      userId,
      amount,
      reason,
    })
    throw upsertError
  }

  return {
    awarded: amount,
    xp: updated as QuizXpSummary,
  }
}


