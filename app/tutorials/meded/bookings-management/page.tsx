"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Ticket, Users, CheckCircle, X, Clock, Download, Search } from "lucide-react";
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
                  Navigate to <strong>Bookings</strong> from the dashboard sidebar. This page shows all events with booking enabled and their booking status.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: View Event Bookings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Click on any event to view its bookings. You'll see:</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                      <p className="text-sm font-semibold text-gray-900">Confirmed Bookings</p>
                    </div>
                    <p className="text-xs text-gray-600">Students with secured spots</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                      <p className="text-sm font-semibold text-gray-900">Waitlist</p>
                    </div>
                    <p className="text-xs text-gray-600">Students waiting for spots</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <X className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-sm font-semibold text-gray-900">Cancelled</p>
                    </div>
                    <p className="text-xs text-gray-600">Cancelled bookings</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Users className="h-5 w-5 text-green-600 mr-2" />
                      <p className="text-sm font-semibold text-gray-900">Attended</p>
                    </div>
                    <p className="text-xs text-gray-600">Students who attended</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Manage Individual Bookings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">For each booking, you can:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>View Details:</strong> See student information and booking timestamp</li>
                  <li><strong>Cancel Booking:</strong> Cancel a booking with a reason (if needed)</li>
                  <li><strong>Move from Waitlist:</strong> Promote waitlisted students when spots open</li>
                  <li><strong>Mark Attendance:</strong> Manually mark attendance if QR scanning wasn't used</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Export Booking Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  You can export booking data for reporting and record-keeping:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Click the <strong>"Export"</strong> button on the bookings page</li>
                  <li>Choose export format (CSV/Excel)</li>
                  <li>Select date range if needed</li>
                  <li>Download the file with all booking information</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 5: Booking Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  The bookings page provides useful statistics:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Total bookings per event</li>
                  <li>Capacity utilization percentage</li>
                  <li>Waitlist length</li>
                  <li>Attendance rates</li>
                  <li>Booking trends over time</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
                <CardDescription>Continue learning with these related tutorials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Link href="/tutorials/meded/qr-codes">
                    <Button variant="outline" size="sm">
                      QR Code Generation →
                    </Button>
                  </Link>
                  <Link href="/tutorials/meded/attendance-tracking-admin">
                    <Button variant="outline" size="sm">
                      Attendance Tracking →
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

