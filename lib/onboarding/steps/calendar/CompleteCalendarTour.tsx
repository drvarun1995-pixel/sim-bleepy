import React from 'react'
import { Step } from 'react-joyride'

export interface CompleteCalendarTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf'
}

/**
 * Creates the complete Calendar Tour
 * 
 * This includes:
 * 1. Calendar Sidebar Link
 * 2. Calendar View Popup
 * 3. Header Buttons (All Events, My Events, Request Teaching Event, Add Event, Smart Bulk Upload)
 * 4. Personalized View Banner
 * 5. Filters Section
 * 6. Calendar Widget
 * 7. Events List for Selected Date
 * 
 * This is the full reusable calendar onboarding that can be used by any role.
 */
export function createCompleteCalendarTour(config: CompleteCalendarTourConfig = {}): Step[] {
  const { role = 'student' } = config

  const steps: Step[] = []

  // Step 1: Calendar Sidebar Link
  // Use specific ID selector like dashboard link to avoid zero dimensions issue
  steps.push({
    target: '#sidebar-calendar-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Calendar View</h3>
        <p className="text-gray-700">
          This is your calendar navigation link. Click here anytime to access the calendar view where you can see all events in an intuitive calendar format.
        </p>
        <p className="text-gray-700">
          The calendar helps you visualize your event schedule and manage overlapping events efficiently.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 2: Calendar View Popup (Center)
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: Calendar View</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your calendar page where you can view all events in a calendar format. You can navigate between months, click on dates to see events, and filter events to find exactly what you're looking for.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore the key features of the calendar view.
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
          <h3 className="text-xl font-bold text-purple-700">Event Management Controls</h3>
          <p className="text-gray-700">
            These buttons give you quick access to important actions:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li><strong>All Events / My Events:</strong> Toggle between viewing all events or only events personalized for your profile</li>
            <li><strong>Request Teaching Event:</strong> Submit a request for a teaching event you'd like to see on the platform</li>
            {role === 'meded_team' || role === 'ctf' ? (
              <>
                <li><strong>Add Event:</strong> Create a new event directly from this page</li>
                <li><strong>Smart Bulk Upload:</strong> Upload multiple events at once using AI-powered parsing</li>
              </>
            ) : null}
          </ul>
        </div>
      )
    : (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-purple-700">Event View Controls</h3>
          <p className="text-gray-700">
            These buttons help you control what events you see:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li><strong>All Events / My Events:</strong> Toggle between viewing all events or only events personalized for your profile</li>
            <li><strong>Request Teaching Event:</strong> Submit a request for a teaching event you'd like to see on the platform</li>
          </ul>
        </div>
      )

  steps.push({
    target: '[data-tour="calendar-header-buttons"]',
    content: headerButtonsContent,
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 4: Personalized View Banner (optional - only shows if user has personalized view active)
  // Note: This step will use fallback to 'body' if element doesn't exist
  steps.push({
    target: '[data-tour="calendar-personalized-banner"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Personalized View Active</h3>
        <p className="text-gray-700">
          This banner confirms that you're viewing events filtered for your profile. The calendar is showing only events relevant to your role, university, and study year.
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
    target: '[data-tour="calendar-filters"]',
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
          Click "Reset" to clear all filters and see all events again.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 6: Calendar Widget
  steps.push({
    target: '[data-tour="calendar-widget"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Interactive Calendar</h3>
        <p className="text-gray-700">
          This is your main calendar view. Here you can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>Navigate between months using the arrow buttons</li>
          <li>Click on any date to see events for that day</li>
          <li>Click on an event within the calendar to view its details</li>
          <li>See events color-coded by category</li>
        </ul>
        <p className="text-gray-700">
          The calendar updates automatically based on your active filters.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 7: Events List for Selected Date
  steps.push({
    target: '[data-tour="calendar-events-list"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Events List</h3>
        <p className="text-gray-700">
          When you click on a date in the calendar, events for that date appear here. You can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>See all events scheduled for the selected date</li>
          <li>View event details including time, location, and organizer</li>
          <li>Click on any event to open its full details page</li>
          <li>See event categories and formats at a glance</li>
        </ul>
        <p className="text-gray-700">
          This list updates automatically when you select different dates in the calendar.
        </p>
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}

