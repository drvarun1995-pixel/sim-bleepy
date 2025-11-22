import React from 'react'
import { Step } from 'react-joyride'

export interface CompleteMyAttendanceTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf'
}

/**
 * Creates the complete My Attendance Tour
 * 
 * This includes:
 * 1. My Attendance Sidebar Link
 * 2. My Attendance View Popup
 * 3. Attendance Tracking Notice (disclaimer)
 * 4. Search Section
 * 5. Stats Section (Total Events Attended, Filtered Results, Unique Dates)
 * 6. Attendance Records List/Empty State
 * 
 * This is the full reusable my attendance onboarding that can be used by any role.
 */
export function createCompleteMyAttendanceTour(config: CompleteMyAttendanceTourConfig = {}): Step[] {
  const { role = 'student' } = config

  const steps: Step[] = []

  // Step 1: My Attendance Sidebar Link
  steps.push({
    target: '#sidebar-my-attendance-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">My Attendance Tracking</h3>
        <p className="text-gray-700">
          This is your attendance tracking navigation link. Click here anytime to access your attendance page where you can view all events where you've scanned QR codes for attendance.
        </p>
        <p className="text-gray-700">
          The attendance page allows you to track your event attendance history, search through your records, and view detailed information about each event you've attended.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 2: My Attendance View Popup (Center)
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: My Attendance Tracking</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your attendance tracking page where you can view all events where you've scanned QR codes for attendance. You can search through your records, view statistics, and see detailed information about each event.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore the key features of the attendance tracking page.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    disableOverlay: false,
    disableScrolling: false,
  })

  // Step 3: Attendance Tracking Notice
  steps.push({
    target: '[data-tour="my-attendance-notice"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Attendance Tracking Notice</h3>
        <p className="text-gray-700">
          This notice explains that your attendance at events is automatically tracked and monitored by the MedEd Team and Administrators.
        </p>
        <p className="text-gray-700">
          This information is used for educational records, certification, and compliance purposes. Your attendance data helps ensure accurate tracking of your participation in training events.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 4: Search Section
  steps.push({
    target: '[data-tour="my-attendance-search"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Search Your Attendance Records</h3>
        <p className="text-gray-700">
          Use the search bar to quickly find specific attendance records:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>Search by event title</li>
          <li>Search by event format</li>
          <li>Search by location</li>
          <li>Search by organizer</li>
          <li>Search by speaker</li>
        </ul>
        <p className="text-gray-700">
          The search filters your attendance records in real-time, making it easy to find specific events you've attended.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 5: Stats Section
  steps.push({
    target: '[data-tour="my-attendance-stats"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Attendance Statistics</h3>
        <p className="text-gray-700">
          These statistics provide a quick overview of your attendance:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Total Events Attended:</strong> The total number of events where you've scanned QR codes</li>
          <li><strong>Filtered Results:</strong> The number of records matching your current search query</li>
          <li><strong>Unique Dates:</strong> The number of different dates on which you attended events</li>
        </ul>
        <p className="text-gray-700">
          These stats update automatically as you search and filter your attendance records.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 6: Attendance Records List/Empty State
  steps.push({
    target: '[data-tour="my-attendance-records"], [data-tour="my-attendance-empty-state"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Your Attendance Records</h3>
        <p className="text-gray-700">
          Here you can view all your attendance records. Each record shows:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Event Details:</strong> Event title, date, time, format, location, organizer, and speakers</li>
          <li><strong>Attendance Status:</strong> Confirmation that you attended the event</li>
          <li><strong>Scan Timestamp:</strong> The exact date and time when you scanned the QR code</li>
          <li><strong>View Event:</strong> Click to navigate to the full event page for more information</li>
        </ul>
        <p className="text-gray-700">
          If you don't have any attendance records yet, they will appear here automatically once you scan QR codes at events. Each time you scan a QR code at an event, it will be recorded and displayed in this list.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}

