"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BarChart3, TrendingUp, Download, Filter, Users, FileText, Calendar, RefreshCw, Clock, User, Trash2 } from "lucide-react";
import Link from "next/link";

export default function AnalyticsTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Analytics & Reports</h1>
            <p className="text-xl text-gray-600">Access comprehensive platform analytics, user activity, and download statistics</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Analytics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Analytics</strong> from the dashboard sidebar. This page provides comprehensive insights into platform usage, user activity, and resource downloads.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Access:</strong> Only admins and MedEd team members can access the analytics dashboard. The page shows real-time and historical data about platform usage.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: View User Activity Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">The analytics dashboard shows comprehensive user activity data:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Total Users</p>
                      <p className="text-sm text-gray-600">Total number of registered users on the platform.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Active Users Today</p>
                      <p className="text-sm text-gray-600">Number of users who logged in today, indicating daily engagement.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">User Details</p>
                      <p className="text-sm text-gray-600">For each user, see email, name, role, account creation date, last login, login count, email verification status, and activity metrics.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Activity Metrics</p>
                      <p className="text-sm text-gray-600">Track total attempts (e.g., AI simulator attempts), average scores, and other engagement metrics per user.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: View Download Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Track resource download activity:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Download className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Total Downloads</p>
                      <p className="text-sm text-gray-600">Total number of resource downloads across all users and resources.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Downloads Today</p>
                      <p className="text-sm text-gray-600">Number of downloads that occurred today, showing daily resource usage.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Download Details</p>
                      <p className="text-sm text-gray-600">For each download, see resource name, user who downloaded, download timestamp, file size, and file type.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Resource Analytics:</strong> Download statistics help identify which resources are most popular and useful to students, informing resource management decisions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Filter and Sort Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Use filters and sorting to analyze data:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Date Filter</p>
                      <p className="text-sm text-gray-600">Filter user activity and downloads by date range (last 7 days, 30 days, 90 days, or all time).</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">User Filter</p>
                      <p className="text-sm text-gray-600">Search and filter users by name or email to view specific user activity.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Sort Options</p>
                      <p className="text-sm text-gray-600">Sort users by last login, login count, account creation date, or other metrics to identify patterns.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: View Charts and Visualizations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">The analytics dashboard includes visual charts:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>User Activity Charts:</strong> Visual representations of user login trends over time</li>
                  <li><strong>Download Trends:</strong> Charts showing download activity patterns</li>
                  <li><strong>Role Distribution:</strong> Pie charts or bar charts showing user distribution by role</li>
                  <li><strong>Time-based Analysis:</strong> Line charts showing activity trends over selected time periods</li>
                </ul>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Visual Insights:</strong> Charts help identify trends, peak usage times, and patterns in platform engagement that may not be obvious from raw data.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Export Analytics Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Export data for external analysis:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Export user activity data as CSV files</li>
                  <li>Export download statistics for reporting</li>
                  <li>Generate reports for specific time periods</li>
                  <li>Share analytics data with stakeholders</li>
                </ul>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Use Cases:</strong> Export data for annual reports, usage analysis, resource planning, institutional reporting, and identifying trends for platform improvements.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2 text-purple-600" />
                  Step 7: Refresh and Update Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Use the refresh button to update analytics data with the latest information. This ensures you're viewing current statistics and activity metrics.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Real-time Updates:</strong> Analytics data is updated as users interact with the platform. Refresh to see the latest activity and statistics.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trash2 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 8: Manage Analytics Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Additional data management options:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Trash2 className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Clear User Login Data</p>
                      <p className="text-sm text-gray-600">Clear login tracking data for individual users or all users. This resets login counts and last login timestamps.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Warning:</strong> Clearing login data is permanent and cannot be undone. Use this feature carefully, typically for data privacy compliance or resetting analytics.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Analytics Metrics Explained</CardTitle>
                <CardDescription>Understanding the key metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900">Total Users</p>
                    <p className="text-sm text-blue-700">All registered users on the platform, regardless of activity level.</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-900">Active Users Today</p>
                    <p className="text-sm text-green-700">Users who logged in today, indicating daily platform engagement.</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-yellow-900">Login Count</p>
                    <p className="text-sm text-yellow-700">Total number of times a user has logged into the platform, showing engagement level.</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="font-semibold text-purple-900">Last Login</p>
                    <p className="text-sm text-purple-700">Most recent login timestamp, helping identify active vs. inactive users.</p>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                    <p className="font-semibold text-pink-900">Download Statistics</p>
                    <p className="text-sm text-pink-700">Tracks which resources are downloaded, by whom, and when, providing insights into resource popularity and usage patterns.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Best Practices</CardTitle>
                <CardDescription>Tips for effective analytics usage</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Review analytics regularly to understand platform usage patterns</li>
                  <li>Use date filters to analyze trends over specific time periods</li>
                  <li>Identify inactive users who may need re-engagement</li>
                  <li>Track download statistics to understand which resources are most valuable</li>
                  <li>Export data for external analysis and reporting</li>
                  <li>Use charts to visualize trends and patterns</li>
                  <li>Compare metrics across different time periods to measure growth</li>
                  <li>Share insights with team members to inform platform improvements</li>
                  <li>Monitor active users daily to track engagement</li>
                  <li>Use analytics to identify areas for platform enhancement</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
