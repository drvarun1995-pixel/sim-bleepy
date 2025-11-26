import React from 'react'
import { Step } from 'react-joyride'

export interface CompleteMedEdContactsTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf' | 'admin'
}

/**
 * Creates the complete MedEd Team Contacts Tour
 * 
 * This includes:
 * 1. MedEd Team Contacts Sidebar Link
 * 2. MedEd Team Contacts View Popup (Center)
 * 3. Contact Cards
 * 4. Email Links
 * 
 * This is the full reusable MedEd Team Contacts onboarding that can be used by any role with contacts permissions.
 */
export function createCompleteMedEdContactsTour(config: CompleteMedEdContactsTourConfig = {}): Step[] {
  const { role = 'meded_team' } = config

  const steps: Step[] = []

  // Step 0: MedEd Team Contacts Sidebar Link
  steps.push({
    target: 'nav #sidebar-meded-contacts-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">MedEd Team Contacts</h3>
        <p className="text-gray-700">
          This is your MedEd Team Contacts navigation link. Click here anytime to access the contacts page where you can find contact information for Clinical Teaching Fellows and other important MedEd team members.
        </p>
        <p className="text-gray-700">
          The contacts page provides easy access to reach out to the MedEd team for support, questions, or assistance with your learning journey.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 1: MedEd Team Contacts View Popup (Center)
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: MedEd Team Contacts Page</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your MedEd Team Contacts page. Here you can find contact information for Clinical Teaching Fellows and other important MedEd team members who are available to support you.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore the key features of the contacts page.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    disableOverlay: false,
    disableScrolling: false,
  })

  // Step 2: Contact Cards
  steps.push({
    target: '[data-tour="meded-contacts-cards"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Contact Cards</h3>
        <p className="text-gray-700">
          These cards display information about each MedEd team member, including:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Name and Title:</strong> The team member's name and their role (e.g., Clinical Teaching Fellow).</li>
          <li><strong>Bio:</strong> A brief description of their expertise and how they can help you.</li>
          <li><strong>Contact Information:</strong> Email and phone number (if available) to reach out directly.</li>
        </ul>
        <p className="text-gray-700">
          Each card provides all the information you need to contact a team member for support, questions, or assistance with your learning journey.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 3: Email Links
  steps.push({
    target: '[data-tour="meded-contacts-email"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Email Contact</h3>
        <p className="text-gray-700">
          Click on any email address to open your default email client and compose a message to that team member. This makes it easy to reach out for support, ask questions, or request assistance.
        </p>
        <p className="text-gray-700">
          The email links are clickable and will automatically open your email application with the recipient's address pre-filled, making communication quick and convenient.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}

