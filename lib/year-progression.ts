/**
 * Year progression rules and targeting helpers.
 * Safe to import from client or server.
 */

import {
  ARU_STUDY_YEARS,
  UCL_STUDY_YEARS,
  isUniversity,
  type University,
} from '@/lib/study-years'

export const ACADEMIC_STATUSES = ['active', 'intercalated', 'graduated', 'left'] as const
export type AcademicStatus = (typeof ACADEMIC_STATUSES)[number]

export const PROGRESSION_ACTIONS = ['advance', 'fy1', 'graduate', 'intercalated'] as const
export type ProgressionAction = (typeof PROGRESSION_ACTIONS)[number]

export const SCHEDULE_SCOPES = ['all', 'university', 'year_group', 'cohort', 'selected_users'] as const
export type ScheduleScope = (typeof SCHEDULE_SCOPES)[number]

export const DEFAULT_COHORT_LABEL = '25-26'
export const EXISTING_COHORT_LABEL = '25-26'
export const NEXT_COHORT_LABEL = '26-27'

/** Personal test accounts — always ride with the latest cohort, profile unchanged. */
export const TEST_ACCOUNT_EMAILS = [
  'drvarun1995@gmail.com',
  'varun.tyagi@nhs.net',
] as const

export function isTestAccountEmail(email: string | null | undefined): boolean {
  const normalised = String(email || '').trim().toLowerCase()
  return (TEST_ACCOUNT_EMAILS as readonly string[]).includes(normalised)
}

/** Hidden from Student Cohorts, email targeting, and progression leftover lists. */
export function isExcludedFromLearnerLists(user: {
  email?: string | null
  name?: string | null
} | null | undefined): boolean {
  if (!user) return false
  if (isTestAccountEmail(user.email)) return true
  const name = String(user.name || '').toLowerCase()
  const email = String(user.email || '').toLowerCase()
  if (email.includes('chopde')) return true
  if (name.includes('shantanu') && name.includes('chopde')) return true
  return false
}

export function latestCohortLabel(labels: Array<string | null | undefined>): string {
  const ranked = labels
    .map((label) => String(label || '').trim())
    .filter((label) => /^\d{2}-\d{2}$/.test(label))
    .sort((a, b) => compareCohortLabels(a, b))
  return ranked[ranked.length - 1] || NEXT_COHORT_LABEL
}

export function compareCohortLabels(a: string, b: string): number {
  const [aStart, aEnd] = a.split('-').map(Number)
  const [bStart, bEnd] = b.split('-').map(Number)
  return aStart - bStart || aEnd - bEnd
}

/** The working/upcoming year: next after `is_current`, if that row exists. */
export function upcomingCohortLabel(
  cohorts: Array<{ label?: string | null; is_current?: boolean | null }>
): string {
  const labels = cohorts.map((row) => String(row.label || '').trim()).filter(Boolean)
  const current =
    cohorts.find((row) => row.is_current)?.label?.trim() || EXISTING_COHORT_LABEL
  const next = suggestNextCohortLabel(current)
  if (labels.includes(next)) return next
  return latestCohortLabel(labels)
}

/** 25-26 → 26-27 */
export function suggestNextCohortLabel(label: string | null | undefined): string {
  const match = String(label || '').trim().match(/^(\d{2})-(\d{2})$/)
  if (!match) return NEXT_COHORT_LABEL
  const start = (Number(match[1]) + 1) % 100
  const end = (Number(match[2]) + 1) % 100
  return `${String(start).padStart(2, '0')}-${String(end).padStart(2, '0')}`
}

/** 26-27 → 25-26 */
export function previousCohortLabel(label: string | null | undefined): string | null {
  const match = String(label || '').trim().match(/^(\d{2})-(\d{2})$/)
  if (!match) return null
  const start = (Number(match[1]) + 99) % 100
  const end = (Number(match[2]) + 99) % 100
  return `${String(start).padStart(2, '0')}-${String(end).padStart(2, '0')}`
}

/**
 * Academic-year label for a calendar date.
 * Cohort years start on 5 August (25-26 = 5 Aug 2025 → 5 Aug 2026).
 */
export function calendarCohortLabel(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)
  const afterFlip = month > 8 || (month === 8 && day >= 5)
  const startYear = afterFlip ? year : year - 1
  const yy = String(startYear % 100).padStart(2, '0')
  const next = String((startYear + 1) % 100).padStart(2, '0')
  return `${yy}-${next}`
}

export type LearnerSnapshot = {
  id: string
  email?: string | null
  name?: string | null
  role?: string | null
  role_type?: string | null
  university?: string | null
  study_year?: string | null
  foundation_year?: string | null
  academic_status?: string | null
  academic_cohort?: string | null
  marketing_consent?: boolean | null
}

export type ComputedProgression = {
  action: ProgressionAction
  academic_status: AcademicStatus
  academic_cohort: string | null
  role_type: string | null
  university: string | null
  study_year: string | null
  foundation_year: string | null
  fromLabel: string
  toLabel: string
  isExit: boolean
}

export function isAcademicStatus(value: string | null | undefined): value is AcademicStatus {
  return !!value && (ACADEMIC_STATUSES as readonly string[]).includes(value)
}

/** Active learners only — intercalated / graduated / left are hidden from student targeting. */
export function isLearnerTargetable(
  user: Pick<LearnerSnapshot, 'academic_status'> | null | undefined
): boolean {
  const status = user?.academic_status
  if (!status || status === 'active') return true
  return false
}

/** Alias used by student-ops targeting (emails, events, push, announcements). */
export const isStudentTargetable = isLearnerTargetable

export function isStudentOpsRole(roleType: string | null | undefined, role?: string | null): boolean {
  const type = String(roleType || '').trim()
  if (type === 'medical_student' || type === 'foundation_doctor') return true
  return String(role || '').trim() === 'student' && type !== 'registrar' && type !== 'consultant'
}

/**
 * PostgREST filter: null status (legacy) or active.
 * Graduated / intercalated / left are excluded.
 */
export const TARGETABLE_LEARNER_OR = 'academic_status.is.null,academic_status.eq.active'

export function stageLabel(user: LearnerSnapshot): string {
  const fy = (user.foundation_year || '').trim()
  if (user.role_type === 'foundation_doctor' || fy === 'FY1' || fy === 'FY2') {
    return fy || 'Foundation Year'
  }
  const uni = (user.university || '').trim()
  const year = (user.study_year || '').trim()
  if (uni && year) return `${uni} Year ${year}`
  if (uni) return `${uni} student`
  if (year) return `Year ${year}`
  return 'Learner'
}

export function isExistingNoEmailCohort(label: string | null | undefined): boolean {
  return (label || '').trim() === EXISTING_COHORT_LABEL
}

export type CohortListRow = {
  label: string
  is_current: boolean
  suppress_emails: boolean
}

/** Always include a current cohort, even if `academic_cohorts` is empty. */
export function withCurrentCohort(
  rows: Array<{ label?: string | null; is_current?: boolean | null; suppress_emails?: boolean | null }>,
  extraLabels: string[] = [],
  now = new Date()
): CohortListRow[] {
  const calendar = calendarCohortLabel(now)
  const byLabel = new Map<string, CohortListRow>()

  for (const row of rows) {
    const label = String(row.label || '').trim()
    if (!label) continue
    byLabel.set(label, {
      label,
      is_current: !!row.is_current,
      suppress_emails: row.suppress_emails === true || isExistingNoEmailCohort(label),
    })
  }

  for (const raw of extraLabels) {
    const label = String(raw || '').trim()
    if (!label || byLabel.has(label)) continue
    byLabel.set(label, {
      label,
      is_current: false,
      suppress_emails: isExistingNoEmailCohort(label),
    })
  }

  if (!byLabel.has(calendar)) {
    byLabel.set(calendar, {
      label: calendar,
      is_current: false,
      suppress_emails: isExistingNoEmailCohort(calendar),
    })
  }

  const list = Array.from(byLabel.values())
  if (list.some((row) => row.is_current)) return list
  return list.map((row) => ({ ...row, is_current: row.label === calendar }))
}

function nextStudyYear(university: University, year: string): string | null {
  const years: readonly string[] = university === 'ARU' ? ARU_STUDY_YEARS : UCL_STUDY_YEARS
  const idx = years.indexOf(year)
  if (idx < 0) return null
  if (idx >= years.length - 1) return null
  return years[idx + 1]
}

function isTerminalStudyYear(university: University, year: string): boolean {
  if (university === 'ARU') return year === '5'
  if (university === 'UCL') return year === '6'
  return false
}

/**
 * Recommended next step for one learner.
 * Terminal years (ARU5 / UCL6 / FY2) use `exitAction` (graduate | fy1 | intercalated).
 */
export function computeNextProgression(
  user: LearnerSnapshot,
  options?: {
    forcedAction?: ProgressionAction | 'per_user'
    exitAction?: ProgressionAction
    nextCohortLabel?: string | null
  }
): ComputedProgression | { skip: true; reason: string } {
  const status = (user.academic_status || 'active') as AcademicStatus
  if (status === 'intercalated') {
    return { skip: true, reason: 'Intercalated — progression paused' }
  }
  if (status === 'graduated' || status === 'left') {
    return { skip: true, reason: `Status is ${status}` }
  }

  const forced = options?.forcedAction && options.forcedAction !== 'per_user'
    ? options.forcedAction
    : null
  const exitAction: ProgressionAction = options?.exitAction || 'graduate'
  const nextCohort = options?.nextCohortLabel || NEXT_COHORT_LABEL
  const fromLabel = stageLabel(user)

  const applyExit = (action: ProgressionAction): ComputedProgression => {
    if (action === 'fy1') {
      const next: LearnerSnapshot = {
        ...user,
        role_type: 'foundation_doctor',
        university: null,
        study_year: null,
        foundation_year: 'FY1',
        academic_status: 'active',
        academic_cohort: nextCohort,
      }
      return {
        action: 'fy1',
        academic_status: 'active',
        academic_cohort: nextCohort,
        role_type: 'foundation_doctor',
        university: null,
        study_year: null,
        foundation_year: 'FY1',
        fromLabel,
        toLabel: stageLabel(next),
        isExit: true,
      }
    }
    if (action === 'intercalated') {
      return {
        action: 'intercalated',
        academic_status: 'intercalated',
        academic_cohort: user.academic_cohort || EXISTING_COHORT_LABEL,
        role_type: user.role_type || null,
        university: user.university || null,
        study_year: user.study_year || null,
        foundation_year: user.foundation_year || null,
        fromLabel,
        toLabel: `${fromLabel} (intercalated)`,
        isExit: true,
      }
    }
    return {
      action: 'graduate',
      academic_status: 'graduated',
      academic_cohort: user.academic_cohort || EXISTING_COHORT_LABEL,
      role_type: user.role_type || null,
      university: user.university || null,
      study_year: user.study_year || null,
      foundation_year: user.foundation_year || null,
      fromLabel,
      toLabel: `${fromLabel} (graduated)`,
      isExit: true,
    }
  }

  if (forced && forced !== 'advance') {
    return applyExit(forced)
  }

  const fy = (user.foundation_year || '').trim()
  const isFy =
    user.role_type === 'foundation_doctor' || fy === 'FY1' || fy === 'FY2'

  if (isFy) {
    if (fy === 'FY2') return applyExit(exitAction)
    if (fy === 'FY1' || !fy) {
      const next: LearnerSnapshot = {
        ...user,
        role_type: 'foundation_doctor',
        foundation_year: 'FY2',
        study_year: null,
        academic_status: 'active',
        academic_cohort: nextCohort,
      }
      return {
        action: 'advance',
        academic_status: 'active',
        academic_cohort: nextCohort,
        role_type: 'foundation_doctor',
        university: user.university || null,
        study_year: null,
        foundation_year: 'FY2',
        fromLabel,
        toLabel: stageLabel(next),
        isExit: false,
      }
    }
    return { skip: true, reason: 'Foundation year is missing or unrecognised' }
  }

  const uni = user.university
  const year = (user.study_year || '').trim()
  if (!isUniversity(uni) || !year) {
    return { skip: true, reason: 'Missing university or study year' }
  }

  if (isTerminalStudyYear(uni, year)) {
    return applyExit(exitAction)
  }

  const nextYear = nextStudyYear(uni, year)
  if (!nextYear) {
    return { skip: true, reason: `No next year for ${uni} Year ${year}` }
  }

  const next: LearnerSnapshot = {
    ...user,
    study_year: nextYear,
    academic_status: 'active',
    academic_cohort: nextCohort,
  }
  return {
    action: 'advance',
    academic_status: 'active',
    academic_cohort: nextCohort,
    role_type: user.role_type || 'medical_student',
    university: uni,
    study_year: nextYear,
    foundation_year: null,
    fromLabel,
    toLabel: stageLabel(next),
    isExit: false,
  }
}

export function snapshotFromUser(user: LearnerSnapshot) {
  return {
    academic_status: user.academic_status || 'active',
    academic_cohort: user.academic_cohort || null,
    role_type: user.role_type || null,
    university: user.university || null,
    study_year: user.study_year || null,
    foundation_year: user.foundation_year || null,
    stage_label: stageLabel(user),
  }
}

export function isProgressableLearner(user: LearnerSnapshot): boolean {
  if (user.role_type === 'medical_student' || user.role_type === 'foundation_doctor') return true
  if (user.role === 'student' && (isUniversity(user.university) || user.foundation_year)) return true
  return false
}
