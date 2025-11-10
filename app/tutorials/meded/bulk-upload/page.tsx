"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from "lucide-react";
import Link from "next/link";

export default function BulkUploadTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Bulk Event Upload</h1>
            <p className="text-xl text-gray-600">Learn how to upload multiple events using Excel/CSV files</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Bulk Upload Page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Smart Bulk Upload</strong> from the dashboard sidebar. This feature allows you to upload multiple events at once.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSpreadsheet className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Prepare Your Excel/CSV File
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Your file should include these columns:</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li><strong>Title:</strong> Event title</li>
                    <li><strong>Date:</strong> Event date (YYYY-MM-DD format)</li>
                    <li><strong>Start Time:</strong> Start time (HH:MM format)</li>
                    <li><strong>End Time:</strong> End time (HH:MM format)</li>
                    <li><strong>Description:</strong> Event description</li>
                    <li><strong>Location:</strong> Event location</li>
                    <li><strong>Category:</strong> Event category</li>
                    <li><strong>Format:</strong> Event format type</li>
                  </ul>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Tip:</strong> Download the template file from the bulk upload page to ensure correct formatting.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Upload Your File
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Click the <strong>"Choose File"</strong> or <strong>"Upload"</strong> button</li>
                  <li>Select your prepared Excel or CSV file</li>
                  <li>Wait for the file to be processed</li>
                  <li>Review the preview of events that will be created</li>
                </ol>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                    <p className="text-sm text-gray-700">
                      <strong>Important:</strong> Review the preview carefully before confirming. Check for any errors or missing information.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Review and Confirm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  The system will show you a preview of all events that will be created. Review:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Event titles and descriptions</li>
                  <li>Dates and times</li>
                  <li>Locations and categories</li>
                  <li>Any validation errors or warnings</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  If everything looks correct, click <strong>"Confirm Upload"</strong> to create all events.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 5: Post-Upload Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  After successful upload:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>All events will be created and visible in the Event Data page</li>
                  <li>You can edit individual events if needed</li>
                  <li>Configure additional settings like booking, QR codes, and feedback</li>
                  <li>Link resources to events as appropriate</li>
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
                  <Link href="/tutorials/meded/event-management">
                    <Button variant="outline" size="sm">
                      Event Management →
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

