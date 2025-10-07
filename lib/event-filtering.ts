/**
 * Event Filtering Service
 * Filters events based on user profile to show personalized content
 */

interface UserProfile {
  role_type?: string
  university?: string
  study_year?: string
  foundation_year?: string
  interests?: string[]
  show_all_events?: boolean
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

  return events.filter(event => {
    const categories = event.categories || []
    const categoryNames = categories.map(cat => cat.name.toLowerCase())
    const mainCategory = (event.category || '').toLowerCase()
    
    // Combine all category names for checking
    const allCategoryText = [...categoryNames, mainCategory].join(' ')

    // 1. Check University Match (for students)
    if (userProfile.university && userProfile.role_type === 'medical_student') {
      const hasUniversityMatch = categoryNames.some(cat => 
        cat.includes(userProfile.university!.toLowerCase())
      ) || allCategoryText.includes(userProfile.university.toLowerCase())
      
      const isUniversalEvent = categoryNames.some(cat => 
        cat.includes('all universities') || 
        cat.includes('all students') ||
        cat.includes('general')
      )
      
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
      
      const isAllYearsEvent = categoryNames.some(cat => 
        cat.includes('all years') || 
        cat.includes('all students') ||
        cat.includes('general')
      )
      
      // Check if event has ANY year-specific categories
      const hasAnyYearSpecific = categoryNames.some(cat => 
        cat.match(/year\s*\d/)
      ) || allCategoryText.match(/year\s*\d/)
      
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

    // 3. Check Foundation Year Match (for foundation doctors)
    // Only filter by specific FY year if the user has selected one
    // If they selected foundation_doctor but not FY1/FY2, show all foundation events
    if (userProfile.foundation_year && userProfile.role_type === 'foundation_doctor') {
      const hasFYMatch = categoryNames.some(cat => 
        cat.includes(userProfile.foundation_year!.toLowerCase())
      ) || allCategoryText.includes(userProfile.foundation_year.toLowerCase())
      
      const isGeneralFoundationEvent = categoryNames.some(cat => 
        (cat.includes('foundation') || cat.includes('foundation year') || cat.includes('foundation doctor')) &&
        !cat.includes('fy1') && !cat.includes('fy2')
      ) || (allCategoryText.includes('foundation') && !allCategoryText.includes('fy1') && !allCategoryText.includes('fy2'))
      
      const isAllRolesEvent = categoryNames.some(cat => 
        cat.includes('all roles') ||
        cat.includes('all professionals')
      )
      
      // Check if event has specific FY year categories
      const hasSpecificFYYear = categoryNames.some(cat => 
        cat.includes('fy1') || cat.includes('fy2')
      ) || allCategoryText.includes('fy1') || allCategoryText.includes('fy2')
      
      // If event has specific FY year, only show if it matches
      // If event is general foundation or all roles, show it
      if (hasSpecificFYYear) {
        if (!hasFYMatch && !isGeneralFoundationEvent && !isAllRolesEvent) {
          return false
        }
      }
    } else if (!userProfile.foundation_year && userProfile.role_type === 'foundation_doctor') {
      // User is a foundation doctor but hasn't selected FY1 or FY2
      // Show them ALL foundation year events (including FY1 and FY2 specific events)
      const isFoundationRelated = categoryNames.some(cat => 
        cat.includes('foundation') ||
        cat.includes('foundation year') ||
        cat.includes('foundation doctor') ||
        cat.includes('fy1') ||
        cat.includes('fy2')
      ) || allCategoryText.includes('foundation')
      
      const isUniversalEvent = categoryNames.some(cat => 
        cat.includes('all roles') ||
        cat.includes('all professionals') ||
        cat.includes('general')
      )
      
      // Check if event is specific to medical students (university-based)
      const isMedicalStudentEvent = categoryNames.some(cat => 
        cat.includes('aru') ||
        cat.includes('ucl') ||
        cat.includes('anglia ruskin') ||
        cat.includes('medical student') ||
        cat.includes('university') ||
        cat.match(/year\s*\d/)
      ) || allCategoryText.includes('aru') || allCategoryText.includes('ucl')
      
      // Check if event is specific to other roles
      const isOtherRoleEvent = categoryNames.some(cat => 
        cat.includes('registrar') ||
        cat.includes('consultant') ||
        cat.includes('clinical fellow') ||
        cat.includes('specialty doctor')
      )
      
      // Only show foundation-related events or universal events
      // Filter out medical student events and other role-specific events
      if (!isFoundationRelated && !isUniversalEvent) {
        return false
      }
      
      if ((isMedicalStudentEvent || isOtherRoleEvent) && !isFoundationRelated && !isUniversalEvent) {
        return false
      }
    }

    // 4. Check Role Match (general)
    if (userProfile.role_type) {
      const roleKeywords = getRoleKeywords(userProfile.role_type)
      const hasRoleMatch = roleKeywords.some(keyword => 
        allCategoryText.includes(keyword)
      )
      
      const isUniversalRole = categoryNames.some(cat => 
        cat.includes('all roles') ||
        cat.includes('all professionals') ||
        cat.includes('general')
      )
      
      // If it's a specific role event and doesn't match, filter it out
      const hasSpecificRole = categoryNames.some(cat => 
        cat.includes('student') ||
        cat.includes('doctor') ||
        cat.includes('fellow') ||
        cat.includes('registrar') ||
        cat.includes('consultant')
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
    const dateA = new Date(`${a.date} ${a.startTime || '00:00'}`)
    const dateB = new Date(`${b.date} ${b.startTime || '00:00'}`)
    return dateA.getTime() - dateB.getTime()
  })
}
