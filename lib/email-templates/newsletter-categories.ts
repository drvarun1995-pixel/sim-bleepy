/**
 * Newsletter audience categories. Safe for client pages.
 */

import { ARU_STUDY_YEARS, UCL_STUDY_YEARS } from '@/lib/study-years'

export type NewsletterUser = {
  id: string
  name: string | null
  email: string | null
  role?: string | null
  role_type?: string | null
  university?: string | null
  study_year?: string | null
  foundation_year?: string | null
  academic_cohort?: string | null
  email_verified?: boolean | null
}

export type NewsletterCategory = {
  id: string
  label: string
  group: 'Everyone' | 'ARU' | 'UCL' | 'Foundation' | 'Staff'
  persona: string
  description: string
}

function roleOf(user: NewsletterUser): string {
  return (user.role || '').toLowerCase()
}

function typeOf(user: NewsletterUser): string {
  return (user.role_type || '').toLowerCase()
}

function matchesStudent(user: NewsletterUser, uniKeyword: string, year: string): boolean {
  if (typeOf(user) !== 'medical_student') return false
  if (!(user.university || '').toLowerCase().includes(uniKeyword)) return false
  const studyYear = String(user.study_year || '')
  return studyYear === year || studyYear === `Year ${year}`
}

function matchesFoundation(user: NewsletterUser, year: '1' | '2'): boolean {
  if (typeOf(user) !== 'foundation_doctor') return false
  const fy = String(user.foundation_year || '').toLowerCase()
  return fy === year || fy === `fy${year}` || fy.includes(`fy${year}`) || fy.includes(`year ${year}`)
}

export function isNewsletterStaffUser(user: NewsletterUser): boolean {
  const role = roleOf(user)
  const type = typeOf(user)
  if (role === 'ctf' || role === 'educator' || role === 'meded_team' || role === 'admin') return true
  return ['clinical_teaching_fellow', 'clinical_fellow', 'registrar', 'consultant'].includes(type)
}

export function matchesCtf(user: NewsletterUser): boolean {
  return roleOf(user) === 'ctf' || typeOf(user) === 'clinical_teaching_fellow'
}

function matchesEducator(user: NewsletterUser): boolean {
  return roleOf(user) === 'educator' && !matchesCtf(user)
}

function matchesMeded(user: NewsletterUser): boolean {
  return roleOf(user) === 'meded_team' && !matchesCtf(user)
}

function matchesOtherStaff(user: NewsletterUser): boolean {
  if (matchesCtf(user) || matchesEducator(user) || matchesMeded(user)) return false
  return isNewsletterStaffUser(user)
}

export function canReceiveNewsletter(user: NewsletterUser): boolean {
  if (!user.email) return false
  return user.email_verified === true
}

export function isNewsletterLearner(user: NewsletterUser): boolean {
  if (isNewsletterStaffUser(user)) return false
  const type = typeOf(user)
  if (type === 'medical_student' || type === 'foundation_doctor') return true
  return roleOf(user) === 'student'
}

export const NEWSLETTER_CATEGORIES: NewsletterCategory[] = [
  {
    id: 'learners',
    label: 'All learners',
    group: 'Everyone',
    persona: 'all',
    description: 'Medical students and FY doctors in this cohort',
  },
  {
    id: 'users',
    label: 'All users',
    group: 'Everyone',
    persona: 'all',
    description: 'Learners in this cohort, plus CTFs, MedEd Team, and other staff',
  },
  ...ARU_STUDY_YEARS.map((year) => ({
    id: `aru-${year}`,
    label: `ARU Year ${year}`,
    group: 'ARU' as const,
    persona: `aru-${year}`,
    description: `ARU medical students in Year ${year}`,
  })),
  ...UCL_STUDY_YEARS.map((year) => ({
    id: `ucl-${year}`,
    label: `UCL Year ${year}`,
    group: 'UCL' as const,
    persona: `ucl-${year}`,
    description: `UCL medical students in Year ${year}`,
  })),
  {
    id: 'fy1',
    label: 'FY1',
    group: 'Foundation',
    persona: 'fy1',
    description: 'Foundation Year 1 doctors',
  },
  {
    id: 'fy2',
    label: 'FY2',
    group: 'Foundation',
    persona: 'fy2',
    description: 'Foundation Year 2 doctors',
  },
  {
    id: 'ctf',
    label: 'CTFs',
    group: 'Staff',
    persona: 'ctf',
    description: 'Clinical Teaching Fellows — not limited by cohort',
  },
  {
    id: 'educator',
    label: 'Educators',
    group: 'Staff',
    persona: 'educator',
    description: 'Educator accounts — not limited by cohort',
  },
  {
    id: 'meded',
    label: 'MedEd Team',
    group: 'Staff',
    persona: 'meded',
    description: 'MedEd Team accounts — not limited by cohort',
  },
  {
    id: 'staff-other',
    label: 'Other staff',
    group: 'Staff',
    persona: 'staff-other',
    description: 'Registrars, consultants, clinical fellows, and admins',
  },
]

export const NEWSLETTER_CATEGORY_GROUPS: NewsletterCategory['group'][] = [
  'Everyone',
  'ARU',
  'UCL',
  'Foundation',
  'Staff',
]

export function newsletterCategoryById(id: string | null | undefined): NewsletterCategory | undefined {
  return NEWSLETTER_CATEGORIES.find((item) => item.id === id)
}

export function userMatchesNewsletterCategory(user: NewsletterUser, categoryId: string): boolean {
  if (categoryId === 'users' || categoryId === 'all') return true
  if (categoryId === 'learners') return isNewsletterLearner(user)
  const aru = categoryId.match(/^aru-(\d)$/)
  if (aru) return matchesStudent(user, 'aru', aru[1])
  const ucl = categoryId.match(/^ucl-(\d)$/)
  if (ucl) return matchesStudent(user, 'ucl', ucl[1])
  if (categoryId === 'fy1') return matchesFoundation(user, '1')
  if (categoryId === 'fy2') return matchesFoundation(user, '2')
  if (categoryId === 'ctf') return matchesCtf(user)
  if (categoryId === 'educator') return matchesEducator(user)
  if (categoryId === 'meded') return matchesMeded(user)
  if (categoryId === 'staff-other') return matchesOtherStaff(user)
  return false
}

export function userInNewsletterCohort(
  user: NewsletterUser,
  cohort: string,
  currentCohort: string
): boolean {
  if (!cohort || cohort === '__all__') return true
  const userCohort = String(user.academic_cohort || '').trim()
  if (userCohort === cohort) return true
  if (!userCohort || userCohort === 'unassigned') return cohort === currentCohort
  return false
}

export function usersForNewsletterCategories(
  users: NewsletterUser[],
  categoryIds: string[],
  cohort: string,
  currentCohort: string
): NewsletterUser[] {
  const ids = Array.from(new Set(categoryIds.filter(Boolean)))
  if (ids.length === 0) return []
  const seen = new Set<string>()
  const out: NewsletterUser[] = []
  for (const id of ids) {
    for (const user of usersForNewsletterCategory(users, id, cohort, currentCohort)) {
      if (seen.has(user.id)) continue
      seen.add(user.id)
      out.push(user)
    }
  }
  return out
}

export function newsletterCategoryLabels(ids: string[]): string {
  return ids
    .map((id) => newsletterCategoryById(id)?.label)
    .filter((label): label is string => Boolean(label))
    .join(', ')
}

export function usersForNewsletterCategory(
  users: NewsletterUser[],
  categoryId: string,
  cohort: string,
  currentCohort: string
): NewsletterUser[] {
  const staffOnly =
    categoryId === 'ctf' ||
    categoryId === 'educator' ||
    categoryId === 'meded' ||
    categoryId === 'staff-other'

  return users.filter((user) => {
    if (!canReceiveNewsletter(user)) return false
    if (!userMatchesNewsletterCategory(user, categoryId)) return false
    if (staffOnly) return true
    if (categoryId === 'users' && isNewsletterStaffUser(user)) return true
    return userInNewsletterCohort(user, cohort, currentCohort)
  })
}
