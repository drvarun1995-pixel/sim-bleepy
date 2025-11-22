import React from 'react'
import { Step } from 'react-joyride'

export interface CompleteEventDataTourConfig {
  role?: 'student' | 'educator' | 'meded_team' | 'ctf'
  onTabSwitch?: (tab: string) => void
}

/**
 * Creates the complete Event Data Tour
 * 
 * This includes:
 * 1. Event Data Sidebar Link
 * 2. Central Popup
 * 3. All Events Tab
 * 4. Export Data and Add Event Buttons
 * 5. Filters Section
 * 6. Sortable Event List
 * 7. Duplicate Button
 * 8. Delete Button
 * 9. Bulk Delete Checkbox
 * 10. Pagination
 * 11. Add Event Tab
 * 12-51. Add Event Form Steps (40 steps covering all form sections)
 * 52. Smart Bulk Upload Tab (placeholder - discussed later)
 * 53. Category Tab
 * 54. Add New Category Section
 * 55. Category Management Section
 * 56. Format Tab
 * 57. Add New Format Section
 * 58. Format Management Section
 * 59. Locations Tab
 * 60. Add New Location Section
 * 61. Manage Current Locations Section
 * 62. Organizers Tab
 * 63. Add New Organizer Section
 * 64. Manage Organizers Section
 * 65. Speakers Tab
 * 66. Add New Speaker Section
 * 67. Manage Speakers Section
 * 
 * This is the full reusable event data onboarding that can be used by any role.
 */
export function createCompleteEventDataTour(config: CompleteEventDataTourConfig = {}): Step[] {
  const { role = 'meded_team' } = config

  const steps: Step[] = []

  // Step 1: Event Data Sidebar Link
  steps.push({
    target: '#sidebar-event-data-link',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Event Data</h3>
        <p className="text-gray-700">
          This is your Event Data navigation link. Click here anytime to access the Event Data page where you can manage all aspects of your events, including creating events, managing categories, formats, locations, organizers, and speakers.
        </p>
        <p className="text-gray-700">
          The Event Data page is your central hub for all event management tasks.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 2: Central Popup
  steps.push({
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-purple-700">You Are Here: Event Data</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          This is the Event Data page, your central hub for managing all aspects of your training events. Here you can create, edit, and manage events, as well as configure categories, formats, locations, organizers, and speakers.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Let's explore the key features of the Event Data page.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    disableOverlay: false,
    disableScrolling: false,
  })

  // Step 3: All Events Tab
  steps.push({
    target: '[data-tour="event-data-all-events-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">All Events Tab</h3>
        <p className="text-gray-700">
          This is the "All Events" tab. Click here to view and manage all your events in a comprehensive table format. This is the default view when you first access the Event Data page.
        </p>
        <p className="text-gray-700">
          From here, you can see all events, filter them, sort them, and perform bulk actions.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  })

  // Step 4: Export Data and Add Event Buttons
  steps.push({
    target: '[data-tour="event-data-header-buttons"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Export Data & Add Event</h3>
        <p className="text-gray-700">
          These buttons allow you to:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Export Data:</strong> Download all your event data in a spreadsheet format for backup or analysis</li>
          <li><strong>Add Event:</strong> Create a new event by filling out a comprehensive event form</li>
        </ul>
        <p className="text-gray-700">
          The "Add Event" button will take you to the event creation form where you can add all event details.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 5: Filters Section
  steps.push({
    target: '[data-tour="event-data-filters"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Event Filters</h3>
        <p className="text-gray-700">
          Use these filters to narrow down your event list:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Date Filter:</strong> Filter by all dates, today, this week, or this month</li>
          <li><strong>Format Filter:</strong> Filter events by their format (e.g., Clinical Skills, Core Teaching)</li>
          <li><strong>Location Filter:</strong> Filter events by location</li>
          <li><strong>Organizer Filter:</strong> Filter events by organizer</li>
          <li><strong>Category Filter:</strong> Filter events by category</li>
          <li><strong>Event Type:</strong> Filter by upcoming, expired, or all events</li>
        </ul>
        <p className="text-gray-700">
          You can also use the search bar to search for specific events by title or other details. Click "Reset All" to clear all filters.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 6: Sortable Event List
  steps.push({
    target: '[data-tour="event-data-events-table"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Events Table</h3>
        <p className="text-gray-700">
          This table displays all your events with the following information:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Title:</strong> The event title</li>
          <li><strong>Author:</strong> Who created the event</li>
          <li><strong>Category:</strong> Event categories</li>
          <li><strong>Format:</strong> Event format</li>
          <li><strong>Location:</strong> Where the event takes place</li>
          <li><strong>Organizer:</strong> Who is organizing the event</li>
          <li><strong>Speaker:</strong> Event speakers</li>
          <li><strong>Start Date & End Date:</strong> When the event occurs</li>
        </ul>
        <p className="text-gray-700">
          You can click on any column header to sort the events by that column. Click on a row to edit the event. The table is sortable and searchable to help you find specific events quickly.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 7: Duplicate Button
  steps.push({
    target: '[data-tour="event-data-duplicate-button"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Duplicate Event</h3>
        <p className="text-gray-700">
          Click the duplicate button (copy icon) to create a copy of an existing event. This is useful when you want to create a similar event without having to fill out all the details again.
        </p>
        <p className="text-gray-700">
          The duplicated event will have all the same details as the original, and you can then edit it as needed.
        </p>
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  })

  // Step 8: Delete Button
  steps.push({
    target: '[data-tour="event-data-delete-button"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Delete Event</h3>
        <p className="text-gray-700">
          Click the delete button (trash icon) to permanently delete an event. You'll be asked to confirm before the event is deleted.
        </p>
        <p className="text-gray-700">
          <strong>Warning:</strong> Deleting an event will also delete all associated bookings, attendance records, and feedback. This action cannot be undone.
        </p>
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  })

  // Step 9: Bulk Delete Checkbox
  steps.push({
    target: '[data-tour="event-data-bulk-delete"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Bulk Delete</h3>
        <p className="text-gray-700">
          Use the checkbox in the table header to select all events on the current page, or check individual event checkboxes to select specific events.
        </p>
        <p className="text-gray-700">
          Once you've selected events, a "Delete Selected" button will appear, allowing you to delete multiple events at once. This is useful for cleaning up old or unwanted events in bulk.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 10: Pagination
  steps.push({
    target: '[data-tour="event-data-pagination"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Pagination</h3>
        <p className="text-gray-700">
          Use the pagination controls to navigate through multiple pages of events. You can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li>Click "First" or "Last" to jump to the beginning or end</li>
          <li>Use "Prev" and "Next" to move one page at a time</li>
          <li>Click on page numbers to jump to a specific page</li>
          <li>Use the "Go to page" input to navigate directly to a page</li>
        </ul>
        <p className="text-gray-700">
          The pagination shows how many events are displayed (e.g., "Showing 1-10 of 114 events") and helps you navigate through large lists of events efficiently.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    disableScrolling: false,
    spotlightPadding: 5,
  })

  // Step 11: Add Event Tab
  steps.push({
    target: '[data-tour="event-data-add-event-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Add Event Tab</h3>
        <p className="text-gray-700">
          You can add events here. Click this tab to access the event creation form where you can create new events with all their details.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightPadding: 4,
    disableScrolling: false,
    floaterProps: {
      disableAnimation: true,
      placement: 'bottom',
      offset: 20,
      styles: {
        floater: {
          position: 'fixed',
        },
      },
    },
  })

  // Step 12: Basic Information Tab
  steps.push({
    target: '[data-tour="add-event-basic-information-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Basic Information</h3>
        <p className="text-gray-700">
          This is the first section of the event creation form. Here you'll enter the fundamental details about your event, including the title, description, categories, and format.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 13: Event Title
  steps.push({
    target: '[data-tour="add-event-title"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Event Title</h3>
        <p className="text-gray-700">
          Enter a clear and descriptive title for your event. This title will be displayed on event listings, calendars, and event pages. Make it specific and informative so attendees know what to expect.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 14: Featured Image
  steps.push({
    target: '[data-tour="add-event-featured-image"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Featured Image</h3>
        <p className="text-gray-700">
          Add a featured image for your event. This image will be displayed on event cards, listings, and the event detail page. Choose an image that represents your event well and is visually appealing.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 15: Event Description
  steps.push({
    target: '[data-tour="add-event-description"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Event Description</h3>
        <p className="text-gray-700">
          Provide a detailed description of your event. Use the rich text editor to format your content with headings, lists, links, and other formatting options. This description helps attendees understand what the event is about and what they'll learn or experience.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 16: Categories
  steps.push({
    target: '[data-tour="add-event-categories"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Categories</h3>
        <p className="text-gray-700">
          Select one or more categories for your event. Categories help organize events and allow users to filter events by category. You can select multiple categories if your event fits into several categories.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 17: Format
  steps.push({
    target: '[data-tour="add-event-format"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Format</h3>
        <p className="text-gray-700">
          Select the format of your event (e.g., "A-E Practice Sessions", "Bedside Teaching", "Clinical Skills", etc.). The format describes the type or style of the event and helps categorize it further.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 18: Date And Time Tab
  steps.push({
    target: '[data-tour="add-event-date-time-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Date And Time</h3>
        <p className="text-gray-700">
          Click this tab to set the date and time for your event. You can specify when the event starts and ends, and configure additional timing options.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 19: Date and Time Inputs
  steps.push({
    target: '[data-tour="add-event-date-time-inputs"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Date and Time</h3>
        <p className="text-gray-700">
          Set the start and end dates and times for your event:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Start Date:</strong> When the event begins</li>
          <li><strong>Start Time:</strong> The time the event starts</li>
          <li><strong>End Date:</strong> When the event ends (optional for single-day events)</li>
          <li><strong>End Time:</strong> The time the event ends</li>
        </ul>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 20: All-day Event
  steps.push({
    target: '[data-tour="add-event-all-day"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">All-day Event</h3>
        <p className="text-gray-700">
          Enable this option if your event runs all day without specific start and end times. When enabled, the event will be displayed as an all-day event on calendars, and specific times won't be shown.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 21: Further Time Tweaks
  steps.push({
    target: '[data-tour="add-event-time-tweaks"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Additional Time Options</h3>
        <p className="text-gray-700">
          Configure additional timing options:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Hide Event Time:</strong> Don't display the start time on the event page</li>
          <li><strong>Hide Event End Time:</strong> Don't display the end time on the event page</li>
        </ul>
        <p className="text-gray-700">
          You can also add any additional notes about timing in the notes field, such as "Registration opens 30 minutes before start time" or "Coffee break at 2 PM".
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 22: Location/Venue Tab
  steps.push({
    target: '[data-tour="add-event-location-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Location/Venue</h3>
        <p className="text-gray-700">
          Click this tab to set where your event will take place. You can specify a primary location and additional locations if needed.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 23: Primary Location
  steps.push({
    target: '[data-tour="add-event-primary-location"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Primary Location</h3>
        <p className="text-gray-700">
          Select the main location for your event. The primary location will be displayed prominently on the event page and will be shown on a map if available. Choose from your existing locations or add a new one.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 24: Other Locations
  steps.push({
    target: '[data-tour="add-event-other-locations"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Additional Locations</h3>
        <p className="text-gray-700">
          If your event takes place at multiple locations or has satellite locations, you can add them here. Additional locations will also be displayed on the event page.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 25: Hide Location
  steps.push({
    target: '[data-tour="add-event-hide-location"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Hide Location on Event Page</h3>
        <p className="text-gray-700">
          Enable this option if you don't want to display the location information on the public event page. This is useful for private events or events where the location is shared separately.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 26: Event Links Tab
  steps.push({
    target: '[data-tour="add-event-links-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Event Links</h3>
        <p className="text-gray-700">
          Click this tab to add external links related to your event, such as registration pages, additional resources, or related websites.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 27: Event Links Inputs
  steps.push({
    target: '[data-tour="add-event-links-inputs"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Event Links</h3>
        <p className="text-gray-700">
          Add relevant links for your event:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Event Link:</strong> The main link for your event (e.g., registration page, event website)</li>
          <li><strong>More Info Link:</strong> Additional information or resources related to the event</li>
        </ul>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 28: Where Links Open
  steps.push({
    target: '[data-tour="add-event-links-open"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Link Opening Behavior</h3>
        <p className="text-gray-700">
          Choose how these links should open when clicked:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Same Window:</strong> Opens the link in the same browser tab</li>
          <li><strong>New Tab:</strong> Opens the link in a new browser tab (recommended for external links)</li>
        </ul>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 29: Organizer Tab
  steps.push({
    target: '[data-tour="add-event-organizer-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Organizer</h3>
        <p className="text-gray-700">
          Click this tab to assign organizers to your event. Organizers are responsible for managing and running the event.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 30: Main Organizer
  steps.push({
    target: '[data-tour="add-event-main-organizer"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Main Organizer</h3>
        <p className="text-gray-700">
          Select the primary organizer for this event. Each event must have one main organizer who is primarily responsible for the event. This organizer will be prominently displayed on the event page.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 31: Other Organizers
  steps.push({
    target: '[data-tour="add-event-other-organizers"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Additional Organizers</h3>
        <p className="text-gray-700">
          If your event has multiple organizers, you can add them here. Additional organizers will also be displayed on the event page and can help manage the event.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 32: Hide Organizer
  steps.push({
    target: '[data-tour="add-event-hide-organizer"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Hide Organizer on Event Page</h3>
        <p className="text-gray-700">
          Enable this option if you don't want to display organizer information on the public event page. This is useful for private events or when organizer details should remain confidential.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 33: Speakers Tab
  steps.push({
    target: '[data-tour="add-event-speakers-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Speakers</h3>
        <p className="text-gray-700">
          Click this tab to assign speakers to your event. Speakers are the individuals who will present or lead sessions during the event.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 34: Speakers Selection
  steps.push({
    target: '[data-tour="add-event-speakers"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Select Speakers</h3>
        <p className="text-gray-700">
          Select one or more speakers for your event. You can choose from existing speakers in the system. Speakers will be displayed on the event page, helping attendees know who will be presenting.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 35: Booking Tab
  steps.push({
    target: '[data-tour="add-event-booking-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Booking</h3>
        <p className="text-gray-700">
          Click this tab to configure booking and registration settings for your event. This allows attendees to register and book spots for your event.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 36: Enable Booking
  steps.push({
    target: '[data-tour="add-event-enable-booking"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Enable Booking</h3>
        <p className="text-gray-700">
          Activate this option to enable registration and booking functionality for your event. When enabled, attendees will be able to book spots for your event, and you can manage registrations.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 37: Basic Booking Settings
  steps.push({
    target: '[data-tour="add-event-booking-settings"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Basic Booking Settings</h3>
        <p className="text-gray-700">
          Configure the basic booking options:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Booking Button Label:</strong> Customize the text shown on the booking button (e.g., "Register Now", "Book Spot")</li>
          <li><strong>Event Capacity:</strong> Set the maximum number of bookings allowed. Leave empty for unlimited capacity.</li>
        </ul>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 38: Who Can Book
  steps.push({
    target: '[data-tour="add-event-who-can-book"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Who Can Book</h3>
        <p className="text-gray-700">
          Restrict booking to specific categories if needed. This option is auto-populated from the categories you selected earlier, but you can modify this list to further restrict booking access. For example, you might want only certain student cohorts to be able to book.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 39: Confirmation Popup Boxes
  steps.push({
    target: '[data-tour="add-event-confirmation-checkboxes"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">User Confirmation</h3>
        <p className="text-gray-700">
          Configure checkboxes that users must acknowledge when booking:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Checkbox 1:</strong> Always shown and required - users must check this to complete booking</li>
          <li><strong>Checkbox 2:</strong> Optional - only shown if you provide text for it</li>
        </ul>
        <p className="text-gray-700">
          These checkboxes are useful for terms and conditions, consent forms, or important event information that attendees must acknowledge.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 40: Feedback Tab
  steps.push({
    target: '[data-tour="add-event-feedback-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Feedback</h3>
        <p className="text-gray-700">
          Click this tab to configure feedback collection settings. You can enable feedback forms that attendees will complete after the event.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 41: Enable Feedback
  steps.push({
    target: '[data-tour="add-event-enable-feedback"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Enable Feedback</h3>
        <p className="text-gray-700">
          Activate this option to collect feedback from students after the event. Feedback helps you understand what worked well and what can be improved for future events.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 42: Feedback Form Template
  steps.push({
    target: '[data-tour="add-event-feedback-template"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Feedback Form Template</h3>
        <p className="text-gray-700">
          Choose a feedback form template from your pre-existing templates, or design your own custom feedback form. The form will be shown to attendees after the event, allowing them to provide valuable feedback.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 43: Attendance Tracking Tab
  steps.push({
    target: '[data-tour="add-event-attendance-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Attendance Tracking</h3>
        <p className="text-gray-700">
          Click this tab to configure attendance tracking settings. You can enable QR code scanning for attendance, which makes it easy for attendees to mark their attendance.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 44: Enable Attendance Tracking
  steps.push({
    target: '[data-tour="add-event-enable-attendance"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Enable QR Code Attendance Tracking</h3>
        <p className="text-gray-700">
          Activate this option to allow students to scan QR codes to mark their attendance at the event. This provides an easy and efficient way to track who attended your event.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 45: Certificates Tab
  steps.push({
    target: '[data-tour="add-event-certificates-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Certificates</h3>
        <p className="text-gray-700">
          Click this tab to configure certificate generation settings. You can automatically generate and send certificates to attendees after the event.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 46: Enable Certificate Generation
  steps.push({
    target: '[data-tour="add-event-enable-certificates"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Auto-generate Certificate</h3>
        <p className="text-gray-700">
          Enable this option to automatically generate certificates after event completion. Certificates can be automatically sent to attendees via email and serve as proof of attendance or completion.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 47: Certificate Templates
  steps.push({
    target: '[data-tour="add-event-certificate-template"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Certificate Template</h3>
        <p className="text-gray-700">
          Choose a certificate template from your pre-existing templates, or design your own custom certificate template. The template will be used to generate certificates for all attendees.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 48: Auto-send Certificates
  steps.push({
    target: '[data-tour="add-event-auto-send-certificates"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Auto-send Certificate via Email</h3>
        <p className="text-gray-700">
          Enable this option to automatically email certificates to attendees once they're generated. This ensures attendees receive their certificates without manual intervention.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 49: Generate After Feedback
  steps.push({
    target: '[data-tour="add-event-certificates-after-feedback"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Generate After Feedback Completion</h3>
        <p className="text-gray-700">
          Enable this option to only generate certificates after attendees complete the feedback form. This encourages feedback collection by making certificate generation conditional on feedback submission.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 50: Event Status Tab
  steps.push({
    target: '[data-tour="add-event-status-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Event Status</h3>
        <p className="text-gray-700">
          Click this tab to set the status of your event. The event status helps communicate the current state of the event to attendees.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 51: Event Status Options
  steps.push({
    target: '[data-tour="add-event-status-options"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Event Status</h3>
        <p className="text-gray-700">
          Select the appropriate status for your event:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Scheduled:</strong> For active events that are confirmed and proceeding as planned</li>
          <li><strong>Rescheduled:</strong> For events that have been moved to a different date/time</li>
          <li><strong>Postponed:</strong> For events that have been temporarily delayed</li>
          <li><strong>Cancelled:</strong> For events that have been cancelled</li>
        </ul>
        <p className="text-gray-700">
          <strong>Note:</strong> When you select a status other than "Scheduled" (Rescheduled, Postponed, or Cancelled), the system will automatically create an announcement that will be visible to target cohorts in their personalized dashboard, ensuring they're informed about the status change.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 52: Smart Bulk Upload Tab (placeholder)
  steps.push({
    target: '[data-tour="event-data-bulk-upload-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Smart Bulk Upload Tab</h3>
        <p className="text-gray-700">
          This tab allows you to upload multiple events at once using a smart bulk upload feature. You can upload events from a spreadsheet or use AI-powered tools to create events in bulk.
        </p>
        <p className="text-gray-700">
          <em>Note: The full tour of the Smart Bulk Upload feature will be explained later.</em>
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  })

  // Step 53: Category Tab
  steps.push({
    target: '[data-tour="event-data-category-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Category Tab</h3>
        <p className="text-gray-700">
          Click here to manage event categories. Categories help organize and classify your events (e.g., ARU Year 1, ARU Year 2, Clinical Skills).
        </p>
        <p className="text-gray-700">
          Categories can have parent-child relationships, allowing you to create hierarchical category structures. Each category can have a custom color for visual identification.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  })

  // Step 54: Add New Category Section
  steps.push({
    target: '[data-tour="event-data-add-category"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Add New Category</h3>
        <p className="text-gray-700">
          Use this form to create a new category:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Name:</strong> The category name as it appears on your site</li>
          <li><strong>Parent Category:</strong> Optionally assign a parent to create a hierarchy (only root categories can be selected as parents)</li>
          <li><strong>Description:</strong> A description of the category</li>
          <li><strong>Color:</strong> Choose a color for visual identification</li>
        </ul>
        <p className="text-gray-700">
          Categories help users filter and find events more easily.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 55: Category Management Section
  steps.push({
    target: '[data-tour="event-data-categories-list"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Manage Categories</h3>
        <p className="text-gray-700">
          This section displays all your categories in a table format. For each category, you can see:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Name:</strong> The category name</li>
          <li><strong>Description:</strong> Category description</li>
          <li><strong>Count:</strong> How many events use this category</li>
          <li><strong>Color:</strong> The visual color assigned to the category</li>
        </ul>
        <p className="text-gray-700">
          You can edit or delete categories from this table. Note that deleting a category will remove it from all associated events.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 56: Format Tab
  steps.push({
    target: '[data-tour="event-data-format-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Format Tab</h3>
        <p className="text-gray-700">
          Click here to manage event formats. Formats describe the type or style of event (e.g., A-E Practice Sessions, Bedside Teaching, Clinical Skills, Core Teaching, Exams & Mocks).
        </p>
        <p className="text-gray-700">
          Like categories, formats can have parent-child relationships and custom colors for visual identification.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  })

  // Step 57: Add New Format Section
  steps.push({
    target: '[data-tour="event-data-add-format"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Add New Format</h3>
        <p className="text-gray-700">
          Use this form to create a new format:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Name:</strong> The format name as it appears on your site</li>
          <li><strong>Parent Format:</strong> Optionally assign a parent to create a hierarchy (only root formats can be selected as parents)</li>
          <li><strong>Description:</strong> A description of the format</li>
          <li><strong>Color:</strong> Choose a color for visual identification</li>
        </ul>
        <p className="text-gray-700">
          Formats help categorize events by their teaching style or delivery method.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 58: Format Management Section
  steps.push({
    target: '[data-tour="event-data-formats-list"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Manage Formats</h3>
        <p className="text-gray-700">
          This section displays all your formats in a table format. For each format, you can see:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Name:</strong> The format name</li>
          <li><strong>Description:</strong> Format description</li>
          <li><strong>Count:</strong> How many events use this format</li>
          <li><strong>Color:</strong> The visual color assigned to the format</li>
        </ul>
        <p className="text-gray-700">
          You can edit or delete formats from this table. Note that deleting a format will remove it from all associated events.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 59: Locations Tab
  steps.push({
    target: '[data-tour="event-data-locations-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Locations Tab</h3>
        <p className="text-gray-700">
          Click here to manage event locations. Locations are physical places where events take place (e.g., Simulation Suite, Education Centre, Post Graduate Centre).
        </p>
        <p className="text-gray-700">
          Locations can include addresses and geographic coordinates (latitude/longitude) for mapping purposes.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  })

  // Step 60: Add New Location Section
  steps.push({
    target: '[data-tour="event-data-add-location"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Add New Location</h3>
        <p className="text-gray-700">
          Use this form to create a new location:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Name:</strong> The location name (e.g., "A1, Education Centre")</li>
          <li><strong>Address:</strong> Type in the address to find the location using Google Maps integration</li>
          <li><strong>Latitude & Longitude:</strong> Automatically populated when you select an address, or you can enter them manually</li>
        </ul>
        <p className="text-gray-700">
          When you type an address, the system will show suggestions from Google Maps. Select a suggestion to automatically fill in the address and coordinates. A map preview will also be displayed showing the location.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 61: Manage Current Locations Section
  steps.push({
    target: '[data-tour="event-data-locations-list"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Manage Current Locations</h3>
        <p className="text-gray-700">
          This section displays all your locations in a table format. For each location, you can see:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Name:</strong> The location name</li>
          <li><strong>Address:</strong> The full address</li>
          <li><strong>Coordinates:</strong> Latitude and longitude for mapping</li>
        </ul>
        <p className="text-gray-700">
          You can edit or delete locations from this table. Note that deleting a location will remove it from all associated events.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 62: Organizers Tab
  steps.push({
    target: '[data-tour="event-data-organizers-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Organizers Tab</h3>
        <p className="text-gray-700">
          Click here to manage event organizers. Organizers are individuals or teams responsible for organizing events (e.g., CTF Team, Medical Education Department).
        </p>
        <p className="text-gray-700">
          Organizers help identify who is responsible for each event and can be used for filtering and reporting.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  })

  // Step 63: Add New Organizer Section
  steps.push({
    target: '[data-tour="event-data-add-organizer"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Add New Organizer</h3>
        <p className="text-gray-700">
          Use this form to create a new organizer. Simply enter the organizer name and click "Add New Organizer" to add it to your list.
        </p>
        <p className="text-gray-700">
          Organizers can be individuals (e.g., "Dr. Smith") or teams (e.g., "CTF Team", "Medical Education Department").
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 64: Manage Organizers Section
  steps.push({
    target: '[data-tour="event-data-organizers-list"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Manage Organizers</h3>
        <p className="text-gray-700">
          This section displays all your organizers in a table format. For each organizer, you can see:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Name:</strong> The organizer name</li>
          <li><strong>Count:</strong> How many events this organizer is associated with</li>
        </ul>
        <p className="text-gray-700">
          You can delete organizers from this table. Note that deleting an organizer will remove it from all associated events.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  // Step 65: Speakers Tab
  steps.push({
    target: '[data-tour="event-data-speakers-tab"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Speakers Tab</h3>
        <p className="text-gray-700">
          Click here to manage event speakers. Speakers are individuals who present or teach at events (e.g., doctors, educators, specialists).
        </p>
        <p className="text-gray-700">
          Speakers can have roles (e.g., "Foundation Year Doctor", "CTF", "Presenter") to help categorize them.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  })

  // Step 66: Add New Speaker Section
  steps.push({
    target: '[data-tour="event-data-add-speaker"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Add New Speaker</h3>
        <p className="text-gray-700">
          Use this form to create a new speaker:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Name:</strong> The speaker's full name</li>
          <li><strong>Role:</strong> The speaker's role or title (e.g., "Foundation Year Doctor", "CTF", "Presenter")</li>
        </ul>
        <p className="text-gray-700">
          Speakers can be assigned to multiple events, and you can filter events by speaker to see all events where a particular speaker is presenting.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  })

  // Step 67: Manage Speakers Section
  steps.push({
    target: '[data-tour="event-data-speakers-list"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-purple-700">Manage Speakers</h3>
        <p className="text-gray-700">
          This section displays all your speakers in a table format. For each speaker, you can see:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          <li><strong>Name:</strong> The speaker's name</li>
          <li><strong>Role:</strong> The speaker's role or title</li>
          <li><strong>Count:</strong> How many events this speaker is associated with</li>
        </ul>
        <p className="text-gray-700">
          You can edit or delete speakers from this table. You can also select multiple speakers for bulk deletion. Note that deleting a speaker will remove them from all associated events.
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
    spotlightPadding: 10,
  })

  return steps
}

