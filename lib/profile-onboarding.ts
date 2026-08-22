/**
 * Profile onboarding gate helpers.
 * Separate from feature tours (`onboarding_completed` / never_show).
 */

export type ProfileOnboardingUser = {
  profile_completed?: boolean | null
  role_type?: string | null
  university?: string | null
  onboarding_completed_at?: string | null
}

/** True when the user has finished the required profile onboarding. */
export function isProfileOnboardingComplete(
  user: ProfileOnboardingUser | null | undefined
): boolean {
  if (!user) return false
  if (!user.profile_completed) return false
  if (!user.role_type) return false
  if (user.role_type === 'medical_student' && !user.university) return false
  return true
}

/**
 * Paths that always require login (even before/without profile onboarding).
 * Public marketing and public event browsing stay outside this list.
 */
export const AUTH_REQUIRED_PATH_PREFIXES = [
  '/dashboard',
  '/placements',
  '/placements-guide',
  '/blog-analytics',
  '/download-analytics',
  '/my-bookings',
  '/my-attendance',
  '/mycertificates',
  '/bookings',
  '/cohorts',
  '/event-data',
  '/certificates',
  '/feedback',
  '/attendance-tracking',
  '/qr-codes',
  '/bulk-upload',
  '/bulk-upload-ai',
  '/emails',
  '/analytics',
  '/games-organiser',
  '/stations',
  '/profile',
  '/settings',
  '/imt-portfolio',
  '/teaching-portfolio',
  '/simulation-fellowship',
  '/admin-users',
  '/admin-file-requests',
  '/admin-teaching-requests',
  '/admin',
  '/year-progression',
  '/contact-messages',
  '/simulator-analytics',
  '/meded-contacts',
  '/resources-for-teaching',
] as const

/**
 * Logged-in users must finish profile onboarding before these app areas.
 * Includes some routes that are also browsable while logged out (e.g. /events).
 */
export const PROFILE_REQUIRED_PATH_PREFIXES = [
  ...AUTH_REQUIRED_PATH_PREFIXES,
  '/events',
  '/events-list',
  '/calendar',
  '/calendar-subscription',
  '/formats',
  '/games',
  '/downloads',
  '/changelog',
  '/clinical-sounds',
  '/network',
  '/connections',
  '/friends',
  '/mentors',
  '/portfolio',
] as const

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function pathRequiresAuth(pathname: string): boolean {
  return AUTH_REQUIRED_PATH_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
}

export function pathRequiresProfileOnboarding(pathname: string): boolean {
  return PROFILE_REQUIRED_PATH_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
}

export function isOnboardingProfilePath(pathname: string): boolean {
  return pathname === '/onboarding/profile' || pathname.startsWith('/onboarding/profile/')
}
