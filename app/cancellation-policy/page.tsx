'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Clock, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CancellationPolicyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Event Cancellation Policy
            </h1>
            <p className="text-xl text-gray-600">
              Important information about cancelling your event registrations
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* General Policy */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                General Cancellation Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                We understand that circumstances change, and you may need to cancel your event registration. 
                We strive to make the cancellation process as simple and flexible as possible while ensuring 
                fair access for all users.
              </p>
              <p className="text-gray-700 leading-relaxed">
                When you register for an event, you agree to attend. If you can no longer attend, please cancel 
                your booking as soon as possible to allow others on the waitlist to take your spot.
              </p>
            </CardContent>
          </Card>

          {/* Event-Specific Deadlines */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Clock className="h-5 w-5 text-orange-600" />
                Event-Specific Cancellation Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-orange-900 font-semibold mb-2">
                  Important: Each event may have its own cancellation deadline
                </p>
                <p className="text-orange-800">
                  Specific cancellation deadlines vary by event and are set at the time of booking. 
                  Please check your booking confirmation or "My Bookings" page for the exact deadline for each event.
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Some events may restrict cancellations within a certain timeframe before the event start time 
                (e.g., 24 hours, 48 hours). This is to ensure adequate planning for event organizers and to 
                maintain fair access for other attendees.
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Common cancellation periods:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Free cancellation anytime (some events)</li>
                  <li>Cancellation up to 24 hours before event</li>
                  <li>Cancellation up to 48 hours before event</li>
                  <li>Cancellation up to 1 week before event (for large-scale events)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How to Cancel */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <CheckCircle className="h-5 w-5 text-green-600" />
                How to Cancel Your Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li className="leading-relaxed">
                  <span className="font-semibold">Navigate to "My Bookings"</span> - Access your bookings dashboard from the main navigation menu
                </li>
                <li className="leading-relaxed">
                  <span className="font-semibold">Find your booking</span> - Locate the event you wish to cancel
                </li>
                <li className="leading-relaxed">
                  <span className="font-semibold">Click "Cancel Booking"</span> - Click the cancel button for that specific booking
                </li>
                <li className="leading-relaxed">
                  <span className="font-semibold">Provide a reason (if requested)</span> - Some events may ask for a cancellation reason to help improve future events
                </li>
                <li className="leading-relaxed">
                  <span className="font-semibold">Confirm cancellation</span> - Review and confirm your cancellation
                </li>
              </ol>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <p className="text-green-900">
                  You will receive a confirmation once your cancellation is processed. If the event has a waitlist, 
                  the next person will be automatically notified.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Refund Policy */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg">
              <CardTitle className="text-gray-900">
                Refund Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-700 leading-relaxed">
                All events on this platform are currently free to attend. As such, there are no refunds applicable 
                to event registrations. However, we do track attendance and cancellation patterns to ensure fair 
                access for all users.
              </p>
            </CardContent>
          </Card>

          {/* No-Show Policy */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <AlertCircle className="h-5 w-5 text-red-600" />
                No-Show Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                If you register for an event and do not attend without cancelling your booking, you will be 
                marked as a "no-show." Multiple no-shows may affect your ability to register for future events.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Please be respectful of other attendees and event organizers by cancelling your booking if you 
                cannot attend, even if it's past the cancellation deadline. Last-minute cancellations are better 
                than no-shows.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Mail className="h-5 w-5 text-purple-600" />
                Questions or Special Circumstances?
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about our cancellation policy or need assistance with a specific booking, 
                please contact us:
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-purple-900">
                  <strong>Support Team:</strong> For general inquiries, please contact your event organizer or 
                  reach out through the platform's support channels.
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We will do our best to accommodate special circumstances on a case-by-case basis.
              </p>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-500 pt-4">
            <p>Last updated: October 17, 2025</p>
            <p className="mt-2">
              This policy may be updated from time to time. Please check back regularly for any changes.
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <Button 
            onClick={() => router.push('/my-bookings')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            View My Bookings
          </Button>
        </div>
      </div>
    </div>
  )
}



