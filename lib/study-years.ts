/**
 * Canonical study-year options by university / foundation path.
 * Use this everywhere instead of hard-coding year lists.
 */

export const UNIVERSITIES = ['ARU', 'UCL'] as const
export type University = (typeof UNIVERSITIES)[number]

/** ARU undergraduate years */
export const ARU_STUDY_YEARS = ['1', '2', '3', '4', '5'] as const

/** UCL years offered on this platform (final two years only) */
export const UCL_STUDY_YEARS = ['5', '6'] as const

export const FOUNDATION_YEARS = ['FY1', 'FY2'] as const

export type AruStudyYear = (typeof ARU_STUDY_YEARS)[number]
export type UclStudyYear = (typeof UCL_STUDY_YEARS)[number]
export type StudyYear = AruStudyYear | UclStudyYear
export type FoundationYear = (typeof FOUNDATION_YEARS)[number]

const STUDY_YEARS_BY_UNIVERSITY: Record<University, readonly string[]> = {
  ARU: ARU_STUDY_YEARS,
  UCL: UCL_STUDY_YEARS,
}

export function isUniversity(value: string | null | undefined): value is University {
  return value === 'ARU' || value === 'UCL'
}

export function getStudyYearsForUniversity(university: string | null | undefined): string[] {
  if (!isUniversity(university)) return []
  return [...STUDY_YEARS_BY_UNIVERSITY[university]]
}

/** Union of all undergraduate year numbers used across universities (for combined filters/charts). */
export function getAllUndergraduateStudyYears(): string[] {
  return Array.from(new Set([...ARU_STUDY_YEARS, ...UCL_STUDY_YEARS])).sort(
    (a, b) => Number(a) - Number(b)
  )
}

export function isFoundationYearValue(value: string | null | undefined): boolean {
  return value === 'FY1' || value === 'FY2'
}

export type CohortGroupFilter = 'all' | 'aru' | 'ucl' | 'fy' | 'other'

/** Year chips for Student Cohorts: undergraduate years, FY1/FY2, or both. */
export function getCohortYearFilterOptions(filter: CohortGroupFilter): string[] {
  if (filter === 'aru') return [...ARU_STUDY_YEARS]
  if (filter === 'ucl') return [...UCL_STUDY_YEARS]
  if (filter === 'fy') return [...FOUNDATION_YEARS]
  if (filter === 'other') return []
  return [...getAllUndergraduateStudyYears(), ...FOUNDATION_YEARS]
}

export function formatYearChipLabel(year: string): string {
  if (year === 'unknown') return 'Unassigned'
  if (isFoundationYearValue(year)) return year
  return `Year ${year}`
}

/** Canonical year key for cohort filters: FY1/FY2, study year, or unknown. */
export function learnerYearKey(user: {
  foundation_year?: string | null
  study_year?: string | null
}): string {
  const fy = (user.foundation_year || '').trim()
  if (isFoundationYearValue(fy)) return fy
  const year = (user.study_year || '').trim()
  if (isFoundationYearValue(year)) return year
  if (year) return year
  return 'unknown'
}

export function isValidStudyYearForUniversity(
  university: string | null | undefined,
  studyYear: string | null | undefined
): boolean {
  if (!studyYear) return true // year is optional
  return getStudyYearsForUniversity(university).includes(studyYear)
}

export function universityStudyYearLabel(university: University): string {
  const years = STUDY_YEARS_BY_UNIVERSITY[university]
  if (years.length === 0) return ''
  if (years.length === 1) return `Year ${years[0]}`
  return `Years ${years[0]}-${years[years.length - 1]}`
}
