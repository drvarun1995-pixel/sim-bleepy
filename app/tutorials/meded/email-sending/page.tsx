"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Users, Search, Filter, FileText, Image, Save } from "lucide-react";
import Link from "next/link";

export default function EmailSendingTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Sending Custom Emails</h1>
            <p className="text-xl text-gray-600">Complete guide to sending targeted emails to users and groups</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Email Console
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Send Email</strong> from the dashboard sidebar under the Email section. This is your email management console.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Quick Access:</strong> You can also access this from the dashboard email section.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Select Recipients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Choose who should receive your email using the Recipient Scope dropdown:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Selected Users (max 50)</p>
                      <p className="text-sm text-gray-600">Manually select individual users from the available users list. You can select up to 50 users at a time. Use the search box to find users by name or email, and apply profile filters to narrow down the list.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">By Role</p>
                      <p className="text-sm text-gray-600">Send to all users with a specific role. Select one or more roles: Admin, MedEd Team, Educator, CTF, or Student. All users with the selected role(s) will receive the email.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">All Active Users</p>
                      <p className="text-sm text-gray-600">Send to everyone on the platform who has an active account.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Profile Filters:</strong> When using "Selected Users", you can apply profile filters to narrow down the user list. Filters include: ARU/UCL universities, study years (Year 1-6), foundation years (FY1, FY2), and other profile types. You can also use the search box to find users by name or email address.
                  </p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Select All:</strong> When viewing filtered users, you can click "Select all" to quickly add all visible users to your recipient list (up to the 50 user limit).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Compose Email Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Create your email message:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Subject Line</p>
                      <p className="text-sm text-gray-600">Enter a clear, descriptive subject that summarizes your message.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Rich Text Editor</p>
                      <p className="text-sm text-gray-600">Use the TipTap editor to format your email with headings, lists, links, tables, and more.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Image className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Add Images</p>
                      <p className="text-sm text-gray-600">Upload images directly in the editor. Images are automatically optimized and stored securely.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Save className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Insert Signature</p>
                      <p className="text-sm text-gray-600">Click the signature button (pen icon) next to the "Add Image" button in the editor toolbar. A dialog will show your saved signature preview. Click "Insert Signature" to add it at your cursor position.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Send Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">
                  Once you've composed your email and selected recipients, click the <strong>"Send Email"</strong> button at the bottom of the Email Content card. The system will:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Validate the email subject and body content</li>
                  <li>Validate all recipient email addresses</li>
                  <li>Send emails to all selected recipients via Microsoft Graph API</li>
                  <li>Track delivery success and failures for each recipient</li>
                  <li>Create a log entry in the Email Activity page with full details</li>
                  <li>Clear the form and reset for the next email</li>
                </ol>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Success Tracking:</strong> After sending, you'll see a success message showing how many recipients received the email. You can then navigate to the "Track Emails" page (or click the "Track Emails" button in the header) to view detailed delivery status, success rates, failed recipients, and failure messages.
                  </p>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Resending Failed Emails:</strong> If some emails fail to send, you can resend them by going to the Email Activity page, finding the email log, and clicking "Resend failed". This will pre-fill the email form with only the failed recipients selected.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Best Practices</CardTitle>
                <CardDescription>Tips for effective email communication</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Use clear, action-oriented subject lines</li>
                  <li>Keep messages concise and well-formatted</li>
                  <li>Test with a small group before sending to all users</li>
                  <li>Use profile filters to target specific student groups</li>
                  <li>Include your signature for professional communication</li>
                  <li>Check email logs regularly to monitor delivery success</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

