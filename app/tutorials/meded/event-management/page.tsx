"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Plus, Edit, Settings, FileText, Clock, Users, MapPin, Image, Layers, Tag, User, Bell } from "lucide-react";
import Link from "next/link";

export default function EventManagementTutorial() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/tutorials">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tutorials
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Management Overview</h1>
            <p className="text-xl text-gray-600">Complete guide to creating, editing, and managing teaching events</p>
          </div>

          <div className="space-y-6">
            {/*ARCADE EMBED START*/}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm border-border p-6">
              <div style={{ position: 'relative', paddingBottom: 'calc(50.9792% + 41px)', height: '0px', width: '100%' }}>
                <iframe 
                  src="https://demo.arcade.software/j357B4DsL0qP4faA7vEH?embed&embed_mobile=inline&embed_desktop=inline&show_copy_link=true" 
                  title="Create a New Event and Set Up Booking in the Event Management Platform" 
                  frameBorder="0" 
                  loading="lazy" 
                  allowFullScreen
                  allow="clipboard-write"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', colorScheme: 'light' }}
                  className="rounded-lg"
                />
              </div>
            </div>
            {/*ARCADE EMBED END*/}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Event Data Page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Event Data</strong> from the dashboard sidebar. This is your central hub for all event management activities.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Navigation:</strong> The Event Data page has a sidebar menu with sections for All Events, Add Event, Smart Bulk Upload, Categories, Formats, Locations, Organizers, and Speakers.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Creating a New Event
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Click "Add Event" from the sidebar and fill in the required information:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Event Title</p>
                      <p className="text-sm text-gray-600">Clear, descriptive title for the event</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Date & Time</p>
                      <p className="text-sm text-gray-600">Start and end times for the session. You can hide time display, hide end time, or mark as all-day event.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Location</p>
                      <p className="text-sm text-gray-600">Select a location from the dropdown or add a new one. You can add multiple locations to a single event. Locations can include addresses and coordinates.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Categories</p>
                      <p className="text-sm text-gray-600">Select one or more categories for the event. Categories help organize and filter events.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Layers className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Format</p>
                      <p className="text-sm text-gray-600">Select the event format (e.g., Workshop, Lecture, Seminar). Formats can have parent-child relationships for organization.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Organizer</p>
                      <p className="text-sm text-gray-600">Select a main organizer and optionally add additional organizers. You can hide organizer information on the event page if needed.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Speakers</p>
                      <p className="text-sm text-gray-600">Select one or more speakers for the event. Each speaker has a name and role. You can hide speaker information on the event page if needed.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Image className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Featured Image (Optional)</p>
                      <p className="text-sm text-gray-600">Upload a featured image that displays prominently above the event title on the event page. You can upload images before saving the event.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Event Description</p>
                      <p className="text-sm text-gray-600">Use the rich text editor (TipTap) to add formatted content, images, tables, and more to your event description.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Configure Event Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Set up important event features using the form sections:</p>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-1">Booking Configuration</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Enable/disable booking for the event</li>
                      <li>Set booking capacity (leave empty for unlimited)</li>
                      <li>Configure booking deadline (hours before event)</li>
                      <li>Set cancellation deadline</li>
                      <li>Enable waitlist functionality</li>
                      <li>Customize booking button label</li>
                      <li>Set booking approval mode (auto or manual)</li>
                      <li>Configure confirmation checkboxes</li>
                      <li>Restrict booking to specific categories</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-1">QR Attendance Tracking</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Enable QR code attendance tracking (works independently of booking)</li>
                      <li>QR codes are automatically generated when enabled</li>
                      <li>Perfect for events with walk-ins or external attendees</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="font-semibold text-gray-900 mb-1">Feedback Configuration</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Enable feedback collection (works independently of booking)</li>
                      <li>Select feedback form template</li>
                      <li>Feedback forms are created automatically when enabled</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="font-semibold text-gray-900 mb-1">Certificate Configuration</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Enable auto-generation of certificates</li>
                      <li>Select certificate template</li>
                      <li>Configure auto-send via email</li>
                      <li>Require feedback completion before certificate generation</li>
                      <li>Set feedback deadline (optional)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Editing Existing Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">
                  To edit an event, go to the "All Events" tab, find your event in the table, and click on the event row or use the edit button. You can modify:
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Basic Details</p>
                    <p className="text-xs text-gray-600">Title, description, featured image, date/time, location, organizer, speakers</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Settings</p>
                    <p className="text-xs text-gray-600">Booking, QR attendance, feedback, certificates</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Categories & Format</p>
                    <p className="text-xs text-gray-600">Event categories and format type</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Event Links</p>
                    <p className="text-xs text-gray-600">Event link and more info link</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Important:</strong> Be careful when editing events that already have bookings. You cannot disable booking if there are active registrations. Consider notifying registered attendees of significant changes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Managing Formats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">
                  Formats categorize events by type (e.g., Workshop, Lecture, Seminar, Grand Round). Access the <strong>Formats</strong> section from the Event Data sidebar.
                </p>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-2">Creating Formats</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Go to the "Formats" section in the Event Data sidebar</li>
                      <li>Fill in the format name (required)</li>
                      <li>Optionally set a parent format to create a hierarchy</li>
                      <li>Add a description</li>
                      <li>Select a color for visual identification (optional)</li>
                      <li>Click "Add New Format"</li>
                    </ol>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-2">Editing Formats</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Find the format in the formats list</li>
                      <li>Click the edit button (pencil icon)</li>
                      <li>Update name, description, parent, or color</li>
                      <li>Click "Save" to apply changes</li>
                    </ol>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-semibold text-gray-900 mb-2">Deleting Formats</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Select formats using checkboxes (can select multiple)</li>
                      <li>Click "Delete Selected" for bulk deletion</li>
                      <li>Or click the delete button (trash icon) for individual formats</li>
                      <li>Check the usage count before deleting - formats in use by events should not be deleted</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Format Hierarchy:</strong> Formats can have parent-child relationships. Parent formats appear first in the list, followed by their child formats (indented). This helps organize related format types.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Managing Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">
                  Locations are where events take place. Access the <strong>Locations</strong> section from the Event Data sidebar.
                </p>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-2">Creating Locations</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Go to the "Locations" section in the Event Data sidebar</li>
                      <li>Enter the location name (required)</li>
                      <li>Enter the address - Google Places autocomplete will suggest addresses as you type</li>
                      <li>Select an address from suggestions to auto-fill coordinates</li>
                      <li>Latitude and longitude are automatically populated when you select an address</li>
                      <li>You can manually adjust coordinates if needed</li>
                      <li>Click "Add New Location"</li>
                    </ol>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-2">Editing Locations</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Find the location in the locations list</li>
                      <li>Click the edit button (pencil icon)</li>
                      <li>Update name, address, or coordinates</li>
                      <li>Google Places autocomplete works in edit mode too</li>
                      <li>Click "Save Changes" to apply</li>
                    </ol>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-semibold text-gray-900 mb-2">Deleting Locations</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Click the delete button (trash icon) next to a location</li>
                      <li>Confirm the deletion</li>
                      <li>Ensure no events are using the location before deleting</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Google Places Integration:</strong> The location address field uses Google Places autocomplete, making it easy to add accurate addresses with automatic coordinate detection.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-purple-600" />
                  Step 7: Managing Organizers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">
                  Organizers are departments or groups responsible for events. Access the <strong>Organizers</strong> section from the Event Data sidebar.
                </p>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-2">Creating Organizers</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Go to the "Organizers" section in the Event Data sidebar</li>
                      <li>Enter the organizer name in the input field</li>
                      <li>Press Enter or click the plus button to add</li>
                      <li>The organizer is immediately available for selection in events</li>
                    </ol>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-2">Editing Organizers</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Find the organizer in the organizers list</li>
                      <li>Click the edit button (pencil icon)</li>
                      <li>Update the organizer name in the input field</li>
                      <li>Press Enter or click "Save" to apply changes</li>
                    </ol>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-semibold text-gray-900 mb-2">Deleting Organizers</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Click the delete button (trash icon) next to an organizer</li>
                      <li>Confirm the deletion</li>
                      <li>The usage count shows how many events use this organizer</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Event Usage:</strong> When creating or editing events, you can select a main organizer and add additional organizers. All organizers are displayed on the event page unless hidden.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 8: Managing Speakers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">
                  Speakers are individuals presenting at events. Access the <strong>Speakers</strong> section from the Event Data sidebar.
                </p>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-2">Creating Speakers</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Go to the "Speakers" section in the Event Data sidebar</li>
                      <li>Enter the speaker's name in the first input field</li>
                      <li>Enter the speaker's role in the second input field (e.g., "Keynote Speaker", "Workshop Leader", "Consultant Cardiologist")</li>
                      <li>Click "Add Speaker"</li>
                      <li>The speaker is immediately saved to the database and available for selection in events</li>
                    </ol>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-2">Editing Speakers</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Find the speaker in the speakers list</li>
                      <li>Click the edit button (pencil icon)</li>
                      <li>Update the speaker's name or role</li>
                      <li>Click "Save Changes" to apply</li>
                    </ol>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-semibold text-gray-900 mb-2">Deleting Speakers</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Select speakers using checkboxes (can select multiple)</li>
                      <li>Click "Delete Selected" for bulk deletion</li>
                      <li>Or click the delete button (trash icon) for individual speakers</li>
                      <li>The usage count shows how many events use this speaker</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Event Usage:</strong> When creating or editing events, you can select multiple speakers. Speaker information (name and role) appears on event detail pages unless hidden.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 9: Publishing and Managing Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">
                  After creating an event, you can:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Publish:</strong> Events are published by default when saved. Published events are visible to students.</li>
                  <li><strong>View Event:</strong> Click "Show Event" button when editing to view the public event page</li>
                  <li><strong>Duplicate:</strong> Use the duplicate button (copy icon) in the All Events table to quickly create similar events</li>
                  <li><strong>Delete:</strong> Delete events using the delete button (trash icon). Be careful - this action cannot be undone</li>
                  <li><strong>Sort & Filter:</strong> In the All Events tab, you can sort by title, author, category, format, location, organizer, speaker, or date</li>
                  <li><strong>Pagination:</strong> Use pagination controls to navigate through large lists of events</li>
                  <li><strong>Bulk Actions:</strong> Select multiple events using checkboxes for bulk operations</li>
                </ul>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Important:</strong> Be careful when editing or deleting events that already have bookings. You cannot disable booking if there are active registrations. Consider notifying registered attendees of significant changes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-purple-600" />
                  Push Notifications & Target Cohorts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">
                  When creating events, you can set <strong>Target Cohorts</strong> to enable personalized push notifications:
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-1">Event Reminders</p>
                    <p className="text-sm text-gray-700">Users in target cohorts automatically receive push notifications 1 hour and 15 minutes before events start.</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-1">Event Updates & Cancellations</p>
                    <p className="text-sm text-gray-700">When you update event status (postponed, rescheduled, moved-online, or cancelled), all users in target cohorts receive instant push notifications.</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="font-semibold text-gray-900 mb-1">Target Cohorts Format</p>
                    <p className="text-sm text-gray-700">Use format like: <code className="bg-white px-2 py-1 rounded">["ARU Year 4", "UCL Year 6"]</code>. Users must have matching university and study_year to receive notifications.</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Users must enable push notifications in their profile to receive these alerts. Notifications respect user preferences and can be customized per notification type.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
                <CardDescription>Continue learning with these related tutorials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Link href="/tutorials/meded/bulk-upload">
                    <Button variant="outline" size="sm">
                      Bulk Event Upload →
                    </Button>
                  </Link>
                  <Link href="/tutorials/meded/bookings-management">
                    <Button variant="outline" size="sm">
                      Managing Bookings →
                    </Button>
                  </Link>
                  <Link href="/tutorials/meded/qr-codes">
                    <Button variant="outline" size="sm">
                      QR Code Management →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
