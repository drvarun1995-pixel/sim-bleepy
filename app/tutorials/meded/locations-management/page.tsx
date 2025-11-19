"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Plus, Edit, Trash2, Search } from "lucide-react";
import Link from "next/link";

export default function LocationsManagementTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Managing Event Locations</h1>
            <p className="text-xl text-gray-600">Create, edit, and organize event locations like rooms, halls, and venues</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Locations Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Locations are managed from the <strong>Event Data</strong> page. Navigate to Event Data from the dashboard sidebar, then click on <strong>Locations</strong> in the sidebar menu.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> Locations represent physical or virtual venues where events take place (e.g., "Main Hall", "Lecture Theatre 1", "Online", "Room 205"). Locations can have addresses and optional geographic coordinates (latitude/longitude) for mapping.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Creating New Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To create a new location:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Go to the Event Data page and select "Locations" from the sidebar</li>
                  <li>Fill in the location name (required) - e.g., "Main Hall", "Lecture Theatre 1", "Online"</li>
                  <li>Optionally add an address (e.g., "123 Medical School Road, London")</li>
                  <li>Optionally add geographic coordinates:
                    <ul className="list-disc list-inside ml-6 mt-1">
                      <li>Latitude: Decimal degrees (e.g., 51.5074)</li>
                      <li>Longitude: Decimal degrees (e.g., -0.1278)</li>
                    </ul>
                  </li>
                  <li>Click "Add New Location" to save</li>
                </ol>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Location Names:</strong> Use clear, descriptive names that help students identify where events will take place. Consistent naming (e.g., "Room 101", "Room 102") makes locations easy to find.
                  </p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Geographic Coordinates:</strong> Adding latitude and longitude enables mapping features. You can find coordinates using Google Maps or other mapping services. Coordinates are optional but useful for location-based features.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Editing Existing Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To modify a location:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the location in the locations list</li>
                  <li>Click the edit button (pencil icon)</li>
                  <li>Update the name, address, latitude, or longitude</li>
                  <li>Click "Save" to apply changes</li>
                </ol>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Changes to locations will be reflected in all events using that location. Be careful when changing location names as this affects event displays.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trash2 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Deleting Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To delete locations:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the location in the list</li>
                  <li>Click the delete button (trash icon)</li>
                  <li>Confirm the deletion</li>
                </ol>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Warning:</strong> Check the usage count before deleting. Locations in use by events should not be deleted. You may need to reassign events to other locations first. Deleting a location will remove it from all associated events.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Using Locations in Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">When creating or editing events:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Select a main location from the location dropdown</li>
                  <li>You can select multiple additional locations for events that take place in multiple venues</li>
                  <li>Locations are displayed on event pages and in event lists</li>
                  <li>Students can see location information when viewing event details</li>
                  <li>Locations help students find where events will take place</li>
                  <li>Events can be filtered by location in event lists and attendance tracking</li>
                  <li>Location addresses and coordinates can be used for mapping and navigation</li>
                </ul>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Multiple Locations:</strong> Events can have one main location and multiple additional locations. This is useful for events that span multiple rooms or venues.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Finding and Organizing Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Tips for managing your locations list:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Use the search function to quickly find locations by name</li>
                  <li>Keep location names consistent and descriptive</li>
                  <li>Group similar locations together (e.g., all "Room" locations, all "Hall" locations)</li>
                  <li>Include addresses for external venues to help students find them</li>
                  <li>Add coordinates for locations that benefit from mapping features</li>
                  <li>Regularly review and consolidate duplicate or similar locations</li>
                  <li>Check usage counts before deleting to ensure locations aren't in use</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Location Best Practices</CardTitle>
                <CardDescription>Tips for effective location management</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Use clear, consistent naming conventions (e.g., "Room 101", "Main Hall", "Lecture Theatre 1")</li>
                  <li>Include full addresses for external venues to help students find them</li>
                  <li>Add geographic coordinates for locations that benefit from mapping</li>
                  <li>Create locations for common venues before creating events</li>
                  <li>Use descriptive names that clearly identify the venue</li>
                  <li>Keep the number of locations manageable (consolidate similar venues)</li>
                  <li>Regularly review and remove unused locations</li>
                  <li>Check usage counts before deleting to avoid breaking event associations</li>
                  <li>Consider creating a location for "Online" or "Virtual" for remote events</li>
                  <li>Use consistent formatting (e.g., always capitalize "Room" or "Hall")</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

