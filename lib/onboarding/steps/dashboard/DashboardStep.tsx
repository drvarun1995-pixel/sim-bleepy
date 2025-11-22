import React from 'react'
import { Step } from 'react-joyride'

export interface DashboardStepConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf'
  title?: string
  description?: string
  features?: string[]
  roleSpecificNote?: string
}

/**
 * Reusable Dashboard Step
 * 
 * This step highlights the dashboard page and can be customized per role.
 * Used in full tours for all roles.
 */
export function createDashboardStep(config?: DashboardStepConfig): Step {
  const role = config?.role || 'student'
  
  // Default content that works for all roles
  const defaultTitle = 'Your Dashboard'
  const defaultDescription = 'This is your dashboard - your command center where you can see everything at a glance.'
  const defaultFeatures = [
    'Your upcoming events',
    'Quick statistics and insights',
    'Recent activity',
    'Quick actions for common tasks'
  ]

  // Role-specific customizations
  const roleCustomizations: Record<string, { title?: string; description?: string; features?: string[]; note?: string }> = {
    meded_team: {
      title: 'You Are Here: Dashboard',
      description: 'This is your dashboard - your command center where you can see everything at a glance. As a MedEd Team member, you have access to both student features and powerful administrative tools.',
      features: [
        'Your upcoming events',
        'Quick statistics and insights',
        'Recent activity',
        'Quick actions for common tasks',
        'Event management tools',
        'Student management features'
      ],
      note: 'From here, you can quickly access all the features you need to manage events, track attendance, and support your students.'
    },
    educator: {
      title: 'Your Dashboard',
      description: 'This is your dashboard - your command center where you can see everything at a glance. As an educator, you can manage your teaching activities and track student progress.',
      features: [
        'Your upcoming events',
        'Teaching requests',
        'Student progress',
        'Quick actions for common tasks'
      ]
    },
    student: {
      title: 'Your Dashboard',
      description: 'This is your dashboard - your command center where you can see everything at a glance.',
      features: [
        'Your upcoming events',
        'Your bookings',
        'Your certificates',
        'Quick access to key features'
      ]
    },
    ctf: {
      title: 'Your Dashboard',
      description: 'This is your dashboard - your command center where you can see everything at a glance.',
      features: [
        'Your upcoming events',
        'Quick statistics',
        'Recent activity',
        'Quick actions'
      ]
    }
  }

  // Use custom config, role customization, or defaults (in that priority)
  const customization = roleCustomizations[role] || {}
  const title = config?.title || customization.title || defaultTitle
  const description = config?.description || customization.description || defaultDescription
  const features = config?.features || customization.features || defaultFeatures
  const note = config?.roleSpecificNote || customization.note

  return {
    target: '[data-tour="dashboard-main"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">{title}</h3>
        <p className="text-gray-700">{description}</p>
        {features && features.length > 0 && (
          <>
            <p className="text-gray-700">From here, you can quickly access:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
              {features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </>
        )}
        {note && (
          <p className="text-gray-700 mt-2">{note}</p>
        )}
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  }
}

/**
 * Default dashboard step (no customization)
 */
export const dashboardStep: Step = createDashboardStep()
