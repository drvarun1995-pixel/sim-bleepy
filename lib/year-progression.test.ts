import { describe, expect, it } from 'vitest'
import {
  compareCohortLabels,
  computeNextProgression,
  isExcludedFromLearnerLists,
  isLearnerTargetable,
  upcomingCohortLabel,
  type LearnerSnapshot,
} from '@/lib/year-progression'

function student(partial: Partial<LearnerSnapshot>): LearnerSnapshot {
  return {
    id: 'u1',
    email: 'a@example.com',
    name: 'Ada',
    role: 'student',
    role_type: 'medical_student',
    university: 'ARU',
    study_year: '4',
    foundation_year: null,
    academic_status: 'active',
    academic_cohort: '25-26',
    ...partial,
  }
}

describe('isLearnerTargetable', () => {
  it('treats missing status and active as targetable', () => {
    expect(isLearnerTargetable({})).toBe(true)
    expect(isLearnerTargetable({ academic_status: 'active' })).toBe(true)
  })

  it('hides graduated, intercalated, and left', () => {
    expect(isLearnerTargetable({ academic_status: 'graduated' })).toBe(false)
    expect(isLearnerTargetable({ academic_status: 'intercalated' })).toBe(false)
    expect(isLearnerTargetable({ academic_status: 'left' })).toBe(false)
  })
})

describe('isExcludedFromLearnerLists', () => {
  it('excludes keeper test emails and Shantanu', () => {
    expect(isExcludedFromLearnerLists({ email: 'drvarun1995@gmail.com' })).toBe(true)
    expect(isExcludedFromLearnerLists({ email: 'varun.tyagi@nhs.net' })).toBe(true)
    expect(isExcludedFromLearnerLists({ name: 'Shantanu Chopde', email: 's.chopde@nhs.net' })).toBe(true)
    expect(isExcludedFromLearnerLists({ email: 'student@aru.ac.uk', name: 'Ada' })).toBe(false)
  })
})

describe('computeNextProgression', () => {
  it('advances ARU 4 to ARU 5 into the next cohort', () => {
    const next = computeNextProgression(student({ study_year: '4' }), { nextCohortLabel: '26-27' })
    expect(next).toMatchObject({
      action: 'advance',
      study_year: '5',
      academic_cohort: '26-27',
      academic_status: 'active',
      isExit: false,
    })
  })

  it('graduates ARU 5 by default', () => {
    const next = computeNextProgression(student({ study_year: '5' }))
    expect(next).toMatchObject({
      action: 'graduate',
      academic_status: 'graduated',
      isExit: true,
    })
  })

  it('can send ARU 5 to FY1', () => {
    const next = computeNextProgression(student({ study_year: '5' }), { exitAction: 'fy1', nextCohortLabel: '26-27' })
    expect(next).toMatchObject({
      action: 'fy1',
      role_type: 'foundation_doctor',
      foundation_year: 'FY1',
      academic_status: 'active',
      academic_cohort: '26-27',
    })
  })

  it('advances UCL 5 to 6 and graduates UCL 6', () => {
    const five = computeNextProgression(student({ university: 'UCL', study_year: '5' }), { nextCohortLabel: '26-27' })
    expect(five).toMatchObject({ action: 'advance', study_year: '6' })
    const six = computeNextProgression(student({ university: 'UCL', study_year: '6' }))
    expect(six).toMatchObject({ action: 'graduate', isExit: true })
  })

  it('advances FY1 to FY2 and can graduate FY2', () => {
    const fy1 = computeNextProgression(
      student({
        role_type: 'foundation_doctor',
        university: null,
        study_year: null,
        foundation_year: 'FY1',
      }),
      { nextCohortLabel: '26-27' }
    )
    expect(fy1).toMatchObject({ action: 'advance', foundation_year: 'FY2', academic_cohort: '26-27' })

    const fy2 = computeNextProgression(
      student({
        role_type: 'foundation_doctor',
        university: null,
        study_year: null,
        foundation_year: 'FY2',
      })
    )
    expect(fy2).toMatchObject({ action: 'graduate', isExit: true })
  })

  it('pauses intercalated and skips already graduated', () => {
    expect(computeNextProgression(student({ academic_status: 'intercalated' }))).toEqual({
      skip: true,
      reason: 'Intercalated — progression paused',
    })
    expect(computeNextProgression(student({ academic_status: 'graduated' }))).toMatchObject({
      skip: true,
    })
  })

  it('is idempotent for the same snapshot', () => {
    const user = student({ study_year: '3' })
    expect(computeNextProgression(user, { nextCohortLabel: '26-27' })).toEqual(
      computeNextProgression(user, { nextCohortLabel: '26-27' })
    )
  })
})

describe('upcomingCohortLabel', () => {
  it('picks the year after is_current when that row exists', () => {
    expect(
      upcomingCohortLabel([
        { label: '25-26', is_current: true },
        { label: '26-27', is_current: false },
        { label: '27-28', is_current: false },
      ])
    ).toBe('26-27')
  })

  it('orders labels by academic year', () => {
    expect(compareCohortLabels('25-26', '26-27')).toBeLessThan(0)
  })
})
