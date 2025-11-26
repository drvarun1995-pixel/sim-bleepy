import { Step } from 'react-joyride'

interface CompleteStudentCohortsTourConfig {
  role?: 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'
}

export function createCompleteStudentCohortsTour(config: CompleteStudentCohortsTourConfig = {}): Step[] {
  const { role = 'admin' } = config

  const steps: Step[] = [
    {
      target: 'nav #sidebar-cohorts-link',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Student Cohorts</h3>
          <p>Access the Student Cohorts page from the sidebar to view and manage students by medical school.</p>
        </div>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Welcome to Student Cohorts</h3>
          <p>This page allows you to view and manage students organized by medical school (ARU and UCL). You can filter by university and study year, view statistics and charts, and see detailed student information.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="cohorts-filters"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Filters</h3>
          <p>Filter students by:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>University:</strong> View all students, or filter by ARU or UCL</li>
            <li><strong>Study Year:</strong> Filter students by their year of study (Year 1-6)</li>
            <li><strong>Reset Filters:</strong> Clear all filters and return to the default view</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="cohorts-distribution-university"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Distribution by University</h3>
          <p>This pie chart shows the overall distribution of students across different universities. You can see the percentage and count of students from ARU, UCL, and other institutions.</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="cohorts-students-by-year"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Students by Year</h3>
          <p>This bar chart displays the breakdown of students by study year, showing how many students from each university (ARU and UCL) are in each year of study.</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="cohorts-aru-table"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">ARU Students</h3>
          <p>View all students from Anglia Ruskin University. The table shows:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Student name and email</li>
            <li>Study year</li>
            <li>Email verification status</li>
            <li>Sortable columns for easy organization</li>
          </ul>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '[data-tour="cohorts-ucl-table"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">UCL Students</h3>
          <p>View all students from University College London. The table shows:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Student name and email</li>
            <li>Study year</li>
            <li>Email verification status</li>
            <li>Sortable columns for easy organization</li>
          </ul>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
  ]

  return steps
}

