"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Ticket, Clock, AlertCircle, CheckCircle, X } from "lucide-react";
import Link from "next/link";

export default function BookingEventsTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Booking Events</h1>
            <p className="text-xl text-gray-600">Step-by-step guide to booking your spot at teaching sessions</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ticket className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Find an Event with Booking Enabled
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Look for events that have the <strong>"Book Event"</strong> button visible. Not all events require booking - some are open attendance.
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> Events with limited capacity will show available spots. Book early to secure your place!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Click Book Event
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Click the <strong>"Book Event"</strong> button on the event details page. You'll see a confirmation dialog.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Success!</strong> Once booked, you'll receive a confirmation and the event will appear in your "My Bookings" page.
                  </p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                    <p className="text-sm text-gray-700">
                      <strong>Push Notifications:</strong> Enable push notifications in your profile to receive automatic reminders 24 hours and 1 hour before events, plus instant alerts when you're promoted from waitlist!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Understanding Booking Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Your booking can have different statuses:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Confirmed</p>
                      <p className="text-sm text-gray-600">Your spot is secured for the event</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Waitlist</p>
                      <p className="text-sm text-gray-600">Event is full, but you're on the waitlist if spots open. You'll receive a push notification if you're promoted to confirmed!</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <X className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Cancelled</p>
                      <p className="text-sm text-gray-600">You've cancelled your booking</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 4: Managing Your Booking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  After booking, you can:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>View all your bookings in the <strong>"My Bookings"</strong> page</li>
                  <li>Cancel a booking if your plans change (before the event deadline)</li>
                  <li>See booking details including date, time, and location</li>
                  <li>Access event resources once the event is available</li>
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
                  <Link href="/tutorials/student/my-bookings">
                    <Button variant="outline" size="sm">
                      Managing My Bookings →
                    </Button>
                  </Link>
                  <Link href="/tutorials/student/attendance-tracking">
                    <Button variant="outline" size="sm">
                      Marking Attendance →
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

