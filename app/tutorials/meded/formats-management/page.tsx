"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Layers, Plus, Edit, Trash2, Palette } from "lucide-react";
import Link from "next/link";

export default function FormatsManagementTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Managing Event Formats</h1>
            <p className="text-xl text-gray-600">Create, edit, and organize event formats like workshops, lectures, and seminars</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Formats Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Formats are managed from the <strong>Event Data</strong> page. Navigate to Event Data from the dashboard sidebar, then click on <strong>Formats</strong> in the sidebar menu.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> Formats help categorize events by type (e.g., Workshop, Lecture, Seminar, Grand Round). Formats support hierarchical organization with parent and child formats, and can have colors for visual identification.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Creating New Formats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To create a new format:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Go to the Event Data page and select "Formats" from the sidebar</li>
                  <li>Fill in the format name (required)</li>
                  <li>The slug is automatically generated from the name, but you can customize it</li>
                  <li>Optionally select a parent format to create a hierarchy</li>
                  <li>Add a description (optional)</li>
                  <li>Select a color using the color picker or enter a hex code (optional)</li>
                  <li>Click "Add New Format"</li>
                </ol>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Color Selection:</strong> The format form includes a color picker with preset colors and the ability to enter custom hex codes. Colors help visually distinguish formats in event lists and calendars.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Editing Existing Formats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To modify a format:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the format in the formats list</li>
                  <li>Click the edit button (pencil icon)</li>
                  <li>Update the name, slug, parent, description, or color</li>
                  <li>Click "Save" to apply changes</li>
                </ol>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Changes to formats will be reflected in all events using that format. Be careful when changing parent formats as this affects the hierarchy.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trash2 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Deleting Formats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To delete formats:</p>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-1">Individual Deletion</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Find the format in the list</li>
                      <li>Click the delete button (trash icon)</li>
                      <li>Confirm the deletion</li>
                    </ol>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-1">Bulk Deletion</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Select multiple formats using checkboxes</li>
                      <li>Click "Delete Selected" button</li>
                      <li>Confirm the bulk deletion</li>
                    </ol>
                  </div>
                </div>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Warning:</strong> Check the usage count before deleting. Formats in use by events should not be deleted. You may need to reassign events to other formats first.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Format Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Formats can have colors for visual identification:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Colors are displayed in format badges throughout the platform</li>
                  <li>Use the color picker button to open the color selection interface</li>
                  <li>Choose from preset colors or enter a custom hex color code (e.g., #FF6B6B)</li>
                  <li>Colors help users quickly identify event formats</li>
                  <li>Choose distinct colors for better visual differentiation</li>
                  <li>Colors appear in event lists, calendars, and filter dropdowns</li>
                </ul>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Color Picker:</strong> The format form includes a color picker with a grid of preset colors. Click "Select Colour" to open it, then click a color to select it, or enter a hex code manually.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Format Hierarchy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Formats support hierarchical organization:</p>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-1">Parent Formats</p>
                    <p className="text-sm text-gray-700">Root formats that don't have a parent. These appear first in lists and can be selected as parents for other formats.</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-1">Child Formats</p>
                    <p className="text-sm text-gray-700">Formats that have a parent. These appear indented under their parent in lists, making the hierarchy clear.</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Visual Display:</strong> In the formats list, child formats are displayed with an indentation (└─) and a different background color to show they belong to a parent format.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers className="h-5 w-5 mr-2 text-purple-600" />
                  Step 7: Using Formats in Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">When creating or editing events:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Select a format from the format dropdown</li>
                  <li>Formats are displayed with their colors in the dropdown</li>
                  <li>Parent formats appear first, followed by their child formats (indented)</li>
                  <li>Each event can have one format assigned</li>
                  <li>Formats help categorize events by type (Workshop, Lecture, Seminar, etc.)</li>
                  <li>Events can be filtered by format in event lists and attendance tracking</li>
                  <li>Format information is shown in event details and booking pages</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Format Best Practices</CardTitle>
                <CardDescription>Tips for effective format management</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Use clear, descriptive format names that align with your institution's event types</li>
                  <li>Keep the number of formats manageable (10-20 is ideal)</li>
                  <li>Use consistent color schemes for related formats</li>
                  <li>Leverage hierarchy to organize related formats (e.g., "Workshop" as parent, "Hands-on Workshop" as child)</li>
                  <li>Regularly review and consolidate similar formats</li>
                  <li>Check usage counts before deleting to ensure formats aren't in use</li>
                  <li>Use distinct colors for better visual differentiation</li>
                  <li>Ensure formats align with your institution's event types and teaching methods</li>
                  <li>Use descriptions to clarify format purposes for other team members</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
