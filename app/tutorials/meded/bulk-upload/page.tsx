"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Sparkles, Filter, Edit, Trash2, Save } from "lucide-react";
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Smart Bulk Event Upload</h1>
            <p className="text-xl text-gray-600">Learn how to upload multiple events using AI-powered extraction from Excel, PDF, or Word files</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Smart Bulk Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Smart Bulk Upload</strong> from the dashboard sidebar or from the Event Data page. This feature uses AI (OpenAI GPT-4) to automatically extract event information from documents.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Quick Access:</strong> You can also access this from the Events page using the "Smart Bulk Upload" button, or directly via <code className="bg-white px-2 py-1 rounded">/bulk-upload-ai</code>.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSpreadsheet className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Prepare Your File
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">The system supports multiple file formats:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <FileSpreadsheet className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Excel Files (.xlsx, .xls)</p>
                      <p className="text-sm text-gray-600">Most common format. Include columns for event title, date, time, location, speakers, etc.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileSpreadsheet className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">PDF Files (.pdf)</p>
                      <p className="text-sm text-gray-600">The AI will extract text from PDF documents containing event schedules or lists.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileSpreadsheet className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Word Documents (.docx, .doc)</p>
                      <p className="text-sm text-gray-600">Word documents with event information in any format.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>File Requirements:</strong> Maximum file size is 10MB. The AI works best with clearly structured data, but can handle various formats and layouts.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Configure Bulk Options (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Before uploading, you can set bulk options that will apply to all extracted events:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Bulk Categories</p>
                      <p className="text-sm text-gray-600">Select one or more categories to apply to all events if not specified in the document.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Bulk Format</p>
                      <p className="text-sm text-gray-600">Set a default format (e.g., Workshop, Lecture) for all events.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Bulk Location</p>
                      <p className="text-sm text-gray-600">Set a main location and additional locations for all events.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Bulk Organizer</p>
                      <p className="text-sm text-gray-600">Set a main organizer and additional organizers for all events.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Bulk Speakers</p>
                      <p className="text-sm text-gray-600">Select speakers to add to all events.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Bulk Description</p>
                      <p className="text-sm text-gray-600">Add a common description to all events.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Additional AI Prompt:</strong> You can provide custom instructions to the AI (e.g., "Extract only events from October 2025" or "Assign 'Varun' as default speaker for all events").
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Upload and Process File
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Upload your file and let the AI extract events:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Drag and drop your file or click to select it</li>
                  <li>The system will check for email addresses in the file (for GDPR compliance)</li>
                  <li>If emails are found, you'll see a warning with options to skip or auto-delete them</li>
                  <li>Click "Process File" to start AI extraction (takes 5-30 seconds)</li>
                  <li>The AI will extract event titles, dates, times, descriptions, and match locations/speakers from your database</li>
                </ol>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                    <p className="text-sm text-gray-700">
                      <strong>Email Detection:</strong> The system automatically detects email addresses in your file. You can choose to auto-delete them for privacy, or skip and handle manually. A 30-second countdown will auto-process with email deletion if you don't respond.
                    </p>
                  </div>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>AI Matching:</strong> The AI intelligently matches location and speaker names from your document to existing entries in your database. It only includes names that exist in your database.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Review and Edit Extracted Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">After processing, you'll see all extracted events in a review interface:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Edit className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Edit Individual Events</p>
                      <p className="text-sm text-gray-600">Click the edit button on any event card to modify title, date, time, description, locations, speakers, organizers, categories, or format.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Trash2 className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Delete Unwanted Events</p>
                      <p className="text-sm text-gray-600">Remove events that shouldn't be created by clicking the delete button.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Validation Indicators</p>
                      <p className="text-sm text-gray-600">Events with all required fields (title, date, start time, end time) are marked as valid. Invalid events cannot be created until fixed.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Dropdown Selectors</p>
                      <p className="text-sm text-gray-600">Use dropdown menus to select locations, speakers, organizers, categories, and formats from your existing database entries.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Summary Statistics:</strong> The review page shows how many events are valid vs. total extracted, helping you identify what needs attention.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Confirm and Create Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Once you've reviewed and edited all events:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Ensure all events you want to create are valid (have required fields)</li>
                  <li>Click the <strong>"Create All Events"</strong> button</li>
                  <li>The system will create all valid events in your database</li>
                  <li>You'll see a success message with the number of events created</li>
                </ol>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Success:</strong> All created events will be immediately visible in the Event Data page. You can then configure additional settings like booking, QR codes, feedback, and certificates for each event.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                  How AI Extraction Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">The AI (OpenAI GPT-4o) extracts the following information:</p>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-1">What Gets Extracted</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 ml-2">
                      <li>Event titles (removes format prefixes like "Core Teaching:", "Twilight Teaching:")</li>
                      <li>Dates (converted to YYYY-MM-DD format)</li>
                      <li>Start and end times (converted to HH:MM format, handles decimal times)</li>
                      <li>Descriptions (generated based on title and context)</li>
                      <li>Speakers (matched to existing database entries)</li>
                      <li>Organizers (matched to existing database entries, main organizer identified)</li>
                      <li>Categories (matched to existing database entries)</li>
                      <li>Locations (matched to existing database entries)</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-900 mb-1">Smart Matching</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-700 ml-2">
                      <li>Only includes names that exist in your database</li>
                      <li>Performs case-insensitive matching</li>
                      <li>Skips names that don't match any database entries</li>
                      <li>Returns empty arrays if no matches found</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-yellow-900 mb-1">What Doesn't Get Created</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 ml-2">
                      <li>The AI does NOT create new locations, speakers, organizers, categories, or formats</li>
                      <li>It only matches to existing entries in your database</li>
                      <li>This ensures data consistency and prevents duplicates</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Best Practices</CardTitle>
                <CardDescription>Tips for successful bulk uploads</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Use clear, structured documents with consistent formatting</li>
                  <li>Include location and speaker names that match your database exactly</li>
                  <li>Use bulk options to set common values for all events</li>
                  <li>Always review extracted events before confirming</li>
                  <li>Fix any validation errors before creating events</li>
                  <li>Use the additional AI prompt for specific extraction requirements</li>
                  <li>Remove email addresses from files before uploading for privacy</li>
                  <li>Test with a small file first to understand the extraction process</li>
                  <li>Ensure your OpenAI API key is configured for AI extraction to work</li>
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
                  <Link href="/tutorials/meded/formats-management">
                    <Button variant="outline" size="sm">
                      Formats Management →
                    </Button>
                  </Link>
                  <Link href="/tutorials/meded/categories-management">
                    <Button variant="outline" size="sm">
                      Categories Management →
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
