"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, CheckCircle, Archive, Reply, Eye, EyeOff, Clock, Filter, Search, User, Calendar, Tag, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ContactMessagesTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Messages Management</h1>
            <p className="text-xl text-gray-600">Manage contact form submissions, respond to inquiries, and track message status</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Contact Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Contact Messages</strong> from the dashboard sidebar. This page shows all messages submitted through the contact form on your website.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> The contact messages system allows you to view, manage, and respond to inquiries from website visitors, students, and other users who submit messages through the contact form.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Filter and Search Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Use filters to organize and find messages:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Status Filter</p>
                      <p className="text-sm text-gray-600">Filter by status: All, New, Read, Replied, or Archived. This helps you prioritize unread messages and track which ones have been handled.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Category Filter</p>
                      <p className="text-sm text-gray-600">Filter messages by category (General Inquiry, Technical Support, Feedback, etc.) to group similar messages together.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Search className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Search</p>
                      <p className="text-sm text-gray-600">Search by sender name, email, subject, or message content to quickly find specific inquiries.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Tip:</strong> Start by filtering to "New" messages to see unread inquiries that need attention.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: View Message Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Click on any message to view full details:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Sender Information:</strong> Name and email address of the person who submitted the message</li>
                  <li><strong>Subject:</strong> Message subject line</li>
                  <li><strong>Category:</strong> Category classification of the message</li>
                  <li><strong>Message Content:</strong> Full text of the inquiry</li>
                  <li><strong>Status:</strong> Current status (New, Read, Replied, Archived)</li>
                  <li><strong>Timestamps:</strong> When the message was created, when it was read, and when it was replied to (if applicable)</li>
                  <li><strong>Admin Notes:</strong> Internal notes you've added about the message</li>
                </ul>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Message View:</strong> The detail view shows all message information in an organized layout, making it easy to understand the inquiry and respond appropriately.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Update Message Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Manage message workflow by updating status:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">New → Read</p>
                      <p className="text-sm text-gray-600">Mark as "Read" when you've reviewed the message. This moves it from the "New" filter and records when it was read.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Reply className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Read → Replied</p>
                      <p className="text-sm text-gray-600">Mark as "Replied" when you've responded to the inquiry. This records the reply timestamp and helps track response times.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Archive className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Archive</p>
                      <p className="text-sm text-gray-600">Archive messages that have been fully resolved and no longer need active attention. Archived messages can still be viewed but are filtered out of active lists.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Status Workflow:</strong> Messages typically flow from New → Read → Replied → Archived. Use status updates to track your progress in handling inquiries.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Add Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Add internal notes to messages for tracking:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Record actions taken to resolve the inquiry</li>
                  <li>Note follow-up requirements or next steps</li>
                  <li>Document communication with the sender</li>
                  <li>Add context or background information</li>
                  <li>Track resolution details for future reference</li>
                </ul>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Admin notes are only visible to administrators and MedEd team members. They are not visible to the message sender and are for internal tracking purposes only.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Reply className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Respond to Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To respond to a contact message:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>View the message details to understand the inquiry</li>
                  <li>Use the sender's email address (shown in message details) to send your response</li>
                  <li>You can use your email client or the platform's email sending feature</li>
                  <li>After responding, update the message status to "Replied"</li>
                  <li>Add admin notes documenting your response if needed</li>
                </ol>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Email Integration:</strong> You can use the "Send Email" feature in the dashboard to send responses directly from the platform, or use your external email client.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2 text-purple-600" />
                  Step 7: Refresh and Manage Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Additional management features:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <RefreshCw className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Refresh</p>
                      <p className="text-sm text-gray-600">Click the refresh button to reload messages and see the latest submissions.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Eye className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Show/Hide Archived</p>
                      <p className="text-sm text-gray-600">Toggle to show or hide archived messages in the list view.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Trash2 className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Delete Messages</p>
                      <p className="text-sm text-gray-600">Remove old or resolved messages permanently. Deletion is irreversible.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Message Status Guide</CardTitle>
                <CardDescription>Understanding the different statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-900">New</p>
                    <p className="text-sm text-gray-700">Message has been submitted but not yet reviewed. These are priority messages that need attention.</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900">Read</p>
                    <p className="text-sm text-blue-700">Message has been viewed and reviewed. The read timestamp is recorded.</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-900">Replied</p>
                    <p className="text-sm text-green-700">A response has been sent to the sender. The reply timestamp is recorded.</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-yellow-900">Archived</p>
                    <p className="text-sm text-yellow-700">Message has been resolved and archived. Archived messages are hidden from active lists by default.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Best Practices</CardTitle>
                <CardDescription>Tips for effective contact message management</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Check for new messages regularly to ensure timely responses</li>
                  <li>Use status updates to track your progress in handling inquiries</li>
                  <li>Add admin notes to document actions taken and follow-up requirements</li>
                  <li>Respond to messages promptly to maintain good user experience</li>
                  <li>Use categories to organize and prioritize different types of inquiries</li>
                  <li>Archive resolved messages to keep active lists focused</li>
                  <li>Use search to quickly find specific messages or inquiries</li>
                  <li>Filter by status to focus on messages that need attention</li>
                  <li>Document complex inquiries in admin notes for future reference</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
