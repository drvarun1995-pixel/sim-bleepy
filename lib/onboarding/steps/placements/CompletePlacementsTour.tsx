import React from 'react'
import { Step } from 'react-joyride'

export interface CompletePlacementsTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf' | 'admin'
}

/**
 * Creates the complete Placements Tour
 * 
 * This includes:
 * 1. Placements Sidebar Link
 * 2. Placements View Popup (Center)
 * 3. Statistics Section (Total Specialties, Total Pages, Total Documents)
 * 4. Views Section (Grid View, A-Z Specialties)
 * 5. Search Input
 * 6. Placements Grid/List
 * 
 * This is the full reusable placements onboarding that can be used by any role with placements permissions.
 */
export function createCompletePlacementsTour(config: CompletePlacementsTourConfig = {}): Step[] {
  const { role = 'meded_team' } = config

  const steps: Step[] = []

  // Step 0: Placements Sidebar Link
  steps.push({
    target: 'nav #sidebar-placements-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Placements</h3>
        <p className="text-gray-700">
          This is your placements navigation link. Click here anytime to access the placements page where you can browse specialty information, resources, and documents.
        </p>
        <p className="text-gray-700">
          The placements page provides access to a comprehensive library of specialty-specific information organized by medical specialty, making it easy to find relevant placement resources.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 1: Placements View Popup (Center)
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: Placements Page</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your placements page. Here you can browse specialty information, search for specific specialties, view statistics, and access resources organized by medical specialty.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore the key features of the placements page.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    disableOverlay: false,
    disableScrolling: false,
  })

  // Step 2: Statistics Section
  steps.push({
    target: '[data-tour="placements-stats"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Statistics Overview</h3>
        <p className="text-gray-700">
          These statistics cards show you a quick overview of the placements library:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Total Specialties:</strong> The number of active medical specialties available in the placements library.</li>
          <li><strong>Total Pages:</strong> The total number of specialty pages across all specialties.</li>
          <li><strong>Total Documents:</strong> The total number of documents available across all specialties.</li>
        </ul>
        <p className="text-gray-700">
          These statistics help you understand the scope and content available in the placements library at a glance.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 3: Views Section (Grid View, A-Z Specialties)
  steps.push({
    target: '[data-tour="placements-views"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">View Options</h3>
        <p className="text-gray-700">
          Use these view toggles to switch between different ways of browsing specialties:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Grid View:</strong> Browse specialties in a visual grid layout, perfect for quickly scanning and finding specialties.</li>
          <li><strong>A-Z Specialties:</strong> Browse specialties alphabetically, organized by letter. This view is ideal when you know the name of a specialty and want to find it quickly.</li>
        </ul>
        <p className="text-gray-700">
          Choose the view that works best for your browsing style and needs.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 4: Search Input
  steps.push({
    target: '[data-tour="placements-search"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Search Specialties</h3>
        <p className="text-gray-700">
          Use this search box to quickly find specialties by name or description. The search works in real-time, filtering results as you type.
        </p>
        <p className="text-gray-700">
          This helps you quickly locate specific specialties when browsing through the placements library, especially useful when you have many specialties to choose from.
        </p>
        <p className="text-sm text-gray-600 italic">
          Note: Search is available in Grid View mode.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 5: Placements Grid/List
  steps.push({
    target: '[data-tour="placements-list"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Specialties Display</h3>
        <p className="text-gray-700">
          This is where all available specialties are displayed. Each specialty card shows:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Specialty Name:</strong> The name of the medical specialty.</li>
          <li><strong>Description:</strong> A brief description of the specialty (if available).</li>
          <li><strong>Statistics:</strong> The number of pages and documents available for this specialty.</li>
          <li><strong>View Details Button:</strong> Click to access the specialty's detailed page with all its resources.</li>
        </ul>
        <p className="text-gray-700">
          Click on any specialty card to view its detailed information, pages, and documents. This is your main browsing area for exploring placement resources.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}

