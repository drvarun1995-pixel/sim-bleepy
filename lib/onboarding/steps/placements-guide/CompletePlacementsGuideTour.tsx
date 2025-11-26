import React from 'react'
import { Step } from 'react-joyride'

export interface CompletePlacementsGuideTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf' | 'admin'
}

/**
 * Creates the complete Placements Guide Tour
 * 
 * This includes:
 * 1. Placements Guide Sidebar Link
 * 2. Placements Guide View Popup (Center)
 * 3. Add Specialty Button
 * 4. Statistics Section (Total Specialties, Total Pages, Total Documents)
 * 5. Grid/List View Toggle
 * 6. Specialties Grid/List
 * 
 * This is the full reusable placements guide onboarding that can be used by any role with placements guide permissions.
 */
export function createCompletePlacementsGuideTour(config: CompletePlacementsGuideTourConfig = {}): Step[] {
  const { role = 'meded_team' } = config

  const steps: Step[] = []

  // Step 0: Placements Guide Sidebar Link
  steps.push({
    target: 'nav #sidebar-placements-guide-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Placements Guide</h3>
        <p className="text-gray-700">
          This is your placements guide navigation link. Click here anytime to access the placements guide page where you can manage specialties, pages, and documents for medical placements.
        </p>
        <p className="text-gray-700">
          The placements guide helps organize and manage placement-related content by specialty, making it easy for students and educators to find relevant information.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 1: Placements Guide View Popup (Center)
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: Placements Guide Page</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your placements guide management page. Here you can create and manage medical specialties, organize placement pages and documents, and provide structured guidance for placements.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore the key features of the placements guide page.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    disableOverlay: false,
    disableScrolling: false,
  })

  // Step 2: Add Specialty Button
  steps.push({
    target: '[data-tour="placements-add-specialty"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Add Specialty</h3>
        <p className="text-gray-700">
          Click this button to create a new medical specialty in the placements guide. When you add a specialty, you can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>Define the specialty name and description</li>
          <li>Set up pages and documents specific to that specialty</li>
          <li>Organize placement-related content by medical specialty</li>
          <li>Make it easier for students to find specialty-specific information</li>
        </ul>
        <p className="text-gray-700">
          Specialties help categorize and organize placement content, making it easier to navigate and find relevant information for specific medical fields.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 3: Statistics Section
  steps.push({
    target: '[data-tour="placements-statistics"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Statistics Overview</h3>
        <p className="text-gray-700">
          These statistics cards provide a quick overview of your placements guide content:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Total Specialties:</strong> The number of medical specialties you have created in the placements guide</li>
          <li><strong>Total Pages:</strong> The total number of pages across all specialties</li>
          <li><strong>Total Documents:</strong> The total number of documents across all specialties</li>
        </ul>
        <p className="text-gray-700">
          These metrics help you track the scope and growth of your placements guide content. Each specialty can have multiple pages and documents associated with it.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 4: Grid/List View Toggle
  steps.push({
    target: '[data-tour="placements-view-toggle"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">View Mode Toggle</h3>
        <p className="text-gray-700">
          Use these buttons to switch between different viewing modes for the specialties list:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Grid View:</strong> Displays specialties in a card-based grid layout, showing more visual information at a glance</li>
          <li><strong>List View:</strong> Displays specialties in a compact list format, showing more items in less space</li>
        </ul>
        <p className="text-gray-700">
          Choose the view mode that works best for your workflow. Grid view is great for browsing and getting an overview, while list view is better for quickly scanning through many specialties.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 5: Specialties Grid/List
  steps.push({
    target: '[data-tour="placements-specialties"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Specialties Overview</h3>
        <p className="text-gray-700">
          This section displays all the medical specialties in your placements guide. For each specialty, you can see:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Specialty Name:</strong> The name of the medical specialty</li>
          <li><strong>Description:</strong> A brief description of what the specialty covers</li>
          <li><strong>Page Count:</strong> The number of pages associated with this specialty</li>
          <li><strong>Document Count:</strong> The number of documents associated with this specialty</li>
          <li><strong>View Button:</strong> Click to access the specialty's pages and documents</li>
        </ul>
        <p className="text-gray-700">
          Each specialty card shows key statistics at a glance. Click "View" on any specialty to see its pages and documents, or use the search bar above to find specific specialties.
        </p>
        <p className="text-gray-700">
          If no specialties are shown, click "Add Specialty" to create your first specialty and start organizing placement content.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}

