/**
 * Maps navigation item names to data-tour attribute values
 */
export function getTourAttribute(itemName: string): string | undefined {
  const mapping: Record<string, string> = {
    'Stations': 'ai-simulator',
    'Calendar': 'calendar',
    'Events': 'events-list',
    'My Bookings': 'my-bookings',
    'My Certificates': 'my-certificates',
    'Dashboard': 'dashboard-main',
    'Profile': 'profile-settings',
    'Overview': 'progress-tracking',
    'Announcements': 'announcements',
    'File Requests': 'file-requests',
    'Teaching Requests': 'teaching-requests',
    'Downloads': 'resources',
    'Event Data': 'event-data',
    'Smart Bulk Upload': 'bulk-upload',
    'QR Codes': 'qr-codes',
    'Attendance Tracking': 'attendance-tracking',
    'Feedback': 'feedback',
    'Certificates': 'certificates',
    'Contact Messages': 'contact-messages',
    'Student Cohorts': 'student-cohorts',
    // Social features temporarily disabled - tour attributes removed
    // 'Connections (Beta)': 'connections',
    // 'Friends (Beta)': 'connections-friends',
    // 'Mentors (Beta)': 'connections-mentors',
  }

  return mapping[itemName]
}
