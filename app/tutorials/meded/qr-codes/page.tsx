"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, QrCode, Download, CheckCircle, Smartphone, Printer, Search, Eye, RefreshCw, Trash2, Calendar, Clock, Users, AlertCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function QRCodesTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">QR Code Management</h1>
            <p className="text-xl text-gray-600">Generate and manage QR codes for event attendance tracking</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Understanding QR Codes for Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  QR codes provide a quick and efficient way for students to mark their attendance at events. Each event can have its own unique QR code that students scan using their mobile devices.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>How it works:</strong> When a student scans the QR code with their phone camera, they are automatically marked as attended for that specific event. This eliminates manual attendance taking and reduces errors. QR attendance works independently of booking - perfect for events with walk-ins or external attendees.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Enabling QR Codes for Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To enable QR code attendance for an event:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Navigate to the Event Data page</li>
                  <li>Create a new event or edit an existing event</li>
                  <li>In the event form, go to the "Attendance" section</li>
                  <li>Enable the "QR Code Attendance Tracking" checkbox</li>
                  <li>Save the event</li>
                </ol>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> QR codes are not automatically generated when you enable QR attendance. You need to generate them from the QR Code Management page.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Accessing QR Code Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To manage QR codes:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Navigate to <strong>QR Codes</strong> from the dashboard sidebar</li>
                  <li>The QR Code Management page shows all events with QR attendance enabled</li>
                  <li>You'll see events with and without QR codes</li>
                  <li>Use the search bar to find specific events</li>
                  <li>Use the status filter to view: All Events, With QR Code, Without QR Code, Active QR Codes, or Inactive QR Codes</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Generating QR Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To generate a QR code for an event:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Go to the QR Code Management page</li>
                  <li>Find the event that needs a QR code (events without QR codes will show "No QR Code" badge)</li>
                  <li>Click the "Generate QR Code" button</li>
                  <li>A dialog will open asking for scan window times (optional)</li>
                  <li>Scan window defaults to 30 minutes before event start to 1 hour after event end</li>
                  <li>You can customize the scan window start and end times</li>
                  <li>Click "Generate" to create the QR code</li>
                </ol>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Scan Window:</strong> The scan window defines when the QR code can be scanned. Outside this window, students cannot mark attendance. This helps prevent early or late scanning.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Viewing QR Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To view a QR code for an event:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Go to the QR Code Management page</li>
                  <li>Find the event with a QR code</li>
                  <li>Click the "View QR Code" button</li>
                  <li>This opens a dedicated QR code display page for that event</li>
                  <li>The QR code is displayed as a large scannable image</li>
                  <li>You'll see scan window information and scan count</li>
                  <li>The page shows real-time scan count updates</li>
                </ol>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Real-time Updates:</strong> The QR code display page shows live scan counts and attendee lists, updating automatically as students scan the code.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Downloading QR Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To download a QR code for printing or display:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>View the QR code for an event (click "View QR Code" button)</li>
                  <li>On the QR code display page, click the "Download QR Code" button</li>
                  <li>The QR code will download as a PNG image file</li>
                  <li>Print or display the QR code at the event venue</li>
                  <li>You can also use the fullscreen mode for displaying on screens or projectors</li>
                </ol>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Best Practice:</strong> Print QR codes in a large size (at least 4x4 inches) and place them in visible locations at the event entrance or registration desk. Ensure good lighting so students can easily scan them.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2 text-purple-600" />
                  Step 7: Regenerating QR Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To regenerate a QR code (creates a new one, deactivating the old):</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the event with an existing QR code</li>
                  <li>Click the "Regenerate QR Code" button</li>
                  <li>A dialog will open asking for new scan window times</li>
                  <li>Set the new scan window start and end times</li>
                  <li>Click "Regenerate" to create a new QR code</li>
                  <li>The old QR code will be deactivated and a new one created</li>
                </ol>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>When to Regenerate:</strong> Regenerate QR codes if you need to change the scan window, if the QR code was compromised, or if you need a fresh code for security reasons.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trash2 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 8: Deactivating QR Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To deactivate a QR code:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the event with an active QR code</li>
                  <li>Click the "Deactivate" button</li>
                  <li>Confirm the deactivation</li>
                  <li>The QR code will be marked as inactive and cannot be scanned</li>
                  <li>You can regenerate a new QR code later if needed</li>
                </ol>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Deactivating a QR code prevents further scans. Students who already scanned will have their attendance recorded, but new scans will not work.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
                  Step 9: Understanding QR Code Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">QR codes have different status badges:</p>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-900">No QR Code</p>
                    <p className="text-sm text-gray-600">Event has QR attendance enabled but no QR code has been generated yet.</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-semibold text-red-900">Inactive</p>
                    <p className="text-sm text-red-700">QR code exists but has been deactivated. Cannot be scanned.</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-yellow-900">Scheduled</p>
                    <p className="text-sm text-yellow-700">QR code exists but the scan window hasn't started yet.</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-900">Active</p>
                    <p className="text-sm text-green-700">QR code is active and can be scanned within the scan window.</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-900">Expired</p>
                    <p className="text-sm text-gray-600">QR code's scan window has ended. Cannot be scanned anymore.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="h-5 w-5 mr-2 text-purple-600" />
                  Step 10: How Students Scan QR Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Students can scan QR codes using their mobile devices:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Smartphone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Using Phone Camera</p>
                      <p className="text-sm text-gray-600">Most modern smartphones have built-in QR code scanning in their camera apps. Students open their camera, point it at the QR code, and tap the notification that appears.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Automatic Attendance</p>
                      <p className="text-sm text-gray-600">Once scanned, students are automatically marked as attended. They'll see a confirmation message, and the attendance is recorded immediately with a timestamp.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Scan Window Validation</p>
                      <p className="text-sm text-gray-600">The system checks if the current time is within the scan window. If outside the window, the scan will fail with an appropriate message.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 11: Monitoring QR Code Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">On the QR Code Management page, you can see:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Scan Count:</strong> Number of times the QR code has been scanned</li>
                  <li><strong>Event Details:</strong> Event title, date, time, and location</li>
                  <li><strong>Scan Window:</strong> When the QR code can be scanned</li>
                  <li><strong>Created Date:</strong> When the QR code was generated</li>
                  <li><strong>Status Badge:</strong> Visual indicator of QR code status (Active, Inactive, Scheduled, Expired)</li>
                </ul>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Real-time Monitoring:</strong> When viewing a QR code, the page shows real-time scan count updates and a list of attendees as they scan, helping you monitor attendance during the event.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>QR Code Best Practices</CardTitle>
                <CardDescription>Tips for effective QR code attendance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Generate QR codes well before the event date to allow time for printing</li>
                  <li>Set appropriate scan windows - allow some buffer time before and after the event</li>
                  <li>Test the QR code with your own device before the event</li>
                  <li>Print QR codes in a large size (at least 4x4 inches) for easy scanning</li>
                  <li>Place QR codes in visible, well-lit locations at the event</li>
                  <li>Print multiple copies for large events to avoid bottlenecks</li>
                  <li>Monitor scan counts in real-time during the event</li>
                  <li>Regenerate QR codes if they are compromised or need new scan windows</li>
                  <li>Deactivate QR codes after events to prevent unauthorized scanning</li>
                  <li>Use the fullscreen mode on the QR code display page for digital displays or projectors</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
