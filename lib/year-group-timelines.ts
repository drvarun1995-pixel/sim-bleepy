import type { ProgressionAction } from '@/lib/year-progression'

export type YearGroupKey =
  | 'ARU-1'
  | 'ARU-2'
  | 'ARU-3'
  | 'ARU-4'
  | 'ARU-5'
  | 'UCL-5'
  | 'UCL-6'
  | 'FY-FY1'
  | 'FY-FY2'

export type YearGroupDef = {
  key: YearGroupKey
  label: string
  section: 'medical_school' | 'foundation'
  university: 'ARU' | 'UCL' | null
  study_year: string | null
  foundation_year: string | null
  terminal: boolean
  advancesTo: string
}

export const YEAR_GROUP_DEFS: YearGroupDef[] = [
  { key: 'ARU-1', label: 'ARU Year 1', section: 'medical_school', university: 'ARU', study_year: '1', foundation_year: null, terminal: false, advancesTo: 'ARU Year 2' },
  { key: 'ARU-2', label: 'ARU Year 2', section: 'medical_school', university: 'ARU', study_year: '2', foundation_year: null, terminal: false, advancesTo: 'ARU Year 3' },
  { key: 'ARU-3', label: 'ARU Year 3', section: 'medical_school', university: 'ARU', study_year: '3', foundation_year: null, terminal: false, advancesTo: 'ARU Year 4' },
  { key: 'ARU-4', label: 'ARU Year 4', section: 'medical_school', university: 'ARU', study_year: '4', foundation_year: null, terminal: false, advancesTo: 'ARU Year 5' },
  { key: 'ARU-5', label: 'ARU Year 5', section: 'medical_school', university: 'ARU', study_year: '5', foundation_year: null, terminal: true, advancesTo: 'Graduated' },
  { key: 'UCL-5', label: 'UCL Year 5', section: 'medical_school', university: 'UCL', study_year: '5', foundation_year: null, terminal: false, advancesTo: 'UCL Year 6' },
  { key: 'UCL-6', label: 'UCL Year 6', section: 'medical_school', university: 'UCL', study_year: '6', foundation_year: null, terminal: true, advancesTo: 'Graduated' },
  { key: 'FY-FY1', label: 'Foundation Year 1', section: 'foundation', university: null, study_year: null, foundation_year: 'FY1', terminal: false, advancesTo: 'Foundation Year 2' },
  { key: 'FY-FY2', label: 'Foundation Year 2', section: 'foundation', university: null, study_year: null, foundation_year: 'FY2', terminal: true, advancesTo: 'Graduated' },
]

/** FY years run 5 August → 5 August, matching the cohort label (25-26 → 5 Aug 2025 to 5 Aug 2026). */
export function defaultFoundationDates(cohortLabel: string): { starts_on: string; ends_on: string } {
  const match = String(cohortLabel || '').trim().match(/^(\d{2})-(\d{2})$/)
  const startYear = match ? 2000 + Number(match[1]) : 2025
  const endYear = match ? 2000 + Number(match[2]) : startYear + 1
  return {
    starts_on: `${startYear}-08-05`,
    ends_on: `${endYear}-08-05`,
  }
}

/** ARU 25-26 teaching windows from the school timeline. Year 5 finish is the later block. */
export const ARU_25_26_DATES: Partial<Record<YearGroupKey, { starts_on: string; ends_on: string }>> = {
  'ARU-1': { starts_on: '2025-11-24', ends_on: '2026-05-08' },
  'ARU-2': { starts_on: '2026-02-09', ends_on: '2026-03-20' },
  'ARU-3': { starts_on: '2026-04-01', ends_on: '2026-07-31' },
  'ARU-4': { starts_on: '2025-09-01', ends_on: '2026-07-10' },
  'ARU-5': { starts_on: '2025-09-15', ends_on: '2026-05-24' },
}

export const BASE_COHORT_WINDOW = {
  starts_on: '2025-09-01',
  ends_on: '2026-08-31',
}

export function shiftIsoDate(iso: string | null | undefined, years: number): string {
  const value = String(iso || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  if (!years) return value
  const year = Number(value.slice(0, 4)) + years
  return `${year}${value.slice(4)}`
}

export function cohortOffsetFromBase(label: string, base = '25-26'): number {
  const current = String(label || '').match(/^(\d{2})-/)
  const from = String(base).match(/^(\d{2})-/)
  if (!current || !from) return 0
  return Number(current[1]) - Number(from[1])
}

export function defaultDatesForYearGroup(
  group: YearGroupDef,
  cohortLabel: string,
  cohortStartsOn?: string | null,
  cohortEndsOn?: string | null
): { starts_on: string; ends_on: string } {
  if (group.section === 'foundation') return defaultFoundationDates(cohortLabel)
  const offset = cohortOffsetFromBase(cohortLabel)
  if (group.university === 'ARU' && ARU_25_26_DATES[group.key]) {
    const base = ARU_25_26_DATES[group.key]!
    return {
      starts_on: shiftIsoDate(base.starts_on, offset),
      ends_on: shiftIsoDate(base.ends_on, offset),
    }
  }
  if (cohortStartsOn || cohortEndsOn) {
    return {
      starts_on: cohortStartsOn || '',
      ends_on: cohortEndsOn || '',
    }
  }
  return {
    starts_on: shiftIsoDate(BASE_COHORT_WINDOW.starts_on, offset),
    ends_on: shiftIsoDate(BASE_COHORT_WINDOW.ends_on, offset),
  }
}

export function inheritDatesFromPrevious(
  previous: { starts_on?: string | null; ends_on?: string | null } | null | undefined,
  fallback: { starts_on: string; ends_on: string }
): { starts_on: string; ends_on: string } {
  if (previous?.starts_on && previous?.ends_on) {
    return {
      starts_on: shiftIsoDate(previous.starts_on, 1),
      ends_on: shiftIsoDate(previous.ends_on, 1),
    }
  }
  return fallback
}

export function isoDateToday(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Closed when every year group (medical school + FY) has a finish date that has passed. */
export function isCohortTimelinesClosed(
  groups: Array<{ ends_on?: string | null }>,
  today = isoDateToday()
): boolean {
  if (!groups.length) return false
  return groups.every((group) => !!group.ends_on && group.ends_on <= today)
}

export type TimelineNotes = {
  v: 1
  timeline_key: YearGroupKey
  starts_on: string | null
}

export function encodeTimelineNotes(key: YearGroupKey, startsOn: string | null): string {
  const payload: TimelineNotes = { v: 1, timeline_key: key, starts_on: startsOn || null }
  return JSON.stringify(payload)
}

export function parseTimelineNotes(notes: string | null | undefined): TimelineNotes | null {
  if (!notes) return null
  try {
    const parsed = JSON.parse(notes)
    if (parsed?.v === 1 && typeof parsed.timeline_key === 'string') {
      return parsed as TimelineNotes
    }
  } catch {
    return null
  }
  return null
}

export function yearGroupByKey(key: string | null | undefined): YearGroupDef | undefined {
  return YEAR_GROUP_DEFS.find((group) => group.key === key)
}

export function matchesYearGroup(
  user: {
    university?: string | null
    study_year?: string | null
    foundation_year?: string | null
    role_type?: string | null
  },
  group: YearGroupDef
): boolean {
  if (group.foundation_year) {
    const fy = (user.foundation_year || '').trim() || (user.study_year || '').trim()
    if (fy === group.foundation_year) return true
    if (
      group.foundation_year === 'FY1' &&
      user.role_type === 'foundation_doctor' &&
      fy !== 'FY2' &&
      !fy
    ) {
      return true
    }
    return false
  }
  return user.university === group.university && String(user.study_year || '').trim() === group.study_year
}

export function exitActionLabel(action: string | null | undefined): string {
  if (action === 'fy1') return 'Move to FY1'
  if (action === 'intercalated') return 'Mark intercalated'
  return 'Graduated'
}

export function whatHappensAtFinish(
  group: YearGroupDef,
  exitAction: ProgressionAction | string | null | undefined,
  nextCohort: string | null | undefined
): string {
  const next = nextCohort || 'the next cohort'
  if (group.terminal) {
    if (exitAction === 'fy1') return `Become FY1 in ${next}`
    if (exitAction === 'intercalated') return 'Pause as intercalated'
    return 'Marked graduated (stay in this cohort)'
  }
  return `Become ${group.advancesTo} in ${next}`
}
