"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UserCircle, Plus, Edit, Trash2, Search, Users } from "lucide-react";
import Link from "next/link";

export default function OrganizersManagementTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Managing Event Organizers</h1>
            <p className="text-xl text-gray-600">Create, edit, and organize event organizers who coordinate and manage teaching sessions</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCircle className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Organizers Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Organizers are managed from the <strong>Event Data</strong> page. Navigate to Event Data from the dashboard sidebar, then click on <strong>Organizers</strong> in the sidebar menu.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> Organizers are people who coordinate and manage events (e.g., "Dr. Sarah Smith", "Prof. John Doe"). Events can have one main organizer and multiple additional organizers. Organizers help identify who is responsible for each teaching session.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Creating New Organizers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To create a new organizer:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Go to the Event Data page and select "Organizers" from the sidebar</li>
                  <li>Fill in the organizer name (required) - e.g., "Dr. Sarah Smith", "Prof. John Doe"</li>
                  <li>The name should match how you want the organizer to appear on events</li>
                  <li>Click "Add New Organizer" to save</li>
                </ol>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Organizer Names:</strong> Use full names with titles (Dr., Prof., etc.) for clarity. Consistent naming helps students identify organizers across events.
                  </p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Organizers are separate from speakers. An organizer coordinates the event, while a speaker delivers content. The same person can be both an organizer and a speaker for an event.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Editing Existing Organizers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To modify an organizer:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the organizer in the organizers list</li>
                  <li>Click the edit button (pencil icon)</li>
                  <li>Update the organizer name</li>
                  <li>Click "Save" to apply changes</li>
                </ol>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Changes to organizer names will be reflected in all events using that organizer. Be careful when changing names as this affects event displays.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trash2 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Deleting Organizers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To delete organizers:</p>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-1">Individual Deletion</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Find the organizer in the list</li>
                      <li>Click the delete button (trash icon)</li>
                      <li>Confirm the deletion</li>
                    </ol>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-1">Bulk Deletion</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Select multiple organizers using checkboxes</li>
                      <li>Click "Delete Selected" button</li>
                      <li>Confirm the bulk deletion</li>
                    </ol>
                  </div>
                </div>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Warning:</strong> Check the usage count before deleting. Organizers in use by events should not be deleted. You may need to reassign events to other organizers first. Deleting an organizer will remove them from all associated events.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Using Organizers in Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">When creating or editing events:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Select a main organizer from the organizer dropdown (or type a name to create a new one)</li>
                  <li>You can add multiple additional organizers for events with multiple coordinators</li>
                  <li>Organizers are displayed on event pages and in event lists</li>
                  <li>Students can see organizer information when viewing event details</li>
                  <li>Organizers help identify who is responsible for coordinating each event</li>
                  <li>Events can be filtered by organizer in event lists and attendance tracking</li>
                  <li>The main organizer is prominently displayed, with additional organizers shown as supporting coordinators</li>
                </ul>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Main vs. Additional Organizers:</strong> Events have one main organizer (the primary coordinator) and can have multiple additional organizers (supporting coordinators). This distinction helps identify primary responsibility.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Finding and Organizing Organizers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Tips for managing your organizers list:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Use the search function to quickly find organizers by name</li>
                  <li>Keep organizer names consistent (use full names with titles)</li>
                  <li>Regularly review and consolidate duplicate organizers</li>
                  <li>Check usage counts to identify frequently used organizers</li>
                  <li>Remove inactive or unused organizers to keep the list clean</li>
                  <li>Use consistent formatting (e.g., always include titles like "Dr." or "Prof.")</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Organizer Best Practices</CardTitle>
                <CardDescription>Tips for effective organizer management</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Use full names with professional titles (Dr., Prof., etc.) for clarity</li>
                  <li>Keep organizer names consistent across all events</li>
                  <li>Create organizers before creating events to ensure consistency</li>
                  <li>Use the same organizer name format throughout (e.g., always "Dr. First Last" or always "First Last, MD")</li>
                  <li>Regularly review and consolidate duplicate organizers with similar names</li>
                  <li>Check usage counts before deleting to ensure organizers aren't in use</li>
                  <li>Distinguish between organizers and speakers (they can be the same person but serve different roles)</li>
                  <li>Keep the number of organizers manageable (consolidate when possible)</li>
                  <li>Use search to quickly find organizers when assigning to events</li>
                  <li>Maintain a clean organizers list by removing unused entries</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

