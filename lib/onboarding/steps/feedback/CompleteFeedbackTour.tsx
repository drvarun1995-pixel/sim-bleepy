import React from 'react'
import { Step } from 'react-joyride'

export interface CompleteFeedbackTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf' | 'admin'
}

/**
 * Creates the complete Feedback Tour
 * 
 * This includes:
 * 1. Feedback Sidebar Link
 * 2. Feedback View Popup (Center)
 * 3. Action Buttons (Analytics, Template Management, Create Feedback Form)
 * 4. Feedback Forms List
 * 
 * This is the full reusable feedback onboarding that can be used by any role with feedback permissions.
 */
export function createCompleteFeedbackTour(config: CompleteFeedbackTourConfig = {}): Step[] {
  const { role = 'meded_team' } = config

  const steps: Step[] = []

  // Step 0: Feedback Sidebar Link
  // Use specific selector that targets desktop sidebar (Event Operations section), not mobile
  steps.push({
    target: 'nav #sidebar-feedback-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Feedback Management</h3>
        <p className="text-gray-700">
          This is your feedback navigation link. Click here anytime to access the feedback page where you can create, manage, and analyze feedback forms for events.
        </p>
        <p className="text-gray-700">
          Feedback forms allow you to collect valuable insights from event attendees, helping you improve future events and measure satisfaction.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 1: Feedback View Popup (Center)
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: Feedback Management Page</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your feedback management page. Here you can create feedback forms, manage templates, view analytics, and analyze responses from event attendees.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore the key features of the feedback page.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    disableOverlay: false,
    disableScrolling: false,
  })

  // Step 2: Action Buttons (Analytics, Template Management, Create Feedback Form)
  steps.push({
    target: '[data-tour="feedback-buttons"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Action Buttons</h3>
        <p className="text-gray-700">
          Use these buttons to manage your feedback system:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Analytics:</strong> View comprehensive feedback analytics, including response rates, satisfaction scores, and detailed reports for all your feedback forms.</li>
          <li><strong>Template Management:</strong> Create, edit, and manage feedback form templates. Templates allow you to reuse common question sets across multiple events.</li>
          <li><strong>Create Feedback Form:</strong> Create a new feedback form for your events. You can customize questions, enable anonymous responses, and link forms to specific events.</li>
        </ul>
        <p className="text-gray-700">
          These tools help you efficiently collect, organize, and analyze feedback from your events.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 3: Feedback Forms List
  steps.push({
    target: '[data-tour="feedback-forms-list"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Feedback Forms Overview</h3>
        <p className="text-gray-700">
          This section displays all your feedback forms. For each form, you can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>View Form Details:</strong> See form name, template type, linked events, and status</li>
          <li><strong>Edit Forms:</strong> Modify existing feedback forms, update questions, or change settings</li>
          <li><strong>View Responses:</strong> Access collected feedback responses and analyze attendee input</li>
          <li><strong>Manage Status:</strong> Activate or deactivate forms to control when feedback can be submitted</li>
          <li><strong>Delete Forms:</strong> Remove forms that are no longer needed</li>
        </ul>
        <p className="text-gray-700">
          Each feedback form can be linked to one or more events, allowing attendees to provide feedback after attending. Forms can be customized with various question types and can support anonymous responses.
        </p>
        <p className="text-gray-700">
          If no feedback forms are found, click "Create Feedback Form" to get started. You can also use the search bar at the top to find specific forms by name.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}

