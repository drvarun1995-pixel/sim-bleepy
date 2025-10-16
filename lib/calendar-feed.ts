// Calendar feed utility for generating .ics files
// Timezone: Europe/London

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  location?: string;
  isAllDay?: boolean;
  hideTime?: boolean;
  organizer?: string;
}

// Format date and time for ICS format (Europe/London timezone)
function formatICSDateTime(date: string, time: string): string {
  // date: YYYY-MM-DD, time: HH:MM
  const [year, month, day] = date.split('-');
  const [hours, minutes] = time.split(':');
  
  // Ensure proper padding
  const paddedMonth = month.padStart(2, '0');
  const paddedDay = day.padStart(2, '0');
  const paddedHours = hours.padStart(2, '0');
  const paddedMinutes = minutes.padStart(2, '0');
  
  // Format: YYYYMMDDTHHMMSS
  return `${year}${paddedMonth}${paddedDay}T${paddedHours}${paddedMinutes}00`;
}

// Format date for all-day events
function formatICSDate(date: string): string {
  // date: YYYY-MM-DD
  const [year, month, day] = date.split('-');
  // Format: YYYYMMDD
  return `${year}${month}${day}`;
}

// Escape special characters for ICS format
function escapeICSText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

// Generate a single event in ICS format
function generateICSEvent(event: CalendarEvent): string {
  const uid = `${event.id}@bleepy.co.uk`;
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const eventUrl = `https://sim.bleepy.co.uk/events/${event.id}`;
  
  let eventString = 'BEGIN:VEVENT\r\n';
  eventString += `UID:${uid}\r\n`;
  eventString += `DTSTAMP:${timestamp}\r\n`;
  
  // Handle all-day events or events with hidden time
  if (event.isAllDay || event.hideTime) {
    const startDate = formatICSDate(event.date);
    eventString += `DTSTART;VALUE=DATE:${startDate}\r\n`;
    
    // For all-day events, end date is the next day
    const dateObj = new Date(event.date);
    dateObj.setDate(dateObj.getDate() + 1);
    const endDate = formatICSDate(dateObj.toISOString().split('T')[0]);
    eventString += `DTEND;VALUE=DATE:${endDate}\r\n`;
  } else {
    // Timed events with Europe/London timezone
    const startDateTime = formatICSDateTime(event.date, event.startTime);
    const endDateTime = formatICSDateTime(event.date, event.endTime);
    
    eventString += `DTSTART;TZID=Europe/London:${startDateTime}\r\n`;
    eventString += `DTEND;TZID=Europe/London:${endDateTime}\r\n`;
  }
  
  eventString += `SUMMARY:${escapeICSText(event.title)}\r\n`;
  
  if (event.description) {
    // Strip HTML tags from description
    const plainDescription = event.description.replace(/<[^>]*>/g, '').trim();
    eventString += `DESCRIPTION:${escapeICSText(plainDescription)}\r\n`;
  }
  
  if (event.location && event.location.trim()) {
    eventString += `LOCATION:${escapeICSText(event.location)}\r\n`;
  }
  
  if (event.organizer && event.organizer.trim()) {
    eventString += `ORGANIZER;CN=${escapeICSText(event.organizer)}:mailto:noreply@bleepy.co.uk\r\n`;
  }
  
  eventString += `URL:${eventUrl}\r\n`;
  eventString += `STATUS:CONFIRMED\r\n`;
  eventString += 'END:VEVENT\r\n';
  
  return eventString;
}

// Generate complete calendar feed
export function generateCalendarFeed(events: CalendarEvent[], feedName: string = 'Bleepy Events'): string {
  let icsContent = 'BEGIN:VCALENDAR\r\n';
  icsContent += 'VERSION:2.0\r\n';
  icsContent += 'PRODID:-//Bleepy//Event Calendar//EN\r\n';
  icsContent += 'CALSCALE:GREGORIAN\r\n';
  icsContent += 'METHOD:PUBLISH\r\n';
  icsContent += `X-WR-CALNAME:${escapeICSText(feedName)}\r\n`;
  icsContent += 'X-WR-TIMEZONE:Europe/London\r\n';
  icsContent += 'X-WR-CALDESC:Personalized teaching events from Bleepy\r\n';
  
  // Add timezone definition for Europe/London
  icsContent += 'BEGIN:VTIMEZONE\r\n';
  icsContent += 'TZID:Europe/London\r\n';
  icsContent += 'BEGIN:DAYLIGHT\r\n';
  icsContent += 'TZOFFSETFROM:+0000\r\n';
  icsContent += 'TZOFFSETTO:+0100\r\n';
  icsContent += 'TZNAME:BST\r\n';
  icsContent += 'DTSTART:19700329T010000\r\n';
  icsContent += 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\r\n';
  icsContent += 'END:DAYLIGHT\r\n';
  icsContent += 'BEGIN:STANDARD\r\n';
  icsContent += 'TZOFFSETFROM:+0100\r\n';
  icsContent += 'TZOFFSETTO:+0000\r\n';
  icsContent += 'TZNAME:GMT\r\n';
  icsContent += 'DTSTART:19701025T020000\r\n';
  icsContent += 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU\r\n';
  icsContent += 'END:STANDARD\r\n';
  icsContent += 'END:VTIMEZONE\r\n';
  
  // Add all events
  events.forEach(event => {
    icsContent += generateICSEvent(event);
  });
  
  icsContent += 'END:VCALENDAR\r\n';
  
  return icsContent;
}

// Generate calendar feed name based on filters
export function generateFeedName(filters: {
  university?: string;
  year?: string;
  categories?: string[];
  format?: string;
}): string {
  const parts: string[] = ['Bleepy Events'];
  
  if (filters.university) {
    parts.push(filters.university);
  }
  
  if (filters.year) {
    parts.push(`Year ${filters.year}`);
  }
  
  if (filters.categories && filters.categories.length > 0) {
    if (filters.categories.length === 1) {
      parts.push(filters.categories[0]);
    } else {
      parts.push(`${filters.categories.length} Categories`);
    }
  }
  
  return parts.join(' - ');
}

