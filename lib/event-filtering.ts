/**
 * Event Filtering Service
 * Filters events based on user profile to show personalized content
 */

import { ukEventDateTimeToUtc } from '@/lib/ukEventTime'
import { isLearnerTargetable, isStudentOpsRole } from '@/lib/year-progression'

interface UserProfile {
  role_type?: string
  university?: string
  study_year?: string
  foundation_year?: string
  interests?: string[]
  show_all_events?: boolean
  academic_status?: string | null
}

interface EventCategory {
  id: string
  name: string
  color?: string
}

interface Event {
  id: string
  title: string
  description?: string
  date: string
  startTime: string
  endTime: string
  location?: string
  categories?: EventCategory[]
  category?: string
  format?: string
  formatColor?: string
  [key: string]: any
}

/** True for ARU/UCL/year-N student tags — not "Foundation Year 1/2". */
function isMedicalStudentCategory(cat: string): boolean {
  const c = cat.toLowerCase().trim()
  if (c.includes('foundation')) return false
  if (c.includes('fy1') || c.includes('fy2')) return false
  if (/\b(aru|ucl|anglia ruskin)\b/.test(c)) return true
  if (c.includes('medical student') || c.includes('undergraduate')) return true
  // "Year 3", "ARU Year 5", etc. — but not foundation years
  if (/\byear\s*[1-6]\b/.test(c) || /\by[1-6]\b/.test(c)) return true
  return false
}

function isFoundationCategory(cat: string): boolean {
  const c = cat.toLowerCase().trim()
  return (
    c.includes('foundation') ||
    c.includes('fy1') ||
    c.includes('fy2') ||
    c === 'foundation year doctor'
  )
}

function isUniversalCategory(cat: string): boolean {
  const c = cat.toLowerCase().trim()
  return (
    c.includes('all roles') ||
    c.includes('all professionals') ||
    c.includes('all universities') ||
    c.includes('all students') ||
    c.includes('all years') ||
    c === 'general'
  )
}

/** Map profile FY1/FY2 to category strings used on events. */
function foundationYearAliases(foundationYear: string): string[] {
  const fy = foundationYear.trim().toUpperCase()
  if (fy === 'FY1' || fy === 'FOUNDATION YEAR 1') {
    return ['fy1', 'foundation year 1', 'foundation year1', 'f y 1']
  }
  if (fy === 'FY2' || fy === 'FOUNDATION YEAR 2') {
    return ['fy2', 'foundation year 2', 'foundation year2', 'f y 2']
  }
  return [foundationYear.toLowerCase()]
}

function categoryMatchesFoundationYear(cat: string, foundationYear: string): boolean {
  const c = cat.toLowerCase()
  return foundationYearAliases(foundationYear).some((alias) => c.includes(alias))
}

function isSpecificFoundationYearCategory(cat: string): boolean {
  const c = cat.toLowerCase()
  return (
    c.includes('fy1') ||
    c.includes('fy2') ||
    c.includes('foundation year 1') ||
    c.includes('foundation year 2')
  )
}

/**
 * Filters events based on user profile
 * Returns only events relevant to the user's role, university, year, etc.
 */
export function filterEventsByProfile(events: Event[], userProfile: UserProfile): Event[] {
  // If user wants to see all events, return everything
  if (userProfile.show_all_events) {
    return events
  }

  // If no profile data, return all events
  if (!userProfile.role_type) {
    return events
  }

  if (
    isStudentOpsRole(userProfile.role_type) &&
    !isLearnerTargetable(userProfile)
  ) {
    return events.filter((event) => {
      const categories = event.categories || []
      const categoryNames = categories.map((cat) => cat.name.toLowerCase())
      const mainCategory = (event.category || '').toLowerCase()
      const allCats = [...categoryNames, mainCategory].filter(Boolean)
      if (allCats.length === 0) return true
      return allCats.some(isUniversalCategory)
    })
  }

  return events.filter(event => {
    const categories = event.categories || []
    const categoryNames = categories.map(cat => cat.name.toLowerCase())
    const mainCategory = (event.category || '').toLowerCase()
    const allCats = [...categoryNames, mainCategory].filter(Boolean)
    const allCategoryText = allCats.join(' ')

    // 1. Check University Match (for students)
    if (userProfile.university && userProfile.role_type === 'medical_student') {
      const hasUniversityMatch = categoryNames.some(cat => 
        cat.includes(userProfile.university!.toLowerCase())
      ) || allCategoryText.includes(userProfile.university.toLowerCase())
      
      const isUniversalEvent = allCats.some(isUniversalCategory)
      
      if (!hasUniversityMatch && !isUniversalEvent) {
        return false
      }
    }

    // 2. Check Year Match (for medical students)
    // Only filter by year if the user has selected a specific year
    // If they selected a university but not a year, show all events for that university
    if (userProfile.study_year && userProfile.role_type === 'medical_student' && userProfile.university) {
      const hasYearMatch = categoryNames.some(cat => 
        cat.includes(`year ${userProfile.study_year}`) ||
        cat.includes(`year${userProfile.study_year}`) ||
        cat.includes(`y${userProfile.study_year}`)
      ) || allCategoryText.includes(`year ${userProfile.study_year}`)
      
      const isAllYearsEvent = allCats.some(isUniversalCategory)
      
      // Check if event has ANY medical-student year-specific categories
      const hasAnyYearSpecific = allCats.some(isMedicalStudentCategory)
      
      // If event has year-specific categories, only show if it matches the user's year
      // If event has no year-specific categories, show it (it's a general university event)
      if (hasAnyYearSpecific) {
        // Event is year-specific, must match the user's year or be "all years"
        if (!hasYearMatch && !isAllYearsEvent) {
          return false
        }
      }
      // If !hasAnyYearSpecific, event is shown (it's a general university event)
    }

    // 3. Foundation doctors — always exclude medical-student-only events
    // (Previously this only ran when FY1/FY2 was unset, so ARU/UCL events leaked through.)
    if (userProfile.role_type === 'foundation_doctor') {
      const isFoundationRelated = allCats.some(isFoundationCategory)
      const isUniversalEvent = allCats.some(
        (cat) =>
          cat.includes('all roles') ||
          cat.includes('all professionals') ||
          cat === 'general'
      )
      const isMedicalStudentEvent = allCats.some(isMedicalStudentCategory)
      const isOtherRoleEvent = allCats.some((cat) => {
        const c = cat.toLowerCase()
        if (isFoundationCategory(c)) return false
        return (
          c.includes('registrar') ||
          c.includes('consultant') ||
          c.includes('clinical fellow') ||
          c.includes('specialty doctor')
        )
      })

      // Student / other-role events must not appear for foundation doctors
      if (isMedicalStudentEvent && !isFoundationRelated && !isUniversalEvent) {
        return false
      }
      if (isOtherRoleEvent && !isFoundationRelated && !isUniversalEvent) {
        return false
      }

      // Require foundation relevance or an explicitly universal audience
      if (!isFoundationRelated && !isUniversalEvent) {
        return false
      }

      // If user picked FY1/FY2, hide the other FY-specific events
      if (userProfile.foundation_year) {
        const hasSpecificFYYear = allCats.some(isSpecificFoundationYearCategory)
        const hasFYMatch = allCats.some((cat) =>
          categoryMatchesFoundationYear(cat, userProfile.foundation_year!)
        )
        const isGeneralFoundationEvent =
          isFoundationRelated && !hasSpecificFYYear

        if (hasSpecificFYYear && !hasFYMatch && !isGeneralFoundationEvent && !isUniversalEvent) {
          return false
        }
      }

      // Foundation doctors handled above — skip generic role matcher
      return true
    }

    // 4. Check Role Match (general) — non-foundation roles
    if (userProfile.role_type) {
      const roleKeywords = getRoleKeywords(userProfile.role_type)
      const hasRoleMatch = roleKeywords.some(keyword => 
        allCategoryText.includes(keyword)
      )
      
      const isUniversalRole = allCats.some(isUniversalCategory)
      
      // Check if event has categories for the user's specific role
      const hasUserRoleCategories = roleKeywords.some(keyword => 
        categoryNames.some(cat => cat.includes(keyword))
      )
      
      // If event has categories specifically for the user's role, show it
      if (hasUserRoleCategories) {
        return true
      }
      
      // If it's a specific role event and doesn't match, filter it out
      const hasSpecificRole = categoryNames.some(cat => 
        cat.includes('student') ||
        cat.includes('doctor') ||
        cat.includes('fellow') ||
        cat.includes('registrar') ||
        cat.includes('consultant') ||
        isMedicalStudentCategory(cat) ||
        isFoundationCategory(cat)
      )
      
      if (hasSpecificRole && !hasRoleMatch && !isUniversalRole) {
        return false
      }
    }

    return true
  })
}

/**
 * Scores events based on user interests
 * Events matching user interests get higher scores for prioritization
 */
export function scoreEventsByInterests(events: Event[], userProfile: UserProfile): Array<Event & { relevanceScore: number }> {
  if (!userProfile.interests || userProfile.interests.length === 0) {
    return events.map(event => ({ ...event, relevanceScore: 0 }))
  }

  return events.map(event => {
    const categories = event.categories || []
    const categoryNames = categories.map(cat => cat.name.toLowerCase())
    const title = event.title.toLowerCase()
    const allText = [...categoryNames, title].join(' ')

    let score = 0

    // Check each interest
    userProfile.interests?.forEach(interest => {
      const interestKeyword = getInterestKeywords(interest)
      if (interestKeyword.some(keyword => allText.includes(keyword))) {
        score += 1
      }
    })

    return {
      ...event,
      relevanceScore: score
    }
  })
}

/**
 * Get keywords for a specific role type
 */
function getRoleKeywords(roleType: string): string[] {
  const roleMap: Record<string, string[]> = {
    'medical_student': ['student', 'medical student', 'undergraduate'],
    'foundation_doctor': ['foundation', 'fy1', 'fy2', 'foundation year', 'foundation doctor'],
    'clinical_fellow': ['fellow', 'clinical fellow'],
    'specialty_doctor': ['specialty doctor', 'specialty'],
    'registrar': ['registrar', 'specialist registrar'],
    'consultant': ['consultant']
  }

  return roleMap[roleType] || []
}

/**
 * Get keywords for a specific interest
 */
function getInterestKeywords(interest: string): string[] {
  const interestMap: Record<string, string[]> = {
    'clinical_skills': ['clinical skills', 'osce', 'examination', 'clinical'],
    'research': ['research', 'academia', 'publication', 'study'],
    'surgery': ['surgery', 'surgical', 'operation', 'theatre'],
    'medicine': ['medicine', 'medical', 'internal medicine'],
    'pediatrics': ['pediatrics', 'paediatrics', 'children', 'paeds'],
    'emergency': ['emergency', 'a&e', 'acute', 'trauma'],
    'psychiatry': ['psychiatry', 'mental health', 'psychological'],
    'radiology': ['radiology', 'imaging', 'x-ray', 'ct', 'mri'],
    'orthopedics': ['orthopedics', 'orthopaedics', 'bones', 'fracture'],
    'cardiology': ['cardiology', 'cardiac', 'heart'],
    'oncology': ['oncology', 'cancer', 'oncological'],
    'neurology': ['neurology', 'neurological', 'brain', 'neuro']
  }

  return interestMap[interest] || [interest]
}

/**
 * Filters events to show only upcoming events
 */
export function getUpcomingEvents(events: Event[]): Event[] {
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Start of today

  return events.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate >= now
  })
}

/**
 * Filters events for today
 */
export function getTodayEvents(events: Event[]): Event[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return events.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate >= today && eventDate < tomorrow
  })
}

/**
 * Filters events for this week (next 7 days)
 */
export function getThisWeekEvents(events: Event[]): Event[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  return events.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate >= today && eventDate < nextWeek
  })
}

/**
 * Filters events for this month
 */
export function getThisMonthEvents(events: Event[]): Event[] {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  return events.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate.getMonth() === currentMonth && 
           eventDate.getFullYear() === currentYear &&
           eventDate >= now // Only future events
  })
}

/**
 * Sorts events by date and time
 */
export function sortEventsByDate(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    const dateA = ukEventDateTimeToUtc(a.date, a.startTime || '00:00')
    const dateB = ukEventDateTimeToUtc(b.date, b.startTime || '00:00')
    return dateA.getTime() - dateB.getTime()
  })
}
