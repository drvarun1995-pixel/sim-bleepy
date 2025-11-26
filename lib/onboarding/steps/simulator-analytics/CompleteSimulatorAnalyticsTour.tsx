import { Step } from 'react-joyride'

interface CompleteSimulatorAnalyticsTourConfig {
  role?: 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'
}

export function createCompleteSimulatorAnalyticsTour(config: CompleteSimulatorAnalyticsTourConfig = {}): Step[] {
  const { role = 'admin' } = config

  const steps: Step[] = [
    {
      target: 'nav #sidebar-simulator-analytics-link',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Simulator Analytics</h3>
          <p>Access the Simulator Analytics page from the sidebar to view AI patient simulator usage statistics and performance metrics.</p>
        </div>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Welcome to Simulator Analytics</h3>
          <p>This dashboard provides insights into AI patient simulator usage, including user activity, attempt statistics, and performance metrics.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="simulator-analytics-stats"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Key Metrics</h3>
          <p>Quick overview of simulator statistics:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Total Users:</strong> Number of users who have used the simulator</li>
            <li><strong>Total Attempts:</strong> Total number of simulator attempts</li>
            <li><strong>Average Score:</strong> Average performance score across all completed attempts</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="simulator-analytics-daily-usage"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Daily Usage</h3>
          <p>View simulator usage trends over the last 30 days. This shows which stations are being used most frequently and helps identify popular scenarios.</p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '[data-tour="simulator-analytics-recent-activity"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Recent Activity</h3>
          <p>Detailed view of recent simulator attempts, including:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>User information</li>
            <li>Station attempted</li>
            <li>Duration of attempt</li>
            <li>Completion status (PASS, FAIL, or INCOMPLETE)</li>
            <li>Date and time</li>
          </ul>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
  ]

  return steps
}

