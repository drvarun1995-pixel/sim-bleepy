"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Ticket, Calendar, X, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function MyBookingsTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Managing My Bookings</h1>
            <p className="text-xl text-gray-600">How to view, manage, and cancel your event bookings</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ticket className="h-5 w-5 mr-2 text-purple-600" />
                  Accessing My Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Navigate to <strong>"My Bookings"</strong> from the sidebar to see all your registered events.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Viewing Booking Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">Each booking shows:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Event title, date, and time</li>
                  <li>Location and format</li>
                  <li>Booking status (confirmed, waitlist, cancelled)</li>
                  <li>QR code for attendance (if available)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <X className="h-5 w-5 mr-2 text-purple-600" />
                  Cancelling Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">To cancel a booking, click the cancel button and provide a reason. This frees up your spot for others.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

