"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Ticket, Users, CheckCircle, X, Clock, Download, Search, QrCode, Award, Calendar, MapPin, ArrowLeft as BackIcon } from "lucide-react";
import Link from "next/link";

export default function BookingsManagementTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Managing Bookings</h1>
            <p className="text-xl text-gray-600">How to view, manage, and handle event bookings and waitlists</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ticket className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Bookings Page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Bookings</strong> from the dashboard sidebar. This page shows all events with booking enabled and their booking statistics.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Overview:</strong> The Bookings page displays overall statistics (confirmed, waitlist, cancelled, etc.) and a list of all events with bookings. You can filter by status, date, and search for specific events.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Finding Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Use the filters on the Bookings page to find events:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Search className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Search Events</p>
                      <p className="text-sm text-gray-600">Search by event title to quickly find specific events.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Ticket className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Status Filter</p>
                      <p className="text-sm text-gray-600">Filter by: All Statuses, Available, Almost Full, Full, or Unlimited capacity.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Date Filter</p>
                      <p className="text-sm text-gray-600">Filter by: All Events, Upcoming Events, or Past Events.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Bookings Filter</p>
                      <p className="text-sm text-gray-600">Filter by: All, With Bookings, or Without Bookings.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Viewing Event Bookings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To view bookings for a specific event:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Click on any event in the bookings list</li>
                  <li>This opens the Event Bookings page for that specific event</li>
                  <li>You'll see event details (title, date, time, location) at the top</li>
                  <li>Booking statistics are displayed showing counts for each status</li>
                  <li>The bookings table shows all bookings with detailed information</li>
                </ol>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Statistics:</strong> The page shows counts for Confirmed, Waitlist, Cancelled, Attended, and No-Show bookings, giving you a quick overview of the event's booking status.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Understanding Booking Statuses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Bookings can have different statuses:</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                      <p className="text-sm font-semibold text-gray-900">Confirmed</p>
                    </div>
                    <p className="text-xs text-gray-600">Student has a secured spot for the event</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                      <p className="text-sm font-semibold text-gray-900">Waitlist</p>
                    </div>
                    <p className="text-xs text-gray-600">Student is waiting for a spot to become available</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center mb-2">
                      <X className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-sm font-semibold text-gray-900">Cancelled</p>
                    </div>
                    <p className="text-xs text-gray-600">Booking was cancelled by student or admin</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <p className="text-sm font-semibold text-gray-900">Attended</p>
                    </div>
                    <p className="text-xs text-gray-600">Student attended the event (marked via QR code or manually)</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <X className="h-5 w-5 text-gray-600 mr-2" />
                      <p className="text-sm font-semibold text-gray-900">No Show</p>
                    </div>
                    <p className="text-xs text-gray-600">Student had a confirmed booking but did not attend</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-purple-600 mr-2" />
                      <p className="text-sm font-semibold text-gray-900">Pending</p>
                    </div>
                    <p className="text-xs text-gray-600">Booking requires manual approval (if approval mode is manual)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Managing Individual Bookings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">For each booking in the table, you can:</p>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-2">Change Booking Status</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Use the status dropdown in the Actions column</li>
                      <li>Select from: Pending, Confirmed, Waitlist, Cancelled, Attended, No Show</li>
                      <li>Changes are saved immediately</li>
                      <li>When a confirmed booking is cancelled, the first waitlisted student is automatically promoted to Confirmed</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-2">Cancel Booking</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Click "Cancel" button (only available for confirmed or waitlist bookings)</li>
                      <li>Enter a cancellation reason (optional but recommended)</li>
                      <li>Confirm the cancellation</li>
                      <li>If a confirmed booking is cancelled, waitlisted students are automatically notified</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-semibold text-gray-900 mb-2">Delete Booking</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Click "Delete" button (only available for cancelled bookings)</li>
                      <li>Confirm the permanent deletion</li>
                      <li>This action cannot be undone</li>
                      <li>Useful for cleaning up old cancelled bookings</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Filtering and Searching Bookings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">On the Event Bookings page, you can filter bookings:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Search className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Search by Name or Email</p>
                      <p className="text-sm text-gray-600">Type in the search box to filter bookings by student name or email address.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Ticket className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Filter by Status</p>
                      <p className="text-sm text-gray-600">Select from: All Statuses, Pending, Confirmed, Waitlist, Cancelled, Attended, or No Show.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-600" />
                  Step 7: Exporting Booking Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To export booking data for an event:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>On the Event Bookings page, click the "Export CSV" button</li>
                  <li>The export includes: Name, Email, Status, Booked At, Checked In, Certificates Generated, Email Sent</li>
                  <li>The CSV file will download with all current bookings (respecting any active filters)</li>
                  <li>Use the exported data for reporting, analysis, or sharing with other departments</li>
                </ol>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Use Cases:</strong> Export data for attendance reports, certificate generation tracking, email delivery verification, or compliance documentation.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2 text-purple-600" />
                  Step 8: QR Code and Certificate Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">From the Event Bookings page, you can access related features:</p>
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="font-semibold text-gray-900 mb-1">Generate/View QR Code</p>
                    <p className="text-sm text-gray-700">Click "Generate QR Code" or "View QR Code" to manage QR codes for attendance tracking. This opens the QR Code Management page for this event.</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-1">Generate Certificates</p>
                    <p className="text-sm text-gray-700">Click "Generate Certificates" to create certificates for attendees. This opens the certificate generation page for this event.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-purple-600" />
                  Push Notifications for Bookings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">
                  The platform automatically sends push notifications to users for booking-related events:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Booking Reminders</p>
                      <p className="text-sm text-gray-600">Users receive automatic reminders 24 hours before, 1 hour before, and when the event starts.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Waitlist Promotion</p>
                      <p className="text-sm text-gray-600">When you promote someone from waitlist to confirmed, they automatically receive a push notification.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
                    <X className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Admin Cancellation</p>
                      <p className="text-sm text-gray-600">When you cancel a user's booking, they receive an immediate push notification.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Users must enable push notifications in their profile to receive these alerts. All notifications respect user preferences and can be customized per notification type.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
                  Step 9: Understanding Booking Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">The bookings table displays comprehensive information:</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Name</p>
                    <p className="text-xs text-gray-600">Student name with role badge</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Email</p>
                    <p className="text-xs text-gray-600">Student email address</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Status</p>
                    <p className="text-xs text-gray-600">Current booking status with color-coded badge</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Booked At</p>
                    <p className="text-xs text-gray-600">Date when the booking was made</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Checked In</p>
                    <p className="text-xs text-gray-600">Whether the student checked in (via QR code or manually)</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Certificates</p>
                    <p className="text-xs text-gray-600">Whether certificates have been generated</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Email Sent</p>
                    <p className="text-xs text-gray-600">Whether certificates were sent via email</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Actions</p>
                    <p className="text-xs text-gray-600">Status dropdown, Cancel, and Delete buttons</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 10: Waitlist Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">When events reach capacity, students can join a waitlist:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Automatic Promotion:</strong> When a confirmed booking is cancelled, the first student on the waitlist is automatically promoted to Confirmed status</li>
                  <li><strong>Manual Promotion:</strong> You can manually change a waitlist booking to Confirmed using the status dropdown</li>
                  <li><strong>Waitlist Order:</strong> Waitlisted students are ordered by when they joined the waitlist (first come, first served)</li>
                  <li><strong>Notifications:</strong> Students are automatically notified when they are promoted from waitlist to confirmed</li>
                </ul>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Best Practice:</strong> Monitor waitlists regularly and consider increasing event capacity if waitlists become too long, or schedule additional sessions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Booking Management Best Practices</CardTitle>
                <CardDescription>Tips for effective booking management</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Regularly review booking statuses, especially before events</li>
                  <li>Monitor waitlists and consider capacity adjustments if needed</li>
                  <li>Use the search and filter features to quickly find specific bookings</li>
                  <li>Export booking data regularly for record-keeping and reporting</li>
                  <li>Mark attendance promptly after events (via QR codes or manually)</li>
                  <li>Follow up on no-shows to understand reasons and improve future events</li>
                  <li>Use cancellation reasons to track why students cancel (helps improve events)</li>
                  <li>Generate certificates promptly after events for attended students</li>
                  <li>Keep booking data accurate for compliance and reporting purposes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
