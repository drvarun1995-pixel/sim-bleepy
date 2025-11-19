"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, CheckCircle, Download, BarChart3, Filter, Search, Calendar, FileText, Eye, LayoutGrid, List, RotateCcw, UserCheck, UserX, ArrowLeft as BackIcon } from "lucide-react";
import Link from "next/link";

export default function AttendanceTrackingAdminTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Attendance Tracking</h1>
            <p className="text-xl text-gray-600">Monitor and track student attendance across all events with QR attendance enabled</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Attendance Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Attendance Tracking</strong> from the dashboard sidebar. This page shows all events that have QR attendance enabled.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> The Attendance Tracking page allows you to view, filter, search, and export attendance data for events with QR codes. You can see attendance statistics and view detailed records for each event.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Filtering Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Use filters to find specific events:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Search className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Search Events</p>
                      <p className="text-sm text-gray-600">Search by event title or location. The search is case-insensitive and matches partial text.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Status Filter</p>
                      <p className="text-sm text-gray-600">Filter by: All Events, With QR Code, Without QR Code, Active QR Codes, Inactive QR Codes, Completed Events, or Upcoming Events.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Category Filter</p>
                      <p className="text-sm text-gray-600">Filter events by category. Categories are displayed hierarchically with parent and child categories.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Format Filter</p>
                      <p className="text-sm text-gray-600">Filter events by format type (e.g., Workshop, Lecture, Seminar).</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Location Filter</p>
                      <p className="text-sm text-gray-600">Filter events by location name.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Organizer Filter</p>
                      <p className="text-sm text-gray-600">Filter events by organizer name.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Speaker Filter</p>
                      <p className="text-sm text-gray-600">Filter events by speaker name.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Reset Filters:</strong> Use the "Reset Filters" button to clear all filters and search queries at once.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LayoutGrid className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: View Modes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">The Attendance Tracking page offers two view modes:</p>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-2">Extended View</p>
                    <p className="text-sm text-gray-700 mb-2">Shows events as cards with detailed information:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
                      <li>Event title and status badges</li>
                      <li>Date, time, categories, location</li>
                      <li>Attendance statistics (Successful Scans, Failed Scans, Unique Attendees, Total Scans)</li>
                      <li>QR code scan window information</li>
                      <li>Action buttons (View Records, Export)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-2">Compact View</p>
                    <p className="text-sm text-gray-700 mb-2">Shows events in a table format for quick scanning:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
                      <li>Sortable columns (Event, Date & Time, Location, Organizer, Speaker)</li>
                      <li>Color-coded category indicators</li>
                      <li>Compact display of event information</li>
                      <li>Action buttons in the rightmost column</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>View Preference:</strong> Your view mode preference is saved to localStorage, so it will be remembered for your next visit.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <List className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Sorting Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">In both view modes, you can sort events by clicking column headers:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Title:</strong> Sort alphabetically by event title</li>
                  <li><strong>Date:</strong> Sort by event date and time</li>
                  <li><strong>Location:</strong> Sort alphabetically by location name</li>
                  <li><strong>Organizer:</strong> Sort alphabetically by organizer name</li>
                  <li><strong>Speaker:</strong> Sort alphabetically by speaker names</li>
                </ul>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Sort Direction:</strong> Click once for ascending order, click again for descending order. The sort icon indicates the current sort direction.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Viewing Attendance Records
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To view detailed attendance records for an event:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the event in the events list</li>
                  <li>Click the "View Records" button</li>
                  <li>A dialog will open showing all attendance records for that event</li>
                  <li>You'll see: student name, email, scan timestamp, success/failure status, and failure reason if applicable</li>
                  <li>The dialog shows both successful scans and failed scans</li>
                </ol>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Attendance Statistics:</strong> In Extended view, each event card shows key statistics: Successful Scans, Failed Scans, Unique Attendees, and Total Scans. This gives you a quick overview without opening the records.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Exporting Attendance Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To export attendance records for an event:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the event in the events list</li>
                  <li>Click the "Export" button</li>
                  <li>The attendance data will be downloaded as a CSV file</li>
                  <li>The file includes: student name, email, scan timestamp, success status, failure reason, and booking status</li>
                  <li>Use the exported data in spreadsheet applications for further analysis or reporting</li>
                </ol>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Use Cases:</strong> Export data for university reporting, compliance audits, student progress tracking, or sharing with other departments.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 7: Understanding Attendance Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Each event shows four key statistics in Extended view:</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-semibold text-green-900">Successful Scans</p>
                    <p className="text-xs text-green-700">Number of successful attendance scans where the student was marked as attended</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-semibold text-red-900">Failed Scans</p>
                    <p className="text-xs text-red-700">Number of failed scans (e.g., outside scan window, not registered, already scanned)</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900">Unique Attendees</p>
                    <p className="text-xs text-blue-700">Number of unique students who successfully scanned the QR code</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-semibold text-purple-900">Total Scans</p>
                    <p className="text-xs text-purple-700">Total number of scan attempts (successful + failed)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BackIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Step 8: Navigating to QR Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">
                  From the Attendance Tracking page, you can easily navigate to QR code management:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Click the "Back to QR Codes" button at the top of the page</li>
                  <li>This takes you to the QR Code Management page</li>
                  <li>From there, you can generate, view, download, regenerate, or deactivate QR codes</li>
                </ol>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Integration:</strong> Attendance Tracking and QR Code Management are closely integrated. Events must have QR attendance enabled and a QR code generated before attendance can be tracked.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Attendance Tracking Best Practices</CardTitle>
                <CardDescription>Tips for effective attendance management</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Review attendance records regularly to identify patterns or issues early</li>
                  <li>Use filters to quickly find events by category, format, location, organizer, or speaker</li>
                  <li>Export attendance data periodically for record-keeping and reporting</li>
                  <li>Monitor failed scans to identify issues (e.g., scan window problems, registration issues)</li>
                  <li>Compare attendance rates across similar events to identify best practices</li>
                  <li>Use the Extended view for detailed analysis, Compact view for quick scanning</li>
                  <li>Sort events by date to review attendance chronologically</li>
                  <li>Check attendance statistics before and after events to ensure QR codes are working</li>
                  <li>Follow up with students who have low attendance rates</li>
                  <li>Use attendance data to inform event scheduling and planning</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
