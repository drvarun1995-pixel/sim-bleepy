"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, QrCode, Camera, CheckCircle, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function AttendanceTrackingTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Marking Attendance</h1>
            <p className="text-xl text-gray-600">Learn how to scan QR codes and mark your attendance at events</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access QR Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  When you arrive at an event, navigate to <strong>"Scan Attendance"</strong> from the sidebar or use the QR code scanner from your bookings page.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> You must be logged in and have a booking for the event to mark attendance.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Scan the QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Allow camera permissions when prompted</li>
                  <li>Point your device camera at the event's QR code</li>
                  <li>Hold steady until the code is recognized</li>
                  <li>The system will automatically process your attendance</li>
                </ol>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                    <p className="text-sm text-gray-700">
                      <strong>Tip:</strong> Ensure good lighting and hold the camera steady. If scanning fails, try moving closer or adjusting the angle.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Confirm Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  After successful scanning, you'll see a confirmation message showing:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Event name and date</li>
                  <li>Attendance marked successfully</li>
                  <li>Timestamp of your attendance</li>
                </ul>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Success!</strong> Your attendance has been recorded. This information is tracked by the MedEd Team and Administrators for educational records.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: View Your Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  You can view all your attendance records in the <strong>"My Attendance"</strong> page:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>See all events you've attended</li>
                  <li>View attendance timestamps</li>
                  <li>Track your attendance history</li>
                  <li>Export attendance records if needed</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle>Important Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  Your attendance at events is automatically tracked and monitored by the <strong>MedEd Team</strong> and <strong>Administrators</strong>. This information is used for educational records, certification, and compliance purposes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
                <CardDescription>Continue learning with these related tutorials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Link href="/tutorials/student/my-attendance">
                    <Button variant="outline" size="sm">
                      Viewing My Attendance →
                    </Button>
                  </Link>
                  <Link href="/tutorials/student/certificates">
                    <Button variant="outline" size="sm">
                      Accessing Certificates →
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

