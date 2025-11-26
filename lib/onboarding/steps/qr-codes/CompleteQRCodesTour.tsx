import React from 'react'
import { Step } from 'react-joyride'

export interface CompleteQRCodesTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf' | 'admin'
}

/**
 * Creates the complete QR Codes Tour
 * 
 * This includes:
 * 1. QR Codes Sidebar Link
 * 2. QR Codes View Popup (Center)
 * 3. Search Input
 * 4. QR Codes List (All QR Codes)
 * 
 * This is the full reusable QR codes onboarding that can be used by any role with QR codes permissions.
 */
export function createCompleteQRCodesTour(config: CompleteQRCodesTourConfig = {}): Step[] {
  const { role = 'meded_team' } = config

  const steps: Step[] = []

  // Step 0: QR Codes Sidebar Link
  // Use specific selector that targets desktop sidebar (Event Operations section), not mobile
  steps.push({
    target: 'nav #sidebar-qr-codes-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">QR Code Management</h3>
        <p className="text-gray-700">
          This is your QR codes navigation link. Click here anytime to access the QR codes page where you can generate, view, and manage QR codes for event attendance tracking.
        </p>
        <p className="text-gray-700">
          QR codes allow attendees to scan and mark their attendance at events, enabling automated attendance tracking and certificate generation.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 1: QR Codes View Popup (Center)
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: QR Code Management Page</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your QR code management page. Here you can generate QR codes for events, view existing QR codes, manage scan windows, and track attendance.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore the key features of the QR codes page.
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
    target: '[data-tour="qr-codes-search"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Search Events</h3>
        <p className="text-gray-700">
          Use this search box to quickly find events by title. Type any part of the event name to filter the list.
        </p>
        <p className="text-gray-700">
          The search works in real-time, so results update as you type. This helps you quickly locate specific events when managing multiple QR codes.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 3: QR Codes List
  steps.push({
    target: '[data-tour="qr-codes-list"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">All QR Codes</h3>
        <p className="text-gray-700">
          This section displays all events with booking enabled. For each event, you can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Generate QR Code:</strong> Create a new QR code for an event that doesn't have one yet</li>
          <li><strong>View QR Code:</strong> See the QR code, scan window times, and scan statistics</li>
          <li><strong>Download QR Code:</strong> Download the QR code as an image for printing or sharing</li>
          <li><strong>Regenerate QR Code:</strong> Create a new QR code with updated scan window times</li>
          <li><strong>Deactivate QR Code:</strong> Disable scanning for an event</li>
        </ul>
        <p className="text-gray-700">
          Each QR code has a scan window that defines when attendees can scan it. You can configure the start and end times for when scanning is allowed.
        </p>
        <p className="text-gray-700">
          If no events are found, it means there are no events with booking enabled. Only events that have booking enabled can have QR codes generated.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}

