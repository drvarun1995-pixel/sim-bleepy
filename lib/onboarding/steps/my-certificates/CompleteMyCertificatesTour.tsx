import React from 'react'
import { Step } from 'react-joyride'

export interface CompleteMyCertificatesTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf'
}

/**
 * Creates the complete My Certificates Tour
 * 
 * This includes:
 * 1. My Certificates Sidebar Link
 * 2. My Certificates View Popup
 * 3. Stats Section (Total Certificates, This Year, This Month)
 * 4. Filter/Search Section
 * 5. Certificates List/Empty State (certificates which can be downloaded)
 * 
 * This is the full reusable my certificates onboarding that can be used by any role.
 */
export function createCompleteMyCertificatesTour(config: CompleteMyCertificatesTourConfig = {}): Step[] {
  const { role = 'student' } = config

  const steps: Step[] = []

  // Step 1: My Certificates Sidebar Link
  steps.push({
    target: '#sidebar-my-certificates-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">My Certificates</h3>
        <p className="text-gray-700">
          This is your certificates navigation link. Click here anytime to access your certificates page where you can view and download all certificates issued to you for events you've attended.
        </p>
        <p className="text-gray-700">
          The certificates page allows you to manage your professional certificates, download them for your records, and track your certification history.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 2: My Certificates View Popup (Center)
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: My Certificates</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your certificates page where you can view and download all certificates issued to you for events you've attended. You can search through your certificates, view statistics, and download them for your professional records.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore the key features of the certificates page.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    disableOverlay: false,
    disableScrolling: false,
  })

  // Step 3: Stats Section
  steps.push({
    target: '[data-tour="my-certificates-stats"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Certificate Statistics</h3>
        <p className="text-gray-700">
          These statistics provide a quick overview of your certificates:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Total Certificates:</strong> The total number of certificates you've received</li>
          <li><strong>This Year:</strong> The number of certificates issued to you this year</li>
          <li><strong>This Month:</strong> The number of certificates issued to you this month</li>
        </ul>
        <p className="text-gray-700">
          These stats help you track your certification progress and see how many certificates you've earned over time.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 4: Filter/Search Section
  steps.push({
    target: '[data-tour="my-certificates-filter"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Search Your Certificates</h3>
        <p className="text-gray-700">
          Use the search bar to quickly find specific certificates:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>Search by event name</li>
          <li>Search by certificate ID</li>
          <li>Search by your name</li>
        </ul>
        <p className="text-gray-700">
          The search filters your certificates in real-time, making it easy to find specific certificates you need for your records or applications.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 5: Certificates List/Empty State
  steps.push({
    target: '[data-tour="my-certificates-list"], [data-tour="my-certificates-empty-state"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Your Certificates</h3>
        <p className="text-gray-700">
          Here you can view all your certificates. Each certificate shows:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Certificate Preview:</strong> A visual preview of the certificate</li>
          <li><strong>Event Information:</strong> The event title and date for which the certificate was issued</li>
          <li><strong>Certificate ID:</strong> A unique identifier for the certificate</li>
          <li><strong>Issue Date:</strong> When the certificate was generated</li>
          <li><strong>Download Button:</strong> Download the certificate as a PDF or image file for your records</li>
        </ul>
        <p className="text-gray-700">
          Certificates are automatically issued after you attend events and complete any required feedback. They can be used for CPD (Continuing Professional Development) portfolios, job applications, and professional records. Download and save them securely.
        </p>
        <p className="text-gray-700">
          If you don't have any certificates yet, they will appear here automatically once you attend events and they are issued by the organizers.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}

