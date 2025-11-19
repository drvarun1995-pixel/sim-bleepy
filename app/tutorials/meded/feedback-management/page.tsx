"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, BarChart3, Filter, Search, Eye, Star, TrendingUp, Download, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function FeedbackManagementTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Feedback Management</h1>
            <p className="text-xl text-gray-600">View, analyze, and respond to student feedback on teaching events</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Feedback Responses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Feedback</strong> from the dashboard sidebar. This page shows all feedback responses submitted by students for events.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> The feedback management system allows you to view all student feedback, analyze ratings and comments, identify trends, and improve teaching delivery based on student input.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Filter and Search Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Use filters to find specific feedback:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Event Filter</p>
                      <p className="text-sm text-gray-600">Filter feedback by specific event. Select "All Events" to see feedback across all events.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Search className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Search</p>
                      <p className="text-sm text-gray-600">Search by student name, event title, or feedback form name.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Tip:</strong> Use the event filter to focus on feedback for a specific teaching session, or view all feedback to identify overall trends.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: View Feedback Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Each feedback response shows:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Student Information:</strong> Name and email of the student who submitted feedback</li>
                  <li><strong>Event Details:</strong> Event title, date, and time</li>
                  <li><strong>Form Information:</strong> Name of the feedback form used</li>
                  <li><strong>Completion Date:</strong> When the feedback was submitted</li>
                  <li><strong>Responses:</strong> All answers to feedback questions, including ratings and text comments</li>
                  <li><strong>Question Types:</strong> Rating questions (1-5 scale), text questions, and long text responses</li>
                </ul>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Anonymous Feedback:</strong> If a feedback form has anonymous mode enabled, student names may be hidden to protect privacy while still allowing you to see the feedback content.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Analyze Feedback Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">The feedback page provides comprehensive analytics:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Total Responses</p>
                      <p className="text-sm text-gray-600">Number of feedback responses received for the selected event(s).</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Star className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Average Rating</p>
                      <p className="text-sm text-gray-600">Average of all rating question responses (calculated from 1-5 scale ratings).</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <BarChart3 className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Rating Distribution</p>
                      <p className="text-sm text-gray-600">Breakdown showing how many responses received each rating (1, 2, 3, 4, or 5 stars).</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MessageCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Question Analytics</p>
                      <p className="text-sm text-gray-600">For each question, see average ratings (for rating questions) and all text responses (for text questions).</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Response Rate:</strong> The system calculates response rates based on event attendance, helping you understand how many students provided feedback.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Refresh and Update Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Use the refresh button to update the feedback data and analytics. This ensures you're viewing the most recent feedback responses and calculations.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Real-time Updates:</strong> Feedback responses are added as students submit them. Refresh the page to see new responses.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Export Feedback Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Export feedback data for external analysis or reporting:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Download feedback responses as CSV files</li>
                  <li>Export analytics data for detailed analysis</li>
                  <li>Generate reports for specific events or time periods</li>
                  <li>Share feedback summaries with educators or administrators</li>
                </ul>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Use Cases:</strong> Export data for annual reviews, teaching quality assessments, event improvement planning, and institutional reporting.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 7: Access Feedback Analytics Page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">For more detailed analytics, access the Feedback Analytics page:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>View analytics for specific time periods (7 days, 30 days, 90 days, 1 year)</li>
                  <li>Filter analytics by specific event</li>
                  <li>See total feedback forms created</li>
                  <li>View total responses and response rates</li>
                  <li>Analyze average ratings across all events</li>
                  <li>Compare feedback trends over time</li>
                </ul>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Analytics Features:</strong> The analytics page provides high-level insights across all events, while the feedback responses page shows individual responses and detailed question-level analytics.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Understanding Feedback Data</CardTitle>
                <CardDescription>What the different metrics mean</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900">Rating Questions</p>
                    <p className="text-sm text-blue-700">Questions that use a 1-5 star rating scale. The average rating is calculated from all rating question responses.</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-900">Text Questions</p>
                    <p className="text-sm text-green-700">Open-ended questions where students provide written feedback. All text responses are displayed for review.</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-yellow-900">Response Rate</p>
                    <p className="text-sm text-yellow-700">Percentage of event attendees who submitted feedback. Higher response rates indicate more comprehensive feedback data.</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="font-semibold text-purple-900">Question Analytics</p>
                    <p className="text-sm text-purple-700">For each question in the feedback form, you can see individual responses, average ratings (if applicable), and all text comments.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Best Practices</CardTitle>
                <CardDescription>Tips for effective feedback management</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Review feedback regularly to identify trends and areas for improvement</li>
                  <li>Focus on events with low ratings to understand what needs improvement</li>
                  <li>Read text comments for detailed insights beyond numerical ratings</li>
                  <li>Compare feedback across similar events to identify best practices</li>
                  <li>Share positive feedback with educators to recognize good teaching</li>
                  <li>Use analytics to track improvements over time</li>
                  <li>Export data for annual reviews and institutional reporting</li>
                  <li>Respond to specific feedback when appropriate to show students their input is valued</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
