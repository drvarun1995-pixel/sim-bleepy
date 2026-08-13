import { describe, expect, it } from 'vitest'
import {
  matchesAnnouncementAudience,
  shouldReceiveStudentTargeting,
} from '@/lib/learner-targeting'
import { filterEventsByProfile } from '@/lib/event-filtering'
import { parseCohortIdentifier } from '@/lib/push/cohort-parse'

const aruYear5Event = {
  id: 'e1',
  title: 'ARU Year 5 teaching',
  date: '2026-09-01',
  startTime: '09:00',
  endTime: '10:00',
  categories: [{ id: 'c1', name: 'ARU Year 5' }, { id: 'c3', name: 'Medical Student' }],
}

const allRolesEvent = {
  id: 'e2',
  title: 'Open session',
  date: '2026-09-01',
  startTime: '09:00',
  endTime: '10:00',
  categories: [{ id: 'c2', name: 'All roles' }],
}

describe('shouldReceiveStudentTargeting', () => {
  it('lets active students through and blocks graduated / keepers', () => {
    expect(
      shouldReceiveStudentTargeting({
        role_type: 'medical_student',
        academic_status: 'active',
        email: 'ada@aru.ac.uk',
      })
    ).toBe(true)
    expect(
      shouldReceiveStudentTargeting({
        role_type: 'medical_student',
        academic_status: 'graduated',
        email: 'ada@aru.ac.uk',
      })
    ).toBe(false)
    expect(
      shouldReceiveStudentTargeting({
        role_type: 'medical_student',
        academic_status: 'active',
        email: 'drvarun1995@gmail.com',
      })
    ).toBe(false)
  })

  it('does not block staff', () => {
    expect(
      shouldReceiveStudentTargeting({
        role_type: 'registrar',
        role: 'user',
        academic_status: 'active',
        email: 'reg@nhs.net',
      })
    ).toBe(true)
  })
})

describe('matchesAnnouncementAudience', () => {
  it('shows type=all to everyone, including graduates', () => {
    expect(
      matchesAnnouncementAudience(
        { role_type: 'medical_student', academic_status: 'graduated' },
        { type: 'all' }
      )
    ).toBe(true)
  })

  it('hides year-specific announcements from graduated students', () => {
    expect(
      matchesAnnouncementAudience(
        {
          role_type: 'medical_student',
          academic_status: 'graduated',
          university: 'ARU',
          study_year: '5',
        },
        { type: 'specific', roles: ['medical_student'], universities: ['ARU'], years: ['5'] }
      )
    ).toBe(false)
  })

  it('shows year-specific announcements to matching active students', () => {
    expect(
      matchesAnnouncementAudience(
        {
          role_type: 'medical_student',
          academic_status: 'active',
          university: 'ARU',
          study_year: '5',
        },
        { type: 'specific', roles: ['medical_student'], universities: ['ARU'], years: ['5'] }
      )
    ).toBe(true)
  })
})

describe('filterEventsByProfile', () => {
  const active = {
    role_type: 'medical_student',
    university: 'ARU',
    study_year: '5',
    academic_status: 'active',
  }

  it('keeps year-matched events for active students', () => {
    const filtered = filterEventsByProfile([aruYear5Event, allRolesEvent], active)
    expect(filtered.map((event) => event.id)).toEqual(['e1', 'e2'])
  })

  it('drops student-year events for graduated learners but keeps universal ones', () => {
    const filtered = filterEventsByProfile([aruYear5Event, allRolesEvent], {
      ...active,
      academic_status: 'graduated',
    })
    expect(filtered.map((event) => event.id)).toEqual(['e2'])
  })

  it('shows every event for platform CTF regardless of job title or cohorts', () => {
    const filtered = filterEventsByProfile([aruYear5Event, allRolesEvent], {
      role: 'ctf',
      role_type: 'clinical_teaching_fellow',
    })
    expect(filtered.map((event) => event.id)).toEqual(['e1', 'e2'])
  })
})

describe('parseCohortIdentifier', () => {
  it('parses ARU/UCL/Foundation labels', () => {
    expect(parseCohortIdentifier('ARU Year 4')).toEqual({ university: 'ARU', year: '4' })
    expect(parseCohortIdentifier('UCL Year 6')).toEqual({ university: 'UCL', year: '6' })
    expect(parseCohortIdentifier('Foundation Year 1')).toEqual({ university: 'Foundation', year: '1' })
    expect(parseCohortIdentifier('ARU-5')).toEqual({ university: 'ARU', year: '5' })
  })
})
