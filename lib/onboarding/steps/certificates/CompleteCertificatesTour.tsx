import React from 'react'
import { Step } from 'react-joyride'

export interface CompleteCertificatesTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf' | 'admin'
}

/**
 * Creates the complete Certificates Tour
 * 
 * This includes:
 * 1. Certificates Sidebar Link
 * 2. Create New Card (Quick Actions)
 * 3. Generate Now Card (Quick Actions)
 * 4. Template Library Card (Quick Actions)
 * 5. Certificate Manager Card (Quick Actions)
 * 6. Recent Activity Section
 * 7. Statistics Section
 * 8. Template Gallery Section
 * 9. Featured Templates Section
 * 10. Create New Certificate Card (Detailed Path)
 * 11. Use Existing Template Card (Detailed Path)
 * 12. Management Tools Section
 * 
 * This is the full reusable certificates onboarding that can be used by any role with certificate permissions.
 */
export function createCompleteCertificatesTour(config: CompleteCertificatesTourConfig = {}): Step[] {
  const { role = 'meded_team' } = config

  const steps: Step[] = []

  // Step 0: Certificates Sidebar Link
  steps.push({
    target: 'nav #sidebar-certificates-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Certificate Management</h3>
        <p className="text-gray-700">
          This is your certificates navigation link. Click here anytime to access the certificates page where you can create, manage, and generate certificates for events.
        </p>
        <p className="text-gray-700">
          The certificates system allows you to create custom certificate templates, generate certificates for event attendees, and manage your certificate library.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 1: Center Popup
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: Certificate Management Page</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is your certificate management hub. Here you can create new certificate templates, generate certificates for events, manage your template library, and view statistics.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore the key features and sections of the certificates page.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    disableOverlay: false,
    disableScrolling: false,
  })

  // Step 2: Create New Card (Quick Actions)
  steps.push({
    target: '[data-tour="certificates-create-new"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Create New Certificate</h3>
        <p className="text-gray-700">
          Click this card to start creating a certificate from scratch. This option gives you full design control:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>Upload your own background image</li>
          <li>Add and position text fields anywhere on the certificate</li>
          <li>Customize fonts, colors, and styling</li>
          <li>Use dynamic data fields that automatically populate with event and attendee information</li>
          <li>Save your design as a template for future use</li>
        </ul>
        <p className="text-gray-700">
          Perfect for creating unique, branded certificates tailored to your specific needs.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 3: Generate Now Card (Quick Actions)
  steps.push({
    target: '[data-tour="certificates-generate-now"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Generate Now</h3>
        <p className="text-gray-700">
          Click this card to quickly generate certificates using an existing template from your library. This option provides:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>Instant certificate generation using pre-designed templates</li>
          <li>Bulk processing for all event attendees at once</li>
          <li>Automatic email delivery to recipients</li>
          <li>Quick workflow for events with established certificate designs</li>
        </ul>
        <p className="text-gray-700">
          Ideal when you already have a template and just need to generate certificates quickly.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 4: Template Library Card (Quick Actions)
  steps.push({
    target: '[data-tour="certificates-template-library"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Template Library</h3>
        <p className="text-gray-700">
          Click this card to browse and manage all your saved certificate templates. In the Template Library you can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>View all your saved certificate templates</li>
          <li>Edit existing templates to update designs</li>
          <li>Delete templates you no longer need</li>
          <li>Share templates with others in your organization</li>
          <li>Organize and categorize your templates</li>
        </ul>
        <p className="text-gray-700">
          Your template library is where all your certificate designs are stored for easy reuse.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 5: Certificate Manager Card (Quick Actions)
  steps.push({
    target: '[data-tour="certificates-manager"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Certificate Manager</h3>
        <p className="text-gray-700">
          Click this card to view and manage all generated certificates. The Certificate Manager allows you to:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>View all certificates that have been generated</li>
          <li>Search and filter certificates by event, date, or attendee</li>
          <li>Download individual certificates</li>
          <li>Resend certificates to attendees via email</li>
          <li>Track certificate generation history</li>
        </ul>
        <p className="text-gray-700">
          This is your central hub for managing all certificates that have been created and distributed.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 6: Recent Activity Section
  steps.push({
    target: '[data-tour="certificates-recent-activity"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Recent Activity</h3>
        <p className="text-gray-700">
          This section shows your recent certificate-related activities, including:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>Recently generated certificates with event details and timestamps</li>
          <li>Recently created or modified templates</li>
          <li>Activity timeline to track your certificate work</li>
        </ul>
        <p className="text-gray-700">
          This helps you quickly see what certificates and templates you've been working on recently. If no activity is shown, it means you haven't created any certificates or templates yet.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 7: Statistics Section
  steps.push({
    target: '[data-tour="certificates-statistics"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Statistics</h3>
        <p className="text-gray-700">
          This section displays key metrics about your certificate system:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Total Generated:</strong> The total number of certificates you've created</li>
          <li><strong>Active Templates:</strong> The number of certificate templates currently available in your library</li>
          <li><strong>Events with Certificates:</strong> The number of events that have certificates generated</li>
        </ul>
        <p className="text-gray-700">
          These statistics give you a quick overview of your certificate usage and help track your productivity.
        </p>
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 8: Template Gallery Section
  steps.push({
    target: '[data-tour="certificates-template-gallery"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Template Gallery</h3>
        <p className="text-gray-700">
          This section displays certificate templates that have been shared by other users in your organization. Here you can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>Browse templates created and shared by colleagues</li>
          <li>See who created each template and when it was shared</li>
          <li>View template previews and details</li>
          <li>Use shared templates as a starting point for your own certificates</li>
        </ul>
        <p className="text-gray-700">
          The Template Gallery promotes collaboration by allowing team members to share and reuse certificate designs. If no templates are shown, it means no one in your organization has shared templates yet.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 9: Featured Templates Section
  steps.push({
    target: '[data-tour="certificates-featured-templates"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Featured Templates</h3>
        <p className="text-gray-700">
          This section showcases the most popular shared templates in your organization. Featured templates are:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>Ranked by popularity and usage</li>
          <li>High-quality templates that others have found useful</li>
          <li>Ready to use with a single click</li>
          <li>Great starting points for creating your own certificates</li>
        </ul>
        <p className="text-gray-700">
          These are the templates that have been most widely used and recommended by your team. You can click "Use Template" on any featured template to start generating certificates with it.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 10: Create New Certificate Card (Detailed Path)
  steps.push({
    target: '[data-tour="certificates-create-new-detailed"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Create New Certificate - Full Details</h3>
        <p className="text-gray-700">
          This detailed card explains the full capabilities of creating certificates from scratch:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Full Design Control:</strong> Upload any background image and customize every detail of your certificate</li>
          <li><strong>Dynamic Data Fields:</strong> Real event and attendee data automatically populates into your certificate</li>
          <li><strong>Save as Template:</strong> Once you create a design you like, save it as a template to reuse for future events</li>
        </ul>
        <p className="text-gray-700">
          Click "Start Creating" to begin the process of designing your custom certificate from scratch.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 11: Use Existing Template Card (Detailed Path)
  steps.push({
    target: '[data-tour="certificates-use-template-detailed"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Use Existing Template - Full Details</h3>
        <p className="text-gray-700">
          This detailed card explains the benefits of using existing templates:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Instant Generation:</strong> Use pre-designed templates for quick results without design work</li>
          <li><strong>Bulk Processing:</strong> Generate certificates for all attendees at once, saving time</li>
          <li><strong>Auto Email Delivery:</strong> Certificates are automatically sent to attendees via email</li>
        </ul>
        <p className="text-gray-700">
          Click "Generate Now" to quickly create certificates using a template from your library. This is the fastest way to generate certificates for an event.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 12: Management Tools Section
  steps.push({
    target: '[data-tour="certificates-management-tools"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Management Tools</h3>
        <p className="text-gray-700">
          This section provides access to powerful management tools for your certificates and templates:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Template Library:</strong> Browse and manage all your saved certificate templates. Edit, delete, or share templates as needed.</li>
          <li><strong>Certificate Manager:</strong> View and manage all generated certificates. Search, download, and resend certificates to attendees.</li>
        </ul>
        <p className="text-gray-700">
          These management tools give you complete control over your certificate system, allowing you to organize templates, track generated certificates, and maintain your certificate library efficiently.
        </p>
        <p className="text-gray-700">
          Use these tools to keep your certificates organized and ensure smooth certificate generation workflows.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}

