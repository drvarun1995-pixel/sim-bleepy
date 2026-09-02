export const FEEDBACK_OTHER_VALUE = '__other__'
export const FEEDBACK_OTHER_LABEL = 'Other'

export type FeedbackQuestionType =
  | 'rating'
  | 'text'
  | 'long_text'
  | 'yes_no'
  | 'multiple_choice'

export type FeedbackQuestion = {
  id: string
  type: string
  question: string
  required: boolean
  options?: string[]
  scale?: number
  allowMultiple?: boolean
  allowOther?: boolean
  otherPlaceholder?: string
}

export type FeedbackAnswer = string | number | string[] | null | undefined

export function isMultipleChoice(question: { type?: string }): boolean {
  return question.type === 'multiple_choice'
}

export function isAnswerEmpty(value: FeedbackAnswer): boolean {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value) && value.filter((item) => String(item).trim()).length === 0) {
    return true
  }
  return false
}

export function normalizeMcSelections(value: FeedbackAnswer): string[] {
  if (value === undefined || value === null || value === '') return []
  const list = Array.isArray(value) ? value : [value]
  return list.map((item) => String(item).trim()).filter(Boolean)
}

export function isOtherSelected(value: FeedbackAnswer): boolean {
  return normalizeMcSelections(value).includes(FEEDBACK_OTHER_VALUE)
}

/** Replace the Other sentinel with the typed text before save/validate. */
export function finalizeMcAnswer(
  question: FeedbackQuestion,
  value: FeedbackAnswer,
  otherText?: string
): string | string[] | FeedbackAnswer {
  if (!isMultipleChoice(question)) return value

  const other = (otherText || '').trim()
  const selections = normalizeMcSelections(value).map((item) =>
    item === FEEDBACK_OTHER_VALUE ? other : item
  ).filter(Boolean)

  if (question.allowMultiple) {
    return Array.from(new Set(selections))
  }
  return selections[0] || ''
}

export function validateMcAnswer(
  question: FeedbackQuestion,
  value: FeedbackAnswer,
  otherText?: string
): string | null {
  if (!isMultipleChoice(question)) return null

  const otherSelected = isOtherSelected(value)
  const other = (otherText || '').trim()
  const finalized = finalizeMcAnswer(question, value, otherText)
  const selections = normalizeMcSelections(finalized)

  if (question.required && selections.length === 0 && !otherSelected) {
    return 'This question is required'
  }

  if (otherSelected && !other) {
    return 'Please specify Other'
  }

  const allowed = new Set((question.options || []).map((option) => option.trim()).filter(Boolean))
  for (const selection of selections) {
    if (allowed.has(selection)) continue
    if (question.allowOther && otherSelected && selection === other) continue
    return `Invalid option for "${question.question}"`
  }

  if (!question.allowMultiple && selections.length > 1) {
    return `Select only one option for "${question.question}"`
  }

  return null
}

export function validateQuestionAnswer(
  question: FeedbackQuestion,
  value: FeedbackAnswer,
  otherText?: string
): string | null {
  if (isMultipleChoice(question)) {
    return validateMcAnswer(question, value, otherText)
  }

  if (question.required && isAnswerEmpty(value)) {
    return 'This question is required'
  }

  if (isAnswerEmpty(value)) return null

  if (question.type === 'rating') {
    const numeric = Number(value)
    const scale = question.scale || 5
    if (Number.isNaN(numeric) || numeric < 1 || numeric > scale) {
      return `Rating must be between 1 and ${scale}`
    }
  }

  if (question.type === 'yes_no') {
    const normalized = String(value).toLowerCase()
    if (!['yes', 'no'].includes(normalized)) {
      return 'Answer must be yes or no'
    }
  }

  return null
}
