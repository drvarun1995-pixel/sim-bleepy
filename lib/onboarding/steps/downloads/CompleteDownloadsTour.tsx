import React from 'react'
import { Step } from 'react-joyride'

export interface CompleteDownloadsTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf' | 'admin'
  canUpload?: boolean
  includeButtonsStep?: boolean
}

/**
 * Creates the complete Downloads Tour
 * 
 * This includes:
 * 1. Downloads Sidebar Link
 * 2. Downloads View Popup (Center)
 * 3. Action Buttons (Upload Resource, Request Resource)
 * 4. Search Input
 * 5. Filters Section (Filter by Format)
 * 6. Resources List/Grid
 * 7. Pagination
 * 
 * This is the full reusable downloads onboarding that can be used by any role with downloads permissions.
 */
export function createCompleteDownloadsTour(config: CompleteDownloadsTourConfig = {}): Step[] {
  const { role = 'meded_team', canUpload = false, includeButtonsStep = true } = config

  const steps: Step[] = []

  // Step 0: Downloads Sidebar Link
  steps.push({
    target: 'nav #sidebar-downloads-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Downloads</h3>
        <p className="text-gray-700">
          This is your downloads navigation link. Click here anytime to access the downloads page where you can browse, search, and download educational resources.
        </p>
        <p className="text-gray-700">
          The downloads page provides access to a comprehensive library of teaching materials, documents, and resources organized by format and category.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 1: Downloads View Popup (Center)
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: Downloads Page</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your downloads and resources page. Here you can browse educational resources, search for specific materials, filter by format, and download files for your learning or teaching needs.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore the key features of the downloads page.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    disableOverlay: false,
    disableScrolling: false,
  })

  // Step 2: Action Buttons (Upload Resource, Request Resource)
  // Only include this step if the buttons container exists and is visible
  if (includeButtonsStep) {
    steps.push({
      target: '[data-tour="downloads-buttons"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-purple-700">Action Buttons</h3>
          <p className="text-gray-700">
            Use these buttons to manage resources:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            {canUpload && (
              <li><strong>Upload Resource:</strong> (Visible to admins and educators) Click to upload new educational resources, documents, or teaching materials to the downloads library.</li>
            )}
            <li><strong>Request Resource:</strong> Click to request a specific resource that you need but isn't currently available in the library. This helps the team know what materials to add.</li>
          </ul>
          <p className="text-gray-700">
            {canUpload 
              ? 'These buttons help you contribute to and request resources from the downloads library, making it easier to share and access educational materials.'
              : 'Use the Request Resource button to let the team know what materials you need. This helps ensure the downloads library has the resources you need for your learning.'}
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
      spotlightPadding: 10,
    })
  }

  // Step 3: Search Input
  steps.push({
    target: '[data-tour="downloads-search"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Search Resources</h3>
        <p className="text-gray-700">
          Use this search box to quickly find resources by title, description, or the name of the person who taught or uploaded the resource.
        </p>
        <p className="text-gray-700">
          The search works in real-time, filtering results as you type. This helps you quickly locate specific resources when browsing through the library.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 4: Filters Section
  steps.push({
    target: '[data-tour="downloads-filters"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Filter by Format</h3>
        <p className="text-gray-700">
          Use these filter buttons to narrow down resources by their format or category:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>All Resources:</strong> Shows all available resources regardless of format</li>
          <li><strong>Core Teachings:</strong> Filter to show only core teaching materials</li>
          <li><strong>Grand Round:</strong> Filter to show only Grand Round resources</li>
          <li><strong>Twilight Teaching:</strong> Filter to show only Twilight Teaching resources</li>
          <li><strong>Others:</strong> Filter to show resources in other categories</li>
        </ul>
        <p className="text-gray-700">
          You can select multiple format filters at once to combine categories. Click on a selected filter again to deselect it, or use "Clear All" to remove all active filters.
        </p>
        <p className="text-gray-700">
          Each filter button shows the number of resources available in that category, helping you understand the library's content distribution.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 5: Resources List/Grid
  steps.push({
    target: '[data-tour="downloads-resources"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Resources Overview</h3>
        <p className="text-gray-700">
          This section displays all available resources. For each resource, you can see:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Resource Name:</strong> The title of the resource</li>
          <li><strong>Teaching Date & By:</strong> When the teaching session occurred and who taught it</li>
          <li><strong>Mapped Events:</strong> Events that this resource is linked to (if applicable)</li>
          <li><strong>Category & Size:</strong> The resource format/category and file size</li>
          <li><strong>Actions:</strong> Download button to get the resource file</li>
        </ul>
        <p className="text-gray-700">
          Resources can be displayed in either grid view (card-based layout) or list view (table layout). Click on a resource card or use the download button to access the file.
        </p>
        <p className="text-gray-700">
          Each resource shows key information at a glance, including its category, file size, teaching date, and any linked events. This helps you quickly identify and access the materials you need.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 6: Pagination
  steps.push({
    target: '[data-tour="downloads-pagination"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Pagination</h3>
        <p className="text-gray-700">
          Use these pagination controls to navigate through multiple pages of resources:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>Click the page numbers to jump to a specific page</li>
          <li>Use the arrow buttons to move to the previous or next page</li>
          <li>Use the double arrow buttons to jump to the first or last page</li>
          <li>The current page is highlighted to show your position</li>
        </ul>
        <p className="text-gray-700">
          Pagination helps you browse through large collections of resources efficiently. You can also adjust the number of items per page using the dropdown menu in the header.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}

