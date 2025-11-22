import React from 'react'
import { Step } from 'react-joyride'

export interface CompleteMyBookingsTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf'
}

/**
 * Creates the complete My Bookings Tour
 * 
 * This includes:
 * 1. My Bookings Sidebar Link
 * 2. My Bookings View Popup
 * 3. Filter Tabs (Upcoming/Past/All)
 * 4. QR Code Scanner Section
 * 5. Bookings List/Empty State (manage bookings - review, cancel, delete, etc.)
 * 
 * This is the full reusable my bookings onboarding that can be used by any role.
 */
export function createCompleteMyBookingsTour(config: CompleteMyBookingsTourConfig = {}): Step[] {
  const { role = 'student' } = config

  const steps: Step[] = []

  // Step 1: My Bookings Sidebar Link
  steps.push({
    target: '[data-tour="my-bookings"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">My Bookings</h3>
        <p className="text-gray-700">
          This is your bookings navigation link. Click here anytime to access your bookings page where you can view and manage all your event registrations.
        </p>
        <p className="text-gray-700">
          The bookings page allows you to see all your registered events, manage your attendance, and track your booking history.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 2: My Bookings View Popup (Center)
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: My Bookings</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your bookings page where you can view and manage all your event registrations. You can filter bookings by status, scan QR codes for attendance, and manage your bookings.
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

  // Step 3: Filter Tabs (Upcoming/Past/All)
  steps.push({
    target: '[data-tour="my-bookings-filter-tabs"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Filter Your Bookings</h3>
        <p className="text-gray-700">
          Use these tabs to filter your bookings:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Upcoming:</strong> View all your upcoming event bookings</li>
          <li><strong>Past:</strong> View all your past event bookings (attended, cancelled, or no-show)</li>
          <li><strong>All:</strong> View all your bookings regardless of status</li>
        </ul>
        <p className="text-gray-700">
          Each tab shows the count of bookings in that category, making it easy to see how many bookings you have in each status.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 4: QR Code Scanner Section
  steps.push({
    target: '[data-tour="my-bookings-qr-scanner"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">QR Code Scanner</h3>
        <p className="text-gray-700">
          Use the QR code scanner to mark your attendance at events:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>Click "Open QR Scanner" to access the scanner</li>
          <li>Allow camera access when prompted</li>
          <li>Point your camera at the event QR code</li>
          <li>Your attendance will be automatically recorded</li>
        </ul>
        <p className="text-gray-700">
          After scanning, you'll receive a confirmation and can complete feedback forms if required. The scanner is quick and easy to use - you're already logged in, so no additional details are needed.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 5: Bookings List/Empty State
  steps.push({
    target: '[data-tour="my-bookings-list"], [data-tour="my-bookings-empty-state"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Manage Your Bookings</h3>
        <p className="text-gray-700">
          Here you can view and manage all your event bookings:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>View Details:</strong> Click on any booking to see full event details</li>
          <li><strong>Cancel Booking:</strong> Cancel upcoming bookings if you can't attend (may require a reason)</li>
          <li><strong>Delete Booking:</strong> Permanently remove booking records from your history</li>
          <li><strong>Scan QR Code:</strong> Mark attendance for events that support QR code check-in</li>
          <li><strong>Complete Feedback:</strong> Submit feedback forms for attended events</li>
          <li><strong>View Event:</strong> Navigate to the full event page for more information</li>
        </ul>
        <p className="text-gray-700">
          If you don't have any bookings yet, click "Browse Events" to find and register for events.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}

