"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Filter, Search, UserPlus, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function TeachingRequestsTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Teaching Requests Management</h1>
            <p className="text-xl text-gray-600">Handle teaching session requests, assign educators, and manage scheduling</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Teaching Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Teaching Requests</strong> from the dashboard sidebar. This page shows all teaching session requests submitted by students.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> Students can request specific teaching sessions. You manage these requests, assign educators, and schedule sessions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Filter and Search Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Use filters to manage requests:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Status Filter</p>
                      <p className="text-sm text-gray-600">Filter by status: Pending, In Progress, Completed, or Rejected.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Search className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Search</p>
                      <p className="text-sm text-gray-600">Search by student name, email, topic, category, or format.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Category/Format</p>
                      <p className="text-sm text-gray-600">Filter requests by teaching category or format type.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Assign Educators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Assign educators to teaching requests:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Open a teaching request</li>
                  <li>Review the requested topic, category, and format</li>
                  <li>Select an appropriate educator from the assignment dropdown</li>
                  <li>Add notes about the assignment if needed</li>
                  <li>Update the request status to "In Progress"</li>
                </ol>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Tip:</strong> Consider educator expertise, availability, and workload when making assignments.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Manage Request Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Update request status throughout the workflow:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Pending → In Progress</p>
                      <p className="text-sm text-gray-600">Mark as "In Progress" when an educator is assigned and scheduling begins.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">In Progress → Completed</p>
                      <p className="text-sm text-gray-600">Mark as "Completed" when the teaching session has been delivered.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <XCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Reject Request</p>
                      <p className="text-sm text-gray-600">Reject requests that cannot be fulfilled, with an optional reason.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Create Events from Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">When a teaching request is approved:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Create a new event in the Event Data page</li>
                  <li>Use the request details to populate event information</li>
                  <li>Set the assigned educator as the organizer or speaker</li>
                  <li>Schedule the event based on student preferences if possible</li>
                  <li>Link the event to the original request if the system supports it</li>
                </ol>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Best Practice:</strong> Update the request status to "Completed" once the event is created and scheduled.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Request Information</CardTitle>
                <CardDescription>What students provide in teaching requests</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Requested topic or subject</li>
                  <li>Preferred category (e.g., Cardiology, Emergency Medicine)</li>
                  <li>Preferred format (e.g., Workshop, Lecture, Bedside Teaching)</li>
                  <li>Scheduling preferences (dates, times)</li>
                  <li>Additional notes or requirements</li>
                  <li>Contact information</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

