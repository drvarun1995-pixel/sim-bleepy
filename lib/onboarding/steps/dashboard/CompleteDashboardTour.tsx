import React from 'react'
import { Step } from 'react-joyride'
import { createDashboardStep } from './DashboardStep'
import { createFullDashboardTour } from './DashboardWidgetSteps'

export interface CompleteDashboardTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf'
  welcomeTitle?: string
  welcomeDescription?: string
  navigationDescription?: string
  navigationFeatures?: string[]
}

/**
 * Creates the complete Phase 1 Dashboard Tour
 * 
 * This includes:
 * 1. Welcome Popup
 * 2. Navigation Sidebar
 * 3. Dashboard Overview
 * 4-12. All Dashboard Widgets
 * 
 * This is the full reusable dashboard onboarding that can be used by any role.
 */
export function createCompleteDashboardTour(config: CompleteDashboardTourConfig = {}): Step[] {
  const {
    role = 'student',
    welcomeTitle,
    welcomeDescription,
    navigationDescription,
    navigationFeatures,
  } = config

  const steps: Step[] = []

  // Step 1: Welcome Popup
  const defaultWelcomeTitle = role === 'meded_team'
    ? 'Welcome to Bleepy!'
    : role === 'educator'
    ? 'Welcome to Bleepy!'
    : 'Welcome to Bleepy!'

  const defaultWelcomeDescription = role === 'meded_team'
    ? `We're excited to have you on the platform! This quick tour will help you get familiar with your MedEd Team dashboard and all the powerful features at your fingertips.`
    : role === 'educator'
    ? `We're excited to have you on the platform! This quick tour will help you get familiar with your educator dashboard and all the powerful features at your fingertips.`
    : `We're excited to have you on the platform! This quick tour will help you get familiar with your dashboard and all the powerful features at your fingertips.`

  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">{welcomeTitle || defaultWelcomeTitle}</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          {welcomeDescription || defaultWelcomeDescription}
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore together - it will only take a few minutes.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    disableOverlay: false,
    disableScrolling: false,
  })

  // Step 2: Navigation Sidebar
  const defaultNavigationDescription = 'This sidebar is your main navigation. Use it to move between different sections of the platform.'
  
  const defaultNavigationFeatures: Record<string, string[]> = {
    meded_team: [
      'Main navigation (Dashboard, Calendar, Events, etc.)',
      'Event Management tools',
      'Student management features',
      'Analytics and reports',
    ],
    educator: [
      'Main navigation (Dashboard, Calendar, Events, etc.)',
      'Teaching resources',
      'Student management features',
      'Analytics and reports',
    ],
    student: [
      'Main navigation (Dashboard, Calendar, Events, etc.)',
      'My Bookings and Certificates',
      'AI Patient Simulator',
      'Resources and downloads',
    ],
    ctf: [
      'Main navigation (Dashboard, Calendar, Events, etc.)',
      'Event Management tools',
      'Student management features',
      'Analytics and reports',
    ],
  }

  const features = navigationFeatures || defaultNavigationFeatures[role] || defaultNavigationFeatures['student']

  steps.push({
    target: '#sidebar-dashboard-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Navigation Hub</h3>
        <p className="text-gray-700">
          {navigationDescription || defaultNavigationDescription}
        </p>
        {role === 'meded_team' && (
          <p className="text-gray-700">
            As a MedEd Team member, you'll see sections for:
          </p>
        )}
        {role === 'educator' && (
          <p className="text-gray-700">
            As an educator, you'll see sections for:
          </p>
        )}
        {features && features.length > 0 && (
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            {features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        )}
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 3: Dashboard Overview (reusable)
  steps.push(createDashboardStep({ role }))

  // Steps 4-12: All Dashboard Widgets (reusable)
  steps.push(...createFullDashboardTour({ role }))

  return steps
}


