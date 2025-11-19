"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Award, Settings, CheckCircle, Users, FileImage, Mail, Download, Eye, Sparkles, Calendar } from "lucide-react";
import Link from "next/link";

export default function CertificatesGenerationTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Certificate Generation</h1>
            <p className="text-xl text-gray-600">Generate and manage certificates for event completion and attendance</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Certificate Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Generate Certificates</strong> from the dashboard sidebar. This page allows you to manually generate certificates for events or configure automatic certificate generation.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> Certificates are generated for students who attend events and complete required actions (attendance, feedback, etc.). Certificates can be generated manually or automatically based on event settings.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Select Event and Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Choose the event and certificate template:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Select Event</p>
                      <p className="text-sm text-gray-600">Choose the event for which you want to generate certificates. Use the search box to find events by title or date.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileImage className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Select Template</p>
                      <p className="text-sm text-gray-600">Choose a certificate template that defines the design and layout of the certificate. Templates are created in the Certificate Templates section.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Only events with booking enabled will appear in the event list. The system shows events from the event_booking_stats view.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Select Attendees
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Choose which attendees should receive certificates:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Include Attended</p>
                      <p className="text-sm text-gray-600">Generate certificates for all attendees who checked in (marked attendance) at the event.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Include Feedback Completed</p>
                      <p className="text-sm text-gray-600">Only generate certificates for attendees who completed feedback (if feedback is required for the event).</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Include All</p>
                      <p className="text-sm text-gray-600">Generate certificates for all attendees regardless of attendance or feedback status.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Custom Selection</p>
                      <p className="text-sm text-gray-600">Manually select specific attendees by checking the boxes next to their names.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Regenerate Existing:</strong> Check "Regenerate existing certificates" if you want to overwrite certificates that have already been generated for selected attendees.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Generate Certificates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Click "Generate Certificates" to create certificates:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>The system will validate the event, template, and attendee selection</li>
                  <li>For each selected attendee, a certificate PDF will be generated using the template</li>
                  <li>Certificates are stored in Supabase Storage with unique filenames</li>
                  <li>Certificate metadata is saved in the certificates table</li>
                  <li>You'll see a summary showing how many certificates were generated successfully</li>
                </ol>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Generation Results:</strong> The system shows success count, failed count, and skipped count (for attendees who already have certificates if regeneration is disabled).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Send Certificates via Email (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">After generating certificates, you can send them via email:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>After generation, a modal will appear showing generated certificates</li>
                  <li>Click "Send via Email" to email certificates to recipients</li>
                  <li>The system will send each certificate as an email attachment to the attendee's email address</li>
                  <li>Email sending status is tracked (sent, failed, error messages)</li>
                  <li>Certificates are also available for download from the certificates page</li>
                </ol>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Email Configuration:</strong> Certificates are sent using Microsoft Graph API. Ensure email is properly configured in your environment.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Configure Automatic Certificate Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">For automatic certificate generation, configure event settings:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Settings className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Enable Auto-Generation</p>
                      <p className="text-sm text-gray-600">In the event edit form, enable "Auto-generate certificates" and select a certificate template.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Require Feedback</p>
                      <p className="text-sm text-gray-600">Optionally require feedback completion before certificate generation. Set "Feedback required for certificate" and configure feedback deadline days.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Auto-Send Email</p>
                      <p className="text-sm text-gray-600">Enable "Auto-send certificate via email" to automatically email certificates when generated.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Automatic Generation Triggers:</strong> Certificates are automatically generated when events end (via cron job) or when attendees complete required actions (attendance, feedback) based on event settings.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-600" />
                  Step 7: View and Download Certificates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Certificates can be viewed and downloaded:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Student View:</strong> Students can view and download their certificates from the "My Certificates" page or event pages</li>
                  <li><strong>Admin View:</strong> Admins can view all certificates in the certificates management section</li>
                  <li><strong>Download:</strong> Click the download button to save certificate PDFs locally</li>
                  <li><strong>View:</strong> Click the view button to open certificates in a new tab</li>
                </ul>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Certificate Data:</strong> Each certificate includes event title, date, location, attendee name, certificate ID, and generation date. Template design determines the visual layout.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Certificate Requirements</CardTitle>
                <CardDescription>What's needed for certificate generation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900">Event Requirements</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 ml-2">
                      <li>Event must have booking enabled</li>
                      <li>Attendees must have bookings for the event</li>
                      <li>For automatic generation: Event must have ended (past end date/time)</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-900">Attendee Requirements</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-700 ml-2">
                      <li>Must have checked in (marked attendance) at the event</li>
                      <li>If feedback is required: Must have completed feedback</li>
                      <li>Must have a valid email address for email delivery</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-yellow-900">Template Requirements</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 ml-2">
                      <li>A certificate template must be selected</li>
                      <li>Template must be properly configured with design elements</li>
                      <li>Template must include required fields (attendee name, event title, date, etc.)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Best Practices</CardTitle>
                <CardDescription>Tips for effective certificate management</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Configure automatic certificate generation for events that require certificates</li>
                  <li>Set feedback requirements if you want to ensure students provide feedback before receiving certificates</li>
                  <li>Test certificate templates before using them for production events</li>
                  <li>Enable auto-send email to automatically deliver certificates to students</li>
                  <li>Review generated certificates to ensure they display correctly</li>
                  <li>Monitor certificate generation logs for any errors or failures</li>
                  <li>Use custom selection for special cases or manual certificate generation</li>
                  <li>Keep certificate templates updated with current branding and information</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
