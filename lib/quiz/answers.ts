export interface ChallengeAnswerRecord {
  answered_at: string | null
  selected_answer?: string | null
  time_taken_seconds?: number | null
  points_earned?: number | null
  is_correct?: boolean | null
}

/**
 * Determines whether a quiz challenge answer row represents a real submission
 * (including timeouts) as opposed to the pre-populated placeholders that exist
 * before a player answers.
 */
export function hasRecordedAnswer(answer: ChallengeAnswerRecord | null | undefined): boolean {
  if (!answer || !answer.answered_at) return false

  const hasSelectedAnswer =
    typeof answer.selected_answer === 'string' &&
    answer.selected_answer.trim() !== ''

  const hasScoreData =
    answer.points_earned !== null &&
    answer.points_earned !== undefined

  const hasTimeData =
    answer.time_taken_seconds !== null &&
    answer.time_taken_seconds !== undefined

  const hasCorrectnessFlag = typeof answer.is_correct === 'boolean'

  return hasSelectedAnswer || hasScoreData || hasTimeData || hasCorrectnessFlag
}

