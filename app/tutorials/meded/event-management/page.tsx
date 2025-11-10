"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Plus, Edit, Settings, FileText, Clock, Users, MapPin, Image } from "lucide-react";
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Event Data Page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Event Data</strong> from the dashboard sidebar. This is your central hub for all event management.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Quick Access:</strong> You can also use the "Add Event" button directly from the dashboard.
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
                <p className="text-gray-700 mb-4">Click "Add Event" and fill in the required information:</p>
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
                      <p className="text-sm text-gray-600">Start and end times for the session</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Location</p>
                      <p className="text-sm text-gray-600">Where the event will take place</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Categories & Formats</p>
                      <p className="text-sm text-gray-600">Select appropriate categories and format type</p>
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
                      <p className="text-sm text-gray-600">Use the rich text editor to add formatted content, images, tables, and more to your event description</p>
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
                <p className="text-gray-700 mb-4">Set up important event features:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Booking:</strong> Enable/disable booking and set capacity limits</li>
                  <li><strong>QR Attendance:</strong> Enable QR code scanning for attendance</li>
                  <li><strong>Feedback:</strong> Choose feedback templates and requirements</li>
                  <li><strong>Certificates:</strong> Configure automatic certificate generation</li>
                  <li><strong>Resources:</strong> Link downloadable materials to the event</li>
                </ul>
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
                <p className="text-gray-700">
                  To edit an event, go to the "All Events" tab, find your event, and click the edit button. You can modify:
                </p>
                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Basic Details</p>
                    <p className="text-xs text-gray-600">Title, description, featured image, date/time</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Settings</p>
                    <p className="text-xs text-gray-600">Booking, attendance, feedback</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Resources</p>
                    <p className="text-xs text-gray-600">Linked materials and files</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">Categories</p>
                    <p className="text-xs text-gray-600">Event categories and formats</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Important:</strong> Be careful when editing events that already have bookings. Consider notifying registered attendees of significant changes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 5: Publishing and Managing Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  After creating an event, you can:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Publish the event to make it visible to students</li>
                  <li>Save as draft to complete later</li>
                  <li>View event statistics and attendance</li>
                  <li>Manage bookings and waitlists</li>
                  <li>Export event data for reporting</li>
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

