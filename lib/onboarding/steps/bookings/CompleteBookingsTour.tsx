import React from 'react'
import { Step } from 'react-joyride'

export interface CompleteBookingsTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf' | 'admin'
}

/**
 * Creates the complete Bookings Tour
 * 
 * This includes:
 * 1. Bookings Sidebar Link
 * 2. Bookings View Popup (Center)
 * 3. Statistics Section (Total Bookings, Confirmed, Waitlist, Cancelled, Attended, No Show)
 * 4. Filters Section
 * 5. Manage Individual Event Bookings
 * 6. Export CSV Button
 * 
 * This is the full reusable bookings onboarding that can be used by any role with bookings permissions.
 */
export function createCompleteBookingsTour(config: CompleteBookingsTourConfig = {}): Step[] {
  const { role = 'meded_team' } = config

  const steps: Step[] = []

  // Step 1: Bookings Sidebar Link
  // Use specific selector that targets desktop sidebar (Event Operations section), not mobile
  // The desktop sidebar link is in a nav element, while mobile is in a div with lg:hidden
  steps.push({
    target: 'nav #sidebar-bookings-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Event Bookings</h3>
        <p className="text-gray-700">
          This is your bookings navigation link. Click here anytime to access the bookings page where you can view and manage all event registrations and bookings.
        </p>
        <p className="text-gray-700">
          The bookings page provides a comprehensive overview of booking statistics, filters, and detailed management for each event.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 2: Bookings View Popup (Center)
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: Event Bookings Page</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your event bookings management page. Here you can view comprehensive booking statistics, filter events by various criteria, and manage individual event bookings.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore the key features of the bookings page.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    disableOverlay: false,
    disableScrolling: false,
  })

  // Step 3: Statistics Section
  steps.push({
    target: '[data-tour="bookings-stats"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Booking Statistics</h3>
        <p className="text-gray-700">
          This section displays comprehensive booking statistics across all events:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Total Bookings:</strong> Sum of all confirmed and waitlist bookings</li>
          <li><strong>Confirmed:</strong> Number of confirmed bookings</li>
          <li><strong>Waitlist:</strong> Number of bookings on the waitlist</li>
          <li><strong>Cancelled:</strong> Number of cancelled bookings</li>
          <li><strong>Attended:</strong> Number of attendees who marked attendance</li>
          <li><strong>No Show:</strong> Number of bookings where attendees didn't show up</li>
        </ul>
        <p className="text-gray-700">
          These statistics give you a quick overview of booking activity across all events.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 4: Filters Section
  steps.push({
    target: '[data-tour="bookings-filters"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Booking Filters</h3>
        <p className="text-gray-700">
          Use these filters to narrow down the events you see:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Search:</strong> Search for events by title</li>
          <li><strong>Status:</strong> Filter by booking status (All Statuses, Available, Almost Full, Full, Unlimited)</li>
          <li><strong>Date:</strong> Filter by date (All Events, Upcoming Events, Past Events)</li>
          <li><strong>Bookings:</strong> Filter by booking presence (All Events, With Bookings, No Bookings)</li>
        </ul>
        <p className="text-gray-700">
          Combine multiple filters to find exactly what you're looking for.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 5: Manage Individual Event Bookings
  steps.push({
    target: '[data-tour="bookings-events-list"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Manage Event Bookings</h3>
        <p className="text-gray-700">
          This section displays all events with their booking information. For each event, you can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>View event details including title, date, time, and location</li>
          <li>See booking statistics (confirmed, waitlist, cancelled, attended, no show)</li>
          <li>View booking capacity and availability status</li>
          <li>Click "View Details" to manage individual bookings for that event</li>
        </ul>
        <p className="text-gray-700">
          If no events match your filters, you'll see a message indicating no events with bookings were found.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 6: Export CSV Button
  steps.push({
    target: '[data-tour="bookings-export-csv"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Export Booking Data</h3>
        <p className="text-gray-700">
          Click this button to export all booking data to a CSV file. The export includes:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>Event title, date, and time</li>
          <li>Booking capacity and availability</li>
          <li>Confirmed, waitlist, cancelled, attended, and no show counts</li>
          <li>Booking status for each event</li>
        </ul>
        <p className="text-gray-700">
          The CSV file is automatically downloaded and can be opened in Excel or any spreadsheet application for further analysis.
        </p>
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}



