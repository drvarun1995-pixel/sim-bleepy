export type RegistrationSource = 'self' | 'walk_in_scan' | 'walk_in_guest' | 'admin'

/** Shadow `users` row created by guest QR check-in. Not a real signup. */
export const WALK_IN_ACCOUNT_ORIGIN = 'walk_in_guest'

/** Normal website signup / claimed walk-in. Matches the SQL comment on `users.account_origin`. */
export const REGISTERED_ACCOUNT_ORIGIN = null

export type WalkInClaimSignals = {
  account_origin?: string | null
  email_verified?: boolean | null
  must_change_password?: boolean | null
}

export function isWalkInGuestUser(user: { account_origin?: string | null } | null | undefined) {
  return user?.account_origin === WALK_IN_ACCOUNT_ORIGIN
}

/** Registered on the website (verified or not). Door-scan shadows stay excluded. */
export function isRegisteredPlatformUser(user: { account_origin?: string | null } | null | undefined) {
  return !isWalkInGuestUser(user)
}

/**
 * Walk-in row that later chose a password (Forgot password) or was verified.
 * These must be promoted to a normal user (`account_origin` null).
 */
export function walkInGuestLooksClaimed(user: WalkInClaimSignals | null | undefined) {
  if (!isWalkInGuestUser(user)) return false
  if (user?.email_verified) return true
  if (user?.must_change_password === false) return true
  return false
}

/**
 * Still a door shadow: random password, unverified.
 * Sign up may convert this row instead of returning 409.
 */
export function canConvertWalkInGuestOnRegister(user: WalkInClaimSignals | null | undefined) {
  return (
    isWalkInGuestUser(user) &&
    user?.email_verified !== true &&
    user?.must_change_password !== false
  )
}

/** Fields that turn a walk-in shadow into a normal platform user. Keep the same `users.id`. */
export function claimedWalkInAccountFields(now = new Date()) {
  return {
    account_origin: REGISTERED_ACCOUNT_ORIGIN,
    must_change_password: false,
    updated_at: now.toISOString(),
  }
}

export const WALK_IN_DESIGNATION_OPTIONS = [
  { value: 'medical_student', label: 'Medical Student' },
  { value: 'foundation_doctor', label: 'Foundation Year Doctor' },
  { value: 'clinical_fellow', label: 'Clinical Fellow' },
  { value: 'clinical_teaching_fellow', label: 'Clinical Teaching Fellow' },
  { value: 'specialty_doctor', label: 'Specialty Doctor' },
  { value: 'registrar', label: 'Registrar' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'other', label: 'Other' },
] as const

export function registrationSourceLabel(source?: string | null): string {
  switch (source) {
    case 'walk_in_scan':
      return 'Walk-in (signed in)'
    case 'walk_in_guest':
      return 'Walk-in (guest)'
    case 'admin':
      return 'Added by staff'
    case 'self':
    default:
      return 'Registered'
  }
}

export function registrationSourceBadgeClass(source?: string | null): string {
  switch (source) {
    case 'walk_in_scan':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'walk_in_guest':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'admin':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'self':
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}
