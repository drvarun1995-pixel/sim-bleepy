import React from 'react'
import { Step } from 'react-joyride'

export interface CompleteEventsListTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf'
}

/**
 * Creates the complete Events List Tour
 * 
 * This includes:
 * 1. Events Sidebar Link
 * 2. Events List View Popup
 * 3. Header Buttons (Extended/Compact, Show 10/20/50/100/All, My Events/All Events, Request Teaching Event, Export Data)
 * 4. Personalized View Banner (optional)
 * 5. Filters Section
 * 6. Events Table/List
 * 7. Pagination Controls
 * 
 * This is the full reusable events list onboarding that can be used by any role.
 */
export function createCompleteEventsListTour(config: CompleteEventsListTourConfig = {}): Step[] {
  const { role = 'student' } = config

  const steps: Step[] = []

  // Step 1: Events Sidebar Link
  steps.push({
    target: '#sidebar-events-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Events List View</h3>
        <p className="text-gray-700">
          This is your events list navigation link. Click here anytime to access the events list view where you can browse, filter, and manage all events in a table format.
        </p>
        <p className="text-gray-700">
          The events list provides a comprehensive view of all events with sorting, filtering, and detailed information at your fingertips.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 2: Events List View Popup (Center)
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: Events List View</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your events list page where you can view all events in a table format. You can sort events by different columns, filter them to find exactly what you're looking for, and switch between extended and compact views.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore the key features of the events list view.
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
          <h3 className="text-xl font-bold text-purple-700">Event List Controls</h3>
          <p className="text-gray-700">
            These controls help you manage how you view and interact with events:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li><strong>Extended/Compact:</strong> Toggle between detailed extended view or compact table view</li>
            <li><strong>Show 10/20/50/100/All:</strong> Control how many events are displayed per page</li>
            <li><strong>My Events / All Events:</strong> Toggle between personalized events or all events</li>
            <li><strong>Request Teaching Event:</strong> Submit a request for a teaching event</li>
            <li><strong>Export Data:</strong> Export event data for analysis or reporting</li>
          </ul>
        </div>
      )
    : (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-purple-700">Event List Controls</h3>
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
    target: '[data-tour="events-list-header-buttons"]',
    content: headerButtonsContent,
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 4: Personalized View Banner (optional - only show if it exists)
  steps.push({
    target: '[data-tour="events-list-personalized-banner"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Personalized View Active</h3>
        <p className="text-gray-700">
          This banner confirms that you're viewing events filtered for your profile. The events list is showing only events relevant to your role, university, and study year.
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
    target: '[data-tour="events-list-filters"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Event Filters</h3>
        <p className="text-gray-700">
          Use these filters to narrow down the events you see:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Time Period:</strong> Filter by Upcoming, Expired, or All Events</li>
          <li><strong>Category:</strong> Filter by event categories</li>
          <li><strong>Location:</strong> Filter by event location</li>
          <li><strong>Organizer:</strong> Filter by event organizer</li>
          <li><strong>Speaker:</strong> Filter by event speaker</li>
          <li><strong>Format:</strong> Filter by event format (workshop, lecture, etc.)</li>
          <li><strong>Text Search:</strong> Search for events by title or description</li>
        </ul>
        <p className="text-gray-700">
          Click "Reset All" to clear all filters and see all events again.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 6: Events Table/List
  steps.push({
    target: '[data-tour="events-list-table"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Events Table</h3>
        <p className="text-gray-700">
          This table displays all your filtered events. Here you can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>See event details including date, time, location, organizer, and speaker</li>
          <li>Click on column headers to sort events (Date & Time, etc.)</li>
          <li>Click on any event row to view its full details</li>
          <li>Use "View Details" button to open the event page</li>
          <li>See event status badges and format indicators</li>
        </ul>
        <p className="text-gray-700">
          The table updates automatically based on your active filters and sorting preferences.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 7: Pagination
  steps.push({
    target: '[data-tour="events-list-pagination"]',
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

