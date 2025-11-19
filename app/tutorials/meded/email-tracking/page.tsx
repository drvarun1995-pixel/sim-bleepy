"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, History, Filter, Search, Eye, Download, RefreshCcw, Trash2, Users, CheckCircle, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function EmailTrackingTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Email Tracking & Logs</h1>
            <p className="text-xl text-gray-600">Monitor email delivery, track success rates, and manage email logs</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Email Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Track Emails</strong> from the dashboard sidebar under the Email section. This page shows all email sending activity.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Quick Access:</strong> You can also access this from the Send Email page using the "Track Emails" button.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Filter and Search Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Use the filters at the top of the page to find specific emails:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Scope Filter</p>
                      <p className="text-sm text-gray-600">Filter by recipient scope: All audiences, Selected users, or Role-based.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Sender Filter</p>
                      <p className="text-sm text-gray-600">Filter by the email sender. Select from a dropdown of all senders who have sent emails.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Status Filter</p>
                      <p className="text-sm text-gray-600">Filter by delivery status: All statuses, Successful only, or Failed only.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Date Range</p>
                      <p className="text-sm text-gray-600">Filter emails by when they were sent using Start Date and End Date fields.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Search className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Search</p>
                      <p className="text-sm text-gray-600">Search by subject, sender email, or recipient names. The search is case-insensitive and matches partial text.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Page Size</p>
                      <p className="text-sm text-gray-600">Control how many email logs are displayed per page: 10, 20, 30, or 50.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Reset Filters:</strong> Click the "Reset" button to clear all filters and return to the default view showing all emails.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: View Email Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Click the "View" button on any email log entry to open a detailed dialog with:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Eye className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Email Content</p>
                      <p className="text-sm text-gray-600">View the full email subject and body. Toggle between "Preview" (rendered HTML) and "HTML" (raw HTML code) views using the buttons at the top of the content area.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Recipients</p>
                      <p className="text-sm text-gray-600">See all recipients displayed as badges. For role-based emails, you'll see the roles. For selected users, you'll see names and email addresses.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Delivery Status</p>
                      <p className="text-sm text-gray-600">View total recipients, success count, and failure count. The status badge shows "Sent" (all successful) or "Failed" (some failures).</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Failed Recipients</p>
                      <p className="text-sm text-gray-600">If there were failures, see a list of failed recipient email addresses displayed as red badges, along with specific failure error messages explaining why each email failed.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Timestamps</p>
                      <p className="text-sm text-gray-600">See when the email was sent, displayed as a relative time (e.g., "2 hours ago") in the dialog header.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCcw className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Resend Failed Emails
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">
                  If an email had failed deliveries, you can resend it to only the failed recipients:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the email log entry with failures (it will show a "Failed" status badge and a red "Resend failed" button)</li>
                  <li>Click the "Resend failed" button in the Actions column</li>
                  <li>You'll be redirected to the Send Email page with the email form pre-filled</li>
                  <li>The subject and body content are pre-filled from the original email</li>
                  <li>Only the failed recipients are pre-selected in the recipient list</li>
                  <li>Review the content and recipients, then click "Send Email" to resend</li>
                </ol>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Only failed recipients are pre-selected when resending. You can modify the recipient list, subject, or body content if needed before sending. A banner at the top of the form shows how many failed recipients are being resent.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Export and Manage Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Additional actions available in the header buttons:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Download className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Export CSV</p>
                      <p className="text-sm text-gray-600">Download the currently visible email logs as a CSV file. The export includes: Date, Subject, Sender, Scope, and Recipients count. Useful for reporting and analysis in spreadsheet applications.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Trash2 className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Delete Logs</p>
                      <p className="text-sm text-gray-600">You can delete individual logs using the trash icon in the Actions column, or select multiple logs using checkboxes and click "Delete Selected". The "Clear All" button deletes all email logs. All deletions require typing "DELETE" to confirm and are permanent.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Bulk Selection</p>
                      <p className="text-sm text-gray-600">Use the checkboxes in the table to select multiple email logs. The master checkbox in the header selects/deselects all visible logs. Selected logs can be deleted in bulk.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Statistics:</strong> The page header shows total emails sent and total unique recipients across all logs, giving you a quick overview of email activity.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Understanding Email Status</CardTitle>
                <CardDescription>What the different statuses mean</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-900">Successful</p>
                    <p className="text-sm text-green-700">Email was successfully delivered to the recipient's inbox.</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-semibold text-red-900">Failed</p>
                    <p className="text-sm text-red-700">Email delivery failed. Common reasons include invalid email addresses, bounced emails, or server issues.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

