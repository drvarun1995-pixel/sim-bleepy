import {
  isExcludedFromLearnerLists,
  isLearnerTargetable,
  isStudentOpsRole,
  isStudentTargetable,
} from '@/lib/year-progression'

export {
  isExcludedFromLearnerLists,
  isLearnerTargetable,
  isStudentOpsRole,
  isStudentTargetable,
}

export type AnnouncementAudience = {
  type: 'all' | 'specific'
  roles?: string[]
  years?: string[]
  universities?: string[]
  specialties?: string[]
}

export function shouldReceiveStudentTargeting(user: {
  academic_status?: string | null
  role_type?: string | null
  role?: string | null
  email?: string | null
  name?: string | null
} | null | undefined): boolean {
  if (!user) return false
  if (isExcludedFromLearnerLists(user)) return false
  if (!isStudentOpsRole(user.role_type, user.role)) return true
  return isLearnerTargetable(user)
}

export function matchesAnnouncementAudience(
  userProfile: {
    academic_status?: string | null
    role_type?: string | null
    role?: string | null
    study_year?: string | null
    foundation_year?: string | null
    university?: string | null
    specialty?: string | null
    email?: string | null
    name?: string | null
  },
  targetAudience: AnnouncementAudience | null | undefined
): boolean {
  if (!targetAudience || targetAudience.type === 'all') return true

  if (
    isStudentOpsRole(userProfile.role_type, userProfile.role) &&
    !isLearnerTargetable(userProfile)
  ) {
    return false
  }

  const roles = targetAudience.roles || []
  if (roles.length > 0) {
    const userRole = userProfile.role_type || userProfile.role
    if (!userRole || !roles.includes(userRole)) return false
  }

  const years = targetAudience.years || []
  if (years.length > 0) {
    const userYear = userProfile.study_year || userProfile.foundation_year
    if (!userYear || !years.includes(userYear)) return false
  }

  const universities = targetAudience.universities || []
  if (universities.length > 0) {
    if (!userProfile.university || !universities.includes(userProfile.university)) return false
  }

  const specialties = targetAudience.specialties || []
  if (specialties.length > 0) {
    if (!userProfile.specialty || !specialties.includes(userProfile.specialty)) return false
  }

  return true
}
