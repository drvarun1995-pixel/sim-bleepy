import React from 'react'
import { Step } from 'react-joyride'

export interface DashboardWidgetStepsConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf'
  includeWelcomeSection?: boolean
  includeAnnouncements?: boolean
  includeQuickStats?: boolean
  includeUpcomingEvents?: boolean
  includeEventsCalendar?: boolean
  includeMyBookings?: boolean
  includeQuickAccess?: boolean
  includeThisWeek?: boolean
  includePersonalized?: boolean
}

/**
 * Creates reusable dashboard widget steps
 * These can be used individually or as a complete dashboard tour
 */
export function createDashboardWidgetSteps(config: DashboardWidgetStepsConfig = {}): Step[] {
  const {
    role = 'student',
    includeWelcomeSection = true,
    includeAnnouncements = true,
    includeQuickStats = true,
    includeUpcomingEvents = true,
    includeEventsCalendar = true,
    includeMyBookings = true,
    includeQuickAccess = true,
    includeThisWeek = true,
    includePersonalized = true,
  } = config

  const steps: Step[] = []

  // Welcome Section (Personalized Dashboard)
  if (includeWelcomeSection) {
    steps.push({
      target: '[data-tour="welcome-section"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-purple-700">Personalized Dashboard</h3>
          <p className="text-gray-700">
            Welcome back! This personalized greeting shows your name and role. Your dashboard adapts to show you the most relevant information based on your profile and preferences.
          </p>
          <p className="text-gray-700">
            Complete your profile to unlock more personalized features and recommendations tailored just for you.
          </p>
        </div>
      ),
      placement: 'bottom',
    })
  }

  // Announcements
  if (includeAnnouncements) {
    const announcementsContent = role === 'meded_team' || role === 'educator' 
      ? (
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-purple-700">Announcements</h3>
            <p className="text-gray-700">
              Stay updated with important announcements from the platform administrators and your organization.
            </p>
            <p className="text-gray-700">
              {role === 'meded_team' 
                ? 'As a MedEd Team member, you can also create announcements to communicate with students about upcoming events, schedule changes, or important updates.'
                : 'As an educator, you can create announcements to communicate with students.'}
            </p>
          </div>
        )
      : (
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-purple-700">Announcements</h3>
            <p className="text-gray-700">
              Stay updated with important announcements from the platform administrators and your organization.
            </p>
            <p className="text-gray-700">
              Check here regularly for updates about events, schedule changes, and important platform news.
            </p>
          </div>
        )

    steps.push({
      target: '[data-tour="announcements"]',
      content: announcementsContent,
      placement: 'bottom',
    })
  }

  // Quick Statistics
  if (includeQuickStats) {
    steps.push({
      target: '[data-tour="quick-stats"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-purple-700">Quick Statistics</h3>
          <p className="text-gray-700">
            Get a quick overview of your activity at a glance. These statistics show:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li>Events happening today</li>
            <li>Events this week</li>
            <li>Your upcoming bookings</li>
            <li>Recent activity</li>
          </ul>
          <p className="text-gray-700">
            This helps you stay on top of your schedule and manage your time effectively.
          </p>
        </div>
      ),
      placement: 'bottom',
    })
  }

  // Today's Events
  if (includeUpcomingEvents) {
    steps.push({
      target: '[data-tour="upcoming-events"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-purple-700">Today's Events</h3>
          <p className="text-gray-700">
            This card shows all events happening today. You can quickly see:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li>Events you're managing or attending</li>
            <li>Event times and locations</li>
            <li>Quick access to event details</li>
            <li>Manage bookings and attendance</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    })
  }

  // Events Calendar
  if (includeEventsCalendar) {
    steps.push({
      target: '[data-tour="events-calendar"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-purple-700">Your Events Calendar</h3>
          <p className="text-gray-700">
            Visualize all your events in a calendar format. This calendar shows:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li>All events you're involved with</li>
            <li>Upcoming dates at a glance</li>
            <li>Easy navigation between months</li>
            <li>Click on any date to see events for that day</li>
          </ul>
          <p className="text-gray-700">
            Perfect for planning ahead and managing your schedule effectively.
          </p>
        </div>
      ),
      placement: 'bottom',
    })
  }

  // My Upcoming Bookings
  if (includeMyBookings) {
    steps.push({
      target: '[data-tour="dashboard-my-bookings"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-purple-700">My Upcoming Bookings</h3>
          <p className="text-gray-700">
            Track all events you've registered for or are managing. This section shows:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li>Your confirmed bookings</li>
            <li>Pending registrations</li>
            <li>Events you're organizing</li>
            <li>Quick access to manage each event</li>
          </ul>
          <p className="text-gray-700">
            Keep track of everything in one convenient location.
          </p>
        </div>
      ),
      placement: 'left',
      spotlightPadding: 10,
      disableOverlayClose: true,
    })
  }

  // Quick Access
  if (includeQuickAccess) {
    steps.push({
      target: '[data-tour="quick-access"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-purple-700">Quick Access</h3>
          <p className="text-gray-700">
            Get instant access to the features you use most frequently. These quick links help you:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li>Jump to key sections quickly</li>
            <li>Access AI Patient Simulator</li>
            <li>View your progress and achievements</li>
            <li>Navigate to important tools</li>
          </ul>
          <p className="text-gray-700">
            Save time by accessing your favorite features with just one click.
          </p>
        </div>
      ),
      placement: 'bottom',
    })
  }

  // This Week
  if (includeThisWeek) {
    steps.push({
      target: '[data-tour="this-week"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-purple-700">This Week</h3>
          <p className="text-gray-700">
            See all events happening this week in one place. This gives you:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li>A week-at-a-glance view</li>
            <li>All upcoming events in the next 7 days</li>
            <li>Easy planning for your week</li>
            <li>Quick access to event details</li>
          </ul>
          <p className="text-gray-700">
            Plan your week effectively and never miss an important event.
          </p>
        </div>
      ),
      placement: 'bottom',
    })
  }

  // Dashboard Personalization
  if (includePersonalized) {
    steps.push({
      target: '[data-tour="dashboard-personalized"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-purple-700">Your Dashboard is Personalized!</h3>
          <p className="text-gray-700">
            Your dashboard is customized just for you based on your role, preferences, and activity.
          </p>
          <p className="text-gray-700">
            Use the buttons here to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li>Update your preferences to refine what you see</li>
            <li>View all events if you want to see everything</li>
            <li>Customize your dashboard experience</li>
          </ul>
          <p className="text-gray-700">
            The more you use the platform, the better it gets at showing you what matters most to you!
          </p>
        </div>
      ),
      placement: 'top',
    })
  }

  return steps
}

/**
 * Creates a complete dashboard tour sequence (all widgets)
 * This is the full dashboard walkthrough that was previously 12 steps
 */
export function createFullDashboardTour(config: DashboardWidgetStepsConfig = {}): Step[] {
  return createDashboardWidgetSteps({
    ...config,
    // Include all widgets by default
    includeWelcomeSection: true,
    includeAnnouncements: true,
    includeQuickStats: true,
    includeUpcomingEvents: true,
    includeEventsCalendar: true,
    includeMyBookings: true,
    includeQuickAccess: true,
    includeThisWeek: true,
    includePersonalized: true,
  })
}


