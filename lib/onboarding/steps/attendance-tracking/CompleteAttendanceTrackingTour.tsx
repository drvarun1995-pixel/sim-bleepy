import React from 'react'
import { Step } from 'react-joyride'

export interface CompleteAttendanceTrackingTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf' | 'admin'
}

/**
 * Creates the complete Attendance Tracking Tour
 * 
 * This includes:
 * 1. Attendance Tracking Sidebar Link
 * 2. Attendance Tracking View Popup (Center)
 * 3. Search Input
 * 4. Filters Section
 * 5. Reset Filters and View Toggle Buttons
 * 6. Attendance Tracking List
 * 
 * This is the full reusable attendance tracking onboarding that can be used by any role with attendance tracking permissions.
 */
export function createCompleteAttendanceTrackingTour(config: CompleteAttendanceTrackingTourConfig = {}): Step[] {
  const { role = 'meded_team' } = config

  const steps: Step[] = []

  // Step 0: Attendance Tracking Sidebar Link
  // Use specific selector that targets desktop sidebar (Event Operations section), not mobile
  steps.push({
    target: 'nav #sidebar-attendance-tracking-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Attendance Tracking</h3>
        <p className="text-gray-700">
          This is your attendance tracking navigation link. Click here anytime to access the attendance tracking page where you can view and manage attendance records for events with QR code attendance enabled.
        </p>
        <p className="text-gray-700">
          This page provides comprehensive attendance statistics, filtering options, and detailed records for each event.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 1: Attendance Tracking View Popup (Center)
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: Attendance Tracking Page</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your attendance tracking page. Here you can view attendance records, filter events, analyze attendance statistics, and manage QR code attendance data.
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

  // Step 2: Search Input
  steps.push({
    target: '[data-tour="attendance-tracking-search"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Search Events</h3>
        <p className="text-gray-700">
          Use this search box to quickly find events by title. Type any part of the event name to filter the list in real-time.
        </p>
        <p className="text-gray-700">
          The search works instantly, updating results as you type. This helps you quickly locate specific events when reviewing attendance data.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 3: Filters Section
  steps.push({
    target: '[data-tour="attendance-tracking-filters"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Event Filters</h3>
        <p className="text-gray-700">
          Use these filters to narrow down events by various criteria:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Category:</strong> Filter by event categories</li>
          <li><strong>Location:</strong> Filter by event locations</li>
          <li><strong>Organizer:</strong> Filter by event organizers</li>
          <li><strong>Speaker:</strong> Filter by event speakers</li>
          <li><strong>Format:</strong> Filter by event formats</li>
        </ul>
        <p className="text-gray-700">
          You can also filter by status (All Events, With QR Code, Without QR Code, Active QR Codes, Inactive QR Codes, Completed Events, Upcoming Events) using the dropdown next to the search bar.
        </p>
        <p className="text-gray-700">
          Combine multiple filters to find exactly the events you're looking for.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 4: Reset Filters and View Toggle Buttons
  steps.push({
    target: '[data-tour="attendance-tracking-buttons"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Action Buttons</h3>
        <p className="text-gray-700">
          <strong>Reset Filters:</strong> Click this button to clear all active filters and search queries, returning to the default view with all events.
        </p>
        <p className="text-gray-700">
          <strong>View Mode Toggle:</strong> Switch between two viewing modes:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Extended:</strong> Shows events in a grid layout with more detailed information</li>
          <li><strong>Compact:</strong> Shows events in a list layout for a more condensed view</li>
        </ul>
        <p className="text-gray-700">
          Choose the view mode that works best for your workflow.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 5: Attendance Tracking List
  steps.push({
    target: '[data-tour="attendance-tracking-list"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Attendance Tracking Overview</h3>
        <p className="text-gray-700">
          This section displays all events with QR attendance enabled. For each event, you can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>View Attendance Stats:</strong> See total scans, successful scans, failed scans, unique attendees, and attendance rates</li>
          <li><strong>View QR Code Details:</strong> Access QR code information, scan windows, and activation status</li>
          <li><strong>View Attendance Records:</strong> See detailed records of who scanned the QR code and when</li>
          <li><strong>Export Data:</strong> Download attendance data for reporting and analysis</li>
        </ul>
        <p className="text-gray-700">
          Each event card shows key attendance metrics at a glance, including scan counts, attendance rates, and QR code status. Click on an event to view detailed attendance records.
        </p>
        <p className="text-gray-700">
          If no events are found, it means there are no events with QR attendance enabled, or your current filters don't match any events. Try adjusting your search or filter criteria.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}

