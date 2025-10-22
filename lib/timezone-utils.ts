/**
 * Timezone utilities for handling UK daylight saving time shifts
 * UK switches between GMT (UTC+0) and BST (UTC+1) twice a year
 */

export interface TimezoneInfo {
  timezone: string
  offset: number
  isDST: boolean
  displayName: string
  nextTransition?: {
    date: Date
    type: 'start' | 'end'
    newOffset: number
  }
}

/**
 * Get current UK timezone information
 */
export function getUKTimezoneInfo(): TimezoneInfo {
  const now = new Date()
  const ukTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }))
  const utcTime = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }))
  
  // Calculate offset in minutes
  const offsetMinutes = (ukTime.getTime() - utcTime.getTime()) / (1000 * 60)
  const offsetHours = offsetMinutes / 60
  
  const isDST = offsetHours === 1 // BST (British Summer Time)
  const timezone = isDST ? 'BST' : 'GMT'
  const displayName = isDST ? 'British Summer Time (BST)' : 'Greenwich Mean Time (GMT)'
  
  // Calculate next DST transition
  const nextTransition = getNextDSTTransition(now)
  
  return {
    timezone,
    offset: offsetHours,
    isDST,
    displayName,
    nextTransition
  }
}

/**
 * Get the next DST transition date
 */
function getNextDSTTransition(currentDate: Date): TimezoneInfo['nextTransition'] {
  const year = currentDate.getFullYear()
  
  // DST starts: Last Sunday in March at 1:00 AM
  const marchLastSunday = getLastSundayOfMonth(year, 2) // March (month 2)
  marchLastSunday.setHours(1, 0, 0, 0)
  
  // DST ends: Last Sunday in October at 2:00 AM
  const octoberLastSunday = getLastSundayOfMonth(year, 9) // October (month 9)
  octoberLastSunday.setHours(2, 0, 0, 0)
  
  const now = currentDate.getTime()
  
  // Check if we're currently in DST
  const isCurrentlyDST = currentDate >= marchLastSunday && currentDate < octoberLastSunday
  
  if (isCurrentlyDST) {
    // Next transition is end of DST (October)
    return {
      date: octoberLastSunday,
      type: 'end',
      newOffset: 0 // GMT
    }
  } else {
    // Next transition is start of DST (March)
    return {
      date: marchLastSunday,
      type: 'start',
      newOffset: 1 // BST
    }
  }
}

/**
 * Get the last Sunday of a given month
 */
function getLastSundayOfMonth(year: number, month: number): Date {
  // Get the last day of the month
  const lastDay = new Date(year, month + 1, 0)
  const dayOfWeek = lastDay.getDay()
  
  // Calculate days to subtract to get to the last Sunday
  const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek
  const lastSunday = new Date(lastDay)
  lastSunday.setDate(lastDay.getDate() - daysToSubtract)
  
  return lastSunday
}

/**
 * Convert a date to UK timezone
 */
export function toUKTime(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: "Europe/London" }))
}

/**
 * Convert UK time to UTC
 */
export function fromUKTimeToUTC(ukDate: Date): Date {
  // Create a new date with the same local time but in UTC
  const utcDate = new Date(ukDate.getTime())
  
  // Get the current UK timezone offset
  const ukInfo = getUKTimezoneInfo()
  
  // Adjust for the timezone offset
  utcDate.setTime(utcDate.getTime() - (ukInfo.offset * 60 * 60 * 1000))
  
  return utcDate
}

/**
 * Format a date for display with timezone information
 */
export function formatDateWithTimezone(date: Date, includeTimezone = true): string {
  const ukTime = toUKTime(date)
  const ukInfo = getUKTimezoneInfo()
  
  const formattedDate = ukTime.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  
  const formattedTime = ukTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  
  if (includeTimezone) {
    return `${formattedDate} ${formattedTime} ${ukInfo.timezone}`
  }
  
  return `${formattedDate} ${formattedTime}`
}

/**
 * Get timezone warning for upcoming DST transitions
 */
export function getDSTWarning(): string | null {
  const ukInfo = getUKTimezoneInfo()
  
  if (!ukInfo.nextTransition) return null
  
  const now = new Date()
  const daysUntilTransition = Math.ceil(
    (ukInfo.nextTransition.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  if (daysUntilTransition <= 7) {
    const transitionType = ukInfo.nextTransition.type === 'start' ? 'starts' : 'ends'
    const newTimezone = ukInfo.nextTransition.type === 'start' ? 'BST' : 'GMT'
    
    return `⚠️ Daylight Saving Time ${transitionType} in ${daysUntilTransition} days. Clocks will ${ukInfo.nextTransition.type === 'start' ? 'spring forward' : 'fall back'} 1 hour to ${newTimezone}.`
  }
  
  return null
}

/**
 * Handle timezone shifts in event scheduling
 */
export function adjustEventTimeForDST(eventDate: Date, eventTime: string): {
  adjustedDate: Date
  timezoneInfo: TimezoneInfo
  warning?: string
} {
  const ukInfo = getUKTimezoneInfo()
  
  // Parse the event time (assuming format like "14:30")
  const [hours, minutes] = eventTime.split(':').map(Number)
  
  // Create the event date in UK timezone
  const eventDateTime = new Date(eventDate)
  eventDateTime.setHours(hours, minutes, 0, 0)
  
  // Convert to UTC for storage
  const utcDateTime = fromUKTimeToUTC(eventDateTime)
  
  // Check if this event falls during a DST transition
  const nextTransition = ukInfo.nextTransition
  let warning: string | undefined
  
  if (nextTransition) {
    const eventTime = eventDateTime.getTime()
    const transitionTime = nextTransition.date.getTime()
    const timeDiff = Math.abs(eventTime - transitionTime)
    
    // If event is within 24 hours of DST transition
    if (timeDiff < 24 * 60 * 60 * 1000) {
      warning = `This event is scheduled near a DST transition. Please verify the time is correct.`
    }
  }
  
  return {
    adjustedDate: utcDateTime,
    timezoneInfo: ukInfo,
    warning
  }
}

/**
 * Display timezone information component
 */
export function getTimezoneDisplayComponent(): {
  currentTimezone: string
  nextTransition: string | null
  warning: string | null
} {
  const ukInfo = getUKTimezoneInfo()
  const warning = getDSTWarning()
  
  let nextTransitionText: string | null = null
  if (ukInfo.nextTransition) {
    const transitionDate = ukInfo.nextTransition.date.toLocaleDateString('en-GB')
    const transitionType = ukInfo.nextTransition.type === 'start' ? 'starts' : 'ends'
    nextTransitionText = `Next DST transition: ${transitionType} on ${transitionDate}`
  }
  
  return {
    currentTimezone: ukInfo.displayName,
    nextTransition: nextTransitionText,
    warning
  }
}



