import { Step } from 'react-joyride'

interface CompleteAnnouncementsTourConfig {
  role?: 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'
}

export function createCompleteAnnouncementsTour(config: CompleteAnnouncementsTourConfig = {}): Step[] {
  const { role = 'educator' } = config

  const steps: Step[] = [
    {
      target: 'nav #sidebar-announcements-link',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Announcements</h3>
          <p>Access the Announcements page from the dashboard sidebar to create and manage announcements for your audience.</p>
        </div>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Welcome to Announcements</h3>
          <p>This page allows you to create, edit, and manage announcements that will be displayed to your target audience on their dashboards.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="announcements-list"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">All Announcements</h3>
          <p>View all your announcements here. You can see their status, priority, target audience, and manage them by editing, activating/deactivating, or deleting.</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="announcements-create-button"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Create Announcement</h3>
          <p>Click this button to create a new announcement. You can set the title, content, priority, target audience, and expiration date.</p>
        </div>
      ),
      placement: 'left',
      disableBeacon: true,
    },
  ]

  return steps
}

