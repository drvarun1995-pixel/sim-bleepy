"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mic, Plus, Edit, Trash2, Search, Users } from "lucide-react";
import Link from "next/link";

export default function SpeakersManagementTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Managing Event Speakers</h1>
            <p className="text-xl text-gray-600">Create, edit, and organize event speakers who deliver teaching content</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mic className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Speakers Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Speakers are managed from the <strong>Event Data</strong> page. Navigate to Event Data from the dashboard sidebar, then click on <strong>Speakers</strong> in the sidebar menu.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> Speakers are people who deliver content at events (e.g., "Dr. Sarah Smith", "Prof. John Doe"). Events can have multiple speakers. Speakers help identify who is presenting or teaching at each session.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Creating New Speakers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To create a new speaker:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Go to the Event Data page and select "Speakers" from the sidebar</li>
                  <li>Fill in the speaker name (required) - e.g., "Dr. Sarah Smith", "Prof. John Doe"</li>
                  <li>The name should match how you want the speaker to appear on events</li>
                  <li>Click "Add New Speaker" to save</li>
                </ol>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Speaker Names:</strong> Use full names with titles (Dr., Prof., etc.) for clarity. Consistent naming helps students identify speakers across events.
                  </p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Speakers are separate from organizers. A speaker delivers content, while an organizer coordinates the event. The same person can be both a speaker and an organizer for an event.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Editing Existing Speakers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To modify a speaker:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the speaker in the speakers list</li>
                  <li>Click the edit button (pencil icon)</li>
                  <li>Update the speaker name</li>
                  <li>Click "Save" to apply changes</li>
                </ol>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Changes to speaker names will be reflected in all events using that speaker. Be careful when changing names as this affects event displays.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trash2 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Deleting Speakers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To delete speakers:</p>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-1">Individual Deletion</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Find the speaker in the list</li>
                      <li>Click the delete button (trash icon)</li>
                      <li>Confirm the deletion</li>
                    </ol>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-1">Bulk Deletion</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Select multiple speakers using checkboxes</li>
                      <li>Click "Delete Selected" button</li>
                      <li>Confirm the bulk deletion</li>
                    </ol>
                  </div>
                </div>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Warning:</strong> Check the usage count before deleting. Speakers in use by events should not be deleted. You may need to reassign events to other speakers first. Deleting a speaker will remove them from all associated events.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Using Speakers in Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">When creating or editing events:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Select one or more speakers from the speakers dropdown (or type names to create new ones)</li>
                  <li>Events can have multiple speakers for sessions with multiple presenters</li>
                  <li>Speakers are displayed on event pages and in event lists</li>
                  <li>Students can see speaker information when viewing event details</li>
                  <li>Speakers help identify who is delivering content at each event</li>
                  <li>Events can be filtered by speaker in event lists and attendance tracking</li>
                  <li>All speakers are displayed equally (unlike organizers which have main/additional distinction)</li>
                </ul>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Multiple Speakers:</strong> Events can have multiple speakers, which is useful for panel discussions, workshops with multiple instructors, or events with multiple presentations.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Finding and Organizing Speakers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Tips for managing your speakers list:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Use the search function to quickly find speakers by name</li>
                  <li>Keep speaker names consistent (use full names with titles)</li>
                  <li>Regularly review and consolidate duplicate speakers</li>
                  <li>Check usage counts to identify frequently used speakers</li>
                  <li>Remove inactive or unused speakers to keep the list clean</li>
                  <li>Use consistent formatting (e.g., always include titles like "Dr." or "Prof.")</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Speaker Best Practices</CardTitle>
                <CardDescription>Tips for effective speaker management</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Use full names with professional titles (Dr., Prof., etc.) for clarity</li>
                  <li>Keep speaker names consistent across all events</li>
                  <li>Create speakers before creating events to ensure consistency</li>
                  <li>Use the same speaker name format throughout (e.g., always "Dr. First Last" or always "First Last, MD")</li>
                  <li>Regularly review and consolidate duplicate speakers with similar names</li>
                  <li>Check usage counts before deleting to ensure speakers aren't in use</li>
                  <li>Distinguish between speakers and organizers (they can be the same person but serve different roles)</li>
                  <li>Keep the number of speakers manageable (consolidate when possible)</li>
                  <li>Use search to quickly find speakers when assigning to events</li>
                  <li>Maintain a clean speakers list by removing unused entries</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

