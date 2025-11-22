import React from 'react'
import { Step } from 'react-joyride'

export interface CompleteFormatsTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf'
}

/**
 * Creates the complete Formats Tour
 * 
 * This includes:
 * 1. Formats Sidebar Link
 * 2. Formats View Popup
 * 3. Header Buttons (Extended/Compact, Show 10/20/50/100/All, My Events/All Events, Request Teaching Event)
 * 4. Personalized View Banner (optional)
 * 5. Filters Section (Time Period, Format buttons - clickable instead of dropdown)
 * 6. Events Table/List
 * 7. Pagination Controls
 * 
 * This is the full reusable formats onboarding that can be used by any role.
 */
export function createCompleteFormatsTour(config: CompleteFormatsTourConfig = {}): Step[] {
  const { role = 'student' } = config

  const steps: Step[] = []

  // Step 1: Formats Sidebar Link
  steps.push({
    target: '#sidebar-formats-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Events by Format View</h3>
        <p className="text-gray-700">
          This is your formats navigation link. Click here anytime to access the events by format view where you can browse events organized by their format type (workshops, lectures, etc.).
        </p>
        <p className="text-gray-700">
          The formats view provides a unique way to explore events, allowing you to filter by specific formats and see all events organized by format type.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 2: Formats View Popup (Center)
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: Events by Format View</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your events by format page where you can view all events organized by their format type. You can filter events by specific formats, sort them, and switch between extended and compact views.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore the key features of the formats view.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    disableOverlay: false,
    disableScrolling: false,
  })

  // Step 3: Header Buttons
  const headerButtonsContent = role === 'meded_team' || role === 'ctf' || role === 'educator'
    ? (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-purple-700">Format View Controls</h3>
          <p className="text-gray-700">
            These controls help you manage how you view and interact with events:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li><strong>Extended/Compact:</strong> Toggle between detailed extended view or compact table view</li>
            <li><strong>Show 10/20/50/100/All:</strong> Control how many events are displayed per page</li>
            <li><strong>My Events / All Events:</strong> Toggle between personalized events or all events</li>
            <li><strong>Request Teaching Event:</strong> Submit a request for a teaching event</li>
          </ul>
        </div>
      )
    : (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-purple-700">Format View Controls</h3>
          <p className="text-gray-700">
            These controls help you manage how you view events:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li><strong>Extended/Compact:</strong> Toggle between detailed extended view or compact table view</li>
            <li><strong>Show 10/20/50/100/All:</strong> Control how many events are displayed per page</li>
            <li><strong>My Events / All Events:</strong> Toggle between personalized events or all events</li>
            <li><strong>Request Teaching Event:</strong> Submit a request for a teaching event</li>
          </ul>
        </div>
      )

  steps.push({
    target: '[data-tour="formats-header-buttons"]',
    content: headerButtonsContent,
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 4: Personalized View Banner (optional - only show if it exists)
  steps.push({
    target: '[data-tour="formats-personalized-banner"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Personalized View Active</h3>
        <p className="text-gray-700">
          This banner confirms that you're viewing events filtered for your profile. The formats view is showing only events relevant to your role, university, and study year.
        </p>
        <p className="text-gray-700">
          Click "All Events" above to see everything, or update your preferences in Profile Settings to customize what you see.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 5: Filters Section
  steps.push({
    target: '[data-tour="formats-filters"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Format Filters</h3>
        <p className="text-gray-700">
          Use these filters to narrow down the events you see by format:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Time Period:</strong> Filter by Upcoming, Expired, or All Events</li>
          <li><strong>Format Buttons:</strong> Click on format buttons (e.g., "Workshop", "Lecture", "Bedside Teaching") to filter events by that specific format. Each button shows the count of events for that format.</li>
          <li><strong>Show All:</strong> Click "Show All" to clear format filters and see all events</li>
          <li><strong>Reset All:</strong> Clear all filters including time period</li>
        </ul>
        <p className="text-gray-700">
          Unlike the events list page, format filters here are clickable buttons instead of dropdowns, making it easy to see and select multiple formats at once.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 6: Events Table/List
  steps.push({
    target: '[data-tour="formats-table"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Events Table</h3>
        <p className="text-gray-700">
          This table displays all your filtered events organized by format. Here you can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>See event details including date, time, location, organizer, and speaker</li>
          <li>Click on column headers to sort events (Date & Time, Location, Organizer, Speaker, etc.)</li>
          <li>Click on any event row to view its full details</li>
          <li>Use "View Details" button to open the event page</li>
          <li>See event status badges and format color indicators</li>
        </ul>
        <p className="text-gray-700">
          The table updates automatically based on your active format filters, time period selection, and sorting preferences.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 7: Pagination
  steps.push({
    target: '[data-tour="formats-pagination"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Pagination Controls</h3>
        <p className="text-gray-700">
          When you have many events, use these pagination controls to navigate through pages:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>First/Prev/Next/Last:</strong> Navigate to the first, previous, next, or last page</li>
          <li><strong>Page Numbers:</strong> Click on a specific page number to jump directly to that page</li>
          <li><strong>Go to page:</strong> Type a page number to jump directly to that page</li>
          <li><strong>Showing X-Y of Z events:</strong> See how many events are displayed and the total count</li>
        </ul>
        <p className="text-gray-700">
          The pagination automatically adjusts based on your "Show 10/20/50/100/All" selection and the number of filtered events.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}

