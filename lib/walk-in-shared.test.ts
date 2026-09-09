import { describe, expect, it } from 'vitest'
import {
  canConvertWalkInGuestOnRegister,
  claimedWalkInAccountFields,
  isRegisteredPlatformUser,
  isWalkInGuestUser,
  walkInGuestLooksClaimed,
} from '@/lib/walk-in-shared'

describe('walk-in claim helpers', () => {
  it('treats only walk_in_guest origin as a door shadow', () => {
    expect(isWalkInGuestUser({ account_origin: 'walk_in_guest' })).toBe(true)
    expect(isWalkInGuestUser({ account_origin: null })).toBe(false)
    expect(isWalkInGuestUser({ account_origin: 'self' })).toBe(false)
    expect(isRegisteredPlatformUser({ account_origin: null })).toBe(true)
    expect(isRegisteredPlatformUser({ account_origin: 'walk_in_guest' })).toBe(false)
  })

  it('detects claimed walk-ins that later reset or verified', () => {
    expect(
      walkInGuestLooksClaimed({
        account_origin: 'walk_in_guest',
        email_verified: true,
        must_change_password: false,
      })
    ).toBe(true)
    expect(
      walkInGuestLooksClaimed({
        account_origin: 'walk_in_guest',
        email_verified: false,
        must_change_password: false,
      })
    ).toBe(true)
    expect(
      walkInGuestLooksClaimed({
        account_origin: 'walk_in_guest',
        email_verified: false,
        must_change_password: true,
      })
    ).toBe(false)
    expect(
      walkInGuestLooksClaimed({
        account_origin: null,
        email_verified: true,
        must_change_password: false,
      })
    ).toBe(false)
  })

  it('only converts unverified door shadows on Sign up', () => {
    expect(
      canConvertWalkInGuestOnRegister({
        account_origin: 'walk_in_guest',
        email_verified: false,
        must_change_password: true,
      })
    ).toBe(true)
    expect(
      canConvertWalkInGuestOnRegister({
        account_origin: 'walk_in_guest',
        email_verified: true,
        must_change_password: false,
      })
    ).toBe(false)
    expect(
      canConvertWalkInGuestOnRegister({
        account_origin: null,
        email_verified: false,
        must_change_password: true,
      })
    ).toBe(false)
  })

  it('clears origin so the same user id becomes a normal signup', () => {
    const fields = claimedWalkInAccountFields(new Date('2026-09-09T18:00:00.000Z'))
    expect(fields.account_origin).toBeNull()
    expect(fields.must_change_password).toBe(false)
    expect(fields.updated_at).toBe('2026-09-09T18:00:00.000Z')
  })

})
