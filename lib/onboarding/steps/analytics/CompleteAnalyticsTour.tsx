import { Step } from 'react-joyride'

interface CompleteAnalyticsTourConfig {
  role?: 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'
}

export function createCompleteAnalyticsTour(config: CompleteAnalyticsTourConfig = {}): Step[] {
  const { role = 'admin' } = config

  const steps: Step[] = [
    {
      target: 'nav #sidebar-analytics-link',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Analytics</h3>
          <p>Access the Analytics Dashboard from the sidebar to view user activity, login tracking, and download analytics.</p>
        </div>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Welcome to Analytics Dashboard</h3>
          <p>This dashboard provides comprehensive insights into user activity, login patterns, and download statistics. Use the filters and charts to analyze platform usage.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="analytics-header-buttons"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Action Buttons</h3>
          <p>Use these buttons to:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Export Data:</strong> Download analytics data as CSV</li>
            <li><strong>Clear All Login Data:</strong> Reset login tracking for all users</li>
            <li><strong>Refresh:</strong> Reload the latest analytics data</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="analytics-filters"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Filters</h3>
          <p>Filter analytics data by:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Date Range:</strong> View data for all time, last 24 hours, 7 days, or 30 days</li>
            <li><strong>User Filter:</strong> Search for specific users by email or name</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="analytics-stats"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Key Metrics</h3>
          <p>Quick overview of platform statistics:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Total Users:</strong> Total number of registered users</li>
            <li><strong>Active Today:</strong> Users who logged in today</li>
            <li><strong>Total Downloads:</strong> Total number of resource downloads</li>
            <li><strong>Downloads Today:</strong> Downloads in the last 24 hours</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="analytics-activity-over-time"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Activity Over Time</h3>
          <p>This chart shows trends over time for:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Registrations:</strong> New user sign-ups</li>
            <li><strong>Logins:</strong> User login activity</li>
            <li><strong>Downloads:</strong> Resource download activity</li>
          </ul>
          <p className="mt-2">Use the date filter to focus on specific time periods.</p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '[data-tour="analytics-role-distribution"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">User Role Distribution</h3>
          <p>Visual breakdown of users by role (Student, MedEd Team, CTF, etc.). This helps you understand the composition of your user base.</p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '[data-tour="analytics-file-type"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Download by File Type</h3>
          <p>See which file types are most popular among users. This helps identify what content formats are most valuable to your audience.</p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '[data-tour="analytics-recent-downloads"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Recent Downloads</h3>
          <p>View the most recent resource downloads, including the resource name, user who downloaded it, and timestamp. Click Refresh to update the list.</p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '[data-tour="analytics-user-activity"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">User Activity Table</h3>
          <p>Detailed view of all users with their:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Email and role</li>
            <li>Last login timestamp</li>
            <li>Total login count</li>
            <li>Total attempts and average score</li>
          </ul>
          <p className="mt-2">Click column headers to sort. Use "Clear" to reset individual user login data.</p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
  ]

  return steps
}

