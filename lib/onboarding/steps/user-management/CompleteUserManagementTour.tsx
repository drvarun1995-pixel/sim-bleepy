import { Step } from 'react-joyride'

interface CompleteUserManagementTourConfig {
  role?: 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'
}

export function createCompleteUserManagementTour(config: CompleteUserManagementTourConfig = {}): Step[] {
  const { role = 'admin' } = config

  const steps: Step[] = [
    {
      target: 'nav #sidebar-user-management-link',
      content: (
        <div>
          <h3 className="font-semibold mb-2">User Management</h3>
          <p>Access the User Management page from the sidebar to manage users, roles, and permissions.</p>
        </div>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Welcome to User Management</h3>
          <p>This page allows you to view, manage, and edit user accounts, roles, and permissions. You can add new users, export user data, and manage user settings.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="user-management-header-buttons"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Action Buttons</h3>
          <p>Use these buttons to:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Add User:</strong> Create a new user account</li>
            <li><strong>Export:</strong> Download user data as CSV</li>
            <li><strong>Refresh Data:</strong> Reload the latest user information</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="user-management-filters"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Filters</h3>
          <p>Filter and search users:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Search Users:</strong> Search by name or email address</li>
            <li><strong>Filter by Role:</strong> Filter users by their role (Admin, Educator, MedEd Team, CTF, or Student)</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="user-management-table"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Users Table</h3>
          <p>View and manage all users in the system. The table shows:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>User information (name, email)</li>
            <li>Role and status (verified/pending)</li>
            <li>Activity metrics (attempts, average score)</li>
            <li>Join date</li>
            <li>Actions (approve, manage/edit)</li>
          </ul>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
  ]

  return steps
}

