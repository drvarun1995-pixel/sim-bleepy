import { describe, expect, it } from 'vitest'
import { canAccessPersonalPortfolios, canAccessSimulationFellowship } from '@/lib/roles'

describe('canAccessPersonalPortfolios', () => {
  it('allows CTF and admin', () => {
    expect(canAccessPersonalPortfolios({ role: 'ctf' })).toBe(true)
    expect(canAccessPersonalPortfolios({ role: 'admin' })).toBe(true)
  })

  it('allows foundation doctors by role_type', () => {
    expect(
      canAccessPersonalPortfolios({ role: 'student', roleType: 'foundation_doctor' })
    ).toBe(true)
  })

  it('allows FY1/FY2 when role_type is missing', () => {
    expect(canAccessPersonalPortfolios({ role: 'student', foundationYear: 'FY1' })).toBe(true)
    expect(canAccessPersonalPortfolios({ role: 'student', foundationYear: 'FY2' })).toBe(true)
  })

  it('does not allow medical students', () => {
    expect(
      canAccessPersonalPortfolios({
        role: 'student',
        roleType: 'medical_student',
        foundationYear: 'FY1',
      })
    ).toBe(false)
  })

  it('does not allow educators or MedEd', () => {
    expect(canAccessPersonalPortfolios({ role: 'educator' })).toBe(false)
    expect(canAccessPersonalPortfolios({ role: 'meded_team' })).toBe(false)
  })
})

describe('canAccessSimulationFellowship', () => {
  it('allows CTF and admin only', () => {
    expect(canAccessSimulationFellowship({ role: 'ctf' })).toBe(true)
    expect(canAccessSimulationFellowship({ role: 'admin' })).toBe(true)
  })

  it('does not allow foundation year or other roles', () => {
    expect(canAccessSimulationFellowship({ role: 'student' })).toBe(false)
    expect(canAccessSimulationFellowship({ role: 'educator' })).toBe(false)
    expect(canAccessSimulationFellowship({ role: 'meded_team' })).toBe(false)
  })
})
