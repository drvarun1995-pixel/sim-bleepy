export const IMT_SCORE_LADDERS = {
  postgraduate: [0, 1, 3, 4],
  presentations: [0, 2, 4, 6, 8],
  publications: [0, 1, 2, 4, 5, 6],
  teaching_experience: [0, 1, 3, 5],
  training_in_teaching: [0, 1, 3],
  qi: [0, 1, 3, 4],
} as const

export type ImtScoreDomain = keyof typeof IMT_SCORE_LADDERS

export const IMT_SCORE_DOMAINS: { key: ImtScoreDomain; label: string }[] = [
  { key: 'postgraduate', label: 'Postgraduate' },
  { key: 'presentations', label: 'Presentations' },
  { key: 'publications', label: 'Publications' },
  { key: 'teaching_experience', label: 'Teaching experience' },
  { key: 'training_in_teaching', label: 'Training in teaching' },
  { key: 'qi', label: 'QI' },
]

export const IMT_SCORE_MAX = 30

export type ImtSelfAssessmentScores = Record<ImtScoreDomain, number> & { total: number }

export function emptyImtScores(): ImtSelfAssessmentScores {
  return {
    postgraduate: 0,
    presentations: 0,
    publications: 0,
    teaching_experience: 0,
    training_in_teaching: 0,
    qi: 0,
    total: 0,
  }
}

export function imtScoreTotal(scores: Record<ImtScoreDomain, number>): number {
  return IMT_SCORE_DOMAINS.reduce((sum, domain) => sum + (Number(scores[domain.key]) || 0), 0)
}
